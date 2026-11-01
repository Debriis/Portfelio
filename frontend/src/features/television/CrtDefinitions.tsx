function ColorChannels({ id, offset }: { id: string; offset: number }) {
  return (
    <filter
      id={id}
      x="-5%"
      y="-5%"
      width="110%"
      height="110%"
      colorInterpolationFilters="sRGB"
    >
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
        result="red"
      />
      <feOffset in="red" dx={offset} result="red-shift" />
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
        result="green"
      />
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
        result="blue"
      />
      <feOffset in="blue" dx={-offset} result="blue-shift" />
      <feBlend in="red-shift" in2="green" mode="screen" result="rg" />
      <feBlend in="rg" in2="blue-shift" mode="screen" />
    </filter>
  );
}
export function CrtDefinitions() {
  return (
    <svg className="crt-definitions" aria-hidden="true">
      <defs>
        <ColorChannels id="crt-signal" offset={1} />
        <ColorChannels id="crt-edge-signal" offset={6} />
      </defs>
    </svg>
  );
}
