# react-quick-response

A lightweight React component for generating customizable QR codes as SVG elements with support for embedded content overlays.

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

### Custom Styling

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

### With Logo Overlay

```tsx
<ReactQR value="https://example.com">
  <circle cx="24" cy="24" r="20" fill="#007bff" />
  <text x="24" y="28" textAnchor="middle" fill="white" fontSize="12">
    LOGO
  </text>
</ReactQR>
```

```tsx
import ReactLogo from "./assets/react.svg?react";

<ReactQR value="https://react.dev" errorCorrectionLevel="M">
  <ReactLogo width={32} height={32} />
</ReactQR>;
```

```tsx
import ViteLogo from "./assets/vite.png?inline";

<ReactQR value="https://vite.dev" errorCorrectionLevel="M">
  <image href={ViteLogo} width={32} height={32} />
</ReactQR>;
```

## API Reference

### Props

| Prop                   | Type                       | Default      | Description                                                  |
| ---------------------- | -------------------------- | ------------ | ------------------------------------------------------------ |
| `value`                | `string`                   | **Required** | The text or URL to encode in the QR code                     |
| `size`                 | `number`                   | `128`        | Width and height of the QR code in pixels                    |
| `errorCorrectionLevel` | `"L" \| "M" \| "Q" \| "H"` | `"L"`        | Error correction level (L=Low, M=Medium, Q=Quartile, H=High) |
| `margin`               | `number`                   | `4`          | Margin around the QR code in pixels                          |
| `foregroundColor`      | `string`                   | `"#000000"`  | Color of the QR code modules                                 |
| `backgroundColor`      | `string`                   | `"#ffffff"`  | Background color of the QR code                              |
| `children`             | `React.ReactNode`          | `undefined`  | SVG content to overlay in the center                         |

### Error Correction Levels

- **L (Low)**: ~7% error correction
- **M (Medium)**: ~15% error correction
- **Q (Quartile)**: ~25% error correction
- **H (High)**: ~30% error correction

Higher error correction levels allow for more content overlay but result in denser QR codes.

## Requirements

- React 16.8+ (hooks support)
- TypeScript 4.0+ (if using TypeScript)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
