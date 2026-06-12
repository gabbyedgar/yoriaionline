"""
Yoriai — origami crane (orizuru), authored headlessly with Blender (bpy).

A faceted paper crane built from explicit triangles so every crease reads as
a fold. Parts are separate named objects (CraneBody, CraneNeck, CraneBeak,
CraneTail, WingL, WingR); the wings' object origins sit on their fold hinges
so the runtime can flap them with a plain rotation. The Three.js intro
assembles the crane triangle-by-triangle out of drifting paper fragments,
then flies it; the homepage keeps it perched as a living decoration.

Modelled facing +Y, up +Z (glTF Y-up export → faces -Z in three.js, up +Y).

Run:  python3 blender/origami_crane.py   (requires `pip install bpy`)
"""
import os

import bpy

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "models", "crane.glb")


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_lin(h: str):
    h = h.lstrip("#")
    return tuple(srgb_to_linear(int(h[i : i + 2], 16) / 255) for i in (0, 2, 4))


bpy.ops.wm.read_factory_settings(use_empty=True)

paper = bpy.data.materials.new("Paper")
paper.use_nodes = True
bsdf = paper.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (*hex_lin("#F6F2EA"), 1.0)
bsdf.inputs["Roughness"].default_value = 0.55
paper.use_backface_culling = False  # exports as doubleSided

root = bpy.data.objects.new("Crane", None)
bpy.context.collection.objects.link(root)


def part(name, verts, faces, pivot=(0, 0, 0)):
    """Create a mesh part; verts given in world coords, stored relative to pivot
    so the object origin (= fold hinge for wings) is where rotation happens."""
    local = [(v[0] - pivot[0], v[1] - pivot[1], v[2] - pivot[2]) for v in verts]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(local, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = pivot
    obj.data.materials.append(paper)
    bpy.context.collection.objects.link(obj)
    obj.parent = root
    return obj


# ---- body: stretched octahedron, the classic folded core ----
F = (0, 0.58, 0.04)    # breast point
B = (0, -0.52, 0.02)   # rear point
T = (0, 0.02, 0.16)    # top ridge
K = (0, 0.00, -0.20)   # keel
L = (-0.17, 0.03, 0.02)
R = (0.17, 0.03, 0.02)
part(
    "CraneBody",
    [F, B, T, K, L, R],
    [(0, 4, 2), (4, 1, 2), (1, 5, 2), (5, 0, 2),   # top facets
     (4, 0, 3), (1, 4, 3), (5, 1, 3), (0, 5, 3)],  # bottom facets
)

# ---- neck: slender tetra sweeping up-forward ----
n1, n2, n3 = (-0.05, 0.50, 0.10), (0.05, 0.50, 0.10), (0, 0.52, -0.02)
NT = (0, 0.98, 0.88)
part("CraneNeck", [n1, n2, n3, NT], [(0, 1, 3), (1, 2, 3), (2, 0, 3)])

# ---- beak: one small fold tipping forward-down ----
part(
    "CraneBeak",
    [(-0.04, 0.94, 0.90), (0.04, 0.94, 0.90), (0, 1.16, 0.66)],
    [(0, 1, 2)],
)

# ---- tail: mirrored slender tetra sweeping up-back ----
t1, t2, t3 = (-0.05, -0.45, 0.10), (0.05, -0.45, 0.10), (0, -0.47, -0.02)
TT = (0, -1.02, 0.94)
part("CraneTail", [t1, t2, t3, TT], [(0, 1, 3), (1, 2, 3), (2, 0, 3)])

# ---- wings: broad creased triangles, origin on the fold hinge ----
def wing(side):  # side = -1 left, +1 right
    s = side
    pivot = (s * 0.15, 0.03, 0.10)
    A = (s * 0.15, 0.35, 0.10)    # hinge, front
    C = (s * 0.15, -0.30, 0.10)   # hinge, back
    W = (s * 1.32, -0.34, 0.20)   # wing tip, swept back, slight dihedral
    M = (s * 0.64, 0.05, 0.18)    # crease ridge
    faces = [(0, 1, 3), (1, 2, 3), (0, 3, 2)]
    if side > 0:  # flip winding for the mirror
        faces = [(f[0], f[2], f[1]) for f in faces]
    part("WingL" if side < 0 else "WingR", [A, C, W, M], faces, pivot)


wing(-1)
wing(1)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.abspath(OUT),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
)
print(f"exported {OUT} ({os.path.getsize(os.path.abspath(OUT))/1024:.0f} KB)")
