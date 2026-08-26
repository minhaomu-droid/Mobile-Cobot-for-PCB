import React, { useState, useRef, useEffect } from 'react';
import {
  Map,
  Compass,
  Layers,
  Play,
  Pause,
  Square,
  Save,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Eye,
  EyeOff,
  Crosshair,
  Radio,
  Navigation,
  FileCode,
  Zap,
  Trash2,
  Plus,
} from 'lucide-react';
import { ChassisMapData, VirtualZone, ThicknessStation, CalibrationPoint } from '../types';

interface ChassisMapStudioProps {
  stations: ThicknessStation[];
  calibrationPoints: CalibrationPoint[];
  onSyncFleetMap: () => void;
  onShowToast: (msg: string) => void;
}

export const ChassisMapStudio: React.FC<ChassisMapStudioProps> = ({
  stations,
  calibrationPoints,
  onSyncFleetMap,
  onShowToast,
}) => {
  // SLAM Mapping session state
  const [isMappingActive, setIsMappingActive] = useState<boolean>(false);
  const [mappingTimeSec, setMappingTimeSec] = useState<number>(0);
  const [scannedAreaM2, setScannedAreaM2] = useState<number>(438.5);
  const [featurePointsCount, setFeaturePointsCount] = useState<number>(14820);
  const [loopClosureScore, setLoopClosureScore] = useState<number>(99.8);
  const [slamAlgorithm, setSlamAlgorithm] = useState<'Cartographer 2D' | 'FAST-LIO 3D' | 'Gmapping'>('Cartographer 2D');

  // Layer Visibility Controls
  const [showLaserPoints, setShowLaserPoints] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showVirtualWalls, setShowVirtualWalls] = useState<boolean>(true);
  const [showOneWayLanes, setShowOneWayLanes] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showPaths, setShowPaths] = useState<boolean>(true);
  const [showRobots, setShowRobots] = useState<boolean>(true);

  // Interactive Tools: 'PAN' | 'NAV_GOAL' | 'RELOCALIZE' | 'ADD_WALL' | 'ADD_POINT'
  const [activeTool, setActiveTool] = useState<'PAN' | 'NAV_GOAL' | 'RELOCALIZE' | 'ADD_WALL' | 'ADD_POINT'>('PAN');

  // Zoom and Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Relocalization status
  const [relocConfidence, setRelocConfidence] = useState<number>(99.4);
  const [isRelocalizing, setIsRelocalizing] = useState<boolean>(false);

  // Active Target Nav Goal point
  const [navGoal, setNavGoal] = useState<{ x: number; y: number; name?: string } | null>({ x: 380, y: 130, name: 'ST-01 上料对接点' });

  // Map Data Store
  const [mapList, setMapList] = useState<ChassisMapData[]>([
    {
      id: 'MAP-001',
      name: 'Workshop_SMT_Main_Floor_v2.4',
      version: 'v2.4',
      widthMeters: 48.0,
      heightMeters: 28.0,
      resolutionMeters: 0.05,
      origin: [-10.0, -10.0],
      createdTime: '2026-08-10 14:30',
      isCurrent: true,
      algorithm: 'Cartographer 2D',
      relocalizationConfidence: 99.4,
      virtualZones: [
        {
          id: 'VZ-01',
          name: '高压电柜禁行区 #A',
          type: 'FORBIDDEN',
          polygon: [[10, 10], [50, 10], [50, 40], [10, 40]],
        },
        {
          id: 'VZ-02',
          name: '激光测厚机高精避障区',
          type: 'PRECISION_ALIGN',
          polygon: [[180, 70], [300, 70], [300, 130], [180, 130]],
        },
        {
          id: 'VZ-03',
          name: '主干道单向快速通行区',
          type: 'ONE_WAY',
          polygon: [[50, 80], [550, 80], [550, 120], [50, 120]],
          directionAngle: 0,
        },
      ],
    },
    {
      id: 'MAP-002',
      name: 'Warehouse_Raw_Material_A_v1.8',
      version: 'v1.8',
      widthMeters: 36.0,
      heightMeters: 20.0,
      resolutionMeters: 0.05,
      origin: [-5.0, -5.0],
      createdTime: '2026-08-01 09:15',
      isCurrent: false,
      algorithm: 'Cartographer 2D',
      relocalizationConfidence: 98.6,
      virtualZones: [],
    },
  ]);

  const [currentMapId, setCurrentMapId] = useState<string>('MAP-001');
  const currentMap = mapList.find((m) => m.id === currentMapId) || mapList[0];

  // Dynamic laser point cloud simulated data
  const [laserPoints, setLaserPoints] = useState<{ x: number; y: number }[]>([]);

  // AMR positions on the map
  const [amrList, setAmrList] = useState([
    { id: 'M-01', name: 'M-01 (上料)', x: 190, y: 110, heading: 90, status: 'NAVIGATING', battery: 94 },
    { id: 'M-02', name: 'M-02 (下料)', x: 270, y: 110, heading: 270, status: 'PICKING', battery: 88 },
    { id: 'M-03', name: 'M-03 (备用)', x: 430, y: 110, heading: 90, status: 'IDLE', battery: 76 },
    { id: 'M-04', name: 'M-04 (巡检)', x: 100, y: 260, heading: 180, status: 'NAVIGATING', battery: 82 },
  ]);

  // Generate initial simulated point cloud
  useEffect(() => {
    const points: { x: number; y: number }[] = [];
    // Outer perimeter walls
    for (let x = 30; x <= 570; x += 15) {
      points.push({ x: x + (Math.random() - 0.5) * 2, y: 20 + (Math.random() - 0.5) * 2 });
      points.push({ x: x + (Math.random() - 0.5) * 2, y: 300 + (Math.random() - 0.5) * 2 });
    }
    for (let y = 20; y <= 300; y += 15) {
      points.push({ x: 30 + (Math.random() - 0.5) * 2, y: y + (Math.random() - 0.5) * 2 });
      points.push({ x: 570 + (Math.random() - 0.5) * 2, y: y + (Math.random() - 0.5) * 2 });
    }
    // Obstacle pillars
    const pillars = [
      { cx: 150, cy: 150 },
      { cx: 350, cy: 150 },
      { cx: 480, cy: 150 },
      { cx: 150, cy: 230 },
      { cx: 350, cy: 230 },
    ];
    pillars.forEach((p) => {
      for (let a = 0; a < Math.PI * 2; a += 0.8) {
        points.push({
          x: p.cx + Math.cos(a) * 8 + (Math.random() - 0.5) * 1.5,
          y: p.cy + Math.sin(a) * 8 + (Math.random() - 0.5) * 1.5,
        });
      }
    });
    setLaserPoints(points);
  }, []);

  // SLAM mapping timer simulation
  useEffect(() => {
    let interval: any;
    if (isMappingActive) {
      interval = setInterval(() => {
        setMappingTimeSec((prev) => prev + 1);
        setScannedAreaM2((prev) => Number((prev + 0.35).toFixed(1)));
        setFeaturePointsCount((prev) => prev + 12);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMappingActive]);

  // Handle map click based on active tool
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 600);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 320);

    if (activeTool === 'NAV_GOAL') {
      setNavGoal({ x: clickX, y: clickY, name: `自定义导航目标 (${clickX}, ${clickY})` });
      onShowToast(`已向底盘下发 2D 目标导航点: X=${clickX}m, Y=${clickY}m`);
    } else if (activeTool === 'RELOCALIZE') {
      setIsRelocalizing(true);
      setTimeout(() => {
        setIsRelocalizing(false);
        setRelocConfidence(99.6);
        onShowToast(`已在坐标 (${clickX}, ${clickY}) 完成激光雷达点云匹配重定位！置信度 99.6%`);
      }, 800);
    } else if (activeTool === 'ADD_WALL') {
      onShowToast(`已在坐标 (${clickX}, ${clickY}) 标记虚拟禁行线起点`);
    } else if (activeTool === 'ADD_POINT') {
      onShowToast(`已新建站点标定示教点: CP-${Date.now().toString().slice(-4)} (${clickX}, ${clickY})`);
    }
  };

  // Start SLAM Mapping
  const handleToggleSlamMapping = () => {
    if (!isMappingActive) {
      setIsMappingActive(true);
      onShowToast(`已启动 ${slamAlgorithm} 实时激光雷达建图引擎，复合机器人底盘进入被动建图巡航`);
    } else {
      setIsMappingActive(false);
      onShowToast('激光建图已暂停，已执行闭环优化 (Loop Closure)');
    }
  };

  // Save Map
  const handleSaveMap = () => {
    const newMap: ChassisMapData = {
      id: `MAP-00${mapList.length + 1}`,
      name: `Workshop_SMT_Scanned_${new Date().toISOString().slice(0, 10)}`,
      version: `v${(mapList.length + 1).toFixed(1)}`,
      widthMeters: 48.0,
      heightMeters: 28.0,
      resolutionMeters: 0.05,
      origin: [-10.0, -10.0],
      createdTime: new Date().toLocaleString(),
      isCurrent: true,
      algorithm: slamAlgorithm,
      relocalizationConfidence: 99.8,
      virtualZones: currentMap.virtualZones,
    };
    setMapList([newMap, ...mapList.map((m) => ({ ...m, isCurrent: false }))]);
    setCurrentMapId(newMap.id);
    onShowToast(`当前 SLAM 栅格地图已成功保存并设为主地图：${newMap.name}`);
  };

  return (
    <div className="space-y-4 flex flex-col flex-1 text-slate-900">
      {/* Top Map Header & Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">底盘 2D/3D SLAM 激光地图与建图工作台</h3>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono">
                {currentMap.name} ({currentMap.version})
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              栅格分辨率: {currentMap.resolutionMeters}m (5cm) • 尺寸: {currentMap.widthMeters}m × {currentMap.heightMeters}m • 算法: {currentMap.algorithm}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* SLAM Mapping Toggle */}
          <button
            onClick={handleToggleSlamMapping}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isMappingActive
                ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500'
            }`}
          >
            {isMappingActive ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isMappingActive ? `正在建图 (${mappingTimeSec}s)` : '启动雷达在线建图'}</span>
          </button>

          {/* Save Map */}
          <button
            onClick={handleSaveMap}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="保存当前栅格地图"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">保存地图</span>
          </button>

          {/* Export Map Package */}
          <button
            onClick={() => onShowToast('已导出底盘地图包：map.yaml + map.pgm + zones.json')}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="导出 YAML + PGM 工业地图包"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">导出 .yaml/.pgm</span>
          </button>

          {/* Fleet Map Sync */}
          <button
            onClick={onSyncFleetMap}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>下发全车队 (8台)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Map Canvas + Right Tool Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left: 2D Interactive Map Canvas (8 Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Top Interactive Canvas Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
            {/* Interactive Tool Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTool('PAN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'PAN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="查看与平移模式"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>平移查看</span>
              </button>

              <button
                onClick={() => setActiveTool('NAV_GOAL')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'NAV_GOAL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="点击地图指定 2D 目标导航点"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>目标点导航 (2D Nav)</span>
              </button>

              <button
                onClick={() => setActiveTool('RELOCALIZE')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'RELOCALIZE' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="手动打点重定位估计位姿"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>打点重定位 (Pose)</span>
              </button>

              <button
                onClick={() => setActiveTool('ADD_WALL')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'ADD_WALL' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="在地图上绘制虚拟禁行墙"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>绘制禁行墙</span>
              </button>
            </div>

            {/* Zoom & View Controls */}
            <div className="flex items-center gap-1 text-slate-700">
              <button
                onClick={() => setZoomLevel((prev) => Math.min(2.0, prev + 0.1))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center border border-slate-200 text-xs font-bold"
                title="放大地图"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1 text-slate-600">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.1))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center border border-slate-200 text-xs font-bold"
                title="缩小地图"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center border border-slate-200 text-xs font-bold"
                title="重置视图"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* SVG Map Canvas with Layer Elements */}
          <div className="flex-1 bg-white rounded-xl border border-slate-300 relative overflow-hidden flex items-center justify-center min-h-[360px] max-h-[460px] shadow-inner">
            {/* Grid Pattern */}
            {showGrid && (
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-75" />
            )}

            {/* Coordinate Ruler labels */}
            <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-700 pointer-events-none bg-white/95 px-2.5 py-1 rounded-lg border border-slate-300 shadow-xs font-semibold">
              原点 (0.00m, 0.00m) • 比例尺: 1px = 0.05m • 工具模式: {activeTool}
            </div>

            <svg
              className="w-full h-full select-none cursor-crosshair"
              viewBox="0 0 600 320"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease-out',
              }}
              onClick={handleMapClick}
            >
              {/* Workshop Outer Wall Boundary */}
              <rect x="25" y="15" width="550" height="290" fill="none" stroke="#94a3b8" strokeWidth="2.5" />

              {/* Transit Highway / Lanes */}
              <rect x="50" y="80" width="500" height="40" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
              <rect x="50" y="190" width="500" height="40" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
              <rect x="130" y="40" width="40" height="240" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
              <rect x="370" y="40" width="40" height="240" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* One-Way Lane Direction Arrows */}
              {showOneWayLanes && (
                <g opacity="0.85">
                  <path d="M100 100 L120 100 M115 95 L120 100 L115 105" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                  <path d="M220 100 L240 100 M235 95 L240 100 L235 105" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                  <path d="M340 100 L360 100 M355 95 L360 100 L355 105" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                  <path d="M460 100 L480 100 M475 95 L480 100 L475 105" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                  {/* Reverse Lower Lane */}
                  <path d="M480 210 L460 210 M465 205 L460 210 L465 215" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                  <path d="M360 210 L340 210 M345 205 L340 210 L345 215" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                  <path d="M240 210 L220 210 M225 205 L220 210 L225 215" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                </g>
              )}

              {/* Virtual Walls & Forbidden Zones */}
              {showVirtualWalls && (
                <g>
                  {/* Forbidden Zone 1 */}
                  <rect x="490" y="30" width="70" height="40" rx="4" fill="#fee2e2" fillOpacity="0.8" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="525" y="54" fill="#dc2626" fontSize="8" fontWeight="bold" textAnchor="middle">高压禁行区</text>

                  {/* Forbidden Zone 2 */}
                  <rect x="25" y="240" width="60" height="50" rx="4" fill="#fee2e2" fillOpacity="0.8" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="55" y="268" fill="#dc2626" fontSize="8" fontWeight="bold" textAnchor="middle">配电室禁行</text>

                  {/* Virtual Wall Line */}
                  <line x1="300" y1="20" x2="300" y2="70" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 3" />
                  <text x="300" y="15" fill="#d97706" fontSize="7" fontWeight="bold" textAnchor="middle">虚拟隔离墙</text>
                </g>
              )}

              {/* Laser Point Cloud (LiDAR Scanned Points) */}
              {showLaserPoints && (
                <g opacity="0.85">
                  {laserPoints.map((pt, idx) => (
                    <circle key={idx} cx={pt.x} cy={pt.y} r="1.5" fill="#0284c7" />
                  ))}
                </g>
              )}

              {/* Workstations / Machines */}
              {showStations && (
                <g>
                  {/* ST-01 */}
                  <g transform="translate(190, 15)">
                    <rect width="100" height="55" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                    <text x="50" y="24" fill="#1e40af" fontSize="9" fontWeight="bold" textAnchor="middle">1号测厚机 (ST-01)</text>
                    <circle cx="50" cy="40" r="4" fill="#10b981" />
                    <text x="50" y="48" fill="#047857" fontSize="7" fontWeight="bold" textAnchor="middle">标定就绪</text>
                  </g>

                  {/* ST-02 */}
                  <g transform="translate(430, 15)">
                    <rect width="100" height="55" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                    <text x="50" y="24" fill="#1e40af" fontSize="9" fontWeight="bold" textAnchor="middle">2号测厚机 (ST-02)</text>
                    <circle cx="50" cy="40" r="4" fill="#10b981" />
                    <text x="50" y="48" fill="#047857" fontSize="7" fontWeight="bold" textAnchor="middle">标定就绪</text>
                  </g>

                  {/* ST-03 */}
                  <g transform="translate(190, 245)">
                    <rect width="100" height="55" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                    <text x="50" y="24" fill="#1e40af" fontSize="9" fontWeight="bold" textAnchor="middle">3号测厚机 (ST-03)</text>
                    <circle cx="50" cy="40" r="4" fill="#10b981" />
                  </g>

                  {/* Charging Station Dock */}
                  <g transform="translate(30, 90)">
                    <rect width="50" height="35" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                    <text x="25" y="18" fill="#047857" fontSize="7" fontWeight="bold" textAnchor="middle">充电桩 #01</text>
                    <text x="25" y="28" fill="#059669" fontSize="6" fontWeight="bold" textAnchor="middle">24V 40A 就绪</text>
                  </g>
                </g>
              )}

              {/* Real-time Global Path Trajectory */}
              {showPaths && navGoal && (
                <g>
                  {/* Path line from AMR-01 to navGoal */}
                  <path
                    d={`M 190 110 Q 280 110 ${navGoal.x} ${navGoal.y}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />
                  {/* Goal Marker Flag */}
                  <g transform={`translate(${navGoal.x}, ${navGoal.y})`}>
                    <circle r="7" fill="#10b981" fillOpacity="0.3" className="animate-ping" />
                    <circle r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <text y="-8" fill="#059669" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {navGoal.name || '目标点'}
                    </text>
                  </g>
                </g>
              )}

              {/* AMRs on Map */}
              {showRobots &&
                amrList.map((amr) => (
                  <g key={amr.id} transform={`translate(${amr.x}, ${amr.y})`}>
                    {/* Footprint circle */}
                    <circle r="14" fill="#2563eb" fillOpacity="0.85" stroke="#1d4ed8" strokeWidth="2" />
                    {/* Heading pointer triangle */}
                    <polygon
                      points="0,-12 5,-4 -5,-4"
                      fill="#ffffff"
                      transform={`rotate(${amr.heading})`}
                    />
                    <circle r="3" fill="#ffffff" />
                    <text y="22" fill="#1e293b" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      {amr.id}
                    </text>
                  </g>
                ))}
            </svg>
          </div>

          {/* Layer Visibility Checkboxes Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-1 text-slate-500 font-bold font-mono">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>图层开关:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1 text-slate-700 cursor-pointer hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={showLaserPoints}
                  onChange={(e) => setShowLaserPoints(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>激光雷达点云</span>
              </label>

              <label className="flex items-center gap-1 text-slate-700 cursor-pointer hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={showVirtualWalls}
                  onChange={(e) => setShowVirtualWalls(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>虚拟禁行区</span>
              </label>

              <label className="flex items-center gap-1 text-slate-700 cursor-pointer hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={showOneWayLanes}
                  onChange={(e) => setShowOneWayLanes(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>单向车道</span>
              </label>

              <label className="flex items-center gap-1 text-slate-700 cursor-pointer hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={showStations}
                  onChange={(e) => setShowStations(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>测厚机与工位</span>
              </label>

              <label className="flex items-center gap-1 text-slate-700 cursor-pointer hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={showPaths}
                  onChange={(e) => setShowPaths(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>规划路径</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: SLAM Engine Controls & Map Management (4 Columns) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          {/* Card 1: SLAM Engine & Realtime Mapping Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Radio className="w-4 h-4 text-indigo-600" />
                <span>SLAM 激光建图引擎状态</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  isMappingActive
                    ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isMappingActive ? '正在扫图中 (MAPPING)' : '就绪 (STANDBY)'}
              </span>
            </div>

            {/* Algorithm selector */}
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">SLAM 核心算法引擎</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                {(['Cartographer 2D', 'FAST-LIO 3D', 'Gmapping'] as const).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => setSlamAlgorithm(algo)}
                    className={`py-1.5 px-1 rounded-xl font-bold border transition-all text-center ${
                      slamAlgorithm === algo
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {algo.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Mapping telemetry metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">扫描有效面积</span>
                <span className="font-bold text-slate-900 text-sm">{scannedAreaM2} m²</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">提取特征点数</span>
                <span className="font-bold text-blue-700 text-sm">{featurePointsCount} pts</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">闭环优化得分</span>
                <span className="font-bold text-emerald-700 text-sm">{loopClosureScore}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">建图运行时间</span>
                <span className="font-bold text-slate-800 text-sm">{mappingTimeSec} 秒</span>
              </div>
            </div>

            {/* Mapping Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onShowToast('已执行点云去噪算法，清除了 142 个离群反光噪点')}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-all cursor-pointer text-center"
              >
                点云降噪滤波
              </button>
              <button
                onClick={() => onShowToast('已强制执行全局回环检测 (Global Loop Closure Optimization)')}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-all cursor-pointer text-center"
              >
                强制闭环优化
              </button>
            </div>
          </div>

          {/* Card 2: Relocalization & Pose Estimation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Crosshair className="w-4 h-4 text-amber-600" />
                <span>底盘重定位与姿态校准 (Relocalization)</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                置信度: {relocConfidence}%
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>当前估计位姿 X:</span>
                <span className="font-bold text-slate-900">12.450 m</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>当前估计位姿 Y:</span>
                <span className="font-bold text-slate-900">8.320 m</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>当前朝向角 Yaw (θ):</span>
                <span className="font-bold text-blue-700">90.00°</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsRelocalizing(true);
                  setTimeout(() => {
                    setIsRelocalizing(false);
                    setRelocConfidence(99.9);
                    onShowToast('全场反光柱与自然特征匹配重定位完成！置信度 99.9%');
                  }, 600);
                }}
                disabled={isRelocalizing}
                className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{isRelocalizing ? '匹配中...' : '全局自动重定位'}</span>
              </button>

              <button
                onClick={() => onShowToast('已下发 2D Pose 初始位姿估计指令')}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                <span>微调姿态角</span>
              </button>
            </div>
          </div>

          {/* Card 3: Map Storage & Version Switcher */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span>地图库列表与版本切换 ({mapList.length})</span>
              </div>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {mapList.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setCurrentMapId(m.id);
                    onShowToast(`已切换当前工作地图为：${m.name}`);
                  }}
                  className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    currentMapId === m.id
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="overflow-hidden pr-2">
                    <div className="truncate font-sans">{m.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono font-normal">
                      {m.version} • {m.createdTime}
                    </div>
                  </div>
                  {currentMapId === m.id ? (
                    <span className="shrink-0 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                      当前
                    </span>
                  ) : (
                    <span className="shrink-0 text-blue-600 text-[10px] hover:underline font-medium">
                      启用
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
