import React, { useState } from 'react';
import { Activity } from 'lucide-react';

interface RobotArmSimulationProps {
  cartesianPos: {
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
  };
  jointAngles: number[];
  isMoving?: boolean;
}

export const RobotArmSimulation: React.FC<RobotArmSimulationProps> = ({
  cartesianPos,
  jointAngles,
  isMoving = false,
}) => {
  const [viewMode, setViewMode] = useState<'3D' | 'SIDE' | 'TOP'>('3D');

  // Forward Kinematics 2D projection estimation for visualization
  const svgW = 400;
  const svgH = 200;

  // Base mount center
  const baseX = 200;
  const baseY = 165;

  // Link lengths in SVG pixels
  const l1 = 32; // Base height
  const l2 = 45; // Shoulder to elbow
  const l3 = 40; // Elbow to wrist
  const l4 = 25; // Wrist to flange
  const l5 = 15; // Flange to TCP tool

  // Joint angles in radians
  const j1Rad = ((jointAngles[0] ?? 0) * Math.PI) / 180;
  const j2Rad = ((jointAngles[1] ?? 35) * Math.PI) / 180;
  const j3Rad = ((jointAngles[2] ?? -45) * Math.PI) / 180;
  const j4Rad = ((jointAngles[3] ?? 0) * Math.PI) / 180;
  const j5Rad = ((jointAngles[4] ?? 80) * Math.PI) / 180;
  const j6Rad = ((jointAngles[5] ?? 0) * Math.PI) / 180;

  // Calculate forward kinematics joint positions
  const j1X = baseX;
  const j1Y = baseY - l1;

  const shoulderAngle = -Math.PI / 2 + j2Rad * 0.7;
  const j2X = j1X + l2 * Math.cos(shoulderAngle);
  const j2Y = j1Y + l2 * Math.sin(shoulderAngle);

  const elbowAngle = shoulderAngle + (j3Rad * 0.7 - 0.2);
  const j3X = j2X + l3 * Math.cos(elbowAngle);
  const j3Y = j2Y + l3 * Math.sin(elbowAngle);

  const wristAngle = elbowAngle + (j5Rad * 0.5 - 0.6);
  const j4X = j3X + l4 * Math.cos(wristAngle);
  const j4Y = j3Y + l4 * Math.sin(wristAngle);

  const tcpX = j4X + l5 * Math.cos(wristAngle);
  const tcpY = j4Y + l5 * Math.sin(wristAngle);

  return (
    <div className="bg-white border-2 border-slate-300 rounded-2xl p-2.5 flex flex-col justify-between relative shadow-xs select-none h-full flex-1 min-h-0">
      {/* Top Header & View Mode Switcher */}
      <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-200 text-xs font-mono shrink-0 gap-2">
        <div className="flex items-center gap-1.5 text-slate-800 font-sans font-bold min-w-0">
          <Activity className={`w-3.5 h-3.5 shrink-0 ${isMoving ? 'text-amber-500 animate-spin' : 'text-blue-600'}`} />
          <span className="text-xs text-slate-900 font-black whitespace-nowrap">六轴机械臂运动学仿真</span>
          <span className="text-[10px] text-blue-700 font-mono bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-bold whitespace-nowrap shrink-0">
            6自由度
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('3D')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === '3D'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            3D视角
          </button>
          <button
            onClick={() => setViewMode('SIDE')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'SIDE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            侧视(X-Z)
          </button>
          <button
            onClick={() => setViewMode('TOP')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'TOP'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            俯视(X-Y)
          </button>
        </div>
      </div>

      {/* Dynamic 2D/3D Kinematic Arm Canvas - Light Background (撑满矩形框) */}
      <div className="relative w-full flex-1 min-h-[140px] bg-[#f8fafc] rounded-xl overflow-hidden my-1.5 flex items-center justify-center border border-slate-300">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full">
          <defs>
            {/* Grid Pattern */}
            <pattern id="armGridLight" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>

            {/* Arm Link Gradient */}
            <linearGradient id="linkGradLight1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            <linearGradient id="linkGradLight2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>

            {/* Workspace Reach Glow */}
            <radialGradient id="reachGlowLight" cx="50%" cy="80%" r="60%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width={svgW} height={svgH} fill="url(#armGridLight)" />

          {/* Maximum Workspace Reach Boundary Envelope */}
          <path
            d={`M 100 165 A 110 110 0 0 1 300 165`}
            fill="url(#reachGlowLight)"
            stroke="#0284c7"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Base Pedestal Table / AMR Top Plate */}
          <ellipse cx={baseX} cy={baseY} rx="50" ry="12" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x={baseX - 35} y={baseY - 6} width="70" height="12" fill="#cbd5e1" stroke="#94a3b8" />

          {/* Base Joint J1 (Rotary Base) */}
          <rect x={baseX - 18} y={baseY - l1} width="36" height={l1} rx="4" fill="#475569" stroke="#334155" strokeWidth="1.2" />
          <circle cx={baseX} cy={baseY - l1 / 2} r="4" fill="#38bdf8" />
          <text x={baseX} y={baseY - l1 / 2 + 10} fill="#f1f5f9" fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">J1</text>

          {/* Link 1: Shoulder (J1 -> J2) */}
          <line
            x1={j1X}
            y1={j1Y}
            x2={j2X}
            y2={j2Y}
            stroke="url(#linkGradLight1)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <line
            x1={j1X}
            y1={j1Y}
            x2={j2X}
            y2={j2Y}
            stroke="#bfdbfe"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Joint 2 (Shoulder Pivot) */}
          <circle cx={j2X} cy={j2Y} r="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
          <circle cx={j2X} cy={j2Y} r="3" fill="#38bdf8" />
          <text x={j2X - 12} y={j2Y - 4} fill="#1e293b" fontSize="7" fontWeight="bold" fontFamily="monospace">J2</text>

          {/* Link 2: Upper Arm (J2 -> J3) */}
          <line
            x1={j2X}
            y1={j2Y}
            x2={j3X}
            y2={j3Y}
            stroke="url(#linkGradLight2)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Joint 3 (Elbow Pivot) */}
          <circle cx={j3X} cy={j3Y} r="7" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
          <circle cx={j3X} cy={j3Y} r="2.5" fill="#38bdf8" />
          <text x={j3X + 10} y={j3Y - 4} fill="#1e293b" fontSize="7" fontWeight="bold" fontFamily="monospace">J3</text>

          {/* Link 3: Forearm (J3 -> J4) */}
          <line
            x1={j3X}
            y1={j3Y}
            x2={j4X}
            y2={j4Y}
            stroke="url(#linkGradLight1)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Joint 4/5 (Wrist Pivot) */}
          <circle cx={j4X} cy={j4Y} r="5.5" fill="#334155" stroke="#7c3aed" strokeWidth="1.5" />
          <text x={j4X + 8} y={j4Y + 2} fill="#6b21a8" fontSize="7" fontWeight="bold" fontFamily="monospace">J4/J5</text>

          {/* Link 4: Tool Flange (J4 -> TCP) */}
          <line
            x1={j4X}
            y1={j4Y}
            x2={tcpX}
            y2={tcpY}
            stroke="#64748b"
            strokeWidth="6"
            strokeLinecap="square"
          />

          {/* TCP Gripper / End-Effector Tip */}
          <g transform={`translate(${tcpX}, ${tcpY}) rotate(${(wristAngle * 180) / Math.PI})`}>
            {/* Gripper Bracket */}
            <rect x="-3" y="-6" width="6" height="12" rx="1.5" fill="#334155" stroke="#64748b" strokeWidth="0.8" />
            {/* Finger Left */}
            <rect x="3" y="-7" width="8" height="2.5" rx="1" fill="#0284c7" />
            {/* Finger Right */}
            <rect x="3" y="4.5" width="8" height="2.5" rx="1" fill="#0284c7" />
            {/* Tool Center Point (TCP Crosshair) */}
            <circle cx="9" cy="0" r="2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.5" />
          </g>

          {/* TCP Coordinate Frame Triad */}
          <g transform={`translate(${tcpX}, ${tcpY})`}>
            {/* X-axis (Red) */}
            <line x1="0" y1="0" x2="16" y2="0" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
            <text x="18" y="3" fill="#ef4444" fontSize="7" fontWeight="bold">X</text>
            {/* Z-axis (Blue) */}
            <line x1="0" y1="0" x2="0" y2="-16" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
            <text x="-2" y="-18" fill="#2563eb" fontSize="7" fontWeight="bold">Z</text>
          </g>

          {/* Real-time Trajectory Ghost Line */}
          <circle cx={tcpX} cy={tcpY} r="16" fill="none" stroke="#0284c7" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
        </svg>

        {/* Real-time Simulation Status Overlay Badge (下移并分两行垂直堆叠: 上行 XYZ, 下行 俯仰偏 RPY) */}
        <div className="absolute top-4 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-slate-800 border border-slate-300 shadow-sm flex flex-col gap-1 z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-0.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="font-sans font-bold text-slate-800 text-[10px]">TCP 位姿</span>
          </div>
          {/* 1. XYZ 坐标 (下移一层) */}
          <div className="flex items-center gap-1.5 text-blue-700 font-black">
            <span className="text-slate-500 font-sans font-bold text-[9px]">XYZ:</span>
            <span>[{cartesianPos.x.toFixed(0)}, {cartesianPos.y.toFixed(0)}, {cartesianPos.z.toFixed(0)}] mm</span>
          </div>
          {/* 2. 俯仰偏 (Rx, Ry, Rz - 移动到 XYZ 下面) */}
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
            <span className="text-slate-500 font-sans font-bold text-[9px]">RPY:</span>
            <span>[{cartesianPos.rx.toFixed(0)}°, {cartesianPos.ry.toFixed(0)}°, {cartesianPos.rz.toFixed(0)}°]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
