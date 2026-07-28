import {
  cornerBorderPath,
  cornerCenterPath,
  modulePath,
  rectPath,
  roundRectPath,
} from "./paths";
import qrcodegen from "./qrcodegen";
import type {
  CornerBorderStyle,
  CornerCenterStyle,
  EncodeMode,
  ErrorCorrectionLevel,
  QRShape,
  Rect,
} from "./types";

const ERROR_CORRECTION_LEVEL_MAP: Record<
  ErrorCorrectionLevel,
  qrcodegen.QrCode.Ecc
> = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
} as const;

/**
 * Largest logo (linear fraction of QR size) that stays scannable per ECC
 * level, kept a little under the theoretical recovery limit for safety margin.
 */
export const LOGO_SAFE_RATIO: Record<ErrorCorrectionLevel, number> = {
  L: 0.2,
  M: 0.3,
  Q: 0.38,
  H: 0.45,
};

/** Smallest and largest QR version (matrix size) the encoder supports. */
export const MIN_VERSION = qrcodegen.QrCode.MIN_VERSION;
export const MAX_VERSION = qrcodegen.QrCode.MAX_VERSION;

/** Overall silhouette of the code: a square, or a filled disc. */
export type QRFrame = "square" | "circle";

export interface QRLogo {
  /** Logo width, in user units. */
  width: number;
  /** Logo height, in user units. */
  height: number;
  /**
   * Extra quiet space cleared around the logo, in user units. Default 0.
   * Widens the knockout only — the logo itself keeps its size.
   */
  margin?: number;
}

export interface QRGeometryOptions {
  /** Text or URL to encode. */
  value: string;
  /**
   * Overall silhouette. "circle" shrinks the code to fit a disc and fills the
   * ring around it with decorative modules sampled from the data, separated by
   * a one-module gap. Default "square".
   */
  frame?: QRFrame;
  /** Width and height of the square SVG, in user units. Default 128. */
  size?: number;
  /** Error-correction level. Default "L". */
  errorCorrectionLevel?: ErrorCorrectionLevel;
  /** Quiet-zone padding around the QR, in user units. Default 4. */
  margin?: number;
  /** Body module shape. Default "square". */
  shape?: QRShape;
  /** Outer ring style of the finder patterns. Default "square". */
  cornerBorderStyle?: CornerBorderStyle;
  /** Center dot style of the finder patterns. Default "square". */
  cornerCenterStyle?: CornerCenterStyle;
  /**
   * Corner radius of the background, as a fraction of the size (0–1). `1`
   * makes it a circle. Default 0 (a square).
   */
  backgroundRound?: number;
  /**
   * Smallest QR version to use, 1–40. The encoder still grows past it when the
   * data does not fit. Default 1.
   */
  minVersion?: number;
  /** Largest QR version to use, 1–40. Default 40. */
  maxVersion?: number;
  /** How to encode the value. Default "auto" (most compact). */
  mode?: EncodeMode;
  /** Mask pattern 0–7, or -1 to pick the best automatically. Default -1. */
  maskPattern?: number;
  /**
   * Let the encoder raise the error-correction level when the data leaves room
   * for it, at no cost in size. Default true.
   */
  boostErrorCorrectionLevel?: boolean;
  /**
   * Size of a centered logo, in user units. Modules under it are knocked out
   * so the logo sits on clean background. Pass the logo's real dimensions —
   * `logoRect` comes back with the position to draw it at.
   */
  logo?: QRLogo | null;
  /**
   * Whether the modules behind the logo are removed. Default true.
   */
  logoKnockout?: boolean;
}

