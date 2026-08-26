import React, { useState } from 'react';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  LogOut,
  ArrowLeftRight,
  Cpu,
  Server,
  Activity,
  Layers,
  Sliders,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Compass,
  HandMetal,
  Move,
  Clock,
  Sparkles
} from 'lucide-react';
import { ThicknessStation, PanelState } from '../types';

interface StationControlL3Props {
  station: ThicknessStation;
  allStations: ThicknessStation[];
  onSelectStation: (stationId: string) => void;
  onNavigateToPanel: (panel: PanelState) => void;
  onSelectRobotForL4: (robotType: 'LOADING' | 'UNLOADING') => void;
  onOpenSafetyLockModal: () => void;
  onOpenRemainingBoardsModal: () => void;
  onTriggerTaskMode: (mode: 'RESUME' | 'RESTART') => void;
  onTriggerPause: () => void;
  onTriggerFirstArticle: () => void;
  onResetRobot: (robotName: string, resetType?: 'ARM' | 'ROBOT' | 'GRIPPER') => void;
  onSyncRMS: () => void;
  onBackToHome?: () => void;
  onLogout?: () => void;
}

export const StationControlL3: React.FC<StationControlL3Props> = ({
  station,
  allStations,
  onSelectStation,
  onNavigateToPanel,
  onSelectRobotForL4,
  onOpenSafetyLockModal,
  onOpenRemainingBoardsModal,
  onTriggerTaskMode,
  onTriggerPause,
  onTriggerFirstArticle,
  onResetRobot,
  onSyncRMS,
  onBackToHome,
  onLogout,
}) => {
  const loadingAMR = station.loadingAMR;
  const unloadingAMR = station.unloadingAMR;

  // Task Quantity Calculations
  const totalGoal = station.totalBoardsGoal || 150;
  const completed = station.passCount + station.failCount;
  const passCount = station.passCount;
  const failCount = station.failCount;
  const remainingCount = Math.max(0, totalGoal - completed);
  const yieldPct = completed > 0 ? ((passCount / completed) * 100).toFixed(1) : '100.0';
  const progressPct = Math.min(100, Math.round((completed / totalGoal) * 100));

  const getAMRStatusBadge = (status: string) => {
    switch (status) {
      case 'NAVIGATING':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold">导航对接中</span>;
      case 'PICKING':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">取料作业中</span>;
      case 'PLACING':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold">码垛放料中</span>;
      case 'ERROR':
        return <span className="bg-red-100 text-red-800 border border-red-300 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">故障异常</span>;
      case 'IDLE':
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold">待命就绪</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between select-none font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b-2 border-slate-300 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        {/* Left: [返回选择机台] */}
        <button
          onClick={onBackToHome || (() => onNavigateToPanel('HOME_STATION_LIST'))}
          className="px-4 py-2 bg-[#5bc0de] hover:bg-[#31b0d5] text-white text-xs font-bold rounded-xl border border-[#46b8da] shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回选择机台</span>
        </button>

        {/* Center: Title & Current Station Status */}
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-wide flex items-center justify-center gap-2">
            <span>{station.name}操作界面</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border ${
              station.status === 'RUNNING'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}>
              {station.status === 'RUNNING' ? '自动运行中' : '待机中'}
            </span>
          </h1>
          <p className="text-[10px] font-mono text-slate-500">
            复合机器人站控中枢 • MES/RMS 实时信息中转
          </p>
        </div>

        {/* Right: [退出登录] */}
        <button
          onClick={onLogout || (() => onNavigateToPanel('LOGIN'))}
          className="px-4 py-2 bg-[#5bc0de] hover:bg-[#31b0d5] text-white text-xs font-bold rounded-xl border border-[#46b8da] shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between gap-4">
        {/* 1. Station Quick-Switch Bar & MES/RMS Info Sync Header */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
          {/* Station Quick Switcher Pill Bar (1号机 ~ 8号机) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 shrink-0 mr-1">机台切换:</span>
            {allStations.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectStation(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  s.id === station.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* MES / RMS Metadata & Sync Button */}
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 text-slate-700">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>工单: <strong className="text-slate-900">{station.mesWorkOrder || 'WO-2026-0811A'}</strong></span>
              <span className="text-slate-300">•</span>
              <span>配方: <strong className="text-slate-900">{station.mesRecipeId || 'REC-FR4-1250'}</strong></span>
            </div>
            <button
              onClick={onSyncRMS}
              className="flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-300 text-[10px] font-bold cursor-pointer transition-all"
              title="一键同步至车间调度 RMS/MES 系统"
            >
              <RefreshCw className="w-3 h-3" />
              <span>同步RMS</span>
            </button>
          </div>
        </div>

        {/* 2. 任务数量管理与工作进度卡片 (Task Quantity Management) */}
        <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                  <span>任务数量与工作进度管理</span>
                  <span className="text-[10px] font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    批次: {station.currentLot}
                  </span>
                </h2>
                <p className="text-[10px] font-mono text-slate-500">
                  支持实时获取工作数量，支持继续任务与重新开始两种模式（含人工安全核对环节）
                </p>
              </div>
            </div>

            {/* Task Mode Action Buttons (继续任务 vs 重新开始任务) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onTriggerTaskMode('RESUME')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="继承当前批次已加工数量，人工安全核验后继续自动作业"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>继续任务 (断点续跑)</span>
              </button>

              <button
                onClick={() => onTriggerTaskMode('RESTART')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="重置当前批次计数，从第1片重新开始"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新开始任务</span>
              </button>

              <button
                onClick={onOpenRemainingBoardsModal}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="手动设定剩余板数参数"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>设定剩余板数</span>
              </button>
            </div>
          </div>

          {/* Real-time Work Quantities & Progress Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-sans block mb-0.5">目标计划总数</span>
              <div className="text-base sm:text-lg font-black text-slate-900">{totalGoal} <span className="text-[10px] text-slate-500 font-normal">片</span></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-sans block mb-0.5">已测完成数量</span>
              <div className="text-base sm:text-lg font-black text-blue-700">{completed} <span className="text-[10px] text-slate-500 font-normal">片</span></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-sans block mb-0.5">良品数量 (Pass)</span>
              <div className="text-base sm:text-lg font-black text-emerald-700">{passCount} <span className="text-[10px] text-slate-500 font-normal">片</span></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-sans block mb-0.5">不良品数 (NG)</span>
              <div className="text-base sm:text-lg font-black text-red-600">{failCount} <span className="text-[10px] text-slate-500 font-normal">片</span></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-sans block mb-0.5">合格良率 (Yield)</span>
              <div className="text-base sm:text-lg font-black text-indigo-700">{yieldPct}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-600">
              <span>当前进度: {completed} / {totalGoal} 片 (剩余 {remainingCount} 片)</span>
              <span className="font-bold text-slate-900">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Two Columns: Left (上料复合机器人) vs Right (下料复合机器人) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
          {/* Left Column: 上料复合机器人状态栏 */}
          <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
            <div className="space-y-3">
              {/* Card Header: 重点关注机器人运行状态、电量 */}
              <div className="border-b-2 border-slate-200 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-800">上料复合机器人</h2>
                    <p className="text-[10px] font-mono text-blue-600 font-bold">{loadingAMR.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getAMRStatusBadge(loadingAMR.status)}
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    电量 {loadingAMR.batteryPct}%
                  </span>
                </div>
              </div>

              {/* 核心工作状态与当前任务 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 font-mono text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans font-medium block text-[10px] mb-0.5">当前执行任务:</span>
                  <span className="text-slate-900 font-bold font-sans text-xs">{loadingAMR.currentTask}</span>
                </div>

                {/* 传感器与工单指标 (不重复Pad电量，专注设备数据) */}
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">名义厚度 (MES):</span>
                    <span className="text-xs font-black text-slate-900">{station.nominalThickness.toFixed(3)} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">实时测厚:</span>
                    <span className="text-xs font-black text-blue-700">{station.currentThickness.toFixed(3)} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">吸盘真空度:</span>
                    <span className="text-xs font-bold text-slate-800">{loadingAMR.vacuumPressure} kPa</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">移动线速度:</span>
                    <span className="text-xs font-bold text-slate-800">{loadingAMR.speed} m/s</span>
                  </div>
                </div>

                {/* 6-Axis Joint Angles Preview */}
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-sans mb-1 block">关节角度 (J1~J6):</span>
                  <div className="grid grid-cols-6 gap-1 text-[9px] text-center font-mono font-bold">
                    {loadingAMR.jointAngles.map((angle, i) => (
                      <div key={i} className="bg-slate-50 py-0.5 rounded text-blue-700 border border-slate-200">
                        {angle.toFixed(0)}°
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3대 复位按键与遥控入口 (异常状态恢复) */}
            <div className="space-y-2 pt-3">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onResetRobot(loadingAMR.name, 'ARM')}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="机械臂回到安全抬升原点姿态"
                >
                  <RotateCcw className="w-3 h-3 text-blue-600" />
                  <span>机械臂复位</span>
                </button>

                <button
                  onClick={() => onResetRobot(loadingAMR.name, 'ROBOT')}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="底盘与整机系统原点复位"
                >
                  <Compass className="w-3 h-3 text-indigo-600" />
                  <span>机器人复位</span>
                </button>

                <button
                  onClick={() => onResetRobot(loadingAMR.name, 'GRIPPER')}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="夹具吸盘回到定位标定点"
                >
                  <HandMetal className="w-3 h-3 text-amber-600" />
                  <span>夹具定位点</span>
                </button>
              </div>

              {/* Direct Teleop Control Button */}
              <button
                onClick={() => {
                  onSelectRobotForL4('LOADING');
                  onNavigateToPanel('ROBOT_TELEOP');
                }}
                className="w-full py-2.5 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-bold text-xs rounded-xl border border-[#46b8da] shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                <span>进入上料机器人详细控制页</span>
              </button>
            </div>
          </div>

          {/* Right Column: 下料复合机器人状态栏 */}
          <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
            <div className="space-y-3">
              {/* Card Header */}
              <div className="border-b-2 border-slate-200 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-800">下料复合机器人</h2>
                    <p className="text-[10px] font-mono text-indigo-600 font-bold">{unloadingAMR.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getAMRStatusBadge(unloadingAMR.status)}
                  <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    电量 {unloadingAMR.batteryPct}%
                  </span>
                </div>
              </div>

              {/* 核心工作状态与当前任务 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 font-mono text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans font-medium block text-[10px] mb-0.5">当前执行任务:</span>
                  <span className="text-slate-900 font-bold font-sans text-xs">{unloadingAMR.currentTask}</span>
                </div>

                {/* 传感器与工单指标 */}
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">名义厚度 (MES):</span>
                    <span className="text-xs font-black text-slate-900">{station.nominalThickness.toFixed(3)} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">实时测厚:</span>
                    <span className="text-xs font-black text-blue-700">{station.currentThickness.toFixed(3)} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">吸盘真空度:</span>
                    <span className="text-xs font-bold text-slate-800">{unloadingAMR.vacuumPressure} kPa</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">移动线速度:</span>
                    <span className="text-xs font-bold text-slate-800">{unloadingAMR.speed} m/s</span>
                  </div>
                </div>

                {/* 6-Axis Joint Angles Preview */}
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-sans mb-1 block">关节角度 (J1~J6):</span>
                  <div className="grid grid-cols-6 gap-1 text-[9px] text-center font-mono font-bold">
                    {unloadingAMR.jointAngles.map((angle, i) => (
                      <div key={i} className="bg-slate-50 py-0.5 rounded text-indigo-700 border border-slate-200">
                        {angle.toFixed(0)}°
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3대 复位按键与遥控入口 (异常状态恢复) */}
            <div className="space-y-2 pt-3">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onResetRobot(unloadingAMR.name, 'ARM')}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="机械臂回到安全抬升原点姿态"
                >
                  <RotateCcw className="w-3 h-3 text-blue-600" />
                  <span>机械臂复位</span>
                </button>

                <button
                  onClick={() => onResetRobot(unloadingAMR.name, 'ROBOT')}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="底盘与整机系统原点复位"
                >
                  <Compass className="w-3 h-3 text-indigo-600" />
                  <span>机器人复位</span>
                </button>

                <button
                  onClick={() => onResetRobot(unloadingAMR.name, 'GRIPPER')}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="夹具吸盘回到定位标定点"
                >
                  <HandMetal className="w-3 h-3 text-amber-600" />
                  <span>夹具定位点</span>
                </button>
              </div>

              {/* Direct Teleop Control Button */}
              <button
                onClick={() => {
                  onSelectRobotForL4('UNLOADING');
                  onNavigateToPanel('ROBOT_TELEOP');
                }}
                className="w-full py-2.5 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-bold text-xs rounded-xl border border-[#46b8da] shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                <span>进入下料机器人详细控制页</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Bottom 4 Main Action Buttons (Matching wireframe: [上首件] [启动上下料] [暂停] [手动继续]) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* 1. 上首件 */}
          <button
            onClick={onTriggerFirstArticle}
            className="py-3 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-bold text-xs sm:text-sm rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>上首件校准</span>
          </button>

          {/* 2. 启动上下料 */}
          <button
            onClick={onOpenSafetyLockModal}
            className="py-3 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-bold text-xs sm:text-sm rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>启动上下料</span>
          </button>

          {/* 3. 暂停 */}
          <button
            onClick={onTriggerPause}
            className="py-3 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-bold text-xs sm:text-sm rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Pause className="w-4 h-4 fill-white" />
            <span>暂停作业</span>
          </button>

          {/* 4. 手动继续 */}
          <button
            onClick={onOpenRemainingBoardsModal}
            className="py-3 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-bold text-xs sm:text-sm rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>手动继续</span>
          </button>
        </div>
      </main>

      {/* Footer info */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2 text-center text-[10px] text-slate-500 font-mono">
        Pad终端负责复合机器人动作控制与安全互锁；测厚量测数据与工单状态经 RMS/MES 系统实时同步中转。
      </footer>
    </div>
  );
};
