type Props = {
  className?: string;
};

/**
 * QR-code mark (geometry from itshover.com/icons/qrcode-icon), re-implemented
 * with a pure-CSS hover animation so it needs no animation library:
 * the corners draw in, a scan line sweeps down, then the inner cells pop.
 */
const QrcodeIcon = ({ className = "" }: Props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={`qr-icon ${className}`}
    style={{ overflow: "visible" }}
  >
    <style>{`
      .qr-icon * { transform-box: fill-box; transform-origin: center; }
      .qr-icon .qr-scan { opacity: 0; }
      .qr-icon .qr-corner { stroke-dasharray: 36; }
      .qr-icon:hover .qr-corner { animation: qr-draw .4s ease-out both; }
      .qr-icon:hover .qr-inner { animation: qr-pop .3s ease-out both; }
      .qr-icon:hover .qr-dot { animation: qr-pop .3s ease-out both; }
      .qr-icon:hover .qr-scan {
        animation: qr-scan 1.5s ease-in-out .4s infinite;
      }
      @keyframes qr-draw {
        from { stroke-dashoffset: 36; opacity: 0; }
        to   { stroke-dashoffset: 0; opacity: 1; }
      }
      @keyframes qr-pop {
        from { opacity: 0; transform: scale(.8); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes qr-scan {
        0%   { opacity: 0; transform: translateY(0); }
        20%  { opacity: 1; }
        50%  { opacity: 1; transform: translateY(28px); }
        80%  { opacity: 0; }
        100% { opacity: 0; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .qr-icon:hover * { animation: none; }
        .qr-icon .qr-corner { stroke-dasharray: none; }
      }
    `}</style>

    <rect
      className="qr-scan"
      x="2"
      y="0"
      width="28"
      height="2"
      fill="currentColor"
      stroke="none"
      style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
    />

    <rect className="qr-corner" x="3" y="3" width="9" height="9" />
    <rect
      className="qr-corner"
      x="3"
      y="20"
      width="9"
      height="9"
      style={{ animationDelay: ".1s" }}
    />
    <rect
      className="qr-corner"
      x="20"
      y="3"
      width="9"
      height="9"
      style={{ animationDelay: ".2s" }}
    />

    <rect className="qr-inner" x="27" y="20" width="2" height="2" style={{ animationDelay: ".4s" }} />
    <rect className="qr-inner" x="16" y="27" width="2" height="2" style={{ animationDelay: ".45s" }} />
    <path className="qr-inner" d="M3 16H7" strokeLinecap="square" style={{ animationDelay: ".5s" }} />
    <path
      className="qr-inner"
      d="M13 16H18M22 16V23H29M22 16H26M22 16H18M18 16V20H16"
      strokeLinecap="square"
      style={{ animationDelay: ".55s" }}
    />
    <path className="qr-inner" d="M16 7V10" strokeLinecap="square" style={{ animationDelay: ".6s" }} />
    <path className="qr-inner" d="M16 25V29H23V27" strokeLinecap="square" style={{ animationDelay: ".65s" }} />
    <path className="qr-inner" d="M29.01 29H29" strokeLinecap="square" style={{ animationDelay: ".7s" }} />

    <rect className="qr-dot" x="24" y="7" width="1" height="1" style={{ animationDelay: ".5s" }} />
    <rect className="qr-dot" x="7" y="7" width="1" height="1" style={{ animationDelay: ".58s" }} />
    <rect className="qr-dot" x="7" y="24" width="1" height="1" style={{ animationDelay: ".66s" }} />
  </svg>
);

export default QrcodeIcon;