export interface QRGeometry {
  /** Width and height of the square SVG. */
  size: number;
  /** Quiet-zone padding used. */
  margin: number;
  /** QR version (1–40) the value was encoded at. */
  version: number;
  /** Modules per side of the QR matrix. */
  moduleCount: number;
  /**
   * Modules per side of everything that gets drawn. Same as `moduleCount` for
   * a square frame; larger for a circle, which adds decorative rings.
   */
  gridCount: number;
  /** Top-left corner of the drawn grid, in user units. */
  origin: { x: number; y: number };
  /** Side of one module, in user units. */
  cellSize: number;
  /** Rect covering the whole SVG, quiet zone included. */
  backgroundPath: string;
  /** Every dark module except the finder patterns and the logo knockout. */
  modulesPath: string;
  /** The three finder-pattern rings. Fill with fill-rule "evenodd". */
  cornerBorderPath: string;
  /** The three finder-pattern center dots. */
  cornerCenterPath: string;
  /** Where to draw the logo, or null when no logo was requested. */
  logoRect: Rect | null;
}

const utf8Bytes = (value: string): number[] =>
  Array.from(new TextEncoder().encode(value));

function makeSegments(value: string, mode: EncodeMode) {
  switch (mode) {
    case "numeric":
      return [qrcodegen.QrSegment.makeNumeric(value)];
    case "alphanumeric":
      return [qrcodegen.QrSegment.makeAlphanumeric(value)];
    case "byte":
      return [qrcodegen.QrSegment.makeBytes(utf8Bytes(value))];
    default:
      return qrcodegen.QrSegment.makeSegments(value);
  }
}

/**
 * Encode `value` and lay out every path needed to draw it. Pure: no DOM, no
 * canvas, safe on the server. Throws if the value does not fit a QR code.
 */
