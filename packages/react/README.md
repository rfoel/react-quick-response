# react-quick-response

[![npm version](https://img.shields.io/npm/v/react-quick-response.svg)](https://www.npmjs.com/package/react-quick-response)
[![npm downloads](https://img.shields.io/npm/dm/react-quick-response.svg)](https://www.npmjs.com/package/react-quick-response)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/react-quick-response.svg)](https://bundlephobia.com/package/react-quick-response)
[![license](https://img.shields.io/npm/l/react-quick-response.svg)](../../LICENSE)

**A lightweight React QR code component** — generate customizable QR codes as crisp SVG, with a centered logo overlay, dot/rounded module shapes, and **no third-party dependencies**.

Looking for a **React QR code generator with a logo**, **rounded QR codes**, or a **QR code as an SVG component**? That's what this is.

Not using React? All the geometry lives in
[`quick-response-core`](https://www.npmjs.com/package/quick-response-core) —
pure functions, no DOM.

**[Live demo →](https://react-quick-response.rfoel.dev)**

## Features

- 🪶 **No third-party dependencies** — just its own framework-agnostic core, with a bundled QR encoder
- 🖼️ **SVG output** — sharp at any size, exportable to SVG/PNG
- 🎯 **Logo overlay** — drop any SVG/image as a child; it's auto-sized to the largest scannable area and centered, with the modules behind it knocked out
- 🔵 **Module shapes** — `square`, `dots`, or `rounded` (smooth blobs)
- 🎨 **Custom colors and gradients**, margin, and error-correction level
- 💾 **Export** — download as SVG, PNG, JPEG or WebP at any resolution
- ⚛️ **SSR-friendly** & fully typed (TypeScript)

## How it compares

| | `react-quick-response` | `qrcode.react` | `react-qr-code` | `react-qrcode-logo` |
| --- | :---: | :---: | :---: | :---: |
| Dependencies | **own core only** | `qrcode` | `qrcode-generator` | `qrcode-generator` |
| SVG output | ✅ | ✅ (or canvas) | ✅ | ❌ (canvas) |
| Logo overlay | ✅ auto-sized & centered | ⚠️ manual | ❌ | ✅ |
| Dot / rounded modules | ✅ | ❌ | ❌ | ✅ |
| TypeScript types | ✅ built-in | ✅ | ✅ | ✅ |

## Installation

```bash
npm install react-quick-response
# or
yarn add react-quick-response
# or
pnpm add react-quick-response
```

## Basic Usage

```tsx
import { ReactQR } from "react-quick-response";

function App() {
  return <ReactQR value="https://example.com" size={200} />;
}
```

## Advanced Usage

### Custom styling

```tsx
<ReactQR
  value="https://example.com"
  size={256}
  errorCorrectionLevel="H"
  margin={8}
  foregroundColor="#1a1a1a"
  backgroundColor="#f5f5f5"
/>
```

### Module shapes

```tsx
<ReactQR value="https://example.com" shape="dots" />
<ReactQR value="https://example.com" shape="rounded" />
<ReactQR value="https://example.com" shape="classy" />
<ReactQR value="https://example.com" shape="classy-rounded" />
```

All shapes except `dots` are neighbour-aware: a corner only rounds where the
module has no neighbour on either adjacent side, so connected runs stay
straight where they touch.

- `dots` — every module is a circle.
- `rounded` — all outer corners rounded into smooth blobs.
- `classy` — two opposite corners cut with a straight diagonal (chamfer), the
  other two kept square — sharp, angular leaves with no curves.
- `classy-rounded` — same leaf, but the two corners are rounded instead of cut.
- `vertical` — modules merge into vertical bars with rounded ends.
- `horizontal` — modules merge into horizontal bars with rounded ends.
- `diamond` — each module is a rotated square (rhombus).
- `star` — each module is a four-point star.
- `plus` — each module is a plus / cross.
- `triangle` — each module is an upward triangle.
- `fluid` — fully connected: outer corners round outward and inner notches are
  filled with concave fillets, so the whole code flows like liquid.

The non-rounded standalone shapes (`diamond`, `star`, `plus`, `triangle`)
cover less area per module, so pair them with a higher `errorCorrectionLevel`
if scans get flaky.

### Corner (finder pattern) styles

Style the three "eyes" independently of the body modules — outer ring and
center dot each get their own shape and color.

```tsx
<ReactQR
  value="https://example.com"
  shape="dots"
  cornerBorderStyle="rounded"
  cornerCenterStyle="circle"
  cornerBorderColor="#2563eb"
  cornerCenterColor="#1d4ed8"
/>
```

`cornerBorderStyle` is the outer ring — frame shapes only, so the eye stays
scannable: `square`, `circle`, `rounded`, or `diamond`. `cornerCenterStyle`
is the solid center dot and accepts `square`, `circle`, `rounded`, `diamond`,
`star`, or `plus`. Both colors fall back to `foregroundColor` when unset.

### QR code with a logo

Pass any SVG (or `<image>`) as a child. It's scaled to the largest size
that stays scannable for the chosen error-correction level and centered,
and the QR modules behind it are knocked out automatically.

```tsx
import ReactLogo from "./assets/react.svg?react";

<ReactQR value="https://react.dev" errorCorrectionLevel="M">
  <ReactLogo />
</ReactQR>;
```

```tsx
import ViteLogo from "./assets/vite.png?inline";

<ReactQR value="https://vite.dev" errorCorrectionLevel="M">
  <image href={ViteLogo} width={32} height={32} />
</ReactQR>;
```

Tip: bump `errorCorrectionLevel` to `"H"` for the biggest logo, or set
`logoSize` to control the fraction of the QR it covers.

Or skip children and pass a URL — `logoMargin` clears extra space around it,
`logoKnockout={false}` keeps the modules behind it:

```tsx
<ReactQR
  value="https://example.com"
  image="/logo.png"
  logoMargin={6}
  errorCorrectionLevel="H"
/>
```

### Gradients

Any fill takes a linear or radial gradient. `rotation` is in **degrees**
(qr-code-styling uses radians).

```tsx
<ReactQR
  value="https://example.com"
  size={256}
  foregroundGradient={{
    type: "linear",
    rotation: 45,
    colorStops: [
      { offset: 0, color: "#0ea5e9" },
      { offset: 1, color: "#db2777" },
    ],
  }}
  backgroundGradient={{
    type: "radial",
    colorStops: [
      { offset: 0, color: "#fff" },
      { offset: 1, color: "#e2e8f0" },
    ],
  }}
/>
```

`cornerBorderGradient` and `cornerCenterGradient` style the eyes; both inherit
the foreground when unset. Gradient ids are derived from the gradient itself,
so multiple QR codes on one page never collide and hydration stays stable.

### Circular frame

`frame="circle"` shrinks the code to the square inscribed in a disc and fills
the ring around it with decorative modules sampled from the same data — this is
qr-code-styling's `shape: "circle"`.

```tsx
<ReactQR
  value="https://example.com"
  size={400}
  frame="circle"
  shape="dots"
  backgroundRound={1}
/>
```

The code ends up ~30% smaller for the same `size`, so raise `size` or
`errorCorrectionLevel` and check it with a real scanner.

### Rounded or circular background

```tsx
<ReactQR value="https://example.com" backgroundRound={0.25} />
<ReactQR value="https://example.com" backgroundRound={1} /> {/* a circle */}
```

### Download as SVG / PNG / JPEG / WebP

Point the ref at the component and hand it to `downloadQR`. It serializes what
is actually rendered, so an inline logo comes along.

```tsx
import { useRef } from "react";
import { ReactQR, downloadQR } from "react-quick-response";

function Download() {
  const ref = useRef<SVGSVGElement>(null);

  return (
    <>
      <ReactQR ref={ref} value="https://example.com" size={256} />
      <button
        onClick={() =>
          downloadQR(ref.current!, { format: "png", size: 1024, name: "my-qr" })
        }
      >
        Download PNG
      </button>
    </>
  );
}
```

`qrToBlob`, `qrToDataURL` and `qrToSVGString` return the data instead of saving
it. Options: `format` (`"svg" | "png" | "jpeg" | "webp"`, default `"png"`),
`size` (output pixels), `quality` (jpeg/webp), `background`, and `name`.

A logo loaded from another origin taints the canvas and makes the raster
formats throw — inline the logo (SVG children or a data URI) to avoid it.

### QR version and encoding mode

```tsx
<ReactQR value="1234" minVersion={10} /> {/* never smaller than version 10 */}
<ReactQR value="1234" mode="numeric" />  {/* force one segment mode */}
```

`minVersion` is qr-code-styling's `typeNumber`: a floor, not a fixed size — the
code still grows when the data needs it.

## API Reference

### Props

| Prop                   | Type                                | Default                | Description                                                          |
| ---------------------- | ----------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `value`                | `string`                            | **Required**           | The text or URL to encode in the QR code                             |
| `size`                 | `number`                            | `128`                  | Width and height of the QR code in pixels                            |
| `errorCorrectionLevel` | `"L" \| "M" \| "Q" \| "H"`          | `"L"`                  | Error-correction level (L=Low, M=Medium, Q=Quartile, H=High)         |
| `margin`               | `number`                            | `4`                    | Quiet-zone padding around the QR code, in pixels                     |
| `foregroundColor`      | `string`                            | `"#000"`               | Color of the QR code modules                                         |
| `foregroundGradient`   | `Gradient \| null`                  | `null`                 | Gradient for the modules; wins over `foregroundColor`                 |
| `backgroundColor`      | `string`                            | `"#fff"`               | Background color of the QR code                                      |
| `backgroundGradient`   | `Gradient \| null`                  | `null`                 | Gradient behind the QR; wins over `backgroundColor`                    |
| `backgroundRound`      | `number`                            | `0`                    | Background corner radius as a fraction of `size` (`1` = circle)       |
| `frame`                | `"square" \| "circle"`              | `"square"`             | Overall silhouette (qr-code-styling's `shape`)                        |
| `shape`                | `"square" \| "dots" \| "rounded" \| "classy" \| "classy-rounded" \| "vertical" \| "horizontal" \| "diamond" \| "star" \| "plus" \| "triangle" \| "fluid"` | `"square"` | Shape of the modules |
| `cornerBorderStyle`    | `"square" \| "circle" \| "rounded" \| "diamond"` | `"square"` | Outer-ring style of the three finder patterns ("eyes")          |
| `cornerCenterStyle`    | `"square" \| "circle" \| "rounded" \| "diamond" \| "star" \| "plus"` | `"square"` | Center-dot style of the three finder patterns |
| `cornerBorderColor`    | `string`                            | _`foregroundColor`_    | Color of the finder-pattern outer rings                              |
| `cornerBorderGradient` | `Gradient \| null`                  | `null`                 | Gradient for the finder-pattern outer rings                            |
| `cornerCenterColor`    | `string`                            | _`foregroundColor`_    | Color of the finder-pattern center dots                              |
| `cornerCenterGradient` | `Gradient \| null`                  | `null`                 | Gradient for the finder-pattern center dots                            |
| `logoSize`             | `number`                            | _largest scannable_    | Logo overlay size as a fraction of the QR size (0–1)                 |
| `logoMargin`           | `number`                            | `0`                    | Extra pixels cleared around the logo                                  |
| `logoKnockout`         | `boolean`                           | `true`                 | Remove the modules behind the logo                                    |
| `image`                | `string`                            | `undefined`            | Logo URL or data URI, drawn centered (`children` wins)                |
| `minVersion`           | `number`                            | `1`                    | Smallest QR version (qr-code-styling's `typeNumber`)                   |
| `maxVersion`           | `number`                            | `40`                   | Largest QR version                                                    |
| `mode`                 | `"auto" \| "numeric" \| "alphanumeric" \| "byte"` | `"auto"` | How to encode the value                                       |
| `children`             | `React.ReactNode`                   | `undefined`            | SVG content to overlay in the center (the logo)                      |

### Helpers

| Function | Description |
| --- | --- |
| `downloadQR(svg, options?)` | Save the rendered QR as svg/png/jpeg/webp |
| `qrToBlob(svg, options?)` | Same, as a `Blob` |
| `qrToDataURL(svg, options?)` | Same, as a data URL |
| `qrToSVGString(svg)` | Serialize the rendered element to an SVG string |

### Error correction levels

- **L (Low)**: ~7% error correction
- **M (Medium)**: ~15% error correction
- **Q (Quartile)**: ~25% error correction
- **H (High)**: ~30% error correction

Higher error-correction levels allow for a larger logo overlay but result
in denser QR codes.

## Requirements

- React 16.8+ (hooks support)
- TypeScript 4.0+ (if using TypeScript)

## License

MIT
