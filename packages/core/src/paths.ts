import type {
  CornerBorderStyle,
  CornerCenterStyle,
  CornerRadii,
  Neighbours,
  QRShape,
} from "./types";

// Round to 3 decimals to keep generated path strings compact.
export const r3 = (n: number): number => Math.round(n * 1000) / 1000;

export function squarePath(px: number, py: number, s: number): string {
  return `M${r3(px)},${r3(py)}h${r3(s)}v${r3(s)}h-${r3(s)}z`;
}

export function dotPath(px: number, py: number, s: number): string {
  const rad = s / 2;
  const cy = py + rad;
  return `M${r3(px)},${r3(cy)}a${r3(rad)},${r3(rad)} 0 1 0 ${r3(
    s
  )},0a${r3(rad)},${r3(rad)} 0 1 0 ${r3(-s)},0Z`;
}

export function diamondPath(px: number, py: number, s: number): string {
  const c = s / 2;
  return (
    `M${r3(px + c)},${r3(py)}` +
    `L${r3(px + s)},${r3(py + c)}` +
    `L${r3(px + c)},${r3(py + s)}` +
    `L${r3(px)},${r3(py + c)}Z`
  );
}

export function trianglePath(px: number, py: number, s: number): string {
  return `M${r3(px)},${r3(py + s)}H${r3(px + s)}L${r3(px + s / 2)},${r3(py)}Z`;
}

export function plusPath(px: number, py: number, s: number): string {
  const t = s / 3;
  const a = px;
  const b = px + t;
  const c = px + 2 * t;
  const d = px + s;
  const e = py;
  const f = py + t;
  const g = py + 2 * t;
  const h = py + s;
  return (
    `M${r3(b)},${r3(e)}H${r3(c)}V${r3(f)}H${r3(d)}V${r3(g)}H${r3(c)}` +
    `V${r3(h)}H${r3(b)}V${r3(g)}H${r3(a)}V${r3(f)}H${r3(b)}Z`
  );
}

export function starPath(px: number, py: number, s: number): string {
  const cx = px + s / 2;
  const cy = py + s / 2;
  const R = s / 2;
  const ir = s * 0.16;
  return (
    `M${r3(cx)},${r3(cy - R)}` +
    `L${r3(cx + ir)},${r3(cy - ir)}` +
    `L${r3(cx + R)},${r3(cy)}` +
    `L${r3(cx + ir)},${r3(cy + ir)}` +
    `L${r3(cx)},${r3(cy + R)}` +
    `L${r3(cx - ir)},${r3(cy + ir)}` +
    `L${r3(cx - R)},${r3(cy)}` +
    `L${r3(cx - ir)},${r3(cy - ir)}Z`
  );
}

// Fully-connected "fluid" module. Each corner is traced between the midpoints
// of its two edges (radius = half a cell): a convex arc where both sides are
// empty, a concave fillet where both sides are filled but the diagonal is
// empty (smoothing the inner notch), or a square corner otherwise.
export function fluidPath(
  px: number,
  py: number,
  s: number,
  n: Neighbours
): string {
  const x0 = px;
  const y0 = py;
  const x1 = px + s;
  const y1 = py + s;
  const cx = px + s / 2;
  const cy = py + s / 2;
  const R = r3(s / 2);

  const corner = (
    sideA: boolean,
    sideB: boolean,
    diag: boolean,
    ex: number,
    ey: number,
    kx: number,
    ky: number
  ) => {
    if (!sideA && !sideB) return `A${R},${R} 0 0 1 ${r3(ex)},${r3(ey)}`;
    if (sideA && sideB && !diag) return `A${R},${R} 0 0 0 ${r3(ex)},${r3(ey)}`;
    return `L${r3(kx)},${r3(ky)}L${r3(ex)},${r3(ey)}`;
  };

  let d = `M${r3(cx)},${r3(y0)}`;
  d += corner(n.up, n.right, n.ur, x1, cy, x1, y0); // top-right
  d += corner(n.down, n.right, n.dr, cx, y1, x1, y1); // bottom-right
  d += corner(n.down, n.left, n.dl, x0, cy, x0, y1); // bottom-left
  d += corner(n.up, n.left, n.ul, cx, y0, x0, y0); // top-left
  return d + "Z";
}

// When `bevel` is true each cut corner is a straight diagonal (chamfer)
// instead of a quarter-circle arc — sharp, classy edges with no curves.
export function roundedPath(
  px: number,
  py: number,
  s: number,
  c: CornerRadii,
  bevel = false
): string {
  const x0 = px;
  const y0 = py;
  const x1 = px + s;
  const y1 = py + s;
  const cut = (r: number, x: number, y: number) =>
    bevel ? `L${r3(x)},${r3(y)}` : `A${r3(r)},${r3(r)} 0 0 1 ${r3(x)},${r3(y)}`;

  let d = `M${r3(x0 + c.tl)},${r3(y0)}`;
  d += `H${r3(x1 - c.tr)}`;
  if (c.tr) d += cut(c.tr, x1, y0 + c.tr);
  d += `V${r3(y1 - c.br)}`;
  if (c.br) d += cut(c.br, x1 - c.br, y1);
  d += `H${r3(x0 + c.bl)}`;
  if (c.bl) d += cut(c.bl, x0, y1 - c.bl);
  d += `V${r3(y0 + c.tl)}`;
  if (c.tl) d += cut(c.tl, x0 + c.tl, y0);
  return d + "Z";
}

