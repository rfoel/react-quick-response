import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import qrcodegen from "./qrcodegen";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/**
 * Module shape: "square" (classic), "dots" (each module a circle), or
 * "rounded" (blobs — corners are rounded only where a module has no
 * neighbour, so connected runs stay straight where they touch).
 */
export type QRShape =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "classy-rounded"
  | "vertical"
  | "horizontal"
  | "diamond"
  | "star"
  | "plus"
  | "triangle"
  | "fluid";

/**
 * Outer ring of the three finder patterns ("eyes"). Frame-shaped styles only,
 * so the eye stays detectable: "square", "circle", "rounded", or "diamond".
 */
export type CornerBorderStyle = "square" | "circle" | "rounded" | "diamond";

/** Center dot of the three finder patterns — any solid module shape. */
export type CornerCenterStyle =
  | "square"
  | "circle"
  | "rounded"
  | "diamond"
  | "star"
  | "plus"
  | "triangle";

// Round to 3 decimals to keep generated path strings compact.
const r3 = (n: number): number => Math.round(n * 1000) / 1000;

function dotPath(px: number, py: number, s: number): string {
  const rad = s / 2;
  const cy = py + rad;
  return `M${r3(px)},${r3(cy)}a${r3(rad)},${r3(rad)} 0 1 0 ${r3(
    s
  )},0a${r3(rad)},${r3(rad)} 0 1 0 ${r3(-s)},0Z`;
}

function diamondPath(px: number, py: number, s: number): string {
  const c = s / 2;
  return (
    `M${r3(px + c)},${r3(py)}` +
    `L${r3(px + s)},${r3(py + c)}` +
    `L${r3(px + c)},${r3(py + s)}` +
    `L${r3(px)},${r3(py + c)}Z`
  );
}

function trianglePath(px: number, py: number, s: number): string {
  return `M${r3(px)},${r3(py + s)}H${r3(px + s)}L${r3(px + s / 2)},${r3(py)}Z`;
}

function plusPath(px: number, py: number, s: number): string {
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

type Neighbours = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  ul: boolean;
  ur: boolean;
  dl: boolean;
  dr: boolean;
};

