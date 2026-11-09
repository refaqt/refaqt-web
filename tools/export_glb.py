"""Export the compact-stage FreeCAD assembly to a GLB for the website.

Run with FreeCAD's command-line program from the root of a refaqt/aqtuator
clone that has the CAD (Git LFS) and the stoq submodule checked out:

    freecadcmd tools/export_glb.py <assembly.FCStd> <out.glb> [<out.json>]

Every top-level link of the assembly becomes one node, named after the
object. Each face is tessellated on its own, so the normals stay sharp at the
edges of a face and smooth inside it. Materials are picked by object name
(see MATERIALS / material_for). The optional JSON file holds per-object
volume and bounding box, used by tools/variants.py for the mass estimate.
"""
import json
import math
import struct
import sys

import FreeCAD

LINEAR_DEFLECTION = 0.04  # mm
ANGULAR_DEFLECTION = math.radians(12)

# name -> (base colour RGBA, metallic, roughness)
MATERIALS = {
    "alu_black": ((0.035, 0.037, 0.040, 1.0), 0.55, 0.42),   # black anodised aluminium
    "alu_clear": ((0.62, 0.64, 0.66, 1.0), 0.95, 0.30),      # clear anodised aluminium
    "steel": ((0.70, 0.71, 0.72, 1.0), 1.0, 0.22),          # ground rail steel
    "steel_dark": ((0.22, 0.23, 0.24, 1.0), 1.0, 0.38),     # blackened steel / screws
    "strip": ((0.80, 0.81, 0.82, 1.0), 1.0, 0.16),          # stainless seal strip
    "accent": ((0.0, 0.62, 0.58, 1.0), 0.35, 0.35),         # REFAQT teal
    "forcer": ((0.10, 0.11, 0.12, 1.0), 0.3, 0.55),         # epoxy-potted coils
    "magnet": ((0.45, 0.46, 0.48, 1.0), 0.9, 0.35),         # nickel magnets
    "rubber": ((0.03, 0.03, 0.03, 1.0), 0.0, 0.8),
    "hose": ((0.05, 0.35, 0.75, 1.0), 0.0, 0.45),           # blue PU hose
    "brass": ((0.80, 0.80, 0.78, 1.0), 1.0, 0.25),          # nickel-plated brass
    "print": ((0.13, 0.14, 0.15, 1.0), 0.0, 0.6),           # printed resin parts
    "encoder": ((0.30, 0.31, 0.33, 1.0), 0.8, 0.35),
}


def material_for(name):
    n = name.lower()
    if n == "base":
        return "alu_black"
    if n.startswith("carriage_top"):
        return "alu_clear"
    if n.startswith("carriage_bottom"):
        return "alu_black"
    if n.startswith("sealing_strip"):
        return "strip"
    if n.startswith("egr"):
        return "steel"
    if n.startswith("qeh"):
        return "steel_dark"
    if n.startswith("mk2_"):
        return "magnet"
    if n.startswith("mk21"):
        return "forcer"
    if n.startswith("ta17"):
        return "accent"
    if n.startswith("ak_mc15") or n.startswith("mb_mc15"):
        return "encoder"
    if n.startswith("roller"):
        return "steel"
    if n.startswith("magnet_"):
        return "magnet"
    if n.startswith("cooling_block") or "clamp" in n:
        return "print"
    if n.startswith("fitting"):
        return "brass"
    if n.startswith("hose"):
        return "hose"
    if "oring" in n:
        return "rubber"
    if "screw" in n:
        return "steel_dark"
    return "alu_black"


def mesh_of(shape):
    pos, nrm, idx = [], [], []
    for face in shape.Faces:
        try:
            pts, tris = face.tessellate(LINEAR_DEFLECTION)
        except Exception:
            continue
        if not tris:
            continue
        base = len(pos) // 3
        acc = [[0.0, 0.0, 0.0] for _ in pts]
        for a, b, c in tris:
            pa, pb, pc = pts[a], pts[b], pts[c]
            u = pb - pa
            v = pc - pa
            n = u.cross(v)
            for k in (a, b, c):
                acc[k][0] += n.x
                acc[k][1] += n.y
                acc[k][2] += n.z
        for p, n in zip(pts, acc):
            L = math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2) or 1.0
            # FreeCAD is Z-up in mm; glTF is Y-up in metres.
            pos += [p.x / 1000.0, p.z / 1000.0, -p.y / 1000.0]
            nrm += [n[0] / L, n[2] / L, -n[1] / L]
        for a, b, c in tris:
            idx += [base + a, base + b, base + c]
    return pos, nrm, idx


