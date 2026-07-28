import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  buildQR,
  LOGO_SAFE_RATIO,
  resolvePaints,
  shapeRendering,
  type CornerBorderStyle,
  type CornerCenterStyle,
  type EncodeMode,
  type ErrorCorrectionLevel,
  type Gradient,
  type QRShape,
  type ResolvedGradient,
} from "quick-response-core";

export type {
  ColorStop,
  CornerBorderStyle,
  CornerCenterStyle,
  EncodeMode,
  ErrorCorrectionLevel,
  Gradient,
  QRShape,
} from "quick-response-core";

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

function GradientDef({ gradient }: { gradient: ResolvedGradient }) {
  const stops = gradient.colorStops.map((stop) => (
    <stop
      key={`${stop.offset}-${stop.color}`}
      offset={stop.offset}
      stopColor={stop.color}
    />
  ));

  if (gradient.type === "radial" && gradient.radial) {
    return (
      <radialGradient
        id={gradient.id}
        gradientUnits="userSpaceOnUse"
        {...gradient.radial}
      >
        {stops}
      </radialGradient>
    );
  }

  return (
    <linearGradient
      id={gradient.id}
      gradientUnits="userSpaceOnUse"
      {...(gradient.linear ?? {})}
    >
      {stops}
    </linearGradient>
  );
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
  /** Gradient for the QR modules. Wins over `foregroundColor`. */
  foregroundGradient?: Gradient | null;
  /** Color behind the QR (background). Default "#fff". */
  backgroundColor?: string;
  /** Gradient behind the QR. Wins over `backgroundColor`. */
  backgroundGradient?: Gradient | null;
  /**
   * Corner radius of the background as a fraction of `size` (0–1). `1` makes
   * it a circle. Default 0.
   */
  backgroundRound?: number;
  /**
   * Logo overlay size as a fraction of the QR size (0–1). Defaults to the
   * largest scannable size for the current error-correction level.
   */
  logoSize?: number;
  /** Extra quiet space cleared around the logo, in pixels. Default 0. */
  logoMargin?: number;
  /** Whether the modules behind the logo are removed. Default true. */
  logoKnockout?: boolean;
  /**
   * URL or data URI of a logo, drawn centered. Simpler alternative to passing
   * SVG children; `children` wins when both are given.
   */
  image?: string;
  /** Module shape: "square", "dots", or "rounded". Default "square". */
  shape?: QRShape;
  /** Outer ring style of the finder patterns. Default "square". */
  cornerBorderStyle?: CornerBorderStyle;
  /** Center dot style of the finder patterns. Default "square". */
  cornerCenterStyle?: CornerCenterStyle;
  /** Color of the finder-pattern outer rings. Defaults to foregroundColor. */
  cornerBorderColor?: string;
  /** Gradient for the finder-pattern outer rings. */
  cornerBorderGradient?: Gradient | null;
  /** Color of the finder-pattern center dots. Defaults to foregroundColor. */
  cornerCenterColor?: string;
  /** Gradient for the finder-pattern center dots. */
  cornerCenterGradient?: Gradient | null;
  /**
   * Smallest QR version (matrix size) to use, 1–40. The code still grows when
   * the data needs it. qr-code-styling calls this `typeNumber`. Default 1.
   */
  minVersion?: number;
  /** Largest QR version to use, 1–40. Default 40. */
  maxVersion?: number;
  /** How to encode the value. Default "auto" (most compact). */
  mode?: EncodeMode;
}

