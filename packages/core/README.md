# quick-response-core

[![npm version](https://img.shields.io/npm/v/quick-response-core.svg)](https://www.npmjs.com/package/quick-response-core)
[![license](https://img.shields.io/npm/l/quick-response-core.svg)](../../LICENSE)

**Framework-agnostic QR code generator** — pure functions that turn a string
into SVG path data (or a whole `<svg>` string), with customizable module
shapes, styled finder patterns and a logo knockout. **Zero dependencies**, no
DOM, no canvas: safe in the browser, in Node, in a worker, at build time.

This is the engine behind
[`react-quick-response`](https://www.npmjs.com/package/react-quick-response).
Use it directly to build a QR component for any framework — or no framework.

**[Live demo →](https://react-quick-response.rfoel.dev)**

## Installation

```bash
npm install quick-response-core
```

## Usage

### A complete SVG string

```ts
import { toSVGString } from "quick-response-core";

const svg = toSVGString({
  value: "https://example.com",
  size: 256,
  errorCorrectionLevel: "H",
  shape: "rounded",
  cornerBorderStyle: "rounded",
  cornerCenterStyle: "circle",
  foregroundColor: "#1a1a1a",
  backgroundColor: "#f5f5f5",
});

document.querySelector("#qr")!.innerHTML = svg;
```

### Just the geometry

`buildQR` returns the path data and lets you render it however you like —
JSX, template strings, `document.createElementNS`, a PDF writer.

```ts
import { buildQR } from "quick-response-core";

const qr = buildQR({ value: "https://example.com", size: 256, shape: "dots" });

qr.modulesPath; // "M..." — every dark module except the finder patterns
qr.cornerBorderPath; // the three eyes' rings (fill-rule: evenodd)
qr.cornerCenterPath; // the three eyes' center dots
qr.backgroundPath; // rect covering the whole SVG
qr.cellSize; // side of one module
qr.moduleCount; // modules per side
qr.logoRect; // where to draw the logo, or null
```

`buildQR` throws when the value does not fit a QR code — wrap it if the input
is user-supplied.

### Logo knockout

Pass the logo's real dimensions in user units. The modules underneath are
removed and `logoRect` comes back with the centered position to draw at.

```ts
const qr = buildQR({
  value: "https://example.com",
  size: 256,
  errorCorrectionLevel: "H",
  logo: { width: 96, height: 96 },
});

// { x: 80, y: 80, width: 96, height: 96 }
qr.logoRect;
```

`toSVGString` also accepts `logoHref` and embeds an `<image>` in that rect.

`logo.margin` clears extra modules around the logo without growing the logo
itself; `logoKnockout: false` keeps the modules and draws the logo on top.

Keep the logo inside the scannable budget with `LOGO_SAFE_RATIO`, the largest
linear fraction of the QR that survives each error-correction level:

```ts
import { LOGO_SAFE_RATIO } from "quick-response-core";

const box = 256 * LOGO_SAFE_RATIO.H; // 0.45 → 115.2
```

### Gradients

Any fill can be a linear or radial gradient. `rotation` is in **degrees**,
not radians.

```ts
import { toSVGString } from "quick-response-core";

const svg = toSVGString({
  value: "https://example.com",
  size: 256,
  foregroundGradient: {
    type: "linear",
    rotation: 45,
    colorStops: [
      { offset: 0, color: "#0ea5e9" },
      { offset: 1, color: "#db2777" },
    ],
  },
  backgroundGradient: {
    type: "radial",
    colorStops: [
      { offset: 0, color: "#fff" },
      { offset: 1, color: "#e2e8f0" },
    ],
  },
});
```

Gradient fields: `foregroundGradient`, `backgroundGradient`,
`cornerBorderGradient`, `cornerCenterGradient`. Corner fills inherit the
foreground when unset. The body gradient spans the QR itself (not the quiet
zone), so modules and eyes share one continuous ramp.

Rendering the paths yourself? `resolvePaints` does the same work for you and
hands back the `fill` values plus the gradient defs to render:

```ts
import { buildQR, gradientToSVGString, resolvePaints } from "quick-response-core";

const qr = buildQR({ value: "hi", size: 256 });
const paints = resolvePaints({ foregroundGradient }, { size: 256, margin: 4 });

paints.modules; // "url(#qr-1a2b3c)"
paints.defs.map(gradientToSVGString); // ["<linearGradient …>…</linearGradient>"]
```

Gradient ids are derived from the gradient itself, so they are stable across
server and client renders and two identical gradients share one definition.

### Export: PNG, JPEG, WebP, SVG

```ts
import { download, toBlob, toDataURL } from "quick-response-core";

// Save a 1024px PNG
await download({ value: "https://example.com", size: 256 }, {
  format: "png",
  size: 1024,
  name: "my-qr",
});

const dataUrl = await toDataURL({ value: "hi" }, { format: "webp" });
const blob = await toBlob({ value: "hi" }, { format: "jpeg", quality: 0.8 });
```

Export options: `format` (`"svg" | "png" | "jpeg" | "webp"`, default `"png"`),
`size` (output pixels), `quality` (jpeg/webp), `background` (painted under the
code — defaults to white for jpeg, which has no alpha), and `name` for
`download`.

Already have an SVG string? Use `svgToBlob`, `svgToDataURL`, `svgToDataURI`
(sync, no DOM) or `downloadSVG`. Everything except `svgToDataURI` and the
`"svg"` format rasterizes through `<canvas>`, so it is browser-only and throws
a clear error in Node.

### QR version and encoding mode

```ts
buildQR({ value: "1234", minVersion: 10 }); // never smaller than version 10
buildQR({ value: "1234", mode: "numeric" }); // force one segment mode
buildQR({ value: "hi", maskPattern: 3, boostErrorCorrectionLevel: false });
```

`minVersion` is a floor, not a fixed size — the encoder still grows the matrix
when the data needs it. `mode` accepts `"auto"` (default), `"numeric"`,
`"alphanumeric"` and `"byte"`, and throws when the value does not fit the
chosen charset.

### Circular frame

`frame: "circle"` shrinks the code to the square inscribed in the disc, and
fills the ring left over with decorative modules sampled from the same data,
separated from the code by one empty module.

```ts
toSVGString({
  value: "https://example.com",
  size: 400,
  frame: "circle",
  shape: "dots",
  backgroundRound: 1, // make the background a disc too
});
```

The code itself ends up ~30% smaller (÷√2) for the same `size`, so raise `size`
or `errorCorrectionLevel` and test with a real scanner. `geometry.gridCount`
covers the decorative rings; `moduleCount` stays the real matrix size.

### Rounded background

`backgroundRound` is a fraction of the size, `0` (square) to `1` (circle):

```ts
buildQR({ value: "hi", size: 256, backgroundRound: 0.25 });
```

## API

### `buildQR(options): QRGeometry`

| Option                 | Type                     | Default      | Description                                        |
| ---------------------- | ------------------------ | ------------ | -------------------------------------------------- |
| `value`                | `string`                 | **Required** | Text or URL to encode                              |
| `size`                 | `number`                 | `128`        | Width and height of the square SVG                 |
| `errorCorrectionLevel` | `"L" \| "M" \| "Q" \| "H"` | `"L"`      | Higher survives more damage, denser code           |
| `margin`               | `number`                 | `4`          | Quiet-zone padding                                 |
| `frame`                | `"square" \| "circle"`   | `"square"`   | Overall silhouette: a square or a disc              |
| `shape`                | `QRShape`                | `"square"`   | Body module shape                                  |
| `cornerBorderStyle`    | `CornerBorderStyle`      | `"square"`   | Outer ring of the finder patterns                  |
| `cornerCenterStyle`    | `CornerCenterStyle`      | `"square"`   | Center dot of the finder patterns                  |
| `backgroundRound`      | `number`                 | `0`          | Background corner radius as a fraction of `size`   |
| `logo`                 | `{ width, height, margin? }` | `null`   | Centered knockout for a logo                       |
| `logoKnockout`         | `boolean`                | `true`       | Remove the modules behind the logo                 |
| `minVersion`           | `number`                 | `1`          | Smallest QR version (`typeNumber`)                 |
| `maxVersion`           | `number`                 | `40`         | Largest QR version                                 |
| `mode`                 | `EncodeMode`             | `"auto"`     | Force an encoding mode                             |
| `maskPattern`          | `number`                 | `-1`         | Mask 0–7, or -1 to pick the best                   |
| `boostErrorCorrectionLevel` | `boolean`           | `true`       | Raise the ECC level when it is free                |

Returns paths plus `size`, `margin`, `version`, `moduleCount`, `cellSize` and
`logoRect`.

### `toSVGString(options): string`

Everything `buildQR` takes, plus `foregroundColor`, `backgroundColor`,
`cornerBorderColor`, `cornerCenterColor`, the four `*Gradient` fields and
`logoHref`.

### Shapes

`QRShape`: `square`, `dots`, `rounded`, `classy`, `classy-rounded`,
`vertical`, `horizontal`, `diamond`, `star`, `plus`, `triangle`, `fluid`.

Every shape except `dots` and the standalone glyphs is neighbour-aware: a
corner only rounds where the module has no neighbour on either adjacent side,
so connected runs stay straight where they touch. `fluid` goes further and
fills inner notches with concave fillets.

`CornerBorderStyle`: `square`, `circle`, `rounded`, `diamond` — frame shapes
only, so the eye stays detectable.

`CornerCenterStyle`: `square`, `circle`, `rounded`, `diamond`, `star`, `plus`.

### Path primitives

The individual builders are exported too, for drawing your own layout:
`modulePath`, `dotPath`, `diamondPath`, `starPath`, `plusPath`,
`trianglePath`, `fluidPath`, `roundedPath`, `circlePath`, `rectPath`,
`roundRectPath`, `cornerBorderPath`, `cornerCenterPath`, `shapeRendering`,
plus `resolvePaints`, `resolveGradient` and `gradientToSVGString` for fills.

The bundled encoder (Project Nayuki's `qrcodegen`) is exported as `qrcodegen`
if you need raw matrix access.

## License

MIT
