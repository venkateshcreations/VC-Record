import React from 'react';

// 3D Play Button / Prism Logo
export const Logo3D: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="logoGradBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF4D6D" />
        <stop offset="40%" stopColor="#C9184A" />
        <stop offset="100%" stopColor="#7209B7" />
      </linearGradient>
      <linearGradient id="logoGradTop" x1="10%" y1="0%" x2="90%" y2="90%">
        <stop offset="0%" stopColor="#FF758F" />
        <stop offset="60%" stopColor="#FF4D6D" />
        <stop offset="100%" stopColor="#FF9E00" />
      </linearGradient>
      <linearGradient id="logoHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Ambient shadow */}
    <path
      d="M26 14C22 11.5 17 14.5 17 19.5V80.5C17 85.5 22 88.5 26 86L79 55.5C83 53 83 47 79 44.5L26 14Z"
      fill="#7209B7"
      opacity="0.3"
      transform="translate(4, 6)"
      filter="url(#logoGlow)"
    />
    {/* Base Layer */}
    <path
      d="M26 14C22 11.5 17 14.5 17 19.5V80.5C17 85.5 22 88.5 26 86L79 55.5C83 53 83 47 79 44.5L26 14Z"
      fill="url(#logoGradBase)"
    />
    {/* Top 3D Facet */}
    <path
      d="M26 16C22.5 13.8 19 16.5 19 21V50L75 50L26 16Z"
      fill="url(#logoGradTop)"
      opacity="0.95"
    />
    {/* Glossy Bevel Line */}
    <path
      d="M26 16L78 48"
      stroke="url(#logoHighlight)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Inner Play Glow Dot */}
    <circle cx="34" cy="50" r="7" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

// 3D Screen Recording Monitor
export const Monitor3D: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="monBezel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A0E4E" />
        <stop offset="100%" stopColor="#1E0528" />
      </linearGradient>
      <linearGradient id="monScreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#250930" />
        <stop offset="50%" stopColor="#15031C" />
        <stop offset="100%" stopColor="#0B0110" />
      </linearGradient>
      <linearGradient id="monBorderGlow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FF4D6D" />
        <stop offset="50%" stopColor="#A020F0" />
        <stop offset="100%" stopColor="#FF758F" />
      </linearGradient>
      <linearGradient id="monStand" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6C2277" />
        <stop offset="100%" stopColor="#2A0B33" />
      </linearGradient>
      <filter id="redDotGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Monitor Stand */}
    <path d="M54 78H66V90H54V78Z" fill="url(#monStand)" />
    <path d="M42 90C42 88.5 44 88 47 88H73C76 88 78 88.5 78 90L82 94C82 95 81 96 79 96H41C39 96 38 95 38 94L42 90Z" fill="url(#monStand)" />

    {/* Monitor Outer Frame */}
    <rect x="18" y="18" width="84" height="60" rx="10" fill="url(#monBezel)" stroke="url(#monBorderGlow)" strokeWidth="2.5" />

    {/* Screen Glass */}
    <rect x="23" y="23" width="74" height="50" rx="6" fill="url(#monScreen)" />

    {/* Viewfinder Crop Corner Brackets */}
    <path d="M30 35V30H35" stroke="#FF4D6D" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M90 35V30H85" stroke="#FF4D6D" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 61V66H35" stroke="#FF4D6D" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M90 61V66H85" stroke="#FF4D6D" strokeWidth="2.5" strokeLinecap="round" />

    {/* Center Red Record Circle with Glow */}
    <circle cx="60" cy="48" r="9" fill="#FF1744" filter="url(#redDotGlow)" />
    <circle cx="60" cy="48" r="5" fill="#FF5252" />
    <circle cx="58" cy="46" r="1.5" fill="#FFFFFF" opacity="0.8" />
  </svg>
);

