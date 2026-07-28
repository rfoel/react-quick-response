import {
  gradientToSVGString,
  resolvePaints,
  type QRPaintOptions,
} from "./gradients";
import { shapeRendering } from "./paths";
import { buildQR, type QRGeometryOptions } from "./qr";

export interface QRSvgOptions extends QRGeometryOptions, QRPaintOptions {
  /**
   * URL or data URI of a logo drawn in the knocked-out center. Only used when
   * `logo` dimensions are given.
   */
  logoHref?: string;
}

const escapeAttr = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Render a complete standalone `<svg>` string. Works anywhere — browser,
 * Node, a worker — with no DOM. Throws if the value does not fit a QR code.
 */
export function toSVGString(options: QRSvgOptions): string {
  const {
    foregroundColor,
    foregroundGradient,
    backgroundColor,
    backgroundGradient,
    cornerBorderColor,
    cornerBorderGradient,
    cornerCenterColor,
    cornerCenterGradient,
    logoHref,
    ...geometryOptions
  } = options;

  const qr = buildQR(geometryOptions);
  const {
    size,
    margin,
    backgroundPath,
    modulesPath,
    cornerBorderPath,
    cornerCenterPath,
    logoRect,
  } = qr;

  const paints = resolvePaints(
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
  );

  const shape = geometryOptions.shape ?? "square";
  const borderStyle = geometryOptions.cornerBorderStyle ?? "square";
  const centerStyle = geometryOptions.cornerCenterStyle ?? "square";

  const defs = paints.defs.length
    ? `<defs>${paints.defs.map(gradientToSVGString).join("")}</defs>`
    : "";

  const logo =
    logoRect && logoHref
      ? `<image href="${escapeAttr(logoHref)}" x="${logoRect.x}" y="${
          logoRect.y
        }" width="${logoRect.width}" height="${
          logoRect.height
        }" preserveAspectRatio="xMidYMid meet"/>`
      : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${size} ${size}" preserveAspectRatio="xMidYMid meet">` +
    defs +
    `<path d="${backgroundPath}" fill="${escapeAttr(paints.background)}"/>` +
    `<path d="${modulesPath}" fill="${escapeAttr(
      paints.modules
    )}" shape-rendering="${shapeRendering(shape)}"/>` +
    `<path d="${cornerBorderPath}" fill="${escapeAttr(
      paints.cornerBorder
    )}" fill-rule="evenodd" shape-rendering="${shapeRendering(
      borderStyle
    )}"/>` +
    `<path d="${cornerCenterPath}" fill="${escapeAttr(
      paints.cornerCenter
    )}" shape-rendering="${shapeRendering(centerStyle)}"/>` +
    logo +
    `</svg>`
  );
}
