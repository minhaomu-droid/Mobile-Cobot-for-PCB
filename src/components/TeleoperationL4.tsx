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
  Check
} from 'lucide-react';
import { ThicknessStation, AMRRobotState } from '../types';

interface TeleoperationL4Props {
  station: ThicknessStation;
  selectedRobotType: 'LOADING' | 'UNLOADING';
  onSelectRobotType: (type: 'LOADING' | 'UNLOADING') => void;
  onNavigateBackToL3: () => void;
  pokaYokeHoldSeconds: number;
  onRequestGripperSafetyConfirm?: (action: 'OPEN' | 'CLOSE') => void;
  onNavigateToBlockly?: () => void;
  onLogout?: () => void;
}

export const TeleoperationL4: React.FC<TeleoperationL4Props> = ({
  station,
  selectedRobotType,
  onSelectRobotType,
  onNavigateBackToL3,
  onRequestGripperSafetyConfirm,
  onLogout,
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

  // Gripper & Suction state
  const [isSuctionOn, setIsSuctionOn] = useState<boolean>(true);
  const [vacuumVal, setVacuumVal] = useState<number>(currentRobot.vacuumPressure || -85);
  const [isGripperOpen, setIsGripperOpen] = useState<boolean>(false);
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
    showToast(`已执行 [${currentRobot.name}] 夹具定位点：末端吸盘/夹爪回到治具标定基准位`);
  };

  // Safe Gripper & Suction Triggers
  const handleTriggerSuctionWithSafety = () => {
    if (isSuctionOn) {
      if (onRequestGripperSafetyConfirm) {
        onRequestGripperSafetyConfirm('OPEN');
      } else {
        setIsSuctionOn(false);
        setVacuumVal(0);
        showToast('已破气释放吸盘');
      }
    } else {
      setIsSuctionOn(true);
      setVacuumVal(-85);
      showToast('已开启抽真空吸附 (-85 kPa)');
    }
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between select-none font-sans relative">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl border border-slate-700 text-xs font-mono font-bold animate-fade-in flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white border-b-2 border-slate-300 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        {/* Left: [返回] */}
        <button
          onClick={onNavigateBackToL3}
          className="px-4 py-2 bg-[#5bc0de] hover:bg-[#31b0d5] text-white text-xs font-bold rounded-xl border border-[#46b8da] shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回站控界面</span>
        </button>

        {/* Center: Title & Robot Switcher */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-wide">
              复合机器人控制与异常恢复
            </h1>
            <p className="text-[10px] font-mono text-blue-600 font-bold">
              当前控制: {currentRobot.name} (IP: {currentRobot.ipAddress} • 电量: {currentRobot.batteryPct}%)
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 ml-2">
            <button
              onClick={() => onSelectRobotType('LOADING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRobotType === 'LOADING'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              M-01 上料复合机器人
            </button>
            <button
              onClick={() => onSelectRobotType('UNLOADING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRobotType === 'UNLOADING'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              M-02 下料复合机器人
            </button>
          </div>
        </div>

        {/* Right: [退出登录] */}
        <button
          onClick={onLogout || onNavigateBackToL3}
          className="px-4 py-2 bg-[#5bc0de] hover:bg-[#31b0d5] text-white text-xs font-bold rounded-xl border border-[#46b8da] shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </header>

      {/* 核心异常状态恢复工具栏 (三大复位功能按钮：机械臂复位点、机器人复位点、夹具定位点) */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3 shrink-0">
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-600">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800">异常状态恢复基准点</span>
              <span className="text-[10px] text-slate-500 block font-mono">
                用于设备报警脱困、原点丢失校准或治具对齐
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
            {/* 1. 机械臂复位点 */}
            <button
              onClick={handleArmHomeReset}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-300 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="机械臂关节抬升回到安全预备原点 [0, 0, 90, 0, -90, 0]"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>1. 机械臂复位点</span>
            </button>

            {/* 2. 机器人复位点 */}
            <button
              onClick={handleRobotHomeReset}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-300 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="底盘与整机系统原点零位校准 (0,0,0)"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. 机器人复位点</span>
            </button>

            {/* 3. 夹具定位点 */}
            <button
              onClick={handleGripperCalibrationPoint}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-300 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="末端气动吸盘/夹爪回到治具标定基准位"
            >
              <HandMetal className="w-3.5 h-3.5 text-amber-600" />
              <span>3. 夹具定位点</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Chassis, Arm, Alarms */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* 1. 底盘控制区 (显示位置与定位信息，支持手动与自动模式切换) - Left Column */}
          <div className="lg:col-span-4 bg-white border-2 border-slate-300 rounded-3xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              {/* Header: Mode Switcher (手动模式 vs 自动模式) */}
              <div className="border-b-2 border-slate-200 pb-2.5 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-black text-slate-800">底盘控制与定位</h2>
                </div>

                {/* Manual vs Auto Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => {
                      setChassisMode('MANUAL');
                      showToast('已切换至 [手动模式]：底盘遥控手柄已解锁');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
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
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
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

              {/* 实时位置与定位信息 (Position & SLAM Localization Card) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 font-sans text-[11px] border-b border-slate-200 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-blue-600" />
                    <span>360° 激光雷达 SLAM 状态:</span>
                  </span>
                  <span className="text-emerald-700 font-bold font-mono">极佳 (置信度 {chassisPose.confidence}%)</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-400 block font-sans">X 坐标</span>
                    <span className="text-xs font-black text-slate-900">{chassisPose.x.toFixed(2)} m</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-400 block font-sans">Y 坐标</span>
                    <span className="text-xs font-black text-slate-900">{chassisPose.y.toFixed(2)} m</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-400 block font-sans">航向角 θ</span>
                    <span className="text-xs font-black text-indigo-700">{chassisPose.theta.toFixed(1)}°</span>
                  </div>
                </div>
              </div>

              {/* D-Pad Virtual Joystick (Disabled/Overlay in Auto Mode) */}
              <div className="relative bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 mb-3">
                {chassisMode === 'AUTO' && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-2xl z-10 flex flex-col items-center justify-center text-white text-center p-3">
                    <Lock className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-xs font-bold">自动调度接管中</span>
                    <span className="text-[10px] text-slate-200 mt-0.5">请切换为手动模式以使用虚拟手柄</span>
                  </div>
                )}

                {/* Up */}
                <button
                  onMouseDown={() => handleChassisMove('FORWARD')}
                  onMouseUp={handleChassisStop}
                  onTouchStart={() => handleChassisMove('FORWARD')}
                  onTouchEnd={handleChassisStop}
                  className="w-16 h-13 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-sm rounded-2xl border border-[#46b8da] shadow-md flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span>▲</span>
                  <span className="text-[9px]">前进</span>
                </button>

                {/* Left - Stop - Right */}
                <div className="flex items-center gap-2">
                  <button
                    onMouseDown={() => handleChassisMove('LEFT')}
                    onMouseUp={handleChassisStop}
                    onTouchStart={() => handleChassisMove('LEFT')}
                    onTouchEnd={handleChassisStop}
                    className="w-16 h-13 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-sm rounded-2xl border border-[#46b8da] shadow-md flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    <span>◀</span>
                    <span className="text-[9px]">左转/移</span>
                  </button>

                  <button
                    onClick={handleChassisStop}
                    className="w-16 h-13 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-2xl border border-red-400 shadow-md flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    <span>●</span>
                    <span>停止</span>
                  </button>

                  <button
                    onMouseDown={() => handleChassisMove('RIGHT')}
                    onMouseUp={handleChassisStop}
                    onTouchStart={() => handleChassisMove('RIGHT')}
                    onTouchEnd={handleChassisStop}
                    className="w-16 h-13 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-sm rounded-2xl border border-[#46b8da] shadow-md flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    <span>▶</span>
                    <span className="text-[9px]">右转/移</span>
                  </button>
                </div>

                {/* Down */}
                <button
                  onMouseDown={() => handleChassisMove('BACKWARD')}
                  onMouseUp={handleChassisStop}
                  onTouchStart={() => handleChassisMove('BACKWARD')}
                  onTouchEnd={handleChassisStop}
                  className="w-16 h-13 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-sm rounded-2xl border border-[#46b8da] shadow-md flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span>▼</span>
                  <span className="text-[9px]">后退</span>
                </button>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">线速度设定:</span>
                  <span className="font-mono font-bold text-blue-700">{speed} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 2. 机械臂控制区 (笛卡尔 & 关节空间 + 点动/连续模式 + 1mm/5mm/10mm) - Center Column */}
          <div className="lg:col-span-5 bg-white border-2 border-slate-300 rounded-3xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="border-b-2 border-slate-200 pb-2.5 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-black text-slate-800">六轴机械臂遥控</h2>
                </div>
                {activeMovingAxis && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md animate-pulse border border-amber-200">
                    ● 正在连续运动
                  </span>
                )}
              </div>

              {/* Coordinate Selector & Mode Selector */}
              <div className="space-y-2.5 mb-3">
                <div className="flex items-center justify-between gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <span className="text-[11px] text-slate-500 font-medium pl-2">空间坐标:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setArmControlMode('CARTESIAN')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        armControlMode === 'CARTESIAN'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>笛卡尔 (XYZ)</span>
                    </button>
                    <button
                      onClick={() => setArmControlMode('JOINT')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        armControlMode === 'JOINT'
                          ? 'bg-indigo-600 text-white shadow-sm'
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
                    <span className="text-[11px] text-slate-500 font-medium pl-2">模式:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMotionMode('JOG')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          motionMode === 'JOG'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        点动
                      </button>
                      <button
                        onClick={() => setMotionMode('CONTINUOUS')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          motionMode === 'CONTINUOUS'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        连续长按
                      </button>
                    </div>
                  </div>

                  {/* 3 Speeds */}
                  <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium pl-1.5">
                      {armControlMode === 'CARTESIAN' ? '步长:' : '角度:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setStepSize(1)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          stepSize === 1
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {armControlMode === 'CARTESIAN' ? '1mm' : '1°'}
                      </button>
                      <button
                        onClick={() => setStepSize(5)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          stepSize === 5
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {armControlMode === 'CARTESIAN' ? '5mm' : '5°'}
                      </button>
                      <button
                        onClick={() => setStepSize(10)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          stepSize === 10
                            ? 'bg-blue-600 text-white shadow-sm'
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
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map((axis) => {
                      const axisName = axis === 'x' ? 'X (前后)' : axis === 'y' ? 'Y (左右)' : 'Z (上下)';
                      return (
                        <div
                          key={axis}
                          className="bg-slate-50 border border-slate-200 p-2 rounded-xl flex flex-col justify-between items-center text-xs"
                        >
                          <span className="font-bold text-[10px] text-slate-600">{axisName}</span>
                          <span className="font-mono font-black text-blue-700 text-xs my-0.5">
                            {cartesianPos[axis].toFixed(1)} <span className="text-[9px] font-normal text-slate-400">mm</span>
                          </span>

                          <div className="flex items-center gap-1.5 w-full justify-center pt-1">
                            <button
                              onMouseDown={() => handleCartesianStart(axis, -1)}
                              onMouseUp={handleMotionEnd}
                              onTouchStart={() => handleCartesianStart(axis, -1)}
                              onTouchEnd={handleMotionEnd}
                              className="flex-1 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <button
                              onMouseDown={() => handleCartesianStart(axis, 1)}
                              onMouseUp={handleMotionEnd}
                              onTouchStart={() => handleCartesianStart(axis, 1)}
                              onTouchEnd={handleMotionEnd}
                              className="flex-1 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['rx', 'ry', 'rz'] as const).map((axis) => {
                      const axisName = axis === 'rx' ? 'Rx (翻滚)' : axis === 'ry' ? 'Ry (俯仰)' : 'Rz (偏航)';
                      return (
                        <div
                          key={axis}
                          className="bg-slate-50 border border-slate-200 p-2 rounded-xl flex flex-col justify-between items-center text-xs"
                        >
                          <span className="font-bold text-[10px] text-slate-600">{axisName}</span>
                          <span className="font-mono font-black text-indigo-700 text-xs my-0.5">
                            {cartesianPos[axis].toFixed(1)} <span className="text-[9px] font-normal text-slate-400">°</span>
                          </span>

                          <div className="flex items-center gap-1.5 w-full justify-center pt-1">
                            <button
                              onMouseDown={() => handleCartesianStart(axis, -1)}
                              onMouseUp={handleMotionEnd}
                              onTouchStart={() => handleCartesianStart(axis, -1)}
                              onTouchEnd={handleMotionEnd}
                              className="flex-1 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <button
                              onMouseDown={() => handleCartesianStart(axis, 1)}
                              onMouseUp={handleMotionEnd}
                              onTouchStart={() => handleCartesianStart(axis, 1)}
                              onTouchEnd={handleMotionEnd}
                              className="flex-1 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs"
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
                <div className="space-y-1.5">
                  {jointAngles.map((angle, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs"
                    >
                      <span className="font-bold font-mono text-slate-700 w-16">
                        J{idx + 1} 关节
                      </span>
                      <span className="font-mono font-bold text-blue-700 w-20 text-center">
                        {angle.toFixed(1)}°
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onMouseDown={() => handleJointStart(idx, -1)}
                          onMouseUp={handleMotionEnd}
                          onTouchStart={() => handleJointStart(idx, -1)}
                          onTouchEnd={handleMotionEnd}
                          className="w-10 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          onMouseDown={() => handleJointStart(idx, 1)}
                          onMouseUp={handleMotionEnd}
                          onTouchStart={() => handleJointStart(idx, 1)}
                          onTouchEnd={handleMotionEnd}
                          className="w-10 h-7 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black rounded-lg border border-[#46b8da] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer"
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

          {/* 4. 错误告警区 & [清错] 按键 - Right Column */}
          <div className="lg:col-span-3 bg-white border-2 border-slate-300 rounded-3xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="border-b-2 border-slate-200 pb-2.5 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${robotError ? 'text-red-600' : 'text-slate-400'}`} />
                  <h2 className="text-sm font-black text-slate-800">错误告警与安全使能</h2>
                </div>
              </div>

              {/* Alarm Description Display Box */}
              <div
                className={`border-2 rounded-2xl p-3.5 text-xs font-mono min-h-[140px] flex flex-col justify-between ${
                  robotError
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold mb-1.5">
                    {robotError ? (
                      <span className="text-red-700">● 存在活动设备告警</span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        状态正常，安全回路使能
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {robotError || '复合机器人伺服回路闭合完好，激光导航雷达通信正常，气动吸附系统就绪。'}
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-1.5 mt-2">
                  当前工作状态: <strong className="text-slate-700">{robotStatusText}</strong>
                </div>
              </div>
            </div>

            {/* [清错] 按键 */}
            <div className="pt-3">
              <button
                onClick={handleClearError}
                className="w-full py-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-bold text-sm rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>一键清错与伺服复位</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. 夹具控制区 (包含打开/闭合功能与安全确认机制) - Bottom Full-Width Container */}
        <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 shadow-sm">
          <div className="border-b-2 border-slate-200 pb-2 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandMetal className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-black text-slate-800">夹具控制区 (带防掉板安全确认机制)</h2>
                <p className="text-[10px] text-slate-500 font-sans">
                  包含吸盘抽真空/破气、机械夹爪开合与防掉板安全联锁保护
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-600">
                吸盘真空度: <strong className="text-blue-700">{vacuumVal} kPa</strong>
              </span>
              <span className={`px-2 py-0.5 rounded-md font-bold ${
                isGripperOpen ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                夹爪: {isGripperOpen ? '已打开' : '已闭合'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. 夹具/吸盘破气打开 (含安全防呆确认) */}
            <button
              onClick={handleTriggerSuctionWithSafety}
              className={`py-3 px-3 rounded-2xl text-xs font-bold border shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isSuctionOn
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isSuctionOn ? '吸盘吸气中 (点击安全破气)' : '吸盘已破气释放'}</span>
            </button>

            {/* 2. 夹爪打开/闭合 (含安全确认) */}
            <button
              onClick={handleTriggerGripperWithSafety}
              className={`py-3 px-3 rounded-2xl text-xs font-bold border shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isGripperOpen
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <HandMetal className="w-4 h-4" />
              <span>{isGripperOpen ? '夹爪已打开 (点击闭合)' : '夹爪闭合中 (点击安全打开)'}</span>
            </button>

            {/* 3. 安全脱料放板 (联锁放板) */}
            <button
              onClick={() => {
                if (onRequestGripperSafetyConfirm) {
                  onRequestGripperSafetyConfirm('OPEN');
                } else {
                  setIsSuctionOn(false);
                  setIsGripperOpen(true);
                  setVacuumVal(0);
                  showToast('已完成：安全托台对齐脱料放板操作');
                }
              }}
              className="py-3 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] text-white rounded-2xl text-xs font-bold border border-[#46b8da] shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>安全卸载/脱料放板</span>
            </button>

            {/* 4. 伺服使能就绪 */}
            <button
              onClick={() => showToast('伺服使能回路正常，安全光幕与急停状态良好')}
              className="py-3 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-300 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Power className="w-4 h-4 text-emerald-600" />
              <span>伺服使能就绪</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2 text-center text-[10px] text-slate-500 font-mono">
        提示：已配备机械臂复位点、机器人复位点、夹具定位点三大恢复基准；底盘支持手动/自动模式切换；夹具操作配备防掉板安全联锁。
      </footer>
    </div>
  );
};