// 3D Webcam Camera
export const Webcam3D: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="camBody" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor="#E2E8F0" />
        <stop offset="85%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
      <linearGradient id="camRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066FF" />
        <stop offset="100%" stopColor="#00F5D4" />
      </linearGradient>
      <linearGradient id="camLensDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#091428" />
        <stop offset="60%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="camGlassBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
      </linearGradient>
      <filter id="blueDotGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Webcam Stand / Base */}
    <ellipse cx="60" cy="94" rx="28" ry="7" fill="#64748B" opacity="0.4" />
    <path d="M44 86C44 83 50 82 60 82C70 82 76 83 76 86L78 92H42L44 86Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
    <path d="M56 74H64V84H56V74Z" fill="#94A3B8" />

    {/* Spherical Camera Outer Body */}
    <circle cx="60" cy="50" r="32" fill="url(#camBody)" stroke="#CBD5E1" strokeWidth="1" />

    {/* Blue Glowing Outer Ring */}
    <circle cx="60" cy="50" r="23" stroke="url(#camRing)" strokeWidth="3" />

    {/* Dark Lens Cavity */}
    <circle cx="60" cy="50" r="19" fill="url(#camLensDark)" />

    {/* Concentric Lens Elements */}
    <circle cx="60" cy="50" r="13" fill="#1E293B" stroke="#0284C7" strokeWidth="1.5" />
    <circle cx="60" cy="50" r="8" fill="#0284C7" opacity="0.8" />
    <circle cx="60" cy="50" r="4" fill="#38BDF8" filter="url(#blueDotGlow)" />

    {/* Specular White Glass Reflection */}
    <ellipse cx="53" cy="43" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.75" transform="rotate(-30 53 43)" />
    <ellipse cx="68" cy="58" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.4" />
  </svg>
);

// 3D Audio Microphone
export const Audio3D: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="micBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="50%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
      <linearGradient id="micGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5D4" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="greenGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Stand Base */}
    <ellipse cx="60" cy="98" rx="24" ry="6" fill="#047857" opacity="0.3" />
    <path d="M46 93C46 91 52 90 60 90C68 90 74 91 74 93L76 97H44L46 93Z" fill="#CBD5E1" />
    <rect x="57" y="78" width="6" height="15" fill="#94A3B8" />

    {/* U-Shape Cradle Mount */}
    <path
      d="M38 52V62C38 74 48 83 60 83C72 83 82 74 82 62V52"
      stroke="#CBD5E1"
      strokeWidth="4"
      strokeLinecap="round"
    />

    {/* Capsule Microphone Body */}
    <rect x="46" y="24" width="28" height="46" rx="14" fill="url(#micBody)" stroke="url(#micGlow)" strokeWidth="2.5" />

    {/* Mesh Grill Lines */}
    <line x1="47" y1="36" x2="73" y2="36" stroke="#475569" strokeWidth="1.5" />
    <line x1="47" y1="42" x2="73" y2="42" stroke="#475569" strokeWidth="1.5" />
    <line x1="48" y1="48" x2="72" y2="48" stroke="#475569" strokeWidth="1.5" />

    {/* Glowing Audio LED Accent */}
    <rect x="56" y="56" width="8" height="3" rx="1.5" fill="#00F5D4" filter="url(#greenGlow)" />
  </svg>
);

// 3D Screenshot Camera
export const Screenshot3D: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="camBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4361EE" />
        <stop offset="50%" stopColor="#3A0CA3" />
        <stop offset="100%" stopColor="#7209B7" />
      </linearGradient>
      <linearGradient id="camGoldRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE600" />
        <stop offset="100%" stopColor="#FF7B00" />
      </linearGradient>
      <linearGradient id="camLensGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7209B7" />
        <stop offset="100%" stopColor="#03071E" />
      </linearGradient>
      <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Gold Corner Viewfinder Brackets */}
    <path d="M22 36V26H32" stroke="url(#camGoldRing)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M98 36V26H88" stroke="url(#camGoldRing)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M22 84V94H32" stroke="url(#camGoldRing)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M98 84V94H88" stroke="url(#camGoldRing)" strokeWidth="3.5" strokeLinecap="round" />

    {/* Camera Body */}
    {/* Top Pentaprism Bump */}
    <path d="M46 36L52 30H68L74 36H46Z" fill="#2E0854" />
    {/* Main Rectangular Body */}
    <rect x="32" y="36" width="56" height="42" rx="9" fill="url(#camBaseGrad)" stroke="#6366F1" strokeWidth="1.5" />

    {/* Flash Light Window */}
    <rect x="74" y="42" width="8" height="5" rx="2" fill="#FFE600" opacity="0.9" />

    {/* Big Metallic Lens Ring */}
    <circle cx="60" cy="57" r="16" fill="url(#camLensGlow)" stroke="url(#camGoldRing)" strokeWidth="2.5" />
    <circle cx="60" cy="57" r="10" fill="#0F172A" stroke="#818CF8" strokeWidth="1" />
    <circle cx="60" cy="57" r="5" fill="#4361EE" filter="url(#goldGlow)" />

    {/* Lens Specular Glint */}
    <circle cx="56" cy="53" r="2" fill="#FFFFFF" opacity="0.8" />
  </svg>
);
