import { toSVGString, type QRSvgOptions } from "./svg";

export type ExportFormat = "svg" | "png" | "jpeg" | "webp";

export interface ExportOptions {
  /** Output format. Default "png". */
  format?: ExportFormat;
  /**
   * Output width and height in pixels. Defaults to the SVG's own size — raise
   * it to render at higher resolution (e.g. 4x for print).
   */
  size?: number;
  /** Quality 0–1, for "jpeg" and "webp" only. Default 0.92. */
  quality?: number;
  /**
   * Color painted under the QR before rasterizing. Defaults to "#fff" for
   * "jpeg" (which has no alpha) and transparent otherwise.
   */
  background?: string;
}

const MIME: Record<Exclude<ExportFormat, "svg">, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const requireDOM = (what: string): void => {
  if (typeof document === "undefined")
    throw new Error(
      `${what} needs a DOM (it rasterizes through <canvas>). Use toSVGString on the server.`
    );
};

/** Inline an SVG string as a data URI, no base64 and no DOM needed. */
export function svgToDataURI(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function rasterize(
  svg: string,
  options: ExportOptions
): Promise<HTMLCanvasElement> {
  requireDOM("Rasterizing a QR code");
  const { format = "png", size, background } = options;

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load the QR code SVG"));
    image.src = svgToDataURI(svg);
  });

  const side = size ?? image.naturalWidth ?? image.width;
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2d canvas context");

  // JPEG has no alpha channel: without a fill, transparent areas go black.
  const fill = background ?? (format === "jpeg" ? "#fff" : undefined);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, side, side);
  }
  ctx.drawImage(image, 0, 0, side, side);
  return canvas;
}

/**
 * Rasterize an SVG string to a Blob (or wrap it as-is for `format: "svg"`).
 * Browser only for raster formats.
 */
export async function svgToBlob(
  svg: string,
  options: ExportOptions = {}
): Promise<Blob> {
  const { format = "png", quality = 0.92 } = options;
  if (format === "svg")
    return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });

  const canvas = await rasterize(svg, options);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error(`Could not encode the QR code as ${format}`)),
      MIME[format],
      quality
    );
  });
}

/** Rasterize an SVG string to a data URL. Browser only for raster formats. */
export async function svgToDataURL(
  svg: string,
  options: ExportOptions = {}
): Promise<string> {
  const { format = "png", quality = 0.92 } = options;
  if (format === "svg") return svgToDataURI(svg);

  const canvas = await rasterize(svg, options);
  return canvas.toDataURL(MIME[format], quality);
}

/** Save a Blob to the user's downloads with the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  requireDOM("Downloading");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  // Revoke on the next tick — Safari needs the URL alive during the click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export interface DownloadOptions extends ExportOptions {
  /** Filename without extension. Default "qr". */
  name?: string;
}

/** Download an SVG string as SVG, PNG, JPEG or WebP. Browser only. */
export async function downloadSVG(
  svg: string,
  options: DownloadOptions = {}
): Promise<void> {
  const { name = "qr", format = "png" } = options;
  downloadBlob(await svgToBlob(svg, options), `${name}.${format}`);
}

// The QR options and the export options are kept apart because both have a
// `size`: one is the SVG's user-unit size, the other the output resolution.

/** Build a QR code and return it as a data URL. */
export async function toDataURL(
  qr: QRSvgOptions,
  options: ExportOptions = {}
): Promise<string> {
  return svgToDataURL(toSVGString(qr), options);
}

/** Build a QR code and return it as a Blob. */
export async function toBlob(
  qr: QRSvgOptions,
  options: ExportOptions = {}
): Promise<Blob> {
  return svgToBlob(toSVGString(qr), options);
}

/** Build a QR code and save it to the user's downloads. Browser only. */
export async function download(
  qr: QRSvgOptions,
  options: DownloadOptions = {}
): Promise<void> {
  return downloadSVG(toSVGString(qr), options);
}
