import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  LogOut,
  Bot,
  Move,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  Compass,
  Radio,
  RefreshCw,
  Power,
  HandMetal,
  Activity,
  Crosshair,
  Gauge,
  ShieldCheck,
  Navigation,
  Lock,
  Unlock,
  Check,
  AlertOctagon,
  QrCode
} from 'lucide-react';
import { ThicknessStation, AMRRobotState } from '../types';
import { LidarScanMiniMap } from './LidarScanMiniMap';
import { RobotArmSimulation } from './RobotArmSimulation';
import { EndEffectorSimulation } from './EndEffectorSimulation';
import { QrCodeVisionStudio } from './QrCodeVisionStudio';

interface TeleoperationL4Props {
  station: ThicknessStation;
  selectedRobotType: 'LOADING' | 'UNLOADING';
  onSelectRobotType: (type: 'LOADING' | 'UNLOADING') => void;
  onNavigateBackToL3: () => void;
  pokaYokeHoldSeconds: number;
  onRequestGripperSafetyConfirm?: (action: 'OPEN' | 'CLOSE') => void;
  onNavigateToBlockly?: () => void;
  onLogout?: () => void;
  m01Estop?: boolean;
  m02Estop?: boolean;
  onTriggerEstopM01?: () => void;
  onTriggerEstopM02?: () => void;
}

