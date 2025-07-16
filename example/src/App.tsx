import { useRef } from "react";
import { ReactQR } from "../../src/ReactQR";
import ReactLogo from "./assets/react.svg?react";
import ViteLogo from "./assets/vite.png?inline";

const App = () => {
  const qrRef = useRef<SVGSVGElement>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <ReactQR value="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />

      <ReactQR ref={qrRef} value="https://react.dev" errorCorrectionLevel="M">
        <ReactLogo width={32} height={32} />
      </ReactQR>

      <ReactQR value="https://vite.dev" errorCorrectionLevel="M">
        <image href={ViteLogo} width={32} height={32} />
      </ReactQR>
    </div>
  );
};

export default App;
