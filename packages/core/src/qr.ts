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
   * makes it a circle. Default 0 (a square). qr-code-styling calls this
   * `backgroundOptions.round`.
   */
  backgroundRound?: number;
  /**
   * Smallest QR version to use, 1–40. The encoder still grows past it when the
   * data does not fit. qr-code-styling calls this `typeNumber`. Default 1.
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
   * qr-code-styling calls this `imageOptions.hideBackgroundDots`.
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
  const cellSize = (size - margin * 2) / moduleCount;
  const modules = qr.getModules();

  // Logo knockout, in module coordinates. -1 bounds match nothing.
  let knockout = { sx: -1, sy: -1, ex: -1, ey: -1 };
  let logoRect: Rect | null = null;
  if (logo && logo.width > 0 && logo.height > 0 && cellSize > 0) {
    const gap = logo.margin ?? 0;
    const startXf = (moduleCount - logo.width / cellSize) / 2;
    const startYf = (moduleCount - logo.height / cellSize) / 2;
    logoRect = {
      x: margin + startXf * cellSize,
      y: margin + startYf * cellSize,
      width: logo.width,
      height: logo.height,
    };
    if (logoKnockout) {
      // The cleared area is the logo box grown by `margin` on every side.
      const clearW = (logo.width + gap * 2) / cellSize;
      const clearH = (logo.height + gap * 2) / cellSize;
      const clearX = (moduleCount - clearW) / 2;
      const clearY = (moduleCount - clearH) / 2;
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
  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) ||
    (x >= moduleCount - 7 && y < 7) ||
    (x < 7 && y >= moduleCount - 7);

  // A module is drawn when it's dark, not part of a finder pattern, and not
  // knocked out by the logo.
  const filled = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < moduleCount &&
    y < moduleCount &&
    modules[y][x] &&
    !inFinder(x, y) &&
    !(
      x >= knockout.sx &&
      x < knockout.ex &&
      y >= knockout.sy &&
      y < knockout.ey
    );

  let modulesPath = "";
  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (!filled(x, y)) continue;
      modulesPath += modulePath(
        shape,
        margin + x * cellSize,
        margin + y * cellSize,
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

  // Top-left module of each finder block: TL, TR, BL.
  const origins: [number, number][] = [
    [0, 0],
    [moduleCount - 7, 0],
    [0, moduleCount - 7],
  ];
  let border = "";
  let center = "";
  for (const [cx, cy] of origins) {
    const ox = margin + cx * cellSize;
    const oy = margin + cy * cellSize;
    border += cornerBorderPath(ox, oy, cellSize, cornerBorderStyle);
    center += cornerCenterPath(ox, oy, cellSize, cornerCenterStyle);
  }

  const round = Math.min(Math.max(backgroundRound, 0), 1);

  return {
    size,
    margin,
    version: qr.version,
    moduleCount,
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