export const TeleoperationL4: React.FC<TeleoperationL4Props> = ({
  station,
  selectedRobotType,
  onSelectRobotType,
  onNavigateBackToL3,
  onRequestGripperSafetyConfirm,
  onLogout,
  m01Estop = false,
  m02Estop = false,
  onTriggerEstopM01,
  onTriggerEstopM02,
}) => {
  const currentRobot: AMRRobotState =
    selectedRobotType === 'LOADING' ? station.loadingAMR : station.unloadingAMR;

  // Chassis Navigation Mode: 手动模式 vs 自动模式
  const [chassisMode, setChassisMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');

  // Chassis Real-time Position & SLAM Telemetry
  const [chassisPose, setChassisPose] = useState({
    x: selectedRobotType === 'LOADING' ? 12.45 : 14.80,
    y: selectedRobotType === 'LOADING' ? 6.82 : 8.15,
    theta: 90.0,
    confidence: 99.8,
    lidarStatus: 'NORMAL' as const,
  });

  // Local state for chassis movement & speed
  const [speed, setSpeed] = useState<number>(0.3); // m/s
  const [activeDirection, setActiveDirection] = useState<string>('STOP');

  // Arm Control Coordinates State: Joint vs Cartesian
  const [armControlMode, setArmControlMode] = useState<'JOINT' | 'CARTESIAN'>('CARTESIAN');
  
  // Motion Type: 点动 (Step/Jog) vs 连续 (Continuous Hold)
  const [motionMode, setMotionMode] = useState<'JOG' | 'CONTINUOUS'>('JOG');

  // Step / Speed selection: 1mm, 5mm, 10mm (for Cartesian) & 1°, 5°, 10° (for Joint)
  const [stepSize, setStepSize] = useState<1 | 5 | 10>(5);

  // Arm Joint Angles (J1 ~ J6 in degrees)
  const [jointAngles, setJointAngles] = useState<number[]>([...currentRobot.jointAngles]);

  // Cartesian TCP coordinates (X, Y, Z in mm; Rx, Ry, Rz in degrees)
  const [cartesianPos, setCartesianPos] = useState({
    x: 425.0,
    y: -110.0,
    z: 315.0,
    rx: 180.0,
    ry: 0.0,
    rz: -45.0,
  });

  // Active continuous holding state indicator
  const [activeMovingAxis, setActiveMovingAxis] = useState<string | null>(null);
  const continuousIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up continuous interval on unmount
  useEffect(() => {
    return () => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
      }
    };
  }, []);

  // Gripper state (Pneumatic Parallel Gripper)
  const [isGripperOpen, setIsGripperOpen] = useState<boolean>(false);
  const [rightPanelTab, setRightPanelTab] = useState<'QR_VISION' | 'GRIPPER'>('QR_VISION');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Error and alarm state
  const [robotError, setRobotError] = useState<string | null>(
    currentRobot.status === 'ERROR' ? '0x204: 安全光幕触发停机 / 伺服限位告警' : null
  );
  const [robotStatusText, setRobotStatusText] = useState<string>(
    currentRobot.status === 'ERROR' ? '异常停机' : '手动遥控就绪'
  );

  // Handlers for Chassis Movement
  const handleChassisMove = (dir: string) => {
    if (chassisMode === 'AUTO') {
      showToast('当前处于自动模式，底盘遥控已锁定；请切换到手动模式操作');
      return;
    }
    setActiveDirection(dir);
    // Simulate slight position change
    if (dir === 'FORWARD') setChassisPose((p) => ({ ...p, y: parseFloat((p.y + 0.05).toFixed(2)) }));
    if (dir === 'BACKWARD') setChassisPose((p) => ({ ...p, y: parseFloat((p.y - 0.05).toFixed(2)) }));
    if (dir === 'LEFT') setChassisPose((p) => ({ ...p, x: parseFloat((p.x - 0.05).toFixed(2)), theta: parseFloat(((p.theta + 5) % 360).toFixed(1)) }));
    if (dir === 'RIGHT') setChassisPose((p) => ({ ...p, x: parseFloat((p.x + 0.05).toFixed(2)), theta: parseFloat(((p.theta - 5 + 360) % 360).toFixed(1)) }));
  };

  const handleChassisStop = () => {
    setActiveDirection('STOP');
  };

  // Step Execution for Joint
  const applyJointDelta = (index: number, delta: number) => {
    setJointAngles((prev) => {
      const next = [...prev];
      next[index] = parseFloat((next[index] + delta).toFixed(1));
      return next;
    });
  };

  // Step Execution for Cartesian
  const applyCartesianDelta = (axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz', delta: number) => {
    setCartesianPos((prev) => ({
      ...prev,
      [axis]: parseFloat((prev[axis] + delta).toFixed(1)),
    }));
  };

  // Joint Press Handlers (handles both JOG single click and CONTINUOUS hold)
  const handleJointStart = (index: number, direction: 1 | -1) => {
    const delta = direction * (stepSize === 1 ? 1.0 : stepSize === 5 ? 5.0 : 10.0);
    const axisLabel = `J${index + 1}_${direction > 0 ? 'PLUS' : 'MINUS'}`;
    setActiveMovingAxis(axisLabel);

    if (motionMode === 'JOG') {
      applyJointDelta(index, delta);
    } else {
      applyJointDelta(index, delta * 0.2);
      if (continuousIntervalRef.current) clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = setInterval(() => {
        applyJointDelta(index, delta * 0.2);
      }, 100);
    }
  };

  // Cartesian Press Handlers
  const handleCartesianStart = (
    axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz',
    direction: 1 | -1
  ) => {
    const isLinear = axis === 'x' || axis === 'y' || axis === 'z';
    const unitStep = isLinear ? stepSize : (stepSize === 1 ? 1.0 : stepSize === 5 ? 5.0 : 10.0);
    const delta = direction * unitStep;
    const axisLabel = `${axis.toUpperCase()}_${direction > 0 ? 'PLUS' : 'MINUS'}`;
    setActiveMovingAxis(axisLabel);

    if (motionMode === 'JOG') {
      applyCartesianDelta(axis, delta);
    } else {
      const stepFraction = isLinear ? (stepSize * 0.2) : (unitStep * 0.2);
      applyCartesianDelta(axis, direction * stepFraction);
      if (continuousIntervalRef.current) clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = setInterval(() => {
        applyCartesianDelta(axis, direction * stepFraction);
      }, 100);
    }
  };

  const handleMotionEnd = () => {
    setActiveMovingAxis(null);
    if (continuousIntervalRef.current) {
      clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = null;
    }
  };

  // 1. 【机械臂复位点】 (Arm Home Reset)
  const handleArmHomeReset = () => {
    setJointAngles([0, 0, 90, 0, -90, 0]);
    setCartesianPos({ x: 400.0, y: 0.0, z: 350.0, rx: 180.0, ry: 0.0, rz: 0.0 });
    showToast(`已执行 [${currentRobot.name}] 机械臂复位点：关节角回到安全抬升位`);
  };

  // 2. 【机器人复位点】 (Robot Home Reset / Chassis Zero)
  const handleRobotHomeReset = () => {
    setChassisPose({
      x: 0.0,
      y: 0.0,
      theta: 0.0,
      confidence: 100.0,
      lidarStatus: 'NORMAL',
    });
    setJointAngles([0, 0, 90, 0, -90, 0]);
    showToast(`已执行 [${currentRobot.name}] 机器人整机复位点：底盘原点对齐 (0,0,0) 并校准坐标`);
  };

  // 3. 【夹具定位点】 (Gripper Calibration Pose)
  const handleGripperCalibrationPoint = () => {
    setCartesianPos({ x: 510.0, y: 120.0, z: 185.0, rx: 180.0, ry: 0.0, rz: 0.0 });
    setJointAngles([12.4, -25.0, 78.2, 0.0, -53.2, 12.0]);
    showToast(`已执行 [${currentRobot.name}] 夹具定位点：末端平行夹爪回到治具标定基准位`);
  };

  const handleTriggerGripperWithSafety = () => {
    if (!isGripperOpen) {
      if (onRequestGripperSafetyConfirm) {
        onRequestGripperSafetyConfirm('OPEN');
      } else {
        setIsGripperOpen(true);
        showToast('夹爪已安全打开');
      }
    } else {
      setIsGripperOpen(false);
      showToast('夹爪已闭合夹紧');
    }
  };

  // Clear Error Handler
  const handleClearError = () => {
    setRobotError(null);
    setRobotStatusText('待命中 (已清错)');
    showToast('已清除当前伺服与安全告警');
  };

  return (
    <div className="h-full flex-1 bg-slate-100/90 text-slate-900 flex flex-col justify-between p-3 sm:p-4 gap-2.5 select-none font-sans overflow-hidden min-h-0 relative">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl border border-slate-700 text-xs font-mono font-bold animate-fade-in flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Top Header Bar & Recovery Points (Unified Clean Ribbon) */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl px-4 py-2.5 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0">
        {/* Left: Title & Robot Switcher */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              复合机器人控制与异常恢复
            </h1>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectRobotType('LOADING')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedRobotType === 'LOADING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              M-01 上料复合机器人
            </button>
            <button
              onClick={() => onSelectRobotType('UNLOADING')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedRobotType === 'UNLOADING'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              M-02 下料复合机器人
            </button>
          </div>
        </div>

        {/* Center: 3 Recovery Points */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto justify-center">
          <button
            onClick={handleArmHomeReset}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs sm:text-sm rounded-xl border border-blue-300 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title="机械臂关节抬升回到安全预备原点"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>1. 机械臂复位点</span>
          </button>

          <button
            onClick={handleRobotHomeReset}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs sm:text-sm rounded-xl border border-indigo-300 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title="底盘与整机系统原点零位校准"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. 机器人复位点</span>
          </button>

          <button
            onClick={handleGripperCalibrationPoint}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs sm:text-sm rounded-xl border border-amber-300 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title="末端气动吸盘/夹爪回到治具标定基准位"
          >
            <HandMetal className="w-3.5 h-3.5 text-amber-600" />
            <span>3. 夹具定位点</span>
          </button>
        </div>

        {/* Right: Dedicated E-Stops */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onTriggerEstopM01}
            className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-xs ${
              m01Estop
                ? 'bg-red-700 hover:bg-red-800 text-white border-red-900 animate-pulse ring-2 ring-red-300'
                : 'bg-red-600 hover:bg-red-700 text-white border-red-800'
            }`}
            title="M-01 上料复合机器人独立急停"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{m01Estop ? 'M-01已急停' : 'M-01急停'}</span>
          </button>
          <button
            onClick={onTriggerEstopM02}
            className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-xs ${
              m02Estop
                ? 'bg-red-700 hover:bg-red-800 text-white border-red-900 animate-pulse ring-2 ring-red-300'
                : 'bg-red-600 hover:bg-red-700 text-white border-red-800'
            }`}
            title="M-02 收料复合机器人独立急停"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{m02Estop ? 'M-02已急停' : 'M-02急停'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Chassis, Arm, Gripper & Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* 1. 底盘控制区 - Left Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-300 rounded-2xl p-2.5 sm:p-3 flex flex-col shadow-xs min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-2 min-h-0">
            {/* Header: Mode Switcher */}
            <div className="border-b-2 border-slate-200 pb-1.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <Move className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm sm:text-base font-black text-slate-800">底盘控制与定位</h2>
              </div>

              {/* Manual vs Auto Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => {
                    setChassisMode('MANUAL');
                    showToast('已切换至 [手动模式]：底盘遥控手柄已解锁');
                  }}
                  className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    chassisMode === 'MANUAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Unlock className="w-3 h-3" />
                  <span>手动模式</span>
                </button>
                <button
                  onClick={() => {
                    setChassisMode('AUTO');
                    showToast('已切换至 [自动模式]：底盘由RMS路线导航接管');
                  }}
                  className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    chassisMode === 'AUTO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Navigation className="w-3 h-3" />
                  <span>自动模式</span>
                </button>
              </div>
            </div>

            {/* 实时位置与定位信息 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-mono text-xs space-y-1 shrink-0">
              <div className="flex items-center justify-between text-slate-700 font-sans text-xs border-b border-slate-200 pb-0.5 font-bold">
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span>激光雷达 SLAM:</span>
                </span>
                <span className="text-emerald-700 font-black font-mono text-xs">置信度 {chassisPose.confidence}%</span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="bg-white px-1 py-0.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans font-bold leading-tight">X 坐标</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{chassisPose.x.toFixed(2)} m</span>
                </div>
                <div className="bg-white px-1 py-0.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans font-bold leading-tight">Y 坐标</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{chassisPose.y.toFixed(2)} m</span>
                </div>
                <div className="bg-white px-1 py-0.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans font-bold leading-tight">航向角 θ</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-700 leading-tight">{chassisPose.theta.toFixed(1)}°</span>
                </div>
              </div>
            </div>

            {/* D-Pad Virtual Joystick */}
            <div className="relative bg-slate-50 border-2 border-slate-300 rounded-xl p-1.5 flex flex-col items-center justify-center space-y-1 shrink-0">
              {chassisMode === 'AUTO' && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-xl z-10 flex flex-col items-center justify-center text-white text-center p-2">
                  <Lock className="w-5 h-5 text-emerald-400 mb-0.5" />
                  <span className="text-xs font-bold">自动调度接管中</span>
                  <span className="text-[10px] text-slate-200">请切换为手动模式以使用手柄</span>
                </div>
              )}

              {/* Up */}
              <button
                onMouseDown={() => handleChassisMove('FORWARD')}
                onMouseUp={handleChassisStop}
                onTouchStart={() => handleChassisMove('FORWARD')}
                onTouchEnd={handleChassisStop}
                className="w-18 h-8 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs rounded-lg border border-[#46b8da] shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-[10px] leading-none">▲</span>
                <span className="text-[10px] font-bold leading-none">前进</span>
              </button>

              {/* Left - Stop - Right */}
              <div className="flex items-center gap-1.5">
                <button
                  onMouseDown={() => handleChassisMove('LEFT')}
                  onMouseUp={handleChassisStop}
                  onTouchStart={() => handleChassisMove('LEFT')}
                  onTouchEnd={handleChassisStop}
                  className="w-18 h-8 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs rounded-lg border border-[#46b8da] shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-[10px] leading-none">◀</span>
                  <span className="text-[10px] font-bold leading-none">左转/移</span>
                </button>

                <button
                  onClick={handleChassisStop}
                  className="w-18 h-8 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-lg border border-red-400 shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-[10px] leading-none">●</span>
                  <span className="text-[11px] font-bold leading-none">停止</span>
                </button>

                <button
                  onMouseDown={() => handleChassisMove('RIGHT')}
                  onMouseUp={handleChassisStop}
                  onTouchStart={() => handleChassisMove('RIGHT')}
                  onTouchEnd={handleChassisStop}
                  className="w-18 h-8 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs rounded-lg border border-[#46b8da] shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-[10px] leading-none">▶</span>
                  <span className="text-[10px] font-bold leading-none">右转/移</span>
                </button>
              </div>

              {/* Down */}
              <button
                onMouseDown={() => handleChassisMove('BACKWARD')}
                onMouseUp={handleChassisStop}
                onTouchStart={() => handleChassisMove('BACKWARD')}
                onTouchEnd={handleChassisStop}
                className="w-18 h-8 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs rounded-lg border border-[#46b8da] shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-[10px] leading-none">▼</span>
                <span className="text-[10px] font-bold leading-none">后退</span>
              </button>
            </div>

            {/* Speed Slider */}
            <div className="space-y-0.5 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">线速度设定:</span>
                <span className="font-mono text-blue-700 font-black">{speed} m/s</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* NEW: 激光雷达扫描边界地图组件 (带缩放功能) */}
            <div className="shrink-0 mt-0.5">
              <LidarScanMiniMap
                pose={chassisPose}
                robotName={currentRobot.name}
                robotType={selectedRobotType}
              />
            </div>
          </div>
        </div>

        {/* 2. 机械臂控制区 - Center Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-300 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xs min-h-0 overflow-y-auto">
          <div className="space-y-2">
            <div className="border-b-2 border-slate-200 pb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm sm:text-base font-black text-slate-800">六轴机械臂遥控</h2>
              </div>
              {activeMovingAxis && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md animate-pulse border border-amber-200">
                  ● 正在连续运动
                </span>
              )}
            </div>

            {/* Coordinate Selector & Mode Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                <span className="text-xs text-slate-700 pl-2">空间坐标:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setArmControlMode('CARTESIAN')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      armControlMode === 'CARTESIAN'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>笛卡尔 (XYZ)</span>
                  </button>
                  <button
                    onClick={() => setArmControlMode('JOINT')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      armControlMode === 'JOINT'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>关节 (J1~J6)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {/* 点动 vs 连续切换 */}
                <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-700 pl-1.5">模式:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMotionMode('JOG')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        motionMode === 'JOG'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      点动
                    </button>
                    <button
                      onClick={() => setMotionMode('CONTINUOUS')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        motionMode === 'CONTINUOUS'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      连续长按
                    </button>
                  </div>
                </div>

                {/* 3 Speeds */}
                <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-700 pl-1">
                    {armControlMode === 'CARTESIAN' ? '步长:' : '角度:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setStepSize(1)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        stepSize === 1
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {armControlMode === 'CARTESIAN' ? '1mm' : '1°'}
                    </button>
                    <button
                      onClick={() => setStepSize(5)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        stepSize === 5
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {armControlMode === 'CARTESIAN' ? '5mm' : '5°'}
                    </button>
                    <button
                      onClick={() => setStepSize(10)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        stepSize === 10
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {armControlMode === 'CARTESIAN' ? '10mm' : '10°'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode 1: 笛卡尔空间控制 (X, Y, Z & Rx, Ry, Rz) */}
            {armControlMode === 'CARTESIAN' && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5">
                  {(['x', 'y', 'z'] as const).map((axis) => {
                    const axisName = axis === 'x' ? 'X (前后)' : axis === 'y' ? 'Y (左右)' : 'Z (上下)';
                    return (
                      <div
                        key={axis}
                        className="bg-slate-50 border-2 border-slate-200 p-1.5 rounded-xl flex flex-col justify-between items-center text-xs"
                      >
                        <span className="font-bold text-xs text-slate-800">{axisName}</span>
                        <span className="font-mono font-black text-blue-700 text-sm my-0.5">
                          {cartesianPos[axis].toFixed(1)} <span className="text-[10px] font-normal text-slate-500">mm</span>
                        </span>

                        <div className="flex items-center gap-1 w-full justify-center pt-0.5">
                          <button
                            onMouseDown={() => handleCartesianStart(axis, -1)}
                            onMouseUp={handleMotionEnd}
                            onTouchStart={() => handleCartesianStart(axis, -1)}
                            onTouchEnd={handleMotionEnd}
                            className="flex-1 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                          >
                            -
                          </button>
                          <button
                            onMouseDown={() => handleCartesianStart(axis, 1)}
                            onMouseUp={handleMotionEnd}
                            onTouchStart={() => handleCartesianStart(axis, 1)}
                            onTouchEnd={handleMotionEnd}
                            className="flex-1 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {(['rx', 'ry', 'rz'] as const).map((axis) => {
                    const axisName = axis === 'rx' ? 'Rx (翻滚)' : axis === 'ry' ? 'Ry (俯仰)' : 'Rz (偏航)';
                    return (
                      <div
                        key={axis}
                        className="bg-slate-50 border-2 border-slate-200 p-1.5 rounded-xl flex flex-col justify-between items-center text-xs"
                      >
                        <span className="font-bold text-xs text-slate-800">{axisName}</span>
                        <span className="font-mono font-black text-indigo-700 text-sm my-0.5">
                          {cartesianPos[axis].toFixed(1)} <span className="text-[10px] font-normal text-slate-500">°</span>
                        </span>

                        <div className="flex items-center gap-1 w-full justify-center pt-0.5">
                          <button
                            onMouseDown={() => handleCartesianStart(axis, -1)}
                            onMouseUp={handleMotionEnd}
                            onTouchStart={() => handleCartesianStart(axis, -1)}
                            onTouchEnd={handleMotionEnd}
                            className="flex-1 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                          >
                            -
                          </button>
                          <button
                            onMouseDown={() => handleCartesianStart(axis, 1)}
                            onMouseUp={handleMotionEnd}
                            onTouchStart={() => handleCartesianStart(axis, 1)}
                            onTouchEnd={handleMotionEnd}
                            className="flex-1 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode 2: 关节空间控制 (J1 ~ J6) */}
            {armControlMode === 'JOINT' && (
              <div className="space-y-1">
                {jointAngles.map((angle, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 border-2 border-slate-200 px-2.5 py-1 rounded-xl text-xs"
                  >
                    <span className="font-bold font-mono text-slate-800 text-xs w-16">
                      J{idx + 1} 关节
                    </span>
                    <span className="font-mono font-black text-blue-700 text-sm w-20 text-center">
                      {angle.toFixed(1)}°
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onMouseDown={() => handleJointStart(idx, -1)}
                        onMouseUp={handleMotionEnd}
                        onTouchStart={() => handleJointStart(idx, -1)}
                        onTouchEnd={handleMotionEnd}
                        className="w-12 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                      >
                        -
                      </button>
                      <button
                        onMouseDown={() => handleJointStart(idx, 1)}
                        onMouseUp={handleMotionEnd}
                        onTouchStart={() => handleJointStart(idx, 1)}
                        onTouchEnd={handleMotionEnd}
                        className="w-12 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* NEW: 六轴机械臂三维运动学动态仿真图 */}
            <div className="pt-0.5">
              <RobotArmSimulation
                cartesianPos={cartesianPos}
                jointAngles={jointAngles}
                isMoving={!!activeMovingAxis}
              />
            </div>
          </div>
        </div>

        {/* 3. 夹具控制区、二维码视觉相机 & 错误告警区 - Right Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-300 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xs min-h-0 overflow-y-auto">
          <div className="space-y-2">
            {/* 夹具动作控制 */}
            <div>
              <div className="border-b border-slate-200 pb-1.5 mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HandMetal className="w-4.5 h-4.5 text-emerald-600" />
                  <h2 className="text-sm sm:text-base font-black text-slate-800">夹具控制 (带安全确认)</h2>
                </div>
                <span className={`px-2 py-0.5 rounded-lg font-mono text-xs font-bold ${
                  isGripperOpen ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {isGripperOpen ? '已打开' : '已闭合'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleTriggerGripperWithSafety}
                  className={`py-2 px-2 rounded-xl text-xs font-black border shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    isGripperOpen
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                  }`}
                >
                  <HandMetal className="w-4 h-4" />
                  <span className="truncate">{isGripperOpen ? '夹爪已开(点击闭合)' : '夹爪闭合(点击打开)'}</span>
                </button>

                <button
                  onClick={() => showToast('伺服使能回路正常，安全光幕与急停状态良好')}
                  className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                >
                  <Power className="w-3.5 h-3.5 text-emerald-600" />
                  <span>伺服使能就绪</span>
                </button>
              </div>
            </div>

            {/* Vision / Gripper Simulation Tab Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setRightPanelTab('QR_VISION')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  rightPanelTab === 'QR_VISION'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>二维码视觉相机 (3视角)</span>
              </button>
              <button
                onClick={() => setRightPanelTab('GRIPPER')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  rightPanelTab === 'GRIPPER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HandMetal className="w-3.5 h-3.5" />
                <span>平行夹爪仿真</span>
              </button>
            </div>

            {/* Dynamic Content: QR Vision Studio vs Parallel Gripper Simulation */}
            {rightPanelTab === 'QR_VISION' ? (
              <QrCodeVisionStudio onShowToast={showToast} />
            ) : (
              <EndEffectorSimulation
                isGripperOpen={isGripperOpen}
                robotError={robotError}
              />
            )}

            {/* 告警状态展示 */}
            <div>
              <div
                className={`border-2 rounded-xl p-2 text-xs font-mono flex flex-col justify-between ${
                  robotError
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold mb-0.5 text-xs">
                    {robotError ? (
                      <span className="text-red-700">● 存在活动设备告警</span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        状态正常，安全回路使能
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-tight">
                    {robotError || '伺服回路闭合完好，激光雷达通信正常，气动平行夹爪系统就绪。'}
                  </p>
                </div>

                <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-1 mt-1 flex items-center justify-between">
                  <span>状态: <strong className="text-slate-800 font-bold">{robotStatusText}</strong></span>
                  <span className="text-emerald-700 font-bold">● 气路 0.6MPa 正常</span>
                </div>
              </div>
            </div>
          </div>

          {/* [一键清错与伺服复位] 按键 */}
          <div className="pt-2">
            <button
              onClick={handleClearError}
              className="w-full py-2.5 sm:py-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>一键清错与伺服复位</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
