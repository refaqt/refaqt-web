import FreeCAD, sys
p = sys.argv[-1]
doc = FreeCAD.openDocument(p)
for o in doc.Objects:
    sh = getattr(o, 'Shape', None)
    ok = sh is not None and not sh.isNull()
    if o.TypeId in ('App::Link','Part::Feature','App::Part','PartDesign::Body') or 'Link' in o.TypeId:
        print(o.TypeId, o.Name, o.Label, ok, round(sh.Volume,1) if ok else None)
