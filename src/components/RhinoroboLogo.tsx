import React from 'react';

interface RhinoroboLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  theme?: 'dark' | 'light' | 'white';
  collapsed?: boolean;
  standaloneIcon?: boolean;
}

export const RhinoroboLogo: React.FC<RhinoroboLogoProps> = ({
  className = '',
  size = 'medium',
  showText = true,
  theme = 'light',
  collapsed = false,
  standaloneIcon = false,
}) => {
  // Dimensions based on size prop
  const iconSize =
    size === 'small'
      ? 'w-8 h-8'
      : size === 'large'
      ? 'w-12 h-12'
      : 'w-9 h-9';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Geometric Blue Rhino Head Emblem (Matching User's Image 2 Logo) */}
      <div
        className={`${iconSize} flex items-center justify-center shrink-0 transition-transform`}
        title="犀准机器人 Rhinorobo"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Main Rhinorobo Solid Vibrant Blue Geometric Rhino Head (Image 2 exact outline) */}
          <path
            d="M8 60 
               L44 26 
               L53 48 
               L72 37 
               L74 53 
               C82 38 88 26 92 16 
               C88 46 80 72 82 85 
               C64 85 46 72 32 88 
               L46 95 
               L8 60 Z"
            fill="#0057FF"
          />

          {/* Internal Geometric Eye Cutout / Facet */}
          <polygon
            points="51,46 64,52 56,57"
            fill="#FFFFFF"
          />

          {/* Subtle 3D Horn Facet Highlight */}
          <path
            d="M74 53 L92 16 C89 36 84 56 82 85"
            stroke="#3B82F6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && !collapsed && (
        <div className="flex flex-col justify-center leading-tight">
          <div
            className={`font-black tracking-tight font-sans text-slate-900 ${
              size === 'large'
                ? 'text-xl'
                : size === 'small'
                ? 'text-xs'
                : 'text-sm'
            }`}
          >
            Rhinorobo
          </div>
          <div
            className={`font-bold tracking-wider text-[#0057FF] ${
              size === 'large'
                ? 'text-xs'
                : size === 'small'
                ? 'text-[10px]'
                : 'text-[11px]'
            }`}
          >
            犀准机器人
          </div>
        </div>
      )}
    </div>
  );
};
