/** QR error-correction level, from lowest (L) to highest (H) redundancy. */
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

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
  | "plus";

/** Which of a module's eight surrounding cells are filled. */
export type Neighbours = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  ul: boolean;
  ur: boolean;
  dl: boolean;
  dr: boolean;
};

/** Per-corner radius in pixels (0 = sharp). */
export type CornerRadii = { tl: number; tr: number; br: number; bl: number };

/** A rectangle in SVG user units. */
export type Rect = { x: number; y: number; width: number; height: number };

/** One stop of a gradient: `offset` is 0–1 along the ramp. */
export type ColorStop = { offset: number; color: string };

/**
 * A gradient fill. `rotation` is in **degrees**, clockwise from a
 * left-to-right ramp, and only applies to linear gradients. (qr-code-styling
 * takes radians here — multiply by 180/Math.PI when porting.)
 */
export interface Gradient {
  type?: "linear" | "radial";
  rotation?: number;
  colorStops: ColorStop[];
}

/**
 * How to encode the value. "auto" splits it into the most compact mix of
 * segments; the others force a single mode and throw if the value does not fit
 * that charset.
 */
export type EncodeMode = "auto" | "numeric" | "alphanumeric" | "byte";
