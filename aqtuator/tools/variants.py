"""Generate assets/data/variants.json: the specification of every AQTUATOR CS variant.

Sources (refaqt/aqtuator, modules/compact-stage):
- architecture/compact-stage.sysml   requirements STG-01..STG-15 (design targets)
- stoq maxwell/mk2-mover             MK21 forcer: 181 N continuous, 512 N peak for 1 s
- stoq ace/ta-damper                 TA17-7 elastomer damper, 9 J each in an emergency stop
- RSF (the encoder maker)            scale accuracy +/-15 um per metre; we state
                                     at least +/-5 um for short stages
- cad/assemblies/compact-stage        the 220 mm travel build (base 440 mm)
- tools/stage-info.json               volumes from tools/export_glb.py
- stoq parts library                  MK2 magnet track 4.58 kg/m, MK21 mover 1.1 kg

Only the travel changes between variants. Everything that depends on the
length is scaled from the 220 mm build. The numbers are estimates until a
stage of that length is drawn and weighed.

    python3 tools/variants.py
"""
import json
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
INFO = json.loads((ROOT / "tools" / "stage-info.json").read_text())

TRAVELS = [220, 280, 360, 440, 520, 600]
HEIGHT = 60          # STG-02
WIDTH = 210          # STG-01
REF_LENGTH = 440     # base length of the 220 mm build
HOLE_PITCH = 80      # STG-14
MOVING_MASS = 4.2    # kg, STG-15 estimate from the CAD
STATOR_STOCK = [120, 180, 300]   # MAXWELL MK2 magnet track lengths, mm
STATOR_KG_PER_M = 4.58
ACCURACY_UM_PER_M = 15           # positioning accuracy without mapping, per metre of travel
ACCURACY_MIN_UM = 5              # but never stated better than this

ALU, STEEL = 2.70e-6, 7.85e-6    # kg/mm3

base_kg_per_mm = INFO["base"]["volume_mm3"] * ALU / REF_LENGTH
rail_kg_per_mm = INFO["EGR15U418H"]["volume_mm3"] * STEEL / 418
strip_kg_per_mm = INFO["sealing_strip"]["volume_mm3"] * STEEL / 438


def magnet_track(travel):
    """Shortest stock combination that covers travel + 140 mm (as the 220 build: 2 x 180)."""
    need = travel + 140
    best = None
    for a in range(0, 5):
        for b in range(0, 5):
            for c in range(0, 4):
                total = a * 120 + b * 180 + c * 300
                n = a + b + c
                if total >= need and n:
                    key = (total, n)
                    if best is None or key < best[0]:
                        best = (key, {"120": a, "180": b, "300": c})
    (total, _), combo = best
    return total, combo


def accuracy(travel):
    """Positioning accuracy without mapping, +/- um: 15 um per metre of travel, at least 5 um."""
    return round(max(ACCURACY_MIN_UM, ACCURACY_UM_PER_M * travel / 1000), 1)


def variant(travel):
    length = travel + 340 - 2 * HEIGHT          # STG-03, equals 440 at 220
    rail = length - 22
    holes = (length - 40) // HOLE_PITCH + 1     # per row, 80 mm pitch, centred
    track, combo = magnet_track(travel)
    fixed = (length * base_kg_per_mm + 2 * rail * rail_kg_per_mm
             + track * STATOR_KG_PER_M / 1000 + length * strip_kg_per_mm + 0.05)
    return {
        "model": f"CS-{travel}",
        "travel_mm": travel,
        "length_mm": length,
        "width_mm": WIDTH,
        "height_mm": HEIGHT,
        "rail_length_mm": rail,
        "encoder_measuring_length_mm": travel + 20,
        "magnet_track_mm": track,
        "magnet_track_segments": {k: v for k, v in combo.items() if v},
        "base_holes_per_row": holes,
        "base_screws": 2 * holes,
        "base_hole_span_mm": (holes - 1) * HOLE_PITCH,
        "accuracy_um": accuracy(travel),
        "moving_mass_kg": MOVING_MASS,
        "total_mass_kg": round(MOVING_MASS + fixed, 1),
    }


COMMON = [
    # label, value, unit, group
    ("Positioning accuracy, no mapping", "±5 to ±9", "µm", "Accuracy"),
    ("Repeatability, same direction", "±0.1", "µm", "Accuracy"),
    ("Repeatability, both directions", "±0.3", "µm", "Accuracy"),
    ("Straightness and flatness", "±2", "µm", "Accuracy"),
    ("Pitch, yaw and roll", "±20", "µrad", "Accuracy"),
    ("Encoder", "Absolute, 0.1 µm step, BiSS C", "", "Accuracy"),
    ("Maximum speed", "2", "m/s", "Dynamics"),
    ("Continuous force", "181", "N", "Dynamics"),
    ("Peak force (1 s)", "512", "N", "Dynamics"),
    ("Acceleration, no payload", "≈120", "m/s²", "Dynamics"),
    ("Side load at carriage centre", "500", "N", "Load"),
    ("Screw grid (base and carriage)", "80 mm, M5", "", "Load"),
    ("End stops", "4 elastomer dampers, 18 J per end in an emergency", "", "Load"),
    ("Motor", "Iron-core linear motor, water-cooled", "", "Drive"),
    ("Guides", "2 profile rails, 4 ball blocks", "", "Drive"),
    ("Base", "One-piece aluminium block, black anodised", "", "Drive"),
]


def main():
    out = {
        "status": "All values are design targets. They are not measured yet.",
        "variants": [variant(t) for t in TRAVELS],
        "common": [dict(zip(("label", "value", "unit", "group"), c)) for c in COMMON],
    }
    path = ROOT / "assets" / "data" / "variants.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    for v in out["variants"]:
        print(v["model"], v["length_mm"], v["rail_length_mm"], v["magnet_track_mm"],
              v["magnet_track_segments"], v["base_screws"], v["total_mass_kg"])


if __name__ == "__main__":
    main()
