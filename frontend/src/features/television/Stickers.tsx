export function HelpBadge() {
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true">
      <path
        d="M29 16Q58-8 83 12Q90 16 95 27L111 45Q117 53 107 65L91 83Q71 101 49 94Q29 91 20 77L7 63Q-1 53 11 41L20 32Q22 23 29 16Z"
        fill="#ffef00"
      />
      <path
        d="M31 22Q58 2 80 18Q87 23 89 32L103 47Q110 54 100 63L86 78Q69 94 50 87Q34 86 26 72L14 60Q6 53 18 44L26 35Q27 27 31 22Z"
        fill="none"
        stroke="#090909"
        strokeWidth="5"
      />
      <text
        x="59"
        y="68"
        textAnchor="middle"
        fontFamily="Arial,sans-serif"
        fontSize="50"
        fontWeight="900"
      >
        ?
      </text>
    </svg>
  );
}
export function ContactBadge() {
  return (
    <svg viewBox="0 0 300 180" aria-hidden="true">
      <path
        d="M17 82 84 21Q103 1 129 13L279 67Q308 78 286 105L218 166Q201 181 174 172L20 124Q-4 114 17 82Z"
        fill="#187b38"
      />
      <path
        d="M27 86 91 29Q104 16 124 23L272 75Q290 82 277 98L211 156Q200 168 178 161L29 115Q11 108 27 86Z"
        fill="none"
        stroke="#fff000"
        strokeWidth="5"
      />
      <g
        transform="rotate(-10 150 90)"
        textAnchor="middle"
        fill="#fff000"
        fontFamily="Barlow Condensed,Arial,sans-serif"
        fontWeight="900"
      >
        <text x="153" y="85" fontSize="39">
          LET’S
        </text>
        <text x="153" y="118" fontSize="39">
          TALK
        </text>
        <text x="153" y="140" fontSize="12">
          Say hello
        </text>
      </g>
    </svg>
  );
}
