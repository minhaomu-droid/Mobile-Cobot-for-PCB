import React from 'react';
import { HandMetal } from 'lucide-react';

interface EndEffectorSimulationProps {
  isGripperOpen: boolean;
  robotError: string | null;
}

export const EndEffectorSimulation: React.FC<EndEffectorSimulationProps> = ({
  isGripperOpen,
}) => {
  const isPcbPresent = !isGripperOpen;

  // Finger SVG translation offset (pixels)
  const fingerOffset = isGripperOpen ? 18 : 6;

  return (
    <div className="bg-white border-2 border-slate-300 rounded-2xl p-2.5 flex flex-col justify-between relative shadow-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-200 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-800 font-sans font-bold">
          <HandMetal className={`w-3.5 h-3.5 ${isGripperOpen ? 'text-amber-600' : 'text-emerald-600'}`} />
          <span className="text-xs text-slate-900 font-black">末端平行夹爪仿真 (Pneumatic Gripper)</span>
        </div>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold border ${
            isGripperOpen
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          {isGripperOpen ? '夹爪开度 65mm' : '夹持锁定 15mm'}
        </span>
      </div>

      {/* End Effector Graphic Canvas - Clean Light Theme */}
      <div className="relative w-full h-32 sm:h-36 bg-[#f8fafc] rounded-xl overflow-hidden my-1 flex items-center justify-center border border-slate-300">
        <svg viewBox="0 0 280 140" className="w-full h-full">
          <defs>
            {/* Light Grid */}
            <pattern id="gripperGridLight" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>

            {/* PCB Texture Gradient */}
            <linearGradient id="pcbGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="280" height="140" fill="url(#gripperGridLight)" />

          {/* Flange Mount Connection (Top) */}
          <rect x="115" y="8" width="50" height="14" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="140" y1="8" x2="140" y2="22" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />

          {/* Main Gripper Cylinder Body */}
          <rect x="85" y="22" width="110" height="34" rx="4" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
          <text x="140" y="42" fill="#1e40af" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            SMC 气动高精度平行夹爪
          </text>

          {/* Center Precision Guide Block */}
          <rect x="125" y="56" width="30" height="14" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="140" cy="63" r="2.5" fill="#64748b" />

          {/* Left Finger & Slider Track */}
          <g transform={`translate(${-fingerOffset}, 0)`}>
            {/* Slide Mount */}
            <rect x="95" y="56" width="18" height="10" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
            {/* Rubber Jaw Finger */}
            <path
              d="M 98 66 L 98 108 L 110 108 L 110 94 L 114 94 L 114 66 Z"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="1"
            />
            {/* Gripping Pad Friction Groove */}
            <line x1="112" y1="72" x2="112" y2="92" stroke="#bae6fd" strokeWidth="1.5" />
          </g>

          {/* Right Finger & Slider Track */}
          <g transform={`translate(${fingerOffset}, 0)`}>
            {/* Slide Mount */}
            <rect x="167" y="56" width="18" height="10" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
            {/* Rubber Jaw Finger */}
            <path
              d="M 182 66 L 182 108 L 170 108 L 170 94 L 166 94 L 166 66 Z"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="1"
            />
            {/* Gripping Pad Friction Groove */}
            <line x1="168" y1="72" x2="168" y2="92" stroke="#bae6fd" strokeWidth="1.5" />
          </g>

          {/* Clamped PCB Board (Appears when gripper is closed) */}
          {isPcbPresent && (
            <g>
              {/* Clamped PCB Specimen (Green PCB Plate with Gold Contacts) */}
              <rect
                x="98"
                y="80"
                width="84"
                height="38"
                rx="2"
                fill="url(#pcbGradLight)"
                stroke="#047857"
                strokeWidth="1.2"
              />
              {/* Copper Traces Simulation */}
              <line x1="110" y1="88" x2="170" y2="88" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 2" />
              <line x1="110" y1="96" x2="170" y2="96" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 2" />
              <circle cx="118" cy="106" r="2" fill="#fbbf24" />
              <circle cx="162" cy="106" r="2" fill="#fbbf24" />
              <text x="140" y="108" fill="#ffffff" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                PCB在位机械夹紧中
              </text>
            </g>
          )}

          {/* Optical Beam Sensor (Green dot when detected) */}
          <circle cx="94" cy="74" r="2.5" fill={isPcbPresent ? '#10b981' : '#f59e0b'} />
          <line
            x1="94"
            y1="74"
            x2="186"
            y2="74"
            stroke={isPcbPresent ? '#10b981' : '#f59e0b'}
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Sensor Feedback Grid */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-0.5">
        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <span className="text-slate-600 font-bold">光电对射:</span>
          <span className={`font-bold ${isPcbPresent ? 'text-emerald-700' : 'text-slate-500'}`}>
            {isPcbPresent ? '● 检出板材' : '○ 空载状态'}
          </span>
        </div>

        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <span className="text-slate-600 font-bold">气阀电磁A:</span>
          <span className="text-emerald-700 font-bold">24V 导通</span>
        </div>
      </div>
    </div>
  );
};