export function circlePath(cx: number, cy: number, rad: number): string {
  return (
    `M${r3(cx - rad)},${r3(cy)}` +
    `a${r3(rad)},${r3(rad)} 0 1 0 ${r3(rad * 2)},0` +
    `a${r3(rad)},${r3(rad)} 0 1 0 ${r3(-rad * 2)},0Z`
  );
}

export function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${r3(x)},${r3(y)}h${r3(w)}v${r3(h)}h${r3(-w)}z`;
}

export function roundRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number
): string {
  const r = Math.min(rad, w / 2, h / 2);
  const a = `a${r3(r)},${r3(r)} 0 0 1 `;
  return (
    `M${r3(x + r)},${r3(y)}` +
    `h${r3(w - 2 * r)}${a}${r3(r)},${r3(r)}` +
    `v${r3(h - 2 * r)}${a}${r3(-r)},${r3(r)}` +
    `h${r3(-(w - 2 * r))}${a}${r3(-r)},${r3(-r)}` +
    `v${r3(-(h - 2 * r))}${a}${r3(r)},${r3(-r)}Z`
  );
}

/**
 * One body module, in the given shape. `n` describes the surrounding cells and
 * only matters for the neighbour-aware shapes (rounded, bars, classy, fluid).
 */
export function modulePath(
  shape: QRShape,
  px: number,
  py: number,
  s: number,
  n: Neighbours
): string {
  switch (shape) {
    case "square":
      return squarePath(px, py, s);
    case "dots":
      return dotPath(px, py, s);
    case "diamond":
      return diamondPath(px, py, s);
    case "triangle":
      return trianglePath(px, py, s);
    case "plus":
      return plusPath(px, py, s);
    case "star":
      return starPath(px, py, s);
    case "fluid":
      return fluidPath(px, py, s, n);
  }

  // Neighbour-aware corner rounding. A corner only rounds where the module has
  // no neighbour on either of its two adjacent sides.
  const outerTL = !n.up && !n.left;
  const outerTR = !n.up && !n.right;
  const outerBR = !n.down && !n.right;
  const outerBL = !n.down && !n.left;
  const full = s / 2;

  switch (shape) {
    case "classy":
      // Leaf with straight diagonal cuts on two opposite corners.
      return roundedPath(
        px,
        py,
        s,
        { tl: outerTL ? full : 0, tr: 0, br: outerBR ? full : 0, bl: 0 },
        true
      );
    case "classy-rounded":
      // Same leaf, but the diagonal corners are rounded instead of cut.
      return roundedPath(px, py, s, {
        tl: outerTL ? full : 0,
        tr: 0,
        br: outerBR ? full : 0,
        bl: 0,
      });
    case "vertical":
      // Vertical bars: caps only at the ends of a vertical run.
      return roundedPath(px, py, s, {
        tl: !n.up ? full : 0,
        tr: !n.up ? full : 0,
        br: !n.down ? full : 0,
        bl: !n.down ? full : 0,
      });
    case "horizontal":
      // Horizontal bars: caps only at the ends of a horizontal run.
      return roundedPath(px, py, s, {
        tl: !n.left ? full : 0,
        bl: !n.left ? full : 0,
        tr: !n.right ? full : 0,
        br: !n.right ? full : 0,
      });
    default:
      // "rounded": every outer corner rounded to a half-cell radius.
      return roundedPath(px, py, s, {
        tl: outerTL ? full : 0,
        tr: outerTR ? full : 0,
        br: outerBR ? full : 0,
        bl: outerBL ? full : 0,
      });
  }
}

// The outer ring of one finder pattern, as a frame with a hole (rendered with
// fill-rule "evenodd"). (ox, oy) is the top-left pixel of the 7-module block,
// `unit` is the pixel size of one module (ring thickness).
export function cornerBorderPath(
  ox: number,
  oy: number,
  unit: number,
  style: CornerBorderStyle
): string {
  const outer = unit * 7;
  const inner = unit * 5;
  const ix = ox + unit;
  const iy = oy + unit;
  if (style === "circle") {
    const cx = ox + outer / 2;
    const cy = oy + outer / 2;
    return circlePath(cx, cy, outer / 2) + circlePath(cx, cy, inner / 2);
  }
  if (style === "rounded") {
    return (
      roundRectPath(ox, oy, outer, outer, unit * 2) +
      roundRectPath(ix, iy, inner, inner, unit)
    );
  }
  if (style === "diamond") {
    return diamondPath(ox, oy, outer) + diamondPath(ix, iy, inner);
  }
  return rectPath(ox, oy, outer, outer) + rectPath(ix, iy, inner, inner);
}

// The center dot of one finder pattern (the inner 3x3 modules).
export function cornerCenterPath(
  ox: number,
  oy: number,
  unit: number,
  style: CornerCenterStyle
): string {
  const size = unit * 3;
  const px = ox + unit * 2;
  const py = oy + unit * 2;
  switch (style) {
    case "circle":
      return circlePath(px + size / 2, py + size / 2, size / 2);
    case "rounded":
      return roundRectPath(px, py, size, size, unit);
    case "diamond":
      return diamondPath(px, py, size);
    case "star":
      return starPath(px, py, size);
    case "plus":
      return plusPath(px, py, size);
    default:
      return rectPath(px, py, size, size);
  }
}

/**
 * Axis-aligned square shapes render sharper with "crispEdges"; anything with
 * curves or diagonals needs "geometricPrecision".
 */
export function shapeRendering(
  style: QRShape | CornerBorderStyle | CornerCenterStyle
): "crispEdges" | "geometricPrecision" {
  return style === "square" ? "crispEdges" : "geometricPrecision";
}
