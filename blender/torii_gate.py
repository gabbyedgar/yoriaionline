"""
Yoriai — torii gate + stone lanterns, authored headlessly with Blender (bpy).

Builds a myōjin-style torii: tapered, inward-leaning pillars, a curved kasagi
with upswept ends over a shimaki, a penetrating nuki tie-beam, a central
gakuzuka strut, daiwa capitals and stone kamebara bases — plus two kasuga
stone lanterns with emissive fireboxes. Exports a compact GLB consumed by
the Three.js cinematic intro (src/intro/intro.ts).

The gate is sized so it lines up exactly with the particle torii the intro
assembles from the brand mark (pillar centres at x = ±4.72, kasagi centre
at y ≈ 12 after the glTF Z-up → Y-up conversion).

Run:  python3 blender/torii_gate.py   (requires `pip install bpy`)
"""
import math
import os

import bpy
import bmesh  # noqa: E402 — must come after bpy

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "models", "torii.glb")


# ---------------------------------------------------------------- materials
def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_lin(h: str):
    h = h.lstrip("#")
    return tuple(srgb_to_linear(int(h[i : i + 2], 16) / 255) for i in (0, 2, 4))


def make_mat(name, color, rough=0.6, metal=0.0, emission=None, estr=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*hex_lin(color), 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*hex_lin(emission), 1.0)
        bsdf.inputs["Emission Strength"].default_value = estr
    return m


# ---------------------------------------------------------------- helpers
def link(obj, parent):
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    return obj


def bevel(obj, width=0.045, segments=2):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(40)
    return obj


def shade_smooth(obj, angle=46):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    # edge-split keeps caps/creases crisp while walls stay smooth
    mod = obj.modifiers.new("edgesplit", "EDGE_SPLIT")
    mod.split_angle = math.radians(angle)
    return obj


def add_box(name, w, d, h, loc, mat, parent, rot_y=0.0, bev=0.045):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x *= w
        v.co.y *= d
        v.co.z *= h
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = (0, rot_y, 0)
    obj.data.materials.append(mat)
    link(obj, parent)
    if bev:
        bevel(obj, bev)
    return obj


def add_cone(name, r1, r2, depth, loc, mat, parent, verts=28, rot_y=0.0):
    bpy.ops.mesh.primitive_cone_add(
        vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = (0, rot_y, 0)
    obj.data.materials.append(mat)
    obj.parent = parent
    shade_smooth(obj)
    return obj


def curved_beam(name, length, depth, height, lift, loc, mat, parent, segs=22, flare=0.10):
    """Beam whose ends sweep upward (and flare slightly) — the kasagi."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x *= length
        v.co.y *= depth
        v.co.z *= height
    long_edges = [
        e for e in bm.edges if abs(e.verts[0].co.x - e.verts[1].co.x) > length * 0.5
    ]
    bmesh.ops.subdivide_edges(bm, edges=long_edges, cuts=segs, use_grid_fill=True)
    half = length / 2
    for v in bm.verts:
        t = abs(v.co.x) / half
        v.co.z += lift * t**3.4
        v.co.z += flare * t**6 * (1 if v.co.z > 0 else 0.6)  # ends thicken upward
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.data.materials.append(mat)
    link(obj, parent)
    bevel(obj, 0.05)
    return obj


# ---------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)

VERMILION = make_mat("Vermilion", "#A8432B", rough=0.52)
INK = make_mat("InkLacquer", "#221B17", rough=0.42)
STONE = make_mat("Stone", "#7E7872", rough=0.92)
FIRE = make_mat("LanternFire", "#3A2410", rough=0.7, emission="#FFB45E", estr=4.0)

root = bpy.data.objects.new("Torii", None)
bpy.context.collection.objects.link(root)

# --- pillars (hashira): tapered, leaning inward ~1.4° (uchikorobi) ---
LEAN = math.radians(1.4)
PILLAR_H = 10.55
for sx in (-1, 1):
    cx = sx * (4.72 - math.tan(LEAN) * PILLAR_H / 2)
    add_cone(
        f"Pillar_{'L' if sx < 0 else 'R'}",
        0.68, 0.56, PILLAR_H,
        (cx, 0, PILLAR_H / 2),
        VERMILION, root, rot_y=-sx * LEAN,
    )
    # kamebara — stone base ring
    add_cone(f"Base_{'L' if sx < 0 else 'R'}", 0.98, 0.74, 0.52,
             (sx * 4.72, 0, 0.26), STONE, root)
    # daiwa — capital between pillar and shimaki
    add_cone(f"Daiwa_{'L' if sx < 0 else 'R'}", 0.78, 0.84, 0.34,
             (sx * 4.45, 0, PILLAR_H + 0.17), VERMILION, root, verts=24)

# --- nuki: tie-beam piercing both pillars, ink end-caps ---
add_box("Nuki", 11.6, 0.52, 0.5, (0, 0, 8.4), VERMILION, root)
for sx in (-1, 1):
    add_box(f"NukiEnd_{'L' if sx < 0 else 'R'}", 0.62, 0.58, 0.56,
            (sx * 6.05, 0, 8.4), INK, root, bev=0.03)

# --- gakuzuka: central strut between nuki and shimaki ---
add_box("Gakuzuka", 0.52, 0.46, 2.0, (0, 0, 9.92), VERMILION, root)

# --- shimaki: straight secondary lintel ---
add_box("Shimaki", 12.3, 0.86, 0.54, (0, 0, 11.16), VERMILION, root)

# --- kasagi: ink-lacquered top beam with upswept ends ---
curved_beam("Kasagi", 13.9, 1.08, 0.62, 0.62, (0, 0, 11.78), INK, root)

# --- kasuga stone lanterns (tōrō) flanking the path ---
def lantern(sx: int):
    tag = "L" if sx < 0 else "R"
    base = bpy.data.objects.new(f"Lantern_{tag}", None)
    base.location = (sx * 7.5, 0.9, 0)
    bpy.context.collection.objects.link(base)
    base.parent = root
    add_cone(f"LanBase_{tag}", 0.58, 0.46, 0.20, (0, 0, 0.10), STONE, base, verts=18)
    add_cone(f"LanFoot_{tag}", 0.42, 0.20, 0.26, (0, 0, 0.33), STONE, base, verts=18)
    add_cone(f"LanShaft_{tag}", 0.13, 0.13, 1.05, (0, 0, 0.99), STONE, base, verts=14)
    add_cone(f"LanChudai_{tag}", 0.40, 0.44, 0.14, (0, 0, 1.58), STONE, base, verts=18)
    # firebox — emissive core framed by corner posts
    add_box(f"LanFire_{tag}", 0.40, 0.40, 0.42, (0, 0, 1.88), FIRE, base, bev=0.02)
    for px in (-1, 1):
        for py in (-1, 1):
            add_box(f"LanPost_{tag}{px}{py}", 0.07, 0.07, 0.44,
                    (px * 0.21, py * 0.21, 1.88), STONE, base, bev=0.012)
    add_cone(f"LanRoof_{tag}", 0.56, 0.07, 0.32, (0, 0, 2.26), STONE, base, verts=6)
    add_cone(f"LanJewel_{tag}", 0.09, 0.0, 0.16, (0, 0, 2.50), STONE, base, verts=12)


lantern(-1)
lantern(1)

# ---------------------------------------------------------------- export
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.abspath(OUT),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
)
size = os.path.getsize(os.path.abspath(OUT))
print(f"exported {OUT} ({size/1024:.0f} KB)")