export const ReactQR = forwardRef<SVGSVGElement, ReactQRProps>(
  (
    {
      value,
      size = 128,
      errorCorrectionLevel = "L",
      margin = 4,
      foregroundColor = "#000",
      foregroundGradient = null,
      backgroundColor = "#fff",
      backgroundGradient = null,
      backgroundRound = 0,
      logoSize = LOGO_SAFE_RATIO[errorCorrectionLevel],
      logoMargin = 0,
      logoKnockout = true,
      image,
      shape = "square",
      cornerBorderStyle = "square",
      cornerCenterStyle = "square",
      cornerBorderColor,
      cornerBorderGradient = null,
      cornerCenterColor,
      cornerCenterGradient = null,
      minVersion,
      maxVersion,
      mode,
      children,
    },
    ref
  ) => {
    const childrenSvgRef = useRef<SVGSVGElement>(null);

    const staticSize = useMemo(() => getIntrinsicSize(children), [children]);

    const [intrinsic, setIntrinsic] = useState(staticSize ?? { w: 0, h: 0 });

    useEffect(() => {
      if (!children || staticSize || !childrenSvgRef.current) return;
      const { width, height } = childrenSvgRef.current.getBBox();
      setIntrinsic({ w: width, h: height });
    }, [children, staticSize]);

    // Scale logo to a fraction of the QR size, preserving its aspect ratio.
    // A plain `image` has no measurable aspect ratio, so it gets the full
    // square box and keeps its own ratio inside it via preserveAspectRatio.
    const { w, h } = useMemo(() => {
      const box = size * logoSize;
      if (!children) return image ? { w: box, h: box } : { w: 0, h: 0 };
      if (!intrinsic.w || !intrinsic.h) return { w: 0, h: 0 };
      const scale = box / Math.max(intrinsic.w, intrinsic.h);
      return { w: intrinsic.w * scale, h: intrinsic.h * scale };
    }, [children, image, intrinsic, size, logoSize]);

    // All the geometry — module paths, finder patterns, logo knockout — comes
    // from the framework-agnostic core; this component only renders it.
    const qr = useMemo(() => {
      try {
        return buildQR({
          value,
          size,
          errorCorrectionLevel,
          margin,
          shape,
          cornerBorderStyle,
          cornerCenterStyle,
          backgroundRound,
          minVersion,
          maxVersion,
          mode,
          logo: w && h ? { width: w, height: h, margin: logoMargin } : null,
          logoKnockout,
        });
      } catch (err) {
        console.error("QR generation failed", err);
        return null;
      }
    }, [
      value,
      size,
      errorCorrectionLevel,
      margin,
      shape,
      cornerBorderStyle,
      cornerCenterStyle,
      backgroundRound,
      minVersion,
      maxVersion,
      mode,
      logoMargin,
      logoKnockout,
      w,
      h,
    ]);

    const paints = useMemo(
      () =>
        resolvePaints(
          {
            foregroundColor,
            foregroundGradient,
            backgroundColor,
            backgroundGradient,
            cornerBorderColor,
            cornerBorderGradient,
            cornerCenterColor,
            cornerCenterGradient,
          },
          { size, margin }
        ),
      [
        foregroundColor,
        foregroundGradient,
        backgroundColor,
        backgroundGradient,
        cornerBorderColor,
        cornerBorderGradient,
        cornerCenterColor,
        cornerCenterGradient,
        size,
        margin,
      ]
    );

    if (!qr) return null;

    // On the first pass the logo has not been measured yet, so there is no
    // knockout: park it in the quiet zone at 1x1 just to get it measurable.
    const logo = qr.logoRect ?? { x: margin, y: margin, width: 0, height: 0 };

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {paints.defs.length > 0 && (
          <defs>
            {paints.defs.map((gradient) => (
              <GradientDef key={gradient.id} gradient={gradient} />
            ))}
          </defs>
        )}
        <path d={qr.backgroundPath} fill={paints.background} />
        <path
          d={qr.modulesPath}
          fill={paints.modules}
          shapeRendering={shapeRendering(shape)}
        />
        <path
          d={qr.cornerBorderPath}
          fill={paints.cornerBorder}
          fillRule="evenodd"
          shapeRendering={shapeRendering(cornerBorderStyle)}
        />
        <path
          d={qr.cornerCenterPath}
          fill={paints.cornerCenter}
          shapeRendering={shapeRendering(cornerCenterStyle)}
        />
        {children ? (
          <svg
            ref={childrenSvgRef}
            x={logo.x}
            y={logo.y}
            width={logo.width || 1}
            height={logo.height || 1}
            style={{ width: logo.width || 1, height: logo.height || 1 }}
            viewBox={`0 0 ${intrinsic.w || 1} ${intrinsic.h || 1}`}
            pointerEvents="none"
          >
            {children}
          </svg>
        ) : (
          image && (
            <image
              href={image}
              x={logo.x}
              y={logo.y}
              width={logo.width}
              height={logo.height}
              preserveAspectRatio="xMidYMid meet"
              pointerEvents="none"
            />
          )
        )}
      </svg>
    );
  }
);
