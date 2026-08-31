import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Radio } from 'lucide-react';

interface LidarScanMiniMapProps {
  pose: {
    x: number;
    y: number;
    theta: number;
    confidence: number;
  };
  robotName: string;
  robotType: 'LOADING' | 'UNLOADING';
}

export const LidarScanMiniMap: React.FC<LidarScanMiniMapProps> = ({
  pose,
  robotName,
  robotType,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [showGrid] = useState<boolean>(true);
  const [showRays] = useState<boolean>(true);

  const handleZoomIn = () => setZoom((z) => Math.min(2.2, parseFloat((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, parseFloat((z - 0.25).toFixed(2))));
  const handleResetZoom = () => setZoom(1.0);

  // Workshop layout parameters (24m x 14m)
  const mapWidth = 320;
  const mapHeight = 180;

  const toSvgX = (xMeters: number) => (xMeters / 24) * mapWidth;
  const toSvgY = (yMeters: number) => (1 - yMeters / 14) * mapHeight;

  const robotSvgX = toSvgX(pose.x);
  const robotSvgY = toSvgY(pose.y);

  // Station locations in workshop (8 stations)
  const stations = [
    { id: 'ST-01', name: '1#测厚机', x: 4.5, y: 11.5, w: 2.8, h: 1.8 },
    { id: 'ST-02', name: '2#测厚机', x: 9.5, y: 11.5, w: 2.8, h: 1.8 },
    { id: 'ST-03', name: '3#测厚机', x: 14.5, y: 11.5, w: 2.8, h: 1.8 },
    { id: 'ST-04', name: '4#测厚机', x: 19.5, y: 11.5, w: 2.8, h: 1.8 },
    { id: 'ST-05', name: '5#测厚机', x: 4.5, y: 2.5, w: 2.8, h: 1.8 },
    { id: 'ST-06', name: '6#测厚机', x: 9.5, y: 2.5, w: 2.8, h: 1.8 },
    { id: 'ST-07', name: '7#测厚机', x: 14.5, y: 2.5, w: 2.8, h: 1.8 },
    { id: 'ST-08', name: '8#测厚机', x: 19.5, y: 2.5, w: 2.8, h: 1.8 },
  ];

  const materialBuffer = { x: 1.5, y: 7.0, name: 'PCB料仓' };
  const chargerZone = { x: 22.5, y: 7.0, name: '充电桩' };

  // Simulated LiDAR Ray points scanned from AMR center
  const lidarRays = Array.from({ length: 24 }).map((_, i) => {
    const angleRad = (i * 15 * Math.PI) / 180;
    const rangeMeters = 3.5 + 2.5 * Math.sin(angleRad * 3) + (i % 3 === 0 ? 1.5 : 0.5);
    const targetX = pose.x + rangeMeters * Math.cos(angleRad);
    const targetY = pose.y + rangeMeters * Math.sin(angleRad);
    return {
      x: toSvgX(Math.max(0.5, Math.min(23.5, targetX))),
      y: toSvgY(Math.max(0.5, Math.min(13.5, targetY))),
    };
  });

  return (
    <div className="bg-white border-2 border-slate-300 rounded-2xl p-2.5 flex flex-col justify-between relative shadow-xs select-none">
      {/* Top Map Header & Controls */}
      <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-200 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-800 font-sans font-bold">
          <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span className="text-xs text-slate-900 font-black">激光雷达扫描边界 (SLAM 2D)</span>
          <span className="text-[10px] text-blue-700 font-mono bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-bold">
            {robotName}
          </span>
        </div>

        {/* Zoom Controls & Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={handleZoomOut}
            className="w-6 h-6 bg-white hover:bg-slate-50 active:bg-slate-200 text-slate-700 rounded flex items-center justify-center cursor-pointer transition-all active:scale-95 text-xs font-bold border border-slate-200 shadow-xs"
            title="缩小地图视角"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] font-mono font-bold text-blue-700 px-1 min-w-8 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            className="w-6 h-6 bg-white hover:bg-slate-50 active:bg-slate-200 text-slate-700 rounded flex items-center justify-center cursor-pointer transition-all active:scale-95 text-xs font-bold border border-slate-200 shadow-xs"
            title="放大地图视角"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetZoom}
            className="w-6 h-6 bg-white hover:bg-slate-50 active:bg-slate-200 text-slate-600 hover:text-slate-900 rounded flex items-center justify-center cursor-pointer transition-all active:scale-95 text-xs border border-slate-200 shadow-xs"
            title="复位 100% 居中视角"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Stage - Crisp Light Background */}
      <div className="relative w-full h-32 sm:h-36 bg-[#f8fafc] rounded-xl overflow-hidden my-1 flex items-center justify-center border border-slate-300">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full cursor-crosshair transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: `${(robotSvgX / mapWidth) * 100}% ${(robotSvgY / mapHeight) * 100}%`,
          }}
        >
          <defs>
            {/* Background Grid Pattern (Light) */}
            <pattern id="slamGridLight" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>

            {/* Radar Scan Gradient Sweep */}
            <radialGradient id="lidarSweepLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>

            {/* AMR Heading Glow */}
            <radialGradient id="amrGlowLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid Background */}
          {showGrid && <rect width={mapWidth} height={mapHeight} fill="url(#slamGridLight)" />}

          {/* Workshop Outer Boundary & Walls */}
          <rect
            x="4"
            y="4"
            width={mapWidth - 8}
            height={mapHeight - 8}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.7"
          />

          {/* AGV Main Navigation Track Corridor */}
          <line
            x1="20"
            y1={toSvgY(7.0)}
            x2={mapWidth - 20}
            y2={toSvgY(7.0)}
            stroke="#64748b"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.6"
          />

          {/* Cleanroom Stations (ST-01 ~ ST-08) */}
          {stations.map((st) => {
            const sx = toSvgX(st.x - st.w / 2);
            const sy = toSvgY(st.y + st.h / 2);
            const sw = (st.w / 24) * mapWidth;
            const sh = (st.h / 14) * mapHeight;

            return (
              <g key={st.id}>
                <rect
                  x={sx}
                  y={sy}
                  width={sw}
                  height={sh}
                  rx="3"
                  fill="#ffffff"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={sx + sw / 2}
                  y={sy + sh / 2 + 3}
                  fill="#334155"
                  fontSize="7"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {st.id}
                </text>
              </g>
            );
          })}

          {/* PCB Storage & Charger Zone Markers */}
          <rect
            x={toSvgX(materialBuffer.x - 1.2)}
            y={toSvgY(materialBuffer.y + 1.2)}
            width="28"
            height="28"
            rx="3"
            fill="#ecfdf5"
            stroke="#10b981"
            strokeWidth="1.2"
          />
          <text
            x={toSvgX(materialBuffer.x)}
            y={toSvgY(materialBuffer.y) + 3}
            fill="#065f46"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
          >
            料仓
          </text>

          <rect
            x={toSvgX(chargerZone.x - 1.2)}
            y={toSvgY(chargerZone.y + 1.2)}
            width="28"
            height="28"
            rx="3"
            fill="#fffbeb"
            stroke="#f59e0b"
            strokeWidth="1.2"
          />
          <text
            x={toSvgX(chargerZone.x)}
            y={toSvgY(chargerZone.y) + 3}
            fill="#92400e"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
          >
            充电桩
          </text>

          {/* 360° LiDAR Ray Cloud Points & Boundary Scan */}
          {showRays && (
            <g>
              {/* Scan Ray Cone */}
              <polygon
                points={`${robotSvgX},${robotSvgY} ${lidarRays.map((p) => `${p.x},${p.y}`).join(' ')}`}
                fill="url(#lidarSweepLight)"
              />

              {/* Point Cloud Boundary Hits */}
              {lidarRays.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="1.3"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="0.4"
                />
              ))}

              {/* Boundary connecting lines */}
              <polyline
                points={lidarRays.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#0284c7"
                strokeWidth="1"
                opacity="0.75"
              />
            </g>
          )}

          {/* AMR Robot Current Pose Marker */}
          <g transform={`translate(${robotSvgX}, ${robotSvgY}) rotate(${-pose.theta + 90})`}>
            {/* Pulsing Aura */}
            <circle cx="0" cy="0" r="14" fill="url(#amrGlowLight)" />

            {/* Robot Chassis Body */}
            <rect
              x="-7"
              y="-10"
              width="14"
              height="20"
              rx="3"
              fill={robotType === 'LOADING' ? '#2563eb' : '#4f46e5'}
              stroke="#1e3a8a"
              strokeWidth="1"
            />

            {/* Directional Front Indicator Cone */}
            <polygon points="0,-13 -4,-8 4,-8" fill="#38bdf8" />

            {/* Center LiDAR Sensor Dot */}
            <circle cx="0" cy="0" r="2.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
          </g>
        </svg>

        {/* Compass Heading Indicator */}
        <div className="absolute top-1.5 right-2 bg-white/95 px-1.5 py-0.5 rounded text-[9px] font-mono text-blue-800 border border-slate-300 font-bold shadow-xs">
          θ: {pose.theta.toFixed(1)}°
        </div>
      </div>
    </div>
  );
};
