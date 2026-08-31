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
  Sparkles,
  AlertOctagon
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
  onTriggerSafeStop?: () => void;
  onTriggerGlobalEstop?: () => void;
  onTriggerFirstArticle: () => void;
  onResetRobot: (robotName: string, resetType?: 'ARM' | 'ROBOT' | 'GRIPPER') => void;
  onSyncRMS: () => void;
  onBackToHome?: () => void;
  onLogout?: () => void;
  m01Estop?: boolean;
  m02Estop?: boolean;
  onTriggerEstopM01?: () => void;
  onTriggerEstopM02?: () => void;
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
  onTriggerSafeStop,
  onTriggerGlobalEstop,
  onTriggerFirstArticle,
  onResetRobot,
  onSyncRMS,
  onBackToHome,
  onLogout,
  m01Estop = false,
  m02Estop = false,
  onTriggerEstopM01,
  onTriggerEstopM02,
}) => {
  const loadingAMR = station.loadingAMR;
  const unloadingAMR = station.unloadingAMR;

  // Task Quantity Calculations
  const totalGoal = station.totalBoardsGoal || 150;
  const completed = station.passCount + station.failCount;
  const remainingCount = Math.max(0, totalGoal - completed);
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
    <div className="h-full flex-1 bg-slate-100/90 text-slate-900 flex flex-col justify-between p-3 sm:p-4 gap-3 select-none font-sans overflow-hidden min-h-0">
      {/* 1. Station Quick-Switch Bar & MES/RMS Info Sync Header (Unified Top Bar) */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl px-4 py-2.5 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0">
        {/* Station Switcher Pill Bar (1号机 ~ 8号机) */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <div className="flex items-center gap-1.5 mr-2 shrink-0">
            <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight whitespace-nowrap">
              {station.name}
            </h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold border whitespace-nowrap ${
              station.status === 'RUNNING'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}>
              {station.status === 'RUNNING' ? '自动运行中' : '待机中'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {allStations.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectStation(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  s.id === station.id
                    ? 'bg-blue-600 text-white shadow-xs scale-102'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* MES / RMS Metadata & Sync Button */}
        <div className="flex items-center gap-3 text-xs sm:text-sm font-mono bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Server className="w-4 h-4 text-blue-600 shrink-0" />
            <span>工单: <strong className="text-slate-900">{station.mesWorkOrder || 'WO-2026-0811A'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>配方: <strong className="text-slate-900">{station.mesRecipeId || 'REC-FR4-1250'}</strong></span>
          </div>
          <button
            onClick={onSyncRMS}
            className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-300 text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0"
            title="一键同步至车间调度 RMS/MES 系统"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>同步RMS</span>
          </button>
        </div>
      </div>

      {/* 2. 任务数量管理与工作进度卡片 (Task Quantity Management) */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                <span>任务数量与工作进度管理</span>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  批次: {station.currentLot}
                </span>
              </h2>
            </div>
          </div>

          {/* Task Mode Action Buttons (继续任务 vs 重新开始任务) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onTriggerTaskMode('RESUME')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="继承当前批次已加工数量，人工安全核验后继续自动作业"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>继续任务 (断点续跑)</span>
            </button>

            <button
              onClick={() => onTriggerTaskMode('RESTART')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="重置当前批次计数，从第1片重新开始"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新开始任务</span>
            </button>
          </div>
        </div>

        {/* Real-time Work Quantities & Progress Grid */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600 font-sans">目标计划总数:</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {totalGoal} <span className="text-xs text-slate-500 font-normal">片</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600 font-sans">批次完成进度:</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-700">
              {progressPct}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 3. Two Columns: Left (上料复合机器人) vs Right (下料复合机器人) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 min-h-0">
        {/* Left Column: 上料复合机器人状态栏 */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-2.5">
            {/* Card Header: 重点关注机器人运行状态、电量与独立急停 */}
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800">上料复合机器人</h2>
                  <p className="text-xs font-mono text-blue-600 font-bold">{loadingAMR.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getAMRStatusBadge(loadingAMR.status)}
                <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs sm:text-sm font-mono font-bold px-2.5 py-1 rounded-lg">
                  电量 {loadingAMR.batteryPct}%
                </span>
                {/* M-01 独立急停按钮 */}
                <button
                  onClick={onTriggerEstopM01}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-xs ${
                    m01Estop
                      ? 'bg-red-700 hover:bg-red-800 text-white border-red-900 animate-pulse ring-2 ring-red-300'
                      : 'bg-red-600 hover:bg-red-700 text-white border-red-800'
                  }`}
                  title="M-01 独立急停：立即切断上料机器人伺服动力"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{m01Estop ? 'M-01已急停(复位)' : 'M-01急停'}</span>
                </button>
              </div>
            </div>

            {/* 核心工作状态与当前任务 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2 font-mono text-xs sm:text-sm">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-sans font-bold block text-xs mb-0.5">当前执行任务:</span>
                <span className="text-slate-900 font-bold font-sans text-sm sm:text-base">{loadingAMR.currentTask}</span>
              </div>

              {/* 传感器与工单指标 */}
              <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-sans font-bold block">PCB长宽规格:</span>
                  <span className="text-sm font-black text-slate-900 truncate block">{station.pcbDimensions}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-sans font-bold block">移动线速度:</span>
                  <span className="text-sm font-black text-slate-800">{loadingAMR.speed} m/s</span>
                </div>
              </div>

              {/* 附加状态条目：平行夹爪与对接工位 */}
              <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-sans font-bold block">气动平行夹爪:</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700">● 夹持闭合到位 (15mm)</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-sans font-bold block">当前工位对接:</span>
                  <span className="text-xs sm:text-sm font-bold text-blue-700 font-mono">{station.name} 上料口</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Teleop Control Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                onSelectRobotForL4('LOADING');
                onNavigateToPanel('ROBOT_TELEOP');
              }}
              className="w-full py-2.5 sm:py-3 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-bold text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>进入上料机器人详细控制页</span>
            </button>
          </div>
        </div>

        {/* Right Column: 下料复合机器人状态栏 */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-2.5">
            {/* Card Header: 重点关注机器人运行状态、电量与独立急停 */}
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800">下料复合机器人</h2>
                  <p className="text-xs font-mono text-indigo-600 font-bold">{unloadingAMR.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getAMRStatusBadge(unloadingAMR.status)}
                <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs sm:text-sm font-mono font-bold px-2.5 py-1 rounded-lg">
                  电量 {unloadingAMR.batteryPct}%
                </span>
                {/* M-02 独立急停按钮 */}
                <button
                  onClick={onTriggerEstopM02}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-xs ${
                    m02Estop
                      ? 'bg-red-700 hover:bg-red-800 text-white border-red-900 animate-pulse ring-2 ring-red-300'
                      : 'bg-red-600 hover:bg-red-700 text-white border-red-800'
                  }`}
                  title="M-02 独立急停：立即切断下料机器人伺服动力"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{m02Estop ? 'M-02已急停(复位)' : 'M-02急停'}</span>
                </button>
              </div>
            </div>

            {/* 核心工作状态与当前任务 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2 font-mono text-xs sm:text-sm">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-sans font-bold block text-xs mb-0.5">当前执行任务:</span>
                <span className="text-slate-900 font-bold font-sans text-sm sm:text-base">{unloadingAMR.currentTask}</span>
              </div>

              {/* 传感器与工单指标 */}
              <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-sans font-bold block">PCB长宽规格:</span>
                  <span className="text-sm font-black text-slate-900 truncate block">{station.pcbDimensions}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-sans font-bold block">移动线速度:</span>
                  <span className="text-sm font-black text-slate-800">{unloadingAMR.speed} m/s</span>
                </div>
              </div>

              {/* 附加状态条目：平行夹爪与对接工位 */}
              <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-sans font-bold block">气动平行夹爪:</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700">● 夹持闭合到位 (15mm)</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-sans font-bold block">当前工位对接:</span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-700 font-mono">{station.name} 下料口</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Teleop Control Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                onSelectRobotForL4('UNLOADING');
                onNavigateToPanel('ROBOT_TELEOP');
              }}
              className="w-full py-2.5 sm:py-3 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-bold text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>进入下料机器人详细控制页</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom 4 Main Action Buttons: [上首件校准] [启动上下料] [安全停止] [全局停止] */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        {/* 1. 上首件 */}
        <button
          onClick={onTriggerFirstArticle}
          className="py-3.5 sm:py-4 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-sm sm:text-base rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>上首件校准</span>
        </button>

        {/* 2. 启动上下料 */}
        <button
          onClick={onOpenSafetyLockModal}
          className="py-3.5 sm:py-4 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-sm sm:text-base rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>启动上下料</span>
        </button>

        {/* 3. 安全停止 */}
        <button
          onClick={onTriggerSafeStop || onTriggerPause}
          className="py-3.5 sm:py-4 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-sm sm:text-base rounded-2xl border border-amber-600 shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          title="平稳降速：复合机器人将在当前单片上下料测厚作业完成后自动停止"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>安全停止</span>
        </button>

        {/* 4. 全局停止 */}
        <button
          onClick={onTriggerGlobalEstop || onTriggerPause}
          className="py-3.5 sm:py-4 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-sm sm:text-base rounded-2xl border border-red-800 shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          title="紧急停机：立即切断上料(M-01)与下料(M-02)两台复合机器人所有伺服动力"
        >
          <AlertOctagon className="w-5 h-5" />
          <span>全局停止</span>
        </button>
      </div>
    </div>
  );
};
