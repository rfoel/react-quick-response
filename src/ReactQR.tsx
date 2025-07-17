import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import qrcodegen from "./qrcodegen";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const ERROR_CORRECTION_LEVEL_MAP: Record<
  ErrorCorrectionLevel,
  qrcodegen.QrCode.Ecc
> = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
} as const;

export interface ReactQRProps extends PropsWithChildren {
  value: string;
  size?: number;
  errorCorrectionLevel?: ErrorCorrectionLevel;
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
}

export const ReactQR = forwardRef<SVGSVGElement, ReactQRProps>(
  (
    {
      value,
      size = 128,
      errorCorrectionLevel = "L",
      margin = 4,
      foregroundColor = "#000000",
      backgroundColor = "#ffffff",
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
    const cellSize = qrSize > 0 ? (size - margin * 2) / qrSize : 0;

    const [{ w, h }, setOverlay] = useState({ w: 0, h: 0 });

    useEffect(() => {
      if (children && childrenSvgRef.current) {
        const { width, height } = childrenSvgRef.current.getBBox();
        setOverlay({ w: width, h: height });
      }
    }, [children]);

    const mask = useMemo(() => {
      if (!children || !cellSize) {
        return { sx: -1, sy: -1, ex: -1, ey: -1, fx: 0, fy: 0 };
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
      let path = "";

      for (let y = 0; y < qrSize; y++) {
        for (let x = 0; x < qrSize; x++) {
          const skip = x >= sx && x < ex && y >= sy && y < ey;
          if (!skip && modules[y][x]) {
            const px = margin + x * cellSize;
            const py = margin + y * cellSize;
            path += `M${px},${py}h${cellSize}v${cellSize}h-${cellSize}z`;
          }
        }
      }
      return path;
    }, [qr, qrSize, mask, margin, cellSize]);

    if (!qr) return null;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d={`M0,0h${size}v${size}h-${size}z`} fill={backgroundColor} />
        <path d={qrPath} fill={foregroundColor} shapeRendering="crispEdges" />
        {children ? (
          <svg
            ref={childrenSvgRef}
            x={mask.fx}
            y={mask.fy}
            width={w || 1}
            height={h || 1}
            viewBox={`0 0 ${w} ${h}`}
            pointerEvents="none"
          >
            {children}
          </svg>
        ) : null}
      </svg>
    );
  }
);