def pad4(b, fill=b"\x00"):
    return b + fill * ((4 - len(b) % 4) % 4)


def write_glb(path, objects):
    bin_parts = []
    offset = 0
    buffer_views, accessors, meshes, nodes = [], [], [], []
    mat_names = sorted({m for _, m, _ in objects})
    materials = []
    for m in mat_names:
        col, metal, rough = MATERIALS[m]
        materials.append({
            "name": m,
            "pbrMetallicRoughness": {
                "baseColorFactor": list(col),
                "metallicFactor": metal,
                "roughnessFactor": rough,
            },
        })

    def add_view(data, target):
        nonlocal offset
        data = pad4(data)
        buffer_views.append({"buffer": 0, "byteOffset": offset,
                             "byteLength": len(data), "target": target})
        bin_parts.append(data)
        offset += len(data)
        return len(buffer_views) - 1

    for name, mat, (pos, nrm, idx) in objects:
        n = len(pos) // 3
        if n == 0:
            continue
        mn = [min(pos[i::3]) for i in range(3)]
        mx = [max(pos[i::3]) for i in range(3)]
        v_pos = add_view(struct.pack("<%df" % len(pos), *pos), 34962)
        v_nrm = add_view(struct.pack("<%df" % len(nrm), *nrm), 34962)
        if n < 65536:
            v_idx = add_view(struct.pack("<%dH" % len(idx), *idx), 34963)
            ctype = 5123
        else:
            v_idx = add_view(struct.pack("<%dI" % len(idx), *idx), 34963)
            ctype = 5125
        accessors.append({"bufferView": v_pos, "componentType": 5126, "count": n,
                          "type": "VEC3", "min": mn, "max": mx})
        a_pos = len(accessors) - 1
        accessors.append({"bufferView": v_nrm, "componentType": 5126, "count": n,
                          "type": "VEC3"})
        a_nrm = len(accessors) - 1
        accessors.append({"bufferView": v_idx, "componentType": ctype,
                          "count": len(idx), "type": "SCALAR"})
        a_idx = len(accessors) - 1
        meshes.append({"name": name, "primitives": [{
            "attributes": {"POSITION": a_pos, "NORMAL": a_nrm},
            "indices": a_idx, "material": mat_names.index(mat)}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1})

    gltf = {
        "asset": {"version": "2.0", "generator": "aqtuator-web tools/export_glb.py"},
        "scene": 0,
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": nodes, "meshes": meshes, "materials": materials,
        "accessors": accessors, "bufferViews": buffer_views,
        "buffers": [{"byteLength": offset}],
    }
    js = pad4(json.dumps(gltf, separators=(",", ":")).encode(), b" ")
    bin_data = b"".join(bin_parts)
    total = 12 + 8 + len(js) + 8 + len(bin_data)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A))
        f.write(js)
        f.write(struct.pack("<II", len(bin_data), 0x004E4942))
        f.write(bin_data)


def main():
    args = [a for a in sys.argv if a.endswith((".FCStd", ".glb", ".json"))]
    src, out = args[0], args[1]
    info_path = args[2] if len(args) > 2 else None
    doc = FreeCAD.openDocument(src)
    objects, info = [], {}
    for o in doc.Objects:
        if o.TypeId != "App::Link" or o.InList and any(p.TypeId == "App::Link" for p in o.InList):
            continue
        sh = o.Shape
        if sh.isNull():
            continue
        objects.append((o.Name, material_for(o.Name), mesh_of(sh)))
        bb = sh.BoundBox
        info[o.Name] = {"label": o.Label, "volume_mm3": sh.Volume,
                        "bbox": [bb.XMin, bb.YMin, bb.ZMin, bb.XMax, bb.YMax, bb.ZMax]}
        print("exported", o.Name, len(objects[-1][2][0]) // 3, "vertices")
    write_glb(out, objects)
    if info_path:
        with open(info_path, "w") as f:
            json.dump(info, f, indent=1)


main()
