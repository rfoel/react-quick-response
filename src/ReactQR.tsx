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
export type QRShape = "square" | "dots" | "rounded";

// Round to 3 decimals to keep generated path strings compact.
const r3 = (n: number): number => Math.round(n * 1000) / 1000;

function dotPath(px: number, py: number, s: number): string {
  const rad = s / 2;
  const cy = py + rad;
  return `M${r3(px)},${r3(cy)}a${r3(rad)},${r3(rad)} 0 1 0 ${r3(
    s
  )},0a${r3(rad)},${r3(rad)} 0 1 0 ${r3(-s)},0Z`;
}

type Corners = { tl: boolean; tr: boolean; br: boolean; bl: boolean };

function roundedPath(px: number, py: number, s: number, c: Corners): string {
  const rad = s / 2;
  const x0 = px;
  const y0 = py;
  const x1 = px + s;
  const y1 = py + s;
  const arc = `A${r3(rad)},${r3(rad)} 0 0 1 `;

  let d = `M${r3(x0 + (c.tl ? rad : 0))},${r3(y0)}`;
  d += `H${r3(x1 - (c.tr ? rad : 0))}`;
  if (c.tr) d += `${arc}${r3(x1)},${r3(y0 + rad)}`;
  d += `V${r3(y1 - (c.br ? rad : 0))}`;
  if (c.br) d += `${arc}${r3(x1 - rad)},${r3(y1)}`;
  d += `H${r3(x0 + (c.bl ? rad : 0))}`;
  if (c.bl) d += `${arc}${r3(x0)},${r3(y1 - rad)}`;
  d += `V${r3(y0 + (c.tl ? rad : 0))}`;
  if (c.tl) d += `${arc}${r3(x0 + rad)},${r3(y0)}`;
  return d + "Z";
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

      // A module is drawn when it's dark and not knocked out by the logo.
      const filled = (x: number, y: number) =>
        x >= 0 &&
        y >= 0 &&
        x < qrSize &&
        y < qrSize &&
        modules[y][x] &&
        !(x >= sx && x < ex && y >= sy && y < ey);

      let path = "";
      for (let y = 0; y < qrSize; y++) {
        for (let x = 0; x < qrSize; x++) {
          if (!filled(x, y)) continue;
          const px = margin + x * cellSize;
          const py = margin + y * cellSize;

          if (shape === "dots") {
            path += dotPath(px, py, cellSize);
          } else if (shape === "rounded") {
            const up = filled(x, y - 1);
            const down = filled(x, y + 1);
            const left = filled(x - 1, y);
            const right = filled(x + 1, y);
            path += roundedPath(px, py, cellSize, {
              tl: !up && !left,
              tr: !up && !right,
              br: !down && !right,
              bl: !down && !left,
            });
          } else {
            path += `M${px},${py}h${cellSize}v${cellSize}h-${cellSize}z`;
          }
        }
      }
      return path;
    }, [qr, qrSize, mask, margin, cellSize, shape]);

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
