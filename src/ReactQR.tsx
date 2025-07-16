import {
  forwardRef,
  useLayoutEffect,
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

    const [{ modulesW, modulesH }, setOverlayModules] = useState({
      modulesW: 0,
      modulesH: 0,
    });

    useLayoutEffect(() => {
      if (!children || !childrenSvgRef.current || !cellSize) return;

      const bBox = childrenSvgRef.current.getBBox();
      setOverlayModules({
        modulesW: Math.ceil((bBox.width + 1) / cellSize),
        modulesH: Math.ceil((bBox.height + 1) / cellSize),
      });
    }, [cellSize, children]);

    const { startX, startY, endX, endY } = useMemo(() => {
      if (children) {
        const sx = Math.floor((qrSize - modulesW) / 2);
        const sy = Math.floor((qrSize - modulesH) / 2);
        return {
          startX: sx,
          startY: sy,
          endX: sx + modulesW,
          endY: sy + modulesH,
        };
      }
      return { startX: -1, startY: -1, endX: -1, endY: -1 };
    }, [children, qrSize, modulesW, modulesH]);

    const qrPath = useMemo(() => {
      if (!qr) return "";

      const modules = qr.getModules();
      let path = "";
      for (let y = 0; y < qrSize; y += 1) {
        for (let x = 0; x < qrSize; x += 1) {
          const skip = x >= startX && x < endX && y >= startY && y < endY;
          if (!skip && modules[y][x]) {
            const rectX = margin + x * cellSize;
            const rectY = margin + y * cellSize;
            path += `M${rectX},${rectY}h${cellSize}v${cellSize}h-${cellSize}z`;
          }
        }
      }
      return path;
    }, [qr, qrSize, startX, endX, startY, endY, margin, cellSize]);

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
            x={margin + startX * cellSize}
            y={margin + startY * cellSize}
          >
            {children}
          </svg>
        ) : null}
      </svg>
    );
  }
);
