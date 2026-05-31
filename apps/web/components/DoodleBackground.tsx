export function DoodleBackground() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <symbol id="db-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20c0-9 7-15 16-15 0 9-6 15-15 15-1 0-1 0-1 0z"/>
          <path d="M4 20c4-6 8-9 12-11"/>
        </symbol>
        <symbol id="db-recycle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"/>
          <polyline points="23 20 23 14 17 14"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </symbol>
        <symbol id="db-bottle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2h6M8 4l-1 3v13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7l-1-3"/>
          <line x1="7" y1="10" x2="17" y2="10"/>
        </symbol>
        <symbol id="db-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </symbol>
        <symbol id="db-paper" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="13" y2="17"/>
        </symbol>

        <pattern id="db-tile-a" x="0" y="0" width="96" height="88" patternUnits="userSpaceOnUse">
          <g color="#4BAF47" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <g transform="translate(14,16) rotate(-15)"><use href="#db-leaf"    width="18" height="18" x="-9"  y="-9"/></g>
            <g transform="translate(66,9)  rotate(22)"> <use href="#db-recycle" width="16" height="16" x="-8"  y="-8"/></g>
            <g transform="translate(84,50) rotate(-10)"><use href="#db-bottle"  width="14" height="14" x="-7"  y="-7"/></g>
            <g transform="translate(30,54) rotate(8)">  <use href="#db-box"     width="18" height="18" x="-9"  y="-9"/></g>
            <g transform="translate(8,72)  rotate(-20)"><use href="#db-paper"   width="14" height="14" x="-7"  y="-7"/></g>
            <circle cx="54" cy="34" r="2" fill="currentColor" stroke="none"/>
            <circle cx="78" cy="76" r="2" fill="currentColor" stroke="none"/>
          </g>
        </pattern>

        <pattern id="db-tile-b" x="48" y="44" width="120" height="108" patternUnits="userSpaceOnUse">
          <g color="#4BAF47" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <g transform="translate(18,20) rotate(12)">  <use href="#db-paper"   width="16" height="16" x="-8"  y="-8"/></g>
            <g transform="translate(80,12) rotate(-18)"> <use href="#db-leaf"    width="18" height="18" x="-9"  y="-9"/></g>
            <g transform="translate(106,55) rotate(15)"> <use href="#db-recycle" width="16" height="16" x="-8"  y="-8"/></g>
            <g transform="translate(44,74) rotate(-8)">  <use href="#db-bottle"  width="14" height="14" x="-7"  y="-7"/></g>
            <g transform="translate(90,88) rotate(20)">  <use href="#db-box"     width="16" height="16" x="-8"  y="-8"/></g>
            <circle cx="28" cy="56" r="2" fill="currentColor" stroke="none"/>
            <circle cx="66" cy="38" r="2" fill="currentColor" stroke="none"/>
          </g>
        </pattern>

        <pattern id="db-tile-c" x="24" y="22" width="72" height="66" patternUnits="userSpaceOnUse">
          <g color="#4BAF47" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <g transform="translate(10,12) rotate(-24)"><use href="#db-leaf"   width="14" height="14" x="-7" y="-7"/></g>
            <g transform="translate(52,8)  rotate(18)"> <use href="#db-bottle" width="12" height="12" x="-6" y="-6"/></g>
            <g transform="translate(58,46) rotate(-12)"><use href="#db-paper"  width="12" height="12" x="-6" y="-6"/></g>
            <circle cx="28" cy="50" r="1.5" fill="currentColor" stroke="none"/>
          </g>
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#db-tile-a)" opacity="0.07"/>
      <rect width="100%" height="100%" fill="url(#db-tile-b)" opacity="0.07"/>
      <rect width="100%" height="100%" fill="url(#db-tile-c)" opacity="0.06"/>
    </svg>
  );
}
