import { r3 } from "./paths";
import type { ColorStop, Gradient, Rect } from "./types";

/** A gradient with an id and absolute (userSpaceOnUse) coordinates. */
export interface ResolvedGradient {
  id: string;
  type: "linear" | "radial";
  /** Set when `type` is "linear". */
  linear: { x1: number; y1: number; x2: number; y2: number } | null;
  /** Set when `type` is "radial". */
  radial: { cx: number; cy: number; r: number } | null;
  colorStops: ColorStop[];
}

export interface QRPaintOptions {
  /** Color of the QR modules (foreground). Default "#000". */
  foregroundColor?: string;
  /** Gradient for the QR modules. Wins over `foregroundColor`. */
  foregroundGradient?: Gradient | null;
  /** Color behind the QR (background). Default "#fff". */
  backgroundColor?: string;
  /** Gradient behind the QR. Wins over `backgroundColor`. */
  backgroundGradient?: Gradient | null;
  /** Color of the finder-pattern outer rings. Inherits the foreground. */
  cornerBorderColor?: string;
  /** Gradient for the finder-pattern outer rings. */
  cornerBorderGradient?: Gradient | null;
  /** Color of the finder-pattern center dots. Inherits the foreground. */
  cornerCenterColor?: string;
  /** Gradient for the finder-pattern center dots. */
  cornerCenterGradient?: Gradient | null;
}

/**
 * Ready-to-use `fill` values plus the gradient definitions they point at.
 * Each fill is either a color or `url(#id)`.
 */
export interface QRPaints {
  background: string;
  modules: string;
  cornerBorder: string;
  cornerCenter: string;
  /** Deduplicated — identical gradients share one definition. */
  defs: ResolvedGradient[];
}

// djb2. Ids are derived from the gradient itself so they are stable between
// server and client (no mismatch on hydration) and identical gradients reuse
// one definition instead of colliding.
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const sortStops = (stops: ColorStop[]): ColorStop[] =>
  [...stops].sort((a, b) => a.offset - b.offset);

/**
 * Turn a gradient into absolute coordinates over `bounds`. A linear gradient
 * is a line through the center of the box at `rotation` degrees; a radial one
 * is a circle centered on the box.
 */
export function resolveGradient(
  gradient: Gradient,
  bounds: Rect
): ResolvedGradient {
  const type = gradient.type ?? "linear";
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  let linear: ResolvedGradient["linear"] = null;
  let radial: ResolvedGradient["radial"] = null;

  if (type === "radial") {
    radial = {
      cx: r3(cx),
      cy: r3(cy),
      r: r3(Math.max(bounds.width, bounds.height) / 2),
    };
  } else {
    const angle = ((gradient.rotation ?? 0) * Math.PI) / 180;
    const dx = (Math.cos(angle) * bounds.width) / 2;
    const dy = (Math.sin(angle) * bounds.height) / 2;
    linear = {
      x1: r3(cx - dx),
      y1: r3(cy - dy),
      x2: r3(cx + dx),
      y2: r3(cy + dy),
    };
  }

  const colorStops = sortStops(gradient.colorStops);
  const id = `qr-${hash(
    JSON.stringify([type, linear, radial, colorStops])
  )}`;

  return { id, type, linear, radial, colorStops };
}

/**
 * Resolve every fill of a QR code at once. Corner fills fall back to the
 * foreground: an explicit corner gradient wins over a corner color, which wins
 * over the foreground gradient, which wins over the foreground color.
 */
export function resolvePaints(
  options: QRPaintOptions,
  layout: { size: number; margin: number }
): QRPaints {
  const {
    foregroundColor = "#000",
    foregroundGradient = null,
    backgroundColor = "#fff",
    backgroundGradient = null,
    cornerBorderColor,
    cornerBorderGradient = null,
    cornerCenterColor,
    cornerCenterGradient = null,
  } = options;

  const { size, margin } = layout;
  // The body gradient spans the QR itself, not the quiet zone, so the modules
  // and the three eyes share one continuous ramp.
  const bodyBounds: Rect = {
    x: margin,
    y: margin,
    width: size - margin * 2,
    height: size - margin * 2,
  };
  const fullBounds: Rect = { x: 0, y: 0, width: size, height: size };

  const defs: ResolvedGradient[] = [];
  const paint = (gradient: Gradient | null, color: string, bounds: Rect) => {
    if (!gradient || gradient.colorStops.length === 0) return color;
    const resolved = resolveGradient(gradient, bounds);
    if (!defs.some((d) => d.id === resolved.id)) defs.push(resolved);
    return `url(#${resolved.id})`;
  };

  const background = paint(backgroundGradient, backgroundColor, fullBounds);
  const modules = paint(foregroundGradient, foregroundColor, bodyBounds);
  const inherit = (
    gradient: Gradient | null,
    color: string | undefined
  ): string =>
    gradient
      ? paint(gradient, color ?? foregroundColor, bodyBounds)
      : color ?? modules;

  return {
    background,
    modules,
    cornerBorder: inherit(cornerBorderGradient, cornerBorderColor),
    cornerCenter: inherit(cornerCenterGradient, cornerCenterColor),
    defs,
  };
}

const escapeAttr = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Serialize one resolved gradient as an SVG `<defs>` child. */
export function gradientToSVGString(gradient: ResolvedGradient): string {
  const stops = gradient.colorStops
    .map(
      (stop) =>
        `<stop offset="${r3(stop.offset)}" stop-color="${escapeAttr(
          stop.color
        )}"/>`
    )
    .join("");

  if (gradient.type === "radial" && gradient.radial) {
    const { cx, cy, r } = gradient.radial;
    return (
      `<radialGradient id="${gradient.id}" gradientUnits="userSpaceOnUse" ` +
      `cx="${cx}" cy="${cy}" r="${r}">${stops}</radialGradient>`
    );
  }

  const { x1, y1, x2, y2 } = gradient.linear ?? { x1: 0, y1: 0, x2: 0, y2: 0 };
  return (
    `<linearGradient id="${gradient.id}" gradientUnits="userSpaceOnUse" ` +
    `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`
  );
}
