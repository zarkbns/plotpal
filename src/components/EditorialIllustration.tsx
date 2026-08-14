import React from 'react';

interface EditorialIllustrationProps {
  className?: string;
}

export const EditorialIllustration: React.FC<EditorialIllustrationProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 460 380"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Author studio illustration"
    >
      {/* Background Sun Sphere with geometric grid lines */}
      <circle cx="360" cy="80" r="38" fill="#F48A46" />
      {/* Grid lines inside sun */}
      <path
        d="M 330 75 Q 360 60 390 75 M 330 85 Q 360 100 390 85 M 345 50 Q 360 80 345 110 M 375 50 Q 360 80 375 110"
        stroke="#FFF8F0"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clouds */}
      <path
        d="M 50 190 Q 60 182 72 186 Q 84 180 94 188 Q 102 186 106 193 H 48 Z"
        stroke="#1E1B18"
        strokeWidth="1.5"
        fill="#FAF7F0"
      />
      <path
        d="M 355 180 Q 364 174 374 177 Q 384 171 392 178 Q 398 176 402 182 H 353 Z"
        stroke="#1E1B18"
        strokeWidth="1.5"
        fill="#FAF7F0"
      />

      {/* House Studio Outline */}
      {/* Red Chimney */}
      <rect x="235" y="70" width="34" height="42" fill="#D32F2F" stroke="#1E1B18" strokeWidth="2" />
      {/* Blue Roof Triangle */}
      <polygon points="180,112 260,38 340,112" fill="#1C2D42" stroke="#1E1B18" strokeWidth="2" />
      {/* Small Attic Roof Peak */}
      <polygon points="250,50 260,38 270,50" fill="#FFF" stroke="#1E1B18" strokeWidth="1.5" />

      {/* Main Studio Room Box */}
      <polygon points="180,112 340,112 340,300 180,300" fill="#FAF6EE" stroke="#1E1B18" strokeWidth="2" />
      {/* Gable triangle filler */}
      <polygon points="180,112 260,40 340,112" fill="#FAF6EE" stroke="#1E1B18" strokeWidth="2" />
      {/* Smiling face on attic */}
      <circle cx="218" cy="85" r="14" fill="#FAD02C" stroke="#1E1B18" strokeWidth="1.5" />
      <circle cx="213" cy="82" r="1.5" fill="#1E1B18" />
      <circle cx="223" cy="82" r="1.5" fill="#1E1B18" />
      <path d="M 213 88 Q 218 94 223 88" stroke="#1E1B18" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Split AC Unit on Wall */}
      <rect x="290" y="125" width="42" height="16" rx="2" fill="#FFF" stroke="#1E1B18" strokeWidth="1.5" />
      <line x1="294" y1="133" x2="328" y2="133" stroke="#CBD5E0" strokeWidth="1.5" />
      <circle cx="324" cy="129" r="1.5" fill="#10B981" />

      {/* Studio Window (Left) */}
      <rect x="190" y="130" width="38" height="60" fill="#FFF" stroke="#1E1B18" strokeWidth="1.8" />
      <line x1="190" y1="150" x2="228" y2="150" stroke="#1E1B18" strokeWidth="1.5" />
      <line x1="209" y1="130" x2="209" y2="190" stroke="#1E1B18" strokeWidth="1.5" />

      {/* Flowing ideas / diagram notes */}
      {/* Color wheel pie chart */}
      <g transform="translate(235, 142)">
        <circle cx="0" cy="0" r="10" fill="#FAF6EE" stroke="#1E1B18" strokeWidth="1.2" />
        <path d="M 0 0 L 0 -10 A 10 10 0 0 1 10 0 Z" fill="#E25A65" />
        <path d="M 0 0 L 10 0 A 10 10 0 0 1 0 10 Z" fill="#F07138" />
        <path d="M 0 0 L 0 10 A 10 10 0 0 1 -10 0 Z" fill="#234C6E" />
        <path d="M 0 0 L -10 0 A 10 10 0 0 1 0 -10 Z" fill="#347952" />
      </g>
      {/* Paper airplane */}
      <polygon points="212,154 228,148 222,158" fill="#5D9CEC" stroke="#1E1B18" strokeWidth="1" />

      {/* Desk Table */}
      <line x1="185" y1="240" x2="225" y2="240" stroke="#1E1B18" strokeWidth="2" />
      <line x1="192" y1="240" x2="198" y2="295" stroke="#1E1B18" strokeWidth="1.5" />
      <line x1="218" y1="240" x2="212" y2="295" stroke="#1E1B18" strokeWidth="1.5" />
      {/* Desk Lamp */}
      <path d="M 205 240 L 205 215 L 216 220" stroke="#1E1B18" strokeWidth="1.5" fill="none" />
      <polygon points="214,216 226,222 220,230" fill="#FFCC00" stroke="#1E1B18" strokeWidth="1" />

      {/* Armchair (Sage/Lime Green) */}
      <path
        d="M 285 200 C 295 200 305 210 300 250 L 255 250 C 248 245 250 210 265 200 Z"
        fill="#8DC476"
        stroke="#1E1B18"
        strokeWidth="1.8"
      />
      {/* Chair Wooden Legs */}
      <line x1="260" y1="250" x2="248" y2="295" stroke="#D67035" strokeWidth="3" strokeLinecap="round" />
      <line x1="295" y1="250" x2="305" y2="295" stroke="#D67035" strokeWidth="3" strokeLinecap="round" />

      {/* Author / Character */}
      {/* Legs & Pants */}
      <path
        d="M 270 235 L 265 260 L 252 288"
        stroke="#1E1B18"
        strokeWidth="2"
        fill="#FFF"
      />
      <path
        d="M 280 235 L 278 262 L 268 288"
        stroke="#1E1B18"
        strokeWidth="2"
        fill="#FFF"
      />
      {/* Shoes */}
      <ellipse cx="250" cy="290" rx="7" ry="3" fill="#1E1B18" />
      <ellipse cx="266" cy="290" rx="7" ry="3" fill="#1E1B18" />

      {/* Torso & Shirt */}
      <path
        d="M 268 185 C 275 185 285 190 282 230 L 260 230 C 255 215 258 190 268 185 Z"
        fill="#FFF"
        stroke="#1E1B18"
        strokeWidth="1.8"
      />
      {/* Grid pattern on shirt */}
      <line x1="262" y1="200" x2="280" y2="200" stroke="#1E1B18" strokeWidth="0.8" />
      <line x1="262" y1="212" x2="280" y2="212" stroke="#1E1B18" strokeWidth="0.8" />
      <line x1="270" y1="190" x2="270" y2="225" stroke="#1E1B18" strokeWidth="0.8" />

      {/* Head & Hair */}
      <circle cx="270" cy="175" r="9" fill="#F7D4BE" stroke="#1E1B18" strokeWidth="1.5" />
      <path
        d="M 262 170 C 265 160 280 162 278 174 C 283 172 284 178 277 180 Z"
        fill="#FFF"
        stroke="#1E1B18"
        strokeWidth="1.5"
      />
      {/* Glasses */}
      <circle cx="268" cy="175" r="2.5" fill="none" stroke="#1E1B18" strokeWidth="1.2" />

      {/* Laptop (Orange/Yellow) */}
      <polygon points="250,225 264,225 268,212 254,212" fill="#F48A46" stroke="#1E1B18" strokeWidth="1.5" />
      <line x1="248" y1="225" x2="266" y2="225" stroke="#1E1B18" strokeWidth="2" />

      {/* House Plants (Left) */}
      <g transform="translate(150, 230)">
        <path d="M 15 65 L 12 35 C 5 25 15 15 22 25 C 28 15 38 25 32 35 L 28 65 Z" fill="#8DC476" stroke="#1E1B18" strokeWidth="1.5" />
        <ellipse cx="20" cy="65" rx="14" ry="4" fill="#6B9B58" stroke="#1E1B18" strokeWidth="1.5" />
        {/* Pot */}
        <polygon points="10,65 30,65 27,85 13,85" fill="#E25A65" stroke="#1E1B18" strokeWidth="1.5" />
      </g>

      {/* House Plants & Flowers (Right under window) */}
      <g transform="translate(315, 235)">
        {/* Pot on shelf */}
        <rect x="0" y="20" width="24" height="4" fill="#1E1B18" />
        <polygon points="4,20 18,20 16,10 6,10" fill="#5D9CEC" stroke="#1E1B18" strokeWidth="1.2" />
        {/* Colorful flowers */}
        <circle cx="9" cy="5" r="4" fill="#E25A65" stroke="#1E1B18" strokeWidth="1" />
        <circle cx="16" cy="7" r="3.5" fill="#234C6E" stroke="#1E1B18" strokeWidth="1" />
        <circle cx="21" cy="4" r="3" fill="#F48A46" stroke="#1E1B18" strokeWidth="1" />
      </g>

      {/* Electric Utility Cart / Buggy (Right of house) */}
      <g transform="translate(335, 210)">
        {/* Frame Poles */}
        <line x1="5" y1="0" x2="5" y2="70" stroke="#1E1B18" strokeWidth="2" />
        <line x1="38" y1="20" x2="38" y2="70" stroke="#1E1B18" strokeWidth="2" />
        {/* Top Light/Sign */}
        <rect x="0" y="-8" width="10" height="12" fill="#FFF" stroke="#1E1B18" strokeWidth="1.5" />
        <circle cx="5" cy="-2" r="2" fill="#FAD02C" />
        {/* Roof line */}
        <line x1="2" y1="0" x2="40" y2="18" stroke="#1E1B18" strokeWidth="2" />
        {/* Front Hood */}
        <path
          d="M 5 60 L 25 60 C 35 60 45 68 45 75 L 45 80 L 0 80 Z"
          fill="#FFF"
          stroke="#1E1B18"
          strokeWidth="1.8"
        />
        {/* Front Bumper Accent */}
        <rect x="40" y="72" width="6" height="8" rx="2" fill="#E25A65" stroke="#1E1B18" strokeWidth="1.2" />
        {/* Front Wheel */}
        <circle cx="34" cy="85" r="10" fill="#1C2D42" stroke="#1E1B18" strokeWidth="2" />
        <circle cx="34" cy="85" r="4" fill="#FFF" stroke="#1E1B18" strokeWidth="1.5" />
        {/* Back Wheel */}
        <circle cx="5" cy="85" r="10" fill="#1C2D42" stroke="#1E1B18" strokeWidth="2" />
        <circle cx="5" cy="85" r="4" fill="#FFF" stroke="#1E1B18" strokeWidth="1.5" />
      </g>

      {/* Ground baseline */}
      <line x1="40" y1="300" x2="420" y2="300" stroke="#1E1B18" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
