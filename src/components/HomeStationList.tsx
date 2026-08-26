import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  Cpu,
  Server,
  Bot,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers
} from 'lucide-react';
import { ThicknessStation } from '../types';

interface HomeStationListProps {
  stations: ThicknessStation[];
  onSelectStationForControl: (stationId: string) => void;
  onLogout: () => void;
  onAddStation?: (name: string) => void;
  onDirectRobotControl?: (robotType: 'LOADING' | 'UNLOADING') => void;
}

export const HomeStationList: React.FC<HomeStationListProps> = ({
  stations,
  onSelectStationForControl,
  onAddStation,
  onDirectRobotControl,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RUNNING' | 'STANDBY'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStationName, setNewStationName] = useState(`9号测厚机`);

  const runningCount = stations.filter((s) => s.status === 'RUNNING').length;
  const standbyCount = stations.filter((s) => s.status === 'STANDBY').length;

  const filteredStations = stations.filter((s) => {
    if (filterStatus === 'RUNNING') return s.status === 'RUNNING';
    if (filterStatus === 'STANDBY') return s.status === 'STANDBY';
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddStation && newStationName.trim()) {
      onAddStation(newStationName.trim());
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-100/90 text-slate-900 flex flex-col p-3 sm:p-4 gap-2.5 overflow-hidden select-none font-sans min-h-0">
      {/* Top Compact Summary & Filter Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Title & Quick Station Matrix Count */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-800 tracking-tight">测厚机列表矩阵</h2>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 font-bold">
                8台机台全屏平铺
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono hidden sm:block">
              联想Pad工业站控 • 运行: <strong className="text-emerald-600">{runningCount}</strong> / 待机: <strong className="text-amber-600">{standbyCount}</strong> • MES 中转联动
            </p>
          </div>
        </div>

        {/* Center/Right: Robot Fleet Quick Link + Filter Tabs + Add Button */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Quick Robot Teleop Shortcuts */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
            <Bot className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-[11px] font-bold text-slate-600">机器人:</span>
            <button
              onClick={() => onDirectRobotControl && onDirectRobotControl('LOADING')}
              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 cursor-pointer transition-all active:scale-95"
            >
              M-01 上料
            </button>
            <button
              onClick={() => onDirectRobotControl && onDirectRobotControl('UNLOADING')}
              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 cursor-pointer transition-all active:scale-95"
            >
              M-02 收料
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({stations.length})
            </button>
            <button
              onClick={() => setFilterStatus('RUNNING')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                filterStatus === 'RUNNING'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              运行 ({runningCount})
            </button>
            <button
              onClick={() => setFilterStatus('STANDBY')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                filterStatus === 'STANDBY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              待机 ({standbyCount})
            </button>
          </div>

          {/* Add Station Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-300 flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0"
            title="添加新机台"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">添加</span>
          </button>
        </div>
      </div>

      {/* 8 Stations Tiled 4x2 Grid (Flat Tile Layout with Zero Vertical Scrolling) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-4 lg:grid-rows-2 gap-2.5 flex-1 min-h-0">
        {filteredStations.map((st) => {
          const isRunning = st.status === 'RUNNING';
          const diff = (st.currentThickness - st.nominalThickness).toFixed(3);
          const isPass = Math.abs(st.currentThickness - st.nominalThickness) <= st.toleranceUpper;

          return (
            <div
              key={st.id}
              onClick={() => onSelectStationForControl(st.id)}
              className="bg-white hover:bg-slate-50/90 border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-3 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group select-none relative overflow-hidden"
            >
              {/* Top Row: Station Title, ID, Status Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                      isRunning
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                    }`}
                  >
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900 truncate block group-hover:text-blue-600 transition-colors">
                      {st.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono block leading-none">{st.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                      isRunning
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    {isRunning ? '运行中' : '待机'}
                  </span>
                </div>
              </div>

              {/* Core Realtime Measurement Tile (High Visibility) */}
              <div className="my-1.5 bg-slate-50 group-hover:bg-blue-50/40 p-2 rounded-xl border border-slate-200/80 transition-colors">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold text-slate-500">实时厚度:</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-black font-mono tracking-tight ${isPass ? 'text-blue-700' : 'text-red-600'}`}>
                      {st.currentThickness.toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">mm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 mt-1 border-t border-slate-200/60">
                  <span>标称: <strong className="text-slate-700 font-bold">{st.nominalThickness.toFixed(3)}</strong></span>
                  <span className={`font-bold ${Number(diff) >= 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {Number(diff) >= 0 ? `+${diff}` : diff} mm
                  </span>
                </div>
              </div>

              {/* PCB Spec & Lot Meta */}
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono bg-white p-1.5 rounded-lg border border-slate-100">
                <div className="truncate">
                  <span className="text-slate-400 block text-[9px]">PCB规格:</span>
                  <span className="text-slate-700 font-bold truncate block">{st.pcbDimensions}</span>
                </div>
                <div className="truncate text-right">
                  <span className="text-slate-400 block text-[9px]">当前批次:</span>
                  <span className="text-slate-700 font-bold truncate block">{st.currentLot}</span>
                </div>
              </div>

              {/* Bottom Row: Robot Association & Control Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1.5 mt-auto">
                <div className="text-[9px] text-slate-500 font-mono truncate">
                  上下料: <strong className="text-blue-600">{st.loadingAMR.id}</strong> / <strong className="text-indigo-600">{st.unloadingAMR.id}</strong>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStationForControl(st.id);
                  }}
                  className="px-3 py-1 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-bold text-[11px] rounded-lg border border-[#46b8da] shadow-xs group-hover:shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Cpu className="w-3 h-3" />
                  <span>控制</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Station Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-300 rounded-3xl shadow-2xl max-w-md w-full p-6 text-slate-900">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>添加新测厚机台</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">测厚机名称 / 工位编号:</label>
                <input
                  type="text"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  placeholder="例如: 9号测厚机"
                  className="w-full px-3.5 py-2.5 bg-[#d8f3dc] text-slate-900 font-mono font-bold text-xs rounded-xl border-2 border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Server className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>工艺与工单参数 (MES / 调度下发)</span>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed font-sans space-y-1">
                  <p>• <strong className="text-slate-800">PCB长宽规格:</strong> 由系统根据当前MES工单与配方自动下发同步，无需手动录入。</p>
                  <p>• <strong className="text-slate-800">标称厚度与公差:</strong> 由调度中控自动绑定下发至传感器。</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5bc0de] hover:bg-[#31b0d5] text-white text-xs font-bold rounded-xl border border-[#46b8da] shadow-sm cursor-pointer"
                >
                  确定接入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
