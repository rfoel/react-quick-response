import { useRef, useState } from "react";
import {
  downloadQR,
  ReactQR,
  type CornerBorderStyle,
  type CornerCenterStyle,
  type ErrorCorrectionLevel,
  type QRShape,
} from "react-quick-response";
import ReactLogo from "./assets/react.svg?react";
import QrcodeIcon from "./QrcodeIcon";

const SHAPE_OPTIONS: { value: QRShape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy rounded" },
  { value: "vertical", label: "Vertical bars" },
  { value: "horizontal", label: "Horizontal bars" },
  { value: "diamond", label: "Diamond" },
  { value: "star", label: "Star" },
  { value: "plus", label: "Plus" },
  { value: "triangle", label: "Triangle" },
  { value: "fluid", label: "Fluid" },
];

const CORNER_BORDER_OPTIONS: { value: CornerBorderStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "rounded", label: "Rounded" },
  { value: "diamond", label: "Diamond" },
];

const CORNER_CENTER_OPTIONS: { value: CornerCenterStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "rounded", label: "Rounded" },
  { value: "diamond", label: "Diamond" },
  { value: "star", label: "Star" },
  { value: "plus", label: "Plus" },
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
  const [cornerBorderStyle, setCornerBorderStyle] =
    useState<CornerBorderStyle>("square");
  const [cornerCenterStyle, setCornerCenterStyle] =
    useState<CornerCenterStyle>("square");
  const [cornerBorderColor, setCornerBorderColor] = useState("#0f172a");
  const [cornerCenterColor, setCornerCenterColor] = useState("#0f172a");
  const [showLogo, setShowLogo] = useState(true);
  const [logoSize, setLogoSize] = useState(0.3);
  const [logoMargin, setLogoMargin] = useState(0);
  const [useGradient, setUseGradient] = useState(false);
  const [gradientFrom, setGradientFrom] = useState("#0ea5e9");
  const [gradientTo, setGradientTo] = useState("#db2777");
  const [gradientRotation, setGradientRotation] = useState(45);
  const [backgroundRound, setBackgroundRound] = useState(0);

  const foregroundGradient = useGradient
    ? {
        type: "linear" as const,
        rotation: gradientRotation,
        colorStops: [
          { offset: 0, color: gradientFrom },
          { offset: 1, color: gradientTo },
        ],
      }
    : null;

  // downloadQR serializes the rendered <svg> — logo children included — and
  // rasterizes it for png/jpeg/webp.
  const download = (format: "svg" | "png") => {
    if (!qrRef.current) return;
    downloadQR(qrRef.current, {
      format,
      name: "qr-code",
      size: size * 4,
    });
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
              foregroundGradient={foregroundGradient}
              backgroundColor={backgroundColor}
              backgroundRound={backgroundRound}
              logoMargin={logoMargin}
              shape={shape}
              cornerBorderStyle={cornerBorderStyle}
              cornerCenterStyle={cornerCenterStyle}
              cornerBorderColor={cornerBorderColor}
              cornerCenterColor={cornerCenterColor}
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
                <span>Corner border</span>
                <select
                  className={inputBase}
                  value={cornerBorderStyle}
                  onChange={(e) =>
                    setCornerBorderStyle(e.target.value as CornerBorderStyle)
                  }
                >
                  {CORNER_BORDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${fieldLabel} flex-1`}>
                <span>Corner center</span>
                <select
                  className={inputBase}
                  value={cornerCenterStyle}
                  onChange={(e) =>
                    setCornerCenterStyle(e.target.value as CornerCenterStyle)
                  }
                >
                  {CORNER_CENTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-3.5">
              <label className={`${fieldLabel} flex-1`}>
                <span>Corner border color</span>
                <input
                  className="h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60"
                  type="color"
                  value={cornerBorderColor}
                  onChange={(e) => setCornerBorderColor(e.target.value)}
                />
              </label>
              <label className={`${fieldLabel} flex-1`}>
                <span>Corner center color</span>
                <input
                  className="h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60"
                  type="color"
                  value={cornerCenterColor}
                  onChange={(e) => setCornerCenterColor(e.target.value)}
                />
              </label>
            </div>

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
                checked={useGradient}
                onChange={(e) => setUseGradient(e.target.checked)}
              />
              <span>Foreground gradient</span>
            </label>

            {useGradient && (
              <>
                <div className="flex gap-3.5">
                  <label className={`${fieldLabel} flex-1`}>
                    <span>Gradient from</span>
                    <input
                      className="h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60"
                      type="color"
                      value={gradientFrom}
                      onChange={(e) => setGradientFrom(e.target.value)}
                    />
                  </label>
                  <label className={`${fieldLabel} flex-1`}>
                    <span>Gradient to</span>
                    <input
                      className="h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60"
                      type="color"
                      value={gradientTo}
                      onChange={(e) => setGradientTo(e.target.value)}
                    />
                  </label>
                </div>
                <label className={fieldLabel}>
                  <span>
                    Gradient rotation{" "}
                    <em className="font-normal text-slate-100 not-italic">
                      {gradientRotation}°
                    </em>
                  </span>
                  <input
                    className="accent-sky-500"
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={gradientRotation}
                    onChange={(e) =>
                      setGradientRotation(Number(e.target.value))
                    }
                  />
                </label>
              </>
            )}

            <label className={fieldLabel}>
              <span>
                Background roundness{" "}
                <em className="font-normal text-slate-100 not-italic">
                  {Math.round(backgroundRound * 100)}%
                </em>
              </span>
              <input
                className="accent-sky-500"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={backgroundRound}
                onChange={(e) => setBackgroundRound(Number(e.target.value))}
              />
            </label>

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

            {showLogo && (
              <label className={fieldLabel}>
                <span>
                  Logo margin{" "}
                  <em className="font-normal text-slate-100 not-italic">
                    {logoMargin}px
                  </em>
                </span>
                <input
                  className="accent-sky-500"
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={logoMargin}
                  onChange={(e) => setLogoMargin(Number(e.target.value))}
                />
              </label>
            )}

            <div className="flex gap-3.5">
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-lg bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-400"
                onClick={() => download("svg")}
              >
                Download SVG
              </button>
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-lg border border-slate-700 px-4 py-3 font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-sky-400 hover:bg-slate-800/60"
                onClick={() => download("png")}
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

export default App;
