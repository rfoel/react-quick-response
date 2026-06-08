import { useRef, useState } from "react";
import { ReactQR } from "../../../src/ReactQR";
import ReactLogo from "./assets/react.svg?react";
import QrcodeIcon from "./QrcodeIcon";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type QRShape = "square" | "dots" | "rounded";

const SHAPE_OPTIONS: { value: QRShape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
];

const ECC_OPTIONS: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: "L", label: "Low · 7%" },
  { value: "M", label: "Medium · 15%" },
  { value: "Q", label: "Quartile · 25%" },
  { value: "H", label: "High · 30%" },
];

const fieldLabel = "flex flex-col gap-2 text-sm font-semibold text-slate-400";
const inputBase =
  "rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-slate-100 font-normal outline-none transition focus:border-sky-400";

const App = () => {
  const qrRef = useRef<SVGSVGElement>(null);

  const [value, setValue] = useState("https://github.com/rfoel/react-quick-response");
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(8);
  const [errorCorrectionLevel, setErrorCorrectionLevel] =
    useState<ErrorCorrectionLevel>("M");
  const [foregroundColor, setForegroundColor] = useState("#0f172a");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [shape, setShape] = useState<QRShape>("square");
  const [showLogo, setShowLogo] = useState(true);
  const [logoSize, setLogoSize] = useState(0.3);

  const downloadSvg = () => {
    if (!qrRef.current) return;
    const data = new XMLSerializer().serializeToString(qrRef.current);
    const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(URL.createObjectURL(blob), "qr-code.svg");
  };

  const downloadPng = () => {
    if (!qrRef.current) return;
    const data = new XMLSerializer().serializeToString(qrRef.current);
    const svgUrl =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
    const img = new Image();
    img.onload = () => {
      const scale = 4;
      const canvas = document.createElement("canvas");
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      triggerDownload(canvas.toDataURL("image/png"), "qr-code.png");
    };
    img.src = svgUrl;
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(900px_500px_at_15%_-10%,rgba(79,140,255,0.18),transparent),radial-gradient(700px_500px_at_100%_0%,rgba(110,168,254,0.12),transparent)] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-12">
        <header>
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight">
            <QrcodeIcon className="h-9 w-9 shrink-0 text-sky-400" />
            <span className="bg-gradient-to-r from-white to-sky-400 bg-clip-text text-transparent">
              react-quick-response
            </span>
          </h1>
          <p className="mt-3 max-w-prose leading-relaxed text-slate-400">
            A lightweight React component for generating customizable QR codes
            as SVG, with support for embedded logos.
          </p>
          <nav className="mt-5 flex gap-3">
            <a
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:-translate-y-0.5 hover:border-sky-400"
              href="https://github.com/rfoel/react-quick-response"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:-translate-y-0.5 hover:border-sky-400"
              href="https://www.npmjs.com/package/react-quick-response"
              target="_blank"
              rel="noreferrer"
            >
              npm
            </a>
          </nav>
        </header>

        <main className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section
            className="grid min-h-80 place-items-center overflow-hidden rounded-2xl border border-slate-700 p-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] transition-colors [&_svg]:h-auto [&_svg]:max-w-full"
            style={{ background: backgroundColor }}
          >
            <ReactQR
              ref={qrRef}
              value={value || " "}
              size={size}
              margin={margin}
              errorCorrectionLevel={errorCorrectionLevel}
              foregroundColor={foregroundColor}
              backgroundColor={backgroundColor}
              shape={shape}
              logoSize={logoSize}
            >
              {showLogo ? <ReactLogo /> : undefined}
            </ReactQR>
          </section>

          <section className="flex flex-col gap-5 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <label className={fieldLabel}>
              <span>Content</span>
              <textarea
                className={`${inputBase} resize-y`}
                rows={2}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="URL or any text…"
              />
            </label>

            <label className={fieldLabel}>
              <span>
                Size <em className="font-normal text-slate-100 not-italic">{size}px</em>
              </span>
              <input
                className="accent-sky-500"
                type="range"
                min={128}
                max={512}
                step={8}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </label>

            <label className={fieldLabel}>
              <span>
                Margin{" "}
                <em className="font-normal text-slate-100 not-italic">{margin}px</em>
              </span>
              <input
                className="accent-sky-500"
                type="range"
                min={0}
                max={32}
                step={1}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
              />
            </label>

            <label className={fieldLabel}>
              <span>Error correction</span>
              <select
                className={inputBase}
                value={errorCorrectionLevel}
                onChange={(e) =>
                  setErrorCorrectionLevel(
                    e.target.value as ErrorCorrectionLevel
                  )
                }
              >
                {ECC_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={fieldLabel}>
              <span>Shape</span>
              <select
                className={inputBase}
                value={shape}
                onChange={(e) => setShape(e.target.value as QRShape)}
              >
                {SHAPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-3.5">
              <label className={`${fieldLabel} flex-1`}>
                <span>Foreground</span>
                <input
                  className="h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60"
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                />
              </label>
              <label className={`${fieldLabel} flex-1`}>
                <span>Background</span>
                <input
                  className="h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </label>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-100">
              <input
                className="h-[18px] w-[18px] accent-sky-500"
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
              />
              <span>Embed logo overlay</span>
            </label>

            {showLogo && (
              <label className={fieldLabel}>
                <span>
                  Logo size{" "}
                  <em className="font-normal text-slate-100 not-italic">
                    {Math.round(logoSize * 100)}%
                  </em>
                </span>
                <input
                  className="accent-sky-500"
                  type="range"
                  min={0.1}
                  max={0.5}
                  step={0.01}
                  value={logoSize}
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                />
              </label>
            )}

            <div className="flex gap-3.5">
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-lg bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-400"
                onClick={downloadSvg}
              >
                Download SVG
              </button>
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-lg border border-slate-700 px-4 py-3 font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-sky-400 hover:bg-slate-800/60"
                onClick={downloadPng}
              >
                Download PNG
              </button>
            </div>
          </section>
        </main>

        <footer className="mt-12 text-center text-sm text-slate-400">
          Built with react-quick-response · MIT licensed
        </footer>
      </div>
    </div>
  );
};

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

export default App;