export function buildQR(options: QRGeometryOptions): QRGeometry {
  const {
    value,
    size = 128,
    errorCorrectionLevel = "L",
    margin = 4,
    frame = "square",
    shape = "square",
    cornerBorderStyle = "square",
    cornerCenterStyle = "square",
    backgroundRound = 0,
    minVersion = MIN_VERSION,
    maxVersion = MAX_VERSION,
    mode = "auto",
    maskPattern = -1,
    boostErrorCorrectionLevel = true,
    logo = null,
    logoKnockout = true,
  } = options;

  const qr = qrcodegen.QrCode.encodeSegments(
    makeSegments(value, mode),
    ERROR_CORRECTION_LEVEL_MAP[errorCorrectionLevel],
    minVersion,
    maxVersion,
    maskPattern,
    boostErrorCorrectionLevel
  );
  const moduleCount = qr.size;
  const modules = qr.getModules();

  // A circular frame inscribes the code in the disc, so it shrinks by √2 and
  // the leftover room becomes decorative rings around it.
  const available = size - margin * 2;
  const circle = frame === "circle";
  const cellSize = (circle ? available / Math.SQRT2 : available) / moduleCount;
  // How many decorative rings fit around the code, and where the real matrix
  // starts inside the drawn grid.
  const rings =
    circle && cellSize > 0
      ? Math.max(0, Math.floor((available / cellSize - moduleCount) / 2))
      : 0;
  const gridCount = moduleCount + rings * 2;
  // Centered in the SVG; with a square frame this is exactly `margin`.
  const originX = margin + (available - gridCount * cellSize) / 2;
  const originY = originX;

  // Logo knockout, in grid coordinates. -1 bounds match nothing.
  let knockout = { sx: -1, sy: -1, ex: -1, ey: -1 };
  let logoRect: Rect | null = null;
  if (logo && logo.width > 0 && logo.height > 0 && cellSize > 0) {
    const gap = logo.margin ?? 0;
    logoRect = {
      x: size / 2 - logo.width / 2,
      y: size / 2 - logo.height / 2,
      width: logo.width,
      height: logo.height,
    };
    if (logoKnockout) {
      // The cleared area is the logo box grown by `margin` on every side.
      const clearW = (logo.width + gap * 2) / cellSize;
      const clearH = (logo.height + gap * 2) / cellSize;
      const clearX = (size / 2 - originX) / cellSize - clearW / 2;
      const clearY = (size / 2 - originY) / cellSize - clearH / 2;
      knockout = {
        sx: Math.floor(clearX),
        sy: Math.floor(clearY),
        ex: Math.ceil(clearX + clearW),
        ey: Math.ceil(clearY + clearH),
      };
    }
  }

  // The three 7x7 finder patterns ("eyes"); drawn separately so their
  // ring/center can be styled independently of the body modules.
  const inFinder = (x: number, y: number) => {
    const lx = x - rings;
    const ly = y - rings;
    if (lx < 0 || ly < 0 || lx >= moduleCount || ly >= moduleCount) return false;
    return (
      (lx < 7 && ly < 7) ||
      (lx >= moduleCount - 7 && ly < 7) ||
      (lx < 7 && ly >= moduleCount - 7)
    );
  };

  // Sample the matrix for a decorative module: indices outside the code wrap
  // back into it, so the ring looks like it belongs to the same data.
  const wrap = (k: number) => {
    const i = k < rings * 2 ? k : k >= moduleCount ? k - rings * 2 : k - rings;
    return Math.min(Math.max(i, 0), moduleCount - 1);
  };
  const half = gridCount / 2;

  const dark = (x: number, y: number): boolean => {
    const lx = x - rings;
    const ly = y - rings;
    if (lx >= 0 && ly >= 0 && lx < moduleCount && ly < moduleCount)
      return modules[ly][lx];
    if (!circle) return false;
    // Leave one empty module between the code and the decorative rings.
    if (lx >= -1 && ly >= -1 && lx <= moduleCount && ly <= moduleCount)
      return false;
    // Only modules whose center falls inside the disc.
    if (Math.hypot(x + 0.5 - half, y + 0.5 - half) > half) return false;
    return modules[wrap(y)][wrap(x)];
  };

  // A module is drawn when it's dark, not part of a finder pattern, and not
  // knocked out by the logo.
  const filled = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < gridCount &&
    y < gridCount &&
    dark(x, y) &&
    !inFinder(x, y) &&
    !(
      x >= knockout.sx &&
      x < knockout.ex &&
      y >= knockout.sy &&
      y < knockout.ey
    );

  let modulesPath = "";
  for (let y = 0; y < gridCount; y++) {
    for (let x = 0; x < gridCount; x++) {
      if (!filled(x, y)) continue;
      modulesPath += modulePath(
        shape,
        originX + x * cellSize,
        originY + y * cellSize,
        cellSize,
        {
          up: filled(x, y - 1),
          down: filled(x, y + 1),
          left: filled(x - 1, y),
          right: filled(x + 1, y),
          ul: filled(x - 1, y - 1),
          ur: filled(x + 1, y - 1),
          dl: filled(x - 1, y + 1),
          dr: filled(x + 1, y + 1),
        }
      );
    }
  }

  // Top-left module of each finder block, in grid coordinates: TL, TR, BL.
  const origins: [number, number][] = [
    [rings, rings],
    [rings + moduleCount - 7, rings],
    [rings, rings + moduleCount - 7],
  ];
  let border = "";
  let center = "";
  for (const [cx, cy] of origins) {
    const ox = originX + cx * cellSize;
    const oy = originY + cy * cellSize;
    border += cornerBorderPath(ox, oy, cellSize, cornerBorderStyle);
    center += cornerCenterPath(ox, oy, cellSize, cornerCenterStyle);
  }

  const round = Math.min(Math.max(backgroundRound, 0), 1);

  return {
    size,
    margin,
    version: qr.version,
    moduleCount,
    gridCount,
    origin: { x: originX, y: originY },
    cellSize,
    backgroundPath: round
      ? roundRectPath(0, 0, size, size, (size / 2) * round)
      : rectPath(0, 0, size, size),
    modulesPath,
    cornerBorderPath: border,
    cornerCenterPath: center,
    logoRect,
  };
}
