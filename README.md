# quick-response

Customizable QR codes as crisp SVG — a centered logo overlay, twelve module
shapes, square or circular frames, styleable finder patterns, gradients,
PNG/JPEG/WebP export, **zero third-party dependencies**.

**[Live demo →](https://react-quick-response.rfoel.dev)**

## Packages

| Package | Version | What it is |
| --- | --- | --- |
| [`quick-response-core`](./packages/core) | [![npm](https://img.shields.io/npm/v/quick-response-core.svg)](https://www.npmjs.com/package/quick-response-core) | Pure functions: string → SVG paths or a full `<svg>` string. No DOM, no framework. |
| [`react-quick-response`](./packages/react) | [![npm](https://img.shields.io/npm/v/react-quick-response.svg)](https://www.npmjs.com/package/react-quick-response) | The React component, built on the core. |

```tsx
// React
import { ReactQR } from "react-quick-response";

<ReactQR value="https://example.com" size={200} shape="rounded" />;
```

```ts
// Anywhere else
import { toSVGString } from "quick-response-core";

const svg = toSVGString({ value: "https://example.com", size: 200 });
```

Full docs: **[core](./packages/core/README.md)** ·
**[react](./packages/react/README.md)**

## Development

pnpm workspace. Node 22+, pnpm 11+.

```bash
pnpm install     # install every package and example
pnpm dev         # run the Vite playground (examples/vite)
pnpm build       # build core, then react
pnpm lint        # lint both packages
```

Layout:

```
packages/core     quick-response-core — encoder, path builders, buildQR/toSVGString
packages/react    react-quick-response — the <ReactQR /> component
examples/vite     playground deployed to GitHub Pages
examples/ssr      React Router SSR smoke test
```

Both examples resolve `react-quick-response` and `quick-response-core` to the
workspace **sources** through Vite aliases, so `pnpm dev` gives HMR with no
build step.

Releases are automated with semantic-release on `main`: both packages are
published in lockstep at the same version, core first.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