// Fully-connected "fluid" module. Each corner is traced between the midpoints
// of its two edges (radius = half a cell): a convex arc where both sides are
// empty, a concave fillet where both sides are filled but the diagonal is
// empty (smoothing the inner notch), or a square corner otherwise.
function fluidPath(px: number, py: number, s: number, n: Neighbours): string {
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

function starPath(px: number, py: number, s: number): string {
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

// Per-corner radius in pixels (0 = sharp). Lets one module mix rounded and
// sharp corners — the basis for the "classy" leaf shapes.
type CornerRadii = { tl: number; tr: number; br: number; bl: number };

// When `bevel` is true each cut corner is a straight diagonal (chamfer)
// instead of a quarter-circle arc — sharp, classy edges with no curves.
function roundedPath(
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

function circlePath(cx: number, cy: number, rad: number): string {
  return (
    `M${r3(cx - rad)},${r3(cy)}` +
    `a${r3(rad)},${r3(rad)} 0 1 0 ${r3(rad * 2)},0` +
    `a${r3(rad)},${r3(rad)} 0 1 0 ${r3(-rad * 2)},0Z`
  );
}

function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${r3(x)},${r3(y)}h${r3(w)}v${r3(h)}h${r3(-w)}z`;
}

function roundRectPath(
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

// The outer ring of one finder pattern, as a frame with a hole (rendered with
// fill-rule "evenodd"). (ox, oy) is the top-left pixel of the 7-module block,
// `unit` is the pixel size of one module (ring thickness).
function cornerBorderPath(
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
function cornerCenterPath(
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
    case "triangle":
      return trianglePath(px, py, size);
    default:
      return rectPath(px, py, size, size);
  }
}

const ERROR_CORRECTION_LEVEL_MAP: Record<
  ErrorCorrectionLevel,
  qrcodegen.QrCode.Ecc
> = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
} as const;

// Largest logo (linear fraction of QR size) that stays scannable per ECC
// level, kept a little under the theoretical recovery limit for safety margin.
const LOGO_SAFE_RATIO: Record<ErrorCorrectionLevel, number> = {
  L: 0.2,
  M: 0.3,
  Q: 0.38,
  H: 0.45,
};

type SizedSvgProps = {
  width?: number | string;
  height?: number | string;
  viewBox?: string;
};

function isSizedElement(
  node: React.ReactNode
): node is React.ReactElement<SizedSvgProps> {
  return React.isValidElement(node);
}

function parseNumber(val: unknown): number | null {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function getIntrinsicSize(
  node: React.ReactNode
): { w: number; h: number } | null {
  if (!isSizedElement(node)) return null;

  const wAttr = parseNumber(node.props.width);
  const hAttr = parseNumber(node.props.height);
  if (wAttr && hAttr) return { w: wAttr, h: hAttr };

  const vb = node.props.viewBox;
  if (typeof vb === "string") {
    const nums = vb.trim().split(/\s+/).map(parseFloat);
    if (nums.length === 4 && nums.every(Number.isFinite)) {
      const [, , w, h] = nums;
      return { w, h };
    }
  }
  return null;
}

export interface ReactQRProps extends PropsWithChildren {
  /** Text or URL to encode in the QR code. */
  value: string;
  /** Width and height of the square SVG in pixels. Default 128. */
  size?: number;
  /**
   * Error-correction level. Higher levels survive more damage (and allow a
   * bigger logo) at the cost of denser codes. Default "L".
   */
  errorCorrectionLevel?: ErrorCorrectionLevel;
  /** Quiet-zone padding around the QR, in pixels. Default 4. */
  margin?: number;
  /** Color of the QR modules (foreground). Default "#000". */
  foregroundColor?: string;
  /** Color behind the QR (background). Default "#fff". */
  backgroundColor?: string;
  /**
   * Logo overlay size as a fraction of the QR size (0–1). Defaults to the
   * largest scannable size for the current error-correction level.
   */
  logoSize?: number;
  /** Module shape: "square", "dots", or "rounded". Default "square". */
  shape?: QRShape;
  /** Outer ring style of the finder patterns. Default "square". */
  cornerBorderStyle?: CornerBorderStyle;
  /** Center dot style of the finder patterns. Default "square". */
  cornerCenterStyle?: CornerCenterStyle;
  /** Color of the finder-pattern outer rings. Defaults to foregroundColor. */
  cornerBorderColor?: string;
  /** Color of the finder-pattern center dots. Defaults to foregroundColor. */
  cornerCenterColor?: string;
}

export const ReactQR = forwardRef<SVGSVGElement, ReactQRProps>(
  (
    {
      value,
      size = 128,
      errorCorrectionLevel = "L",
      margin = 4,
      foregroundColor = "#000",
      backgroundColor = "#fff",
      logoSize = LOGO_SAFE_RATIO[errorCorrectionLevel],
      shape = "square",
      cornerBorderStyle = "square",
      cornerCenterStyle = "square",
      cornerBorderColor,
      cornerCenterColor,
      children,
    },
    ref
  ) => {
    const childrenSvgRef = useRef<SVGSVGElement>(null);

    const qr = useMemo(() => {
      try {
        return qrcodegen.QrCode.encodeText(
          value,
          ERROR_CORRECTION_LEVEL_MAP[errorCorrectionLevel]
        );
      } catch (err) {
        console.error("QR generation failed", err);
        return null;
      }
    }, [value, errorCorrectionLevel]);

    const qrSize = qr?.size ?? 0;
    const cellSize = qrSize ? (size - margin * 2) / qrSize : 0;

    const staticSize = useMemo(() => getIntrinsicSize(children), [children]);

    const [intrinsic, setIntrinsic] = useState(staticSize ?? { w: 0, h: 0 });

    useEffect(() => {
      if (!children || staticSize || !childrenSvgRef.current) return;
      const { width, height } = childrenSvgRef.current.getBBox();
      setIntrinsic({ w: width, h: height });
    }, [children, staticSize]);

    // Scale logo to a fraction of the QR size, preserving its aspect ratio.
    const { w, h } = useMemo(() => {
      if (!intrinsic.w || !intrinsic.h) return { w: 0, h: 0 };
      const box = size * logoSize;
      const scale = box / Math.max(intrinsic.w, intrinsic.h);
      return { w: intrinsic.w * scale, h: intrinsic.h * scale };
    }, [intrinsic, size, logoSize]);

    const mask = useMemo(() => {
      if (!children || !cellSize || !w || !h) {
        return {
          sx: -1,
          sy: -1,
          ex: -1,
          ey: -1,
          fx: margin,
          fy: margin,
        };
      }

      const startXf = (qrSize - w / cellSize) / 2;
      const startYf = (qrSize - h / cellSize) / 2;
      const endXf = startXf + w / cellSize;
      const endYf = startYf + h / cellSize;

      return {
        sx: Math.floor(startXf),
        sy: Math.floor(startYf),
        ex: Math.ceil(endXf),
        ey: Math.ceil(endYf),
        fx: margin + startXf * cellSize,
        fy: margin + startYf * cellSize,
      };
    }, [children, w, h, cellSize, qrSize, margin]);

    const qrPath = useMemo(() => {
      if (!qr) return "";
      const { sx, sy, ex, ey } = mask;
      const modules = qr.getModules();

      // The three 7x7 finder patterns ("eyes"); drawn separately so their
      // ring/center can be styled independently of the body modules.
      const inFinder = (x: number, y: number) =>
        (x < 7 && y < 7) ||
        (x >= qrSize - 7 && y < 7) ||
        (x < 7 && y >= qrSize - 7);

      // A module is drawn when it's dark, not part of a finder pattern, and
      // not knocked out by the logo.
      const filled = (x: number, y: number) =>
        x >= 0 &&
        y >= 0 &&
        x < qrSize &&
        y < qrSize &&
        modules[y][x] &&
        !inFinder(x, y) &&
        !(x >= sx && x < ex && y >= sy && y < ey);

      let path = "";
      for (let y = 0; y < qrSize; y++) {
        for (let x = 0; x < qrSize; x++) {
          if (!filled(x, y)) continue;
          const px = margin + x * cellSize;
          const py = margin + y * cellSize;

          if (shape === "dots") {
            path += dotPath(px, py, cellSize);
          } else if (shape === "square") {
            path += `M${px},${py}h${cellSize}v${cellSize}h-${cellSize}z`;
          } else if (shape === "diamond") {
            path += diamondPath(px, py, cellSize);
          } else if (shape === "triangle") {
            path += trianglePath(px, py, cellSize);
          } else if (shape === "plus") {
            path += plusPath(px, py, cellSize);
          } else if (shape === "star") {
            path += starPath(px, py, cellSize);
          } else if (shape === "fluid") {
            path += fluidPath(px, py, cellSize, {
              up: filled(x, y - 1),
              down: filled(x, y + 1),
              left: filled(x - 1, y),
              right: filled(x + 1, y),
              ul: filled(x - 1, y - 1),
              ur: filled(x + 1, y - 1),
              dl: filled(x - 1, y + 1),
              dr: filled(x + 1, y + 1),
            });
          } else {
            // Neighbour-aware corner rounding. A corner only rounds where the
            // module has no neighbour on either of its two adjacent sides.
            const up = filled(x, y - 1);
            const down = filled(x, y + 1);
            const left = filled(x - 1, y);
            const right = filled(x + 1, y);
            const outerTL = !up && !left;
            const outerTR = !up && !right;
            const outerBR = !down && !right;
            const outerBL = !down && !left;
            const full = cellSize / 2;
            let radii: CornerRadii;
            if (shape === "classy") {
              // Leaf with straight diagonal cuts on two opposite corners.
              radii = {
                tl: outerTL ? full : 0,
                tr: 0,
                br: outerBR ? full : 0,
                bl: 0,
              };
              path += roundedPath(px, py, cellSize, radii, true);
            } else if (shape === "classy-rounded") {
              // Same leaf, but the diagonal corners are rounded instead of cut.
              radii = {
                tl: outerTL ? full : 0,
                tr: 0,
                br: outerBR ? full : 0,
                bl: 0,
              };
              path += roundedPath(px, py, cellSize, radii);
            } else if (shape === "vertical") {
              // Vertical bars: caps only at the ends of a vertical run.
              radii = {
                tl: !up ? full : 0,
                tr: !up ? full : 0,
                br: !down ? full : 0,
                bl: !down ? full : 0,
              };
              path += roundedPath(px, py, cellSize, radii);
            } else if (shape === "horizontal") {
              // Horizontal bars: caps only at the ends of a horizontal run.
              radii = {
                tl: !left ? full : 0,
                bl: !left ? full : 0,
                tr: !right ? full : 0,
                br: !right ? full : 0,
              };
              path += roundedPath(px, py, cellSize, radii);
            } else {
              // "rounded": every outer corner rounded to a half-cell radius.
              radii = {
                tl: outerTL ? full : 0,
                tr: outerTR ? full : 0,
                br: outerBR ? full : 0,
                bl: outerBL ? full : 0,
              };
              path += roundedPath(px, py, cellSize, radii);
            }
          }
        }
      }
      return path;
    }, [qr, qrSize, mask, margin, cellSize, shape]);

    const corners = useMemo(() => {
      if (!qr || !cellSize) return { border: "", center: "" };
      // Top-left module of each finder block: TL, TR, BL.
      const origins: [number, number][] = [
        [0, 0],
        [qrSize - 7, 0],
        [0, qrSize - 7],
      ];
      let border = "";
      let center = "";
      for (const [cx, cy] of origins) {
        const ox = margin + cx * cellSize;
        const oy = margin + cy * cellSize;
        border += cornerBorderPath(ox, oy, cellSize, cornerBorderStyle);
        center += cornerCenterPath(ox, oy, cellSize, cornerCenterStyle);
      }
      return { border, center };
    }, [qr, qrSize, margin, cellSize, cornerBorderStyle, cornerCenterStyle]);

    if (!qr) return null;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d={`M0,0h${size}v${size}h-${size}z`} fill={backgroundColor} />
        <path
          d={qrPath}
          fill={foregroundColor}
          shapeRendering={shape === "square" ? "crispEdges" : "geometricPrecision"}
        />
        <path
          d={corners.border}
          fill={cornerBorderColor ?? foregroundColor}
          fillRule="evenodd"
          shapeRendering={
            cornerBorderStyle === "square" ? "crispEdges" : "geometricPrecision"
          }
        />
        <path
          d={corners.center}
          fill={cornerCenterColor ?? foregroundColor}
          shapeRendering={
            cornerCenterStyle === "square" ? "crispEdges" : "geometricPrecision"
          }
        />
        {children && (
          <svg
            ref={childrenSvgRef}
            x={mask.fx}
            y={mask.fy}
            width={w || 1}
            height={h || 1}
            style={{ width: w || 1, height: h || 1 }}
            viewBox={`0 0 ${intrinsic.w || 1} ${intrinsic.h || 1}`}
            pointerEvents="none"
          >
            {children}
          </svg>
        )}
      </svg>
    );
  }
);
