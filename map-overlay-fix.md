# Map Overlay Fix — Proper Coupled Solution

## Goal
Make satellite background and district overlay stay perfectly synced at **any** container size, zoom, or aspect ratio.

## Root Cause Analysis

**Why two layers fail:**
| Layer | How it scales | Result |
|-------|--------------|--------|
| CSS `background-size: cover` | Fills container, crops overflow | Stretches/shifts with container shape |
| SVG `viewBox="0 0 580 480"` | Preserves 580:480 ratio, letterboxes | Stays proportional, ignores container shape |

When container aspect ratio ≠ 580:480, the layers show different geographic areas → misalignment.

## Solution: Single SVG with Embedded Background

Put **everything** inside one SVG — satellite as `<image>`, districts as `<path>`. The SVG `viewBox` handles all scaling uniformly. Both layers are mathematically bound to the same coordinate system.

**Why this works now (but didn't before):**
- Before: `ap_satellite.png` was 640×640 (square) → forced into non-square viewBox → visible stretching
- Now: `ap_map_bg.png` is 1200×993 (ratio **1.209**) which matches viewBox 580:480 (ratio **1.208**)
- Setting `preserveAspectRatio="xMidYMid meet"` on the `<image>` → no distortion

**Container approach:** Remove any fixed width/height. Let the parent layout determine size. The SVG with `viewBox` will fill responsively while keeping everything locked.

## Tasks
- [ ] Task 1: Update `GeographicMapView.tsx` (src) — replace CSS bg div with SVG `<image>` using `ap_map_bg.png` covering viewBox `(0,0,580,480)` → Verify: districts and coastline stay aligned when resizing
- [ ] Task 2: Same for `GeographicMapView.tsx` (commissioner portal)
- [ ] Task 3: Update `StateMap.tsx` (src) — same fix
- [ ] Task 4: Same for `StateMap.tsx` (commissioner portal)
- [ ] Task 5: Test at various browser widths + zoom levels → Verify: no drift at any size

## Done When
- [ ] Coastline matches coastal district outlines at every viewport size and zoom level
- [ ] No stretching or visual artifacts
