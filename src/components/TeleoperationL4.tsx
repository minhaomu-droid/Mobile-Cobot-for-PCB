import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Move,
  Sliders,
  Compass,
  Radio,
  Power,
  HandMetal,
  Crosshair,
  Navigation,
  Lock,
  Unlock,
  AlertOctagon,
  RotateCcw,
  Home,
  Battery,
} from 'lucide-react';
import { ThicknessStation, AMRRobotState } from '../types';

interface TeleoperationL4Props {
  station: ThicknessStation;
  selectedRobotType: 'LOADING' | 'UNLOADING';
  onSelectRobotType: (type: 'LOADING' | 'UNLOADING') => void;
  onNavigateBackToL3: () => void;
  onBackToHome?: () => void;
  pokaYokeHoldSeconds: number;
  onRequestGripperSafetyConfirm?: (action: 'OPEN' | 'CLOSE') => void;
  onNavigateToBlockly?: () => void;
  onLogout?: () => void;
  m01Estop?: boolean;
  m02Estop?: boolean;
  onTriggerEstopM01?: () => void;
  onTriggerEstopM02?: () => void;
  systemMode?: 'AUTO' | 'MANUAL';
  onToggleSystemMode?: () => void;
}

export const TeleoperationL4: React.FC<TeleoperationL4Props> = ({
  station,
  selectedRobotType,
  onSelectRobotType,
  onNavigateBackToL3,
  onBackToHome,
  onRequestGripperSafetyConfirm,
  onLogout,
  m01Estop = false,
  m02Estop = false,
  onTriggerEstopM01,
  onTriggerEstopM02,
  systemMode,
  onToggleSystemMode,
}) => {
  const currentRobot: AMRRobotState =
    selectedRobotType === 'LOADING' ? station.loadingAMR : station.unloadingAMR;

  // Chassis Navigation Mode: 手动模式 vs 自动模式 (由顶部状态栏统一管理)
  const [localChassisMode, setLocalChassisMode] = useState<'MANUAL' | 'AUTO'>('AUTO');
  const chassisMode = systemMode ?? localChassisMode;

  // Chassis Real-time Position & SLAM Telemetry
  const [chassisPose, setChassisPose] = useState({
    x: selectedRobotType === 'LOADING' ? 12.45 : 14.80,
    y: selectedRobotType === 'LOADING' ? 6.82 : 8.15,
    theta: 90.0,
    confidence: 99.8,
    lidarStatus: 'NORMAL' as const,
  });

  // Local state for chassis movement & speed (Max speed limited to 0.5 m/s)
  const [speed, setSpeed] = useState<number>(0.3); // m/s
  const [activeDirection, setActiveDirection] = useState<string>('STOP');

  // Arm Control Coordinates State: Joint vs Cartesian
  const [armControlMode, setArmControlMode] = useState<'JOINT' | 'CARTESIAN'>('CARTESIAN');
  
  // Motion Type: 点动 (Step/Jog) vs 连续 (Continuous Hold)
  const [motionMode, setMotionMode] = useState<'JOG' | 'CONTINUOUS'>('JOG');

  // Step / Speed selection: 1mm, 5mm, 10mm (for Cartesian) & 0.5°, 1°, 5° (for Joint)
  const [cartesianStep, setCartesianStep] = useState<1 | 5 | 10>(5);
  const [jointStep, setJointStep] = useState<0.5 | 1 | 5>(1);

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
  // 机械臂状态（“臂状态”）：未上电、已上电、急停、碰撞
  const [armState, setArmState] = useState<'UNPOWERED' | 'POWERED' | 'ESTOP' | 'COLLISION'>('POWERED');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

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
    if (chassisMode === 'AUTO') return;
    const delta = direction * jointStep;
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
    if (chassisMode === 'AUTO') return;
    const isLinear = axis === 'x' || axis === 'y' || axis === 'z';
    const unitStep = isLinear ? cartesianStep : (cartesianStep === 1 ? 1.0 : cartesianStep === 5 ? 5.0 : 10.0);
    const delta = direction * unitStep;
    const axisLabel = `${axis.toUpperCase()}_${direction > 0 ? 'PLUS' : 'MINUS'}`;
    setActiveMovingAxis(axisLabel);

    if (motionMode === 'JOG') {
      applyCartesianDelta(axis, delta);
    } else {
      const stepFraction = isLinear ? (cartesianStep * 0.2) : (unitStep * 0.2);
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
    if (chassisMode === 'AUTO') {
      showToast('自动调度接管中：请在顶部状态栏切换为 [手动模式] 后再执行机械臂复位');
      return;
    }
    setJointAngles([0, 0, 90, 0, -90, 0]);
    setCartesianPos({ x: 400.0, y: 0.0, z: 350.0, rx: 180.0, ry: 0.0, rz: 0.0 });
    showToast(`已执行 [${currentRobot.name}] 机械臂复位点：关节角回到安全抬升位`);
  };

  // 2. 【机器人复位点】 (Robot Home Reset / Chassis Zero)
  const handleRobotHomeReset = () => {
    if (chassisMode === 'AUTO') {
      showToast('自动调度接管中：请在顶部状态栏切换为 [手动模式] 后再执行机器人复位');
      return;
    }
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
    if (chassisMode === 'AUTO') {
      showToast('自动调度接管中：请在顶部状态栏切换为 [手动模式] 后再执行夹具定位');
      return;
    }
    setCartesianPos({ x: 510.0, y: 120.0, z: 185.0, rx: 180.0, ry: 0.0, rz: 0.0 });
    setJointAngles([12.4, -25.0, 78.2, 0.0, -53.2, 12.0]);
    showToast(`已执行 [${currentRobot.name}] 夹具定位点：末端平行夹爪回到治具标定基准位`);
  };

  const handleTriggerGripperWithSafety = (targetAction: 'OPEN' | 'CLOSE') => {
    if (chassisMode === 'AUTO') {
      showToast('自动调度接管中：请在顶部状态栏切换为 [手动模式] 后再操作夹爪');
      return;
    }
    if (targetAction === 'OPEN') {
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

  return (
    <div className="h-full flex-1 bg-slate-100/90 text-slate-900 flex flex-col justify-between p-3 sm:p-4 gap-2.5 select-none font-sans overflow-hidden min-h-0 relative">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl border border-slate-700 text-xs font-mono font-bold animate-fade-in flex items-center gap-2">
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Top Header Bar & Recovery Points (Unified Clean Ribbon) */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl px-4 py-2.5 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0">
        {/* Left: Home Button + Title: 当前机器人(例如 M-01) 复合机器人控制 + 实时电量 */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start flex-wrap">
          <button
            onClick={onBackToHome || onNavigateBackToL3}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
            title="返回首页 (测厚机列表)"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span>首页</span>
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>{selectedRobotType === 'LOADING' ? 'M-01' : 'M-02'} 复合机器人控制</span>
            </h1>

            {/* 机器人实时电量显示 (与机器人关联在一块) */}
            <div
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shadow-2xs"
              title={`当前${selectedRobotType === 'LOADING' ? 'M-01' : 'M-02'}实时电池剩余电量：${currentRobot.batteryPct}%`}
            >
              <Battery className={`w-4 h-4 ${
                currentRobot.batteryPct <= 20
                  ? 'text-red-600'
                  : currentRobot.batteryPct <= 50
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`} />
              <span className="text-slate-500 font-sans text-xs">电量:</span>
              <span className={`font-mono font-black ${
                currentRobot.batteryPct <= 20
                  ? 'text-red-600'
                  : currentRobot.batteryPct <= 50
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}>
                {currentRobot.batteryPct}%
              </span>
              <div className="w-7 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300/80 hidden sm:block">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentRobot.batteryPct <= 20
                      ? 'bg-red-500'
                      : currentRobot.batteryPct <= 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(Math.max(currentRobot.batteryPct, 5), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: 3 Recovery Points + Robot Status */}
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

          {/* 机器人状态 (加在 3.夹具定位点 后面) */}
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shadow-2xs">
            <span className="text-slate-500 font-sans">{selectedRobotType === 'LOADING' ? 'M-01' : 'M-02'} 状态:</span>
            {(() => {
              const isWorking = currentRobot.status === 'NAVIGATING' || currentRobot.status === 'PICKING' || currentRobot.status === 'PLACING';
              const isErr = currentRobot.status === 'ERROR';
              const label = isWorking ? '工作中' : isErr ? '异常告警' : '待命就绪';
              const colorClass = isWorking ? 'text-blue-700' : isErr ? 'text-red-700' : 'text-emerald-700';
              const dotClass = isWorking ? 'bg-blue-600 animate-pulse' : isErr ? 'bg-red-500' : 'bg-emerald-500';

              return (
                <span className={`flex items-center gap-1 font-mono ${colorClass}`}>
                  <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                  {label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Right: 保留当前机器人的独立急停按钮 (有且仅在测厚机工作中时可用，非工作中灰度不可按) */}
        <div className="flex items-center gap-2 shrink-0">
          {(() => {
            const isRunning = station.status === 'RUNNING';
            const isCurrentEstop = selectedRobotType === 'LOADING' ? m01Estop : m02Estop;
            const currentEstopHandler = selectedRobotType === 'LOADING' ? onTriggerEstopM01 : onTriggerEstopM02;
            const robotLabel = selectedRobotType === 'LOADING' ? 'M-01' : 'M-02';

            return (
              <button
                disabled={!isRunning}
                onClick={isRunning ? currentEstopHandler : undefined}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 transition-all shadow-xs flex items-center gap-1.5 ${
                  isRunning
                    ? `cursor-pointer active:scale-95 ${
                        isCurrentEstop
                          ? 'bg-red-700 hover:bg-red-800 text-white border-red-900 animate-pulse ring-2 ring-red-300'
                          : 'bg-red-600 hover:bg-red-700 text-white border-red-800'
                      }`
                    : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                }`}
                title={
                  isRunning
                    ? `${robotLabel} 独立急停`
                    : '测厚机未在工作状态，急停不可用'
                }
              >
                <AlertOctagon className="w-4 h-4" />
                <span>{isCurrentEstop ? `${robotLabel}已急停` : `${robotLabel}急停`}</span>
              </button>
            );
          })()}
        </div>
      </div>

      {/* Main Content Grid: Chassis, Arm, Gripper & Safety (All 3 columns equal height with aligned bottoms) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        {/* 1. 底盘控制区 - Left Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-300 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xs min-h-0 overflow-y-auto">
          <div className="space-y-2">
            {/* Header: Title + 重定位 + 清错 */}
            <div className="border-b-2 border-slate-200 pb-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Move className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                <h2 className="text-sm sm:text-base font-black text-slate-800">底盘控制与定位</h2>
              </div>

              {/* 重定位 & 清错 */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setChassisPose((p) => ({ ...p, confidence: 100.0, lidarStatus: 'NORMAL' }));
                    showToast(`已下发 [${selectedRobotType === 'LOADING' ? 'M-01' : 'M-02'} 底盘] 激光雷达全局重定位完成`);
                  }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg border border-blue-300 shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="触发激光雷达SLAM全局特征重定位"
                >
                  <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                  <span>重定位</span>
                </button>
                <button
                  onClick={() => {
                    showToast(`已清除 [${selectedRobotType === 'LOADING' ? 'M-01' : 'M-02'} 底盘] 报警与防撞雷达异常状态`);
                  }}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 font-bold text-xs rounded-lg border border-amber-300 shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="清除底盘驱动与防撞雷达异常状态"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>清错</span>
                </button>
              </div>
            </div>

            {/* 实时位置与定位信息 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs space-y-1.5 shrink-0 shadow-2xs">
              <div className="flex items-center justify-between text-slate-700 font-sans text-xs border-b border-slate-200 pb-1 font-bold">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold">激光雷达 SLAM:</span>
                </span>
                <span className="text-emerald-700 font-black font-mono text-xs">置信度 {chassisPose.confidence}%</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
                <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-sans font-bold leading-tight">X 坐标</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{chassisPose.x.toFixed(2)} m</span>
                </div>
                <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-sans font-bold leading-tight">Y 坐标</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{chassisPose.y.toFixed(2)} m</span>
                </div>
                <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-sans font-bold leading-tight">航向角 θ</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-700 leading-tight">{chassisPose.theta.toFixed(1)}°</span>
                </div>
              </div>
            </div>

            {/* D-Pad Virtual Joystick */}
            <div className="relative bg-slate-50 border-2 border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center gap-2 w-full shrink-0 shadow-2xs">
              {chassisMode === 'AUTO' && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-xl z-10 flex flex-col items-center justify-center text-white text-center p-2">
                  <Lock className="w-5 h-5 text-emerald-400 mb-0.5" />
                  <span className="text-xs font-bold">自动调度接管中</span>
                  <span className="text-[10px] text-slate-200">请在顶部状态栏切换为手动模式以使用手柄</span>
                </div>
              )}

              {/* Up - 前进 (适当放宽宽度) */}
              <button
                onMouseDown={() => handleChassisMove('FORWARD')}
                onMouseUp={handleChassisStop}
                onTouchStart={() => handleChassisMove('FORWARD')}
                onTouchEnd={handleChassisStop}
                className="w-36 sm:w-40 h-9.5 sm:h-10 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-[11px] leading-none">▲</span>
                <span className="text-xs sm:text-[13px] font-bold leading-none mt-0.5">前进</span>
              </button>

              {/* Left - Right (保留左转和右转，中间停止按钮已去掉) */}
              <div className="flex items-center justify-center gap-6 w-full max-w-sm px-1">
                <button
                  onMouseDown={() => handleChassisMove('LEFT')}
                  onMouseUp={handleChassisStop}
                  onTouchStart={() => handleChassisMove('LEFT')}
                  onTouchEnd={handleChassisStop}
                  className="w-32 sm:w-36 h-9.5 sm:h-10 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-[11px] leading-none">◀</span>
                  <span className="text-xs sm:text-[13px] font-bold leading-none mt-0.5">左转</span>
                </button>

                <button
                  onMouseDown={() => handleChassisMove('RIGHT')}
                  onMouseUp={handleChassisStop}
                  onTouchStart={() => handleChassisMove('RIGHT')}
                  onTouchEnd={handleChassisStop}
                  className="w-32 sm:w-36 h-9.5 sm:h-10 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-[11px] leading-none">▶</span>
                  <span className="text-xs sm:text-[13px] font-bold leading-none mt-0.5">右转</span>
                </button>
              </div>

              {/* Down - 后退 (适当放宽宽度) */}
              <button
                onMouseDown={() => handleChassisMove('BACKWARD')}
                onMouseUp={handleChassisStop}
                onTouchStart={() => handleChassisMove('BACKWARD')}
                onTouchEnd={handleChassisStop}
                className="w-36 sm:w-40 h-9.5 sm:h-10 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-[11px] leading-none">▼</span>
                <span className="text-xs sm:text-[13px] font-bold leading-none mt-0.5">后退</span>
              </button>
            </div>

            {/* Speed Slider (Inline Single Row) - 最大 0.5m/s */}
            <div className="flex items-center gap-2.5 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">线速度设定:</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="font-mono text-blue-700 font-black text-xs sm:text-sm shrink-0 min-w-[3.5rem] text-right">{speed.toFixed(2)} m/s</span>
            </div>
          </div>
        </div>

        {/* 2. 机械臂控制区 - Center Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-300 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xs min-h-0 overflow-y-auto">
          <div className="space-y-2.5">
            {/* 顶部标题栏：六轴机械臂控制 + (Home位 / 清错 / 使能 / 臂状态) 协调平铺 */}
            <div className="border-b-2 border-slate-200 pb-2 flex items-center justify-between gap-1.5 shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <Sliders className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                <h2 className="text-sm sm:text-base font-black text-slate-800 shrink-0">六轴机械臂控制</h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {/* 1. Home位 (精简紧凑) */}
                <button
                  onClick={handleArmHomeReset}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title="机械臂抬升回到Home原点位"
                >
                  <Home className="w-3 h-3 text-blue-600" />
                  <span>Home位</span>
                </button>

                {/* 2. 清错 */}
                <button
                  onClick={() => {
                    if (armState === 'COLLISION' || armState === 'ESTOP') {
                      setArmState('POWERED');
                    }
                    showToast(`已清除 [${selectedRobotType === 'LOADING' ? 'M-01' : 'M-02'}] 机械臂关节伺服与碰撞报警`);
                  }}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 font-bold text-xs rounded-lg border border-amber-300 shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title="清除机械臂伺服轴与碰撞报警"
                >
                  <RotateCcw className="w-3 h-3 text-amber-600" />
                  <span>清错</span>
                </button>

                {/* 3. 使能 */}
                <button
                  onClick={() => {
                    if (armState === 'POWERED') {
                      setArmState('UNPOWERED');
                      showToast('机械臂伺服已去使能（断电停力，状态：未上电）');
                    } else {
                      setArmState('POWERED');
                      showToast('机械臂伺服已重新使能上电！（状态：已上电）');
                    }
                  }}
                  className={`px-2 py-1 font-bold text-xs rounded-lg border shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                    armState === 'POWERED'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="切换机械臂伺服使能状态"
                >
                  <Power className="w-3 h-3" />
                  <span>使能</span>
                </button>

                {/* 4. 臂状态: 未上电 / 已上电 / 急停 / 碰撞 */}
                {(() => {
                  const isCurrentEstop = selectedRobotType === 'LOADING' ? m01Estop : m02Estop;
                  const currentEffectiveState = isCurrentEstop ? 'ESTOP' : armState;

                  let label = '已上电';
                  let colorClass = 'text-emerald-700';
                  let dotClass = 'bg-emerald-500';

                  if (currentEffectiveState === 'UNPOWERED') {
                    label = '未上电';
                    colorClass = 'text-slate-500';
                    dotClass = 'bg-slate-400';
                  } else if (currentEffectiveState === 'POWERED') {
                    label = '已上电';
                    colorClass = 'text-emerald-700';
                    dotClass = 'bg-emerald-500';
                  } else if (currentEffectiveState === 'ESTOP') {
                    label = '急停';
                    colorClass = 'text-red-700 font-black';
                    dotClass = 'bg-red-600 animate-ping';
                  } else if (currentEffectiveState === 'COLLISION') {
                    label = '碰撞';
                    colorClass = 'text-amber-700 font-black';
                    dotClass = 'bg-amber-600 animate-pulse';
                  }

                  return (
                    <div className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <span className="text-slate-500 font-sans text-xs">臂状态:</span>
                      <span className={`flex items-center gap-1 text-xs ${colorClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                        {label}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 机械臂手动控制交互区（空间坐标、模式、步长、各轴加减） */}
            <div className="relative space-y-2">
              {chassisMode === 'AUTO' && (
                <div className="absolute -inset-1 bg-slate-900/40 backdrop-blur-[2px] rounded-xl z-20 flex flex-col items-center justify-center text-white text-center p-3">
                  <Lock className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-xs sm:text-sm font-black">自动调度接管中</span>
                  <span className="text-[11px] text-slate-200 mt-0.5">请在顶部状态栏切换为手动模式以进行机械臂手动控制</span>
                </div>
              )}

              {/* 第四点：空间坐标系下移一层，单独成行 */}
              <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
                <span className="text-xs text-slate-700 pl-2">空间坐标:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setArmControlMode('CARTESIAN')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      armControlMode === 'CARTESIAN'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>笛卡尔 (XYZ)</span>
                  </button>
                  <button
                    onClick={() => setArmControlMode('JOINT')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      armControlMode === 'JOINT'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>关节 (J1~J6)</span>
                  </button>
                </div>
              </div>

              {/* 第三点：模式、步长与控制卡片往下移动，紧凑贴合 */}
              <div className="space-y-2 pt-0.5">
                {/* Mode & Step Selector */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {/* 点动 vs 连续切换 */}
                  <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-xs text-slate-700 pl-1">模式:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMotionMode('JOG')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          motionMode === 'JOG'
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        点动
                      </button>
                      <button
                        onClick={() => setMotionMode('CONTINUOUS')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          motionMode === 'CONTINUOUS'
                            ? 'bg-amber-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        连续长按
                      </button>
                    </div>
                  </div>

                  {/* 3 Speeds / Step */}
                  <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-xs text-slate-700 pl-1">
                      {armControlMode === 'CARTESIAN' ? '步长:' : '角度:'}
                    </span>
                    <div className="flex items-center gap-1">
                      {armControlMode === 'CARTESIAN' ? (
                        <>
                          <button
                            onClick={() => setCartesianStep(1)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              cartesianStep === 1
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            1mm
                          </button>
                          <button
                            onClick={() => setCartesianStep(5)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              cartesianStep === 5
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            5mm
                          </button>
                          <button
                            onClick={() => setCartesianStep(10)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              cartesianStep === 10
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            10mm
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setJointStep(0.5)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              jointStep === 0.5
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            0.5°
                          </button>
                          <button
                            onClick={() => setJointStep(1)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              jointStep === 1
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            1°
                          </button>
                          <button
                            onClick={() => setJointStep(5)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              jointStep === 5
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            5°
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mode 1: 笛卡尔空间控制 (X/Rx, Y/Ry, Z/Rz 2列3行统一结构排布，与关节模式尺寸样式完全一致) */}
                {armControlMode === 'CARTESIAN' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { axis: 'x' as const, name: 'X 轴', unit: 'mm', value: cartesianPos.x },
                      { axis: 'rx' as const, name: 'Rx 姿态', unit: '°', value: cartesianPos.rx },
                      { axis: 'y' as const, name: 'Y 轴', unit: 'mm', value: cartesianPos.y },
                      { axis: 'ry' as const, name: 'Ry 姿态', unit: '°', value: cartesianPos.ry },
                      { axis: 'z' as const, name: 'Z 轴', unit: 'mm', value: cartesianPos.z },
                      { axis: 'rz' as const, name: 'Rz 姿态', unit: '°', value: cartesianPos.rz },
                    ].map((item) => (
                      <div
                        key={item.axis}
                        className="bg-slate-50 border-2 border-slate-200 p-2 rounded-xl flex items-center justify-between text-xs shadow-2xs gap-1.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold font-mono text-slate-800 text-xs shrink-0">
                            {item.name}
                          </span>
                          <span className="font-mono font-black text-blue-700 text-xs sm:text-sm">
                            {item.value.toFixed(1)}{item.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onMouseDown={() => handleCartesianStart(item.axis, -1)}
                            onMouseUp={handleMotionEnd}
                            onTouchStart={() => handleCartesianStart(item.axis, -1)}
                            onTouchEnd={handleMotionEnd}
                            className="w-8 h-8 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                          >
                            -
                          </button>
                          <button
                            onMouseDown={() => handleCartesianStart(item.axis, 1)}
                            onMouseUp={handleMotionEnd}
                            onTouchStart={() => handleCartesianStart(item.axis, 1)}
                            onTouchEnd={handleMotionEnd}
                            className="w-8 h-8 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mode 2: 关节空间控制 (J1 ~ J6 2列3行紧凑排布: J1+J2, J3+J4, J5+J6) */}
                {armControlMode === 'JOINT' && (
                  <div className="grid grid-cols-2 gap-2">
                    {jointAngles.map((angle, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border-2 border-slate-200 p-2 rounded-xl flex items-center justify-between text-xs shadow-2xs gap-1.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold font-mono text-slate-800 text-xs shrink-0">
                            J{idx + 1} 关节
                          </span>
                          <span className="font-mono font-black text-blue-700 text-xs sm:text-sm">
                            {angle.toFixed(1)}°
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onMouseDown={() => handleJointStart(idx, -1)}
                            onMouseUp={handleMotionEnd}
                            onTouchStart={() => handleJointStart(idx, -1)}
                            onTouchEnd={handleMotionEnd}
                            className="w-8 h-8 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                          >
                            -
                          </button>
                          <button
                            onMouseDown={() => handleJointStart(idx, 1)}
                            onMouseUp={handleMotionEnd}
                            onTouchStart={() => handleJointStart(idx, 1)}
                            onTouchEnd={handleMotionEnd}
                            className="w-8 h-8 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. 夹具控制区、二维码视觉相机 & 错误告警区 - Right Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-300 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xs min-h-0 overflow-y-auto">
          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
            {/* Top section: Gripper, Tabs, QR Studio */}
            <div className="space-y-2.5">
              {/* 夹具动作控制 */}
              <div>
                <div className="border-b border-slate-200 pb-1.5 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <HandMetal className="w-4.5 h-4.5 text-emerald-600" />
                    <h2 className="text-sm sm:text-base font-black text-slate-800">夹具控制</h2>
                  </div>
                </div>

                <div className="relative grid grid-cols-2 gap-2">
                  {chassisMode === 'AUTO' && (
                    <div className="absolute -inset-0.5 bg-slate-900/40 backdrop-blur-[2px] rounded-xl z-20 flex flex-col items-center justify-center text-white text-center p-2">
                      <Lock className="w-4 h-4 text-emerald-400 mb-0.5" />
                      <span className="text-xs font-black">自动调度接管中</span>
                      <span className="text-[10px] text-slate-200">请在顶部状态栏切换为手动模式以操作夹爪</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleTriggerGripperWithSafety('OPEN')}
                    className={`py-2.5 px-2.5 rounded-xl text-xs sm:text-[13px] font-black border shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isGripperOpen
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300'
                        : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                    title="打开末端夹爪（执行前弹出防掉板安全联锁提示）"
                  >
                    <HandMetal className="w-4 h-4 text-amber-600" />
                    <span>夹爪打开</span>
                  </button>

                  <button
                    onClick={() => handleTriggerGripperWithSafety('CLOSE')}
                    className={`py-2.5 px-2.5 rounded-xl text-xs sm:text-[13px] font-black border shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      !isGripperOpen
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 ring-2 ring-blue-300'
                        : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                    title="闭合末端夹爪夹紧工件"
                  >
                    <HandMetal className="w-4 h-4 text-blue-600" />
                    <span>夹爪闭合</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
