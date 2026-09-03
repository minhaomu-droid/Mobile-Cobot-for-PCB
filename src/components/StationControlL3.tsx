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
  AlertOctagon,
  Lock,
  Pencil,
  Check
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
  onOpenFirstArticleModal?: () => void;
  onResetRobot: (robotName: string, resetType?: 'ARM' | 'ROBOT' | 'GRIPPER') => void;
  onSyncRMS: () => void;
  onBackToHome?: () => void;
  onLogout?: () => void;
  m01Estop?: boolean;
  m02Estop?: boolean;
  onTriggerEstopM01?: () => void;
  onTriggerEstopM02?: () => void;
  onUpdateRemainingBoards?: (stationId: string, newRemaining: number) => void;
  systemMode?: 'AUTO' | 'MANUAL';
  onShowToast?: (msg: string) => void;
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
  onOpenFirstArticleModal,
  onResetRobot,
  onSyncRMS,
  onBackToHome,
  onLogout,
  m01Estop = false,
  m02Estop = false,
  onTriggerEstopM01,
  onTriggerEstopM02,
  onUpdateRemainingBoards,
  systemMode = 'AUTO',
  onShowToast,
}) => {
  const loadingAMR = station.loadingAMR;
  const unloadingAMR = station.unloadingAMR;

  // Task Quantity Calculations
  const totalGoal = station.totalBoardsGoal || 150;
  const completed = station.passCount + station.failCount;
  const remainingCount = Math.max(0, totalGoal - completed);
  const progressPct = Math.min(100, Math.round((completed / totalGoal) * 100));

  // Station status check: editable ONLY in STANDBY (待命/就绪) status, NOT in RUNNING (工作中)
  const isRunning = station.status === 'RUNNING';
  const isEditableStatus = station.status === 'STANDBY';
  const [editingValue, setEditingValue] = useState<string>(String(remainingCount));
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  // Sync editing value if station changes
  React.useEffect(() => {
    setEditingValue(String(remainingCount));
  }, [station.id, remainingCount]);

  const handleCommitRemaining = (valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      if (onUpdateRemainingBoards) {
        onUpdateRemainingBoards(station.id, parsed);
        setIsSavedRecently(true);
        setTimeout(() => setIsSavedRecently(false), 1500);
      }
    } else {
      setEditingValue(String(remainingCount));
    }
  };

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
    <div className="h-full flex-1 bg-slate-100/90 text-slate-900 flex flex-col justify-start p-3 sm:p-4 gap-3 select-none font-sans overflow-y-auto min-h-0">
      {/* 1. Station Header Bar */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl px-4 py-2.5 shadow-xs flex items-center justify-between gap-3 shrink-0">
        {/* Station Name & Back Button */}
        <div className="flex items-center gap-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 mr-1"
              title="返回首页 (测厚机列表)"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
              <span>首页</span>
            </button>
          )}

          <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>

      {/* 2. 任务数量管理与工作进度卡片 (Task Quantity Management) */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-sm sm:text-base font-black text-slate-800">
                任务数量与工作进度管理
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  规格: <strong className="text-slate-900">{station.pcbDimensions || '510 × 410 mm'}</strong>
                </span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  批次: <strong className="text-slate-900">{station.currentLot || 'LOT-20260811-001'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Work Quantities & Progress Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
          {/* 1. 工单数量 */}
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600 font-sans">工单数量:</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {totalGoal} <span className="text-xs text-slate-500 font-normal">片</span>
            </div>
          </div>

          {/* 2. 剩余数量 (有且仅在就绪/待命状态可编辑，工作中状态锁定不可编辑) */}
          <div
            className={`p-2.5 rounded-xl flex items-center justify-between transition-all ${
              isEditableStatus
                ? 'bg-blue-50/50 border-2 border-blue-200 shadow-xs'
                : 'bg-slate-50 border border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-700 font-sans">剩余数量:</span>
              {isEditableStatus ? (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                  <Pencil className="w-2.5 h-2.5" />
                  就绪待命·可编辑
                </span>
              ) : (
                <span
                  className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5"
                  title="测厚机工作中状态，锁定不可修改"
                >
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                  工作中锁定
                </span>
              )}
            </div>

            {isEditableStatus ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={editingValue}
                  onChange={(e) => {
                    setEditingValue(e.target.value);
                    handleCommitRemaining(e.target.value);
                  }}
                  onBlur={() => handleCommitRemaining(editingValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitRemaining(editingValue);
                  }}
                  className="w-20 sm:w-24 px-2 py-1 bg-white border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 rounded-lg text-lg sm:text-xl font-mono font-black text-blue-800 text-right outline-none transition-all shadow-xs"
                  title="测厚机当前处于待命/就绪状态，可直接输入修改剩余加工数量"
                />
                <span className="text-xs text-slate-600 font-bold">片</span>
                {isSavedRecently && (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5" title="修改已保存">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
                {remainingCount} <span className="text-xs text-slate-500 font-normal">片</span>
              </div>
            )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 shrink-0">
        {/* Left Column: 上料复合机器人状态栏 */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-xs">
          <div className="space-y-2">
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
                  disabled={!isRunning}
                  onClick={isRunning ? onTriggerEstopM01 : undefined}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 transition-all shadow-xs flex items-center gap-1 ${
                    isRunning
                      ? `active:scale-95 cursor-pointer ${
                          m01Estop
                            ? 'bg-red-700 hover:bg-red-800 text-white border-red-900 animate-pulse ring-2 ring-red-300'
                            : 'bg-red-600 hover:bg-red-700 text-white border-red-800'
                        }`
                      : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                  }`}
                  title={isRunning ? "M-01 独立急停：立即切断上料机器人伺服动力" : "测厚机未在工作状态，急停不可用"}
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
            </div>
          </div>

          {/* Direct Teleop Control Button */}
          <button
            onClick={() => {
              onSelectRobotForL4('LOADING');
              onNavigateToPanel('ROBOT_TELEOP');
            }}
            className="w-full py-2.5 sm:py-3 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-black text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>进入上料机器人详细控制页</span>
          </button>
        </div>

        {/* Right Column: 下料复合机器人状态栏 */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-xs">
          <div className="space-y-2">
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
                  disabled={!isRunning}
                  onClick={isRunning ? onTriggerEstopM02 : undefined}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 transition-all shadow-xs flex items-center gap-1 ${
                    isRunning
                      ? `active:scale-95 cursor-pointer ${
                          m02Estop
                            ? 'bg-red-700 hover:bg-red-800 text-white border-red-900 animate-pulse ring-2 ring-red-300'
                            : 'bg-red-600 hover:bg-red-700 text-white border-red-800'
                        }`
                      : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                  }`}
                  title={isRunning ? "M-02 独立急停：立即切断下料机器人伺服动力" : "测厚机未在工作状态，急停不可用"}
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
            </div>
          </div>

          {/* Direct Teleop Control Button */}
          <button
            onClick={() => {
              onSelectRobotForL4('UNLOADING');
              onNavigateToPanel('ROBOT_TELEOP');
            }}
            className="w-full py-2.5 sm:py-3 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-black text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>进入下料机器人详细控制页</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom 4 Main Action Buttons: [上首件校准] [启动上下料] [安全停止] [全局停止] */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        {/* 1. 上首件 */}
        <button
          onClick={() => {
            if (systemMode === 'MANUAL') {
              if (onShowToast) {
                onShowToast('【模式安全互锁】上首件校准需在【自动模式】下运行，请在顶部状态栏切换为 [自动模式] 后再点击！');
              }
              return;
            }
            if (onOpenFirstArticleModal) {
              onOpenFirstArticleModal();
            } else if (onTriggerFirstArticle) {
              onTriggerFirstArticle();
            }
          }}
          className="py-3.5 sm:py-4 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-sm sm:text-base rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          title={systemMode === 'AUTO' ? "上首件自动送样校准" : "上首件校准（需在顶部切换为自动模式）"}
        >
          <Sparkles className="w-5 h-5" />
          <span>上首件校准</span>
        </button>

        {/* 2. 启动上下料 */}
        <button
          onClick={() => {
            if (systemMode === 'MANUAL') {
              if (onShowToast) {
                onShowToast('【模式安全互锁】启动上下料需在【自动模式】下运行，请在顶部状态栏切换为 [自动模式] 后再启动！');
              }
              return;
            }
            onOpenSafetyLockModal();
          }}
          className="py-3.5 sm:py-4 px-3 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-sm sm:text-base rounded-2xl border border-[#46b8da] shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          title={systemMode === 'AUTO' ? "启动自动上下料循环任务" : "启动上下料（需在顶部切换为自动模式）"}
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

        {/* 4. 全局停止 (有且仅在测厚机工作中时可用，非工作中灰度禁用) */}
        <button
          disabled={!isRunning}
          onClick={isRunning ? (onTriggerGlobalEstop || onTriggerPause) : undefined}
          className={`py-3.5 sm:py-4 px-3 font-black text-sm sm:text-base rounded-2xl border shadow-md flex items-center justify-center gap-2 transition-all ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-red-800 active:scale-95 cursor-pointer'
              : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
          }`}
          title={isRunning ? "紧急停机：立即切断上料(M-01)与下料(M-02)两台复合机器人所有伺服动力" : "测厚机未在工作状态，全局停止不可用"}
        >
          <AlertOctagon className="w-5 h-5" />
          <span>全局停止</span>
        </button>
      </div>
    </div>
  );
};
