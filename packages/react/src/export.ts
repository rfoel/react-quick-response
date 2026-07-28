import {
  downloadBlob,
  svgToBlob,
  svgToDataURL,
  type DownloadOptions,
  type ExportOptions,
} from "quick-response-core";

export type {
  DownloadOptions,
  ExportFormat,
  ExportOptions,
} from "quick-response-core";

/**
 * Serialize a rendered `<ReactQR />` element into a standalone SVG string.
 * Reads the live DOM, so whatever you passed as `children` (an inline logo,
 * a `<text>`, anything) comes along.
 */
export function qrToSVGString(svg: SVGSVGElement): string {
  if (typeof XMLSerializer === "undefined")
    throw new Error("qrToSVGString needs a DOM");
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

/**
 * Rasterize a rendered QR element to a Blob — "png" (default), "jpeg",
 * "webp", or "svg" for the vector itself.
 *
 * A logo loaded from another origin taints the canvas and makes this throw;
 * inline the logo (SVG children or a data URI) to avoid it.
 */
export async function qrToBlob(
  svg: SVGSVGElement,
  options: ExportOptions = {}
): Promise<Blob> {
  return svgToBlob(qrToSVGString(svg), options);
}

/** Rasterize a rendered QR element to a data URL. */
export async function qrToDataURL(
  svg: SVGSVGElement,
  options: ExportOptions = {}
): Promise<string> {
  return svgToDataURL(qrToSVGString(svg), options);
}

/** Save a rendered QR element to the user's downloads. */
export async function downloadQR(
  svg: SVGSVGElement,
  options: DownloadOptions = {}
): Promise<void> {
  const { name = "qr", format = "png" } = options;
  downloadBlob(await qrToBlob(svg, options), `${name}.${format}`);
}
