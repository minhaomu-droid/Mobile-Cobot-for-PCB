import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  Edit2,
  Trash2,
  Cpu,
  Server,
  Bot,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  AlertOctagon,
  X
} from 'lucide-react';
import { ThicknessStation } from '../types';

interface HomeStationListProps {
  stations: ThicknessStation[];
  onSelectStationForControl: (stationId: string) => void;
  onLogout: () => void;
  onAddStation?: (name: string) => void;
  onUpdateStation?: (stationId: string, updatedName: string, updatedLot?: string) => void;
  onDeleteStation?: (stationId: string) => void;
  onDirectRobotControl?: (robotType: 'LOADING' | 'UNLOADING') => void;
  m01Estop?: boolean;
  m02Estop?: boolean;
  onTriggerEstopM01?: () => void;
  onTriggerEstopM02?: () => void;
}

export const HomeStationList: React.FC<HomeStationListProps> = ({
  stations,
  onSelectStationForControl,
  onAddStation,
  onUpdateStation,
  onDeleteStation,
  m01Estop = false,
  m02Estop = false,
  onTriggerEstopM01,
  onTriggerEstopM02,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RUNNING' | 'STANDBY'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [newStationName, setNewStationName] = useState(`9号测厚机`);
  const [selectedEditStationId, setSelectedEditStationId] = useState(stations[0]?.id || '');
  const [editStationName, setEditStationName] = useState(stations[0]?.name || '');
  const [editStationLot, setEditStationLot] = useState(stations[0]?.currentLot || '');
  const [selectedDeleteStationId, setSelectedDeleteStationId] = useState(stations[stations.length - 1]?.id || '');

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
      setNewStationName(`${stations.length + 2}号测厚机`);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateStation && selectedEditStationId && editStationName.trim()) {
      onUpdateStation(selectedEditStationId, editStationName.trim(), editStationLot.trim());
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onDeleteStation && selectedDeleteStationId) {
      onDeleteStation(selectedDeleteStationId);
      setIsDeleteModalOpen(false);
    }
  };

  const openEditModal = (station?: ThicknessStation) => {
    const target = station || stations.find((s) => s.id === selectedEditStationId) || stations[0];
    if (target) {
      setSelectedEditStationId(target.id);
      setEditStationName(target.name);
      setEditStationLot(target.currentLot);
    }
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (station?: ThicknessStation) => {
    const target = station || stations.find((s) => s.id === selectedDeleteStationId) || stations[stations.length - 1];
    if (target) {
      setSelectedDeleteStationId(target.id);
    }
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="flex-1 bg-slate-100/90 text-slate-900 flex flex-col p-3 sm:p-4 gap-3 overflow-hidden select-none font-sans min-h-0">
      {/* Top Compact Summary & Filter Control Bar */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">测厚机列表</h2>
          </div>
        </div>

        {/* Center/Right: Filter Tabs + Add/Edit/Delete Station Buttons */}
        <div className="flex items-center gap-2.5 ml-auto flex-wrap">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({stations.length})
            </button>
            <button
              onClick={() => setFilterStatus('RUNNING')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'RUNNING'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              运行 ({runningCount})
            </button>
            <button
              onClick={() => setFilterStatus('STANDBY')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'STANDBY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              待机 ({standbyCount})
            </button>
          </div>

          {/* Station Management Actions: Add, Edit, Delete */}
          <div className="flex items-center gap-1.5">
            {/* Add Station Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold rounded-xl border border-blue-300 flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
              title="添加新机台"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>添加</span>
            </button>

            {/* Edit Station Button */}
            <button
              onClick={() => openEditModal()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
              title="修改机台信息"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
              <span>修改</span>
            </button>

            {/* Delete Station Button */}
            <button
              onClick={() => openDeleteModal()}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold rounded-xl border border-red-300 flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
              title="删除机台"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>删除</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Stations Tiled 4x2 Grid (Flat Tile Layout with Large Readable Fonts) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-h-0">
        {filteredStations.map((st) => {
          const isRunning = st.status === 'RUNNING';

          return (
            <div
              key={st.id}
              onClick={() => onSelectStationForControl(st.id)}
              className="bg-white hover:bg-slate-50/90 border-2 border-slate-300 hover:border-blue-500 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group select-none relative overflow-hidden"
            >
              <div className="space-y-2">
                {/* Top Row: Station Title, ID, Status Badge */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isRunning
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-amber-50 border-amber-300 text-amber-700'
                      }`}
                    >
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm sm:text-base font-black text-slate-900 truncate block group-hover:text-blue-600 transition-colors">
                        {st.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block leading-none">{st.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                        isRunning
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      {isRunning ? '运行中' : '待机'}
                    </span>
                  </div>
                </div>

                {/* Station Info: PCB Spec & Lot */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50/90 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <div className="truncate">
                    <span className="text-slate-400 block text-[10px] font-bold">PCB规格</span>
                    <span className="text-slate-900 font-black text-xs truncate block">{st.pcbDimensions}</span>
                  </div>
                  <div className="truncate text-right">
                    <span className="text-slate-400 block text-[10px] font-bold">当前批次</span>
                    <span className="text-slate-700 font-bold text-xs truncate block">{st.currentLot}</span>
                  </div>
                </div>

                {/* Separated AMR Section: 上料 (M-01) & 下料 (M-02) with Individual E-Stop */}
                <div className="space-y-1.5">
                  {/* 1. 上料 AMR */}
                  <div className="bg-slate-50/80 group-hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                        上料
                      </span>
                      <span className="text-sm sm:text-base font-black font-mono text-slate-900 tracking-tight">
                        {st.loadingAMR.id}
                      </span>
                      <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
                        {m01Estop ? (
                          <strong className="text-red-600 font-bold">已急停</strong>
                        ) : (
                          `${st.loadingAMR.batteryPct}%`
                        )}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerEstopM01?.();
                      }}
                      className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-red-700 ${
                        m01Estop ? 'bg-red-700 animate-pulse ring-2 ring-red-400' : ''
                      }`}
                      title="M-01 上料复合机器人急停"
                    >
                      <AlertOctagon className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{m01Estop ? 'M-01已急停' : 'M-01急停'}</span>
                    </button>
                  </div>

                  {/* 2. 下料 AMR */}
                  <div className="bg-slate-50/80 group-hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                        下料
                      </span>
                      <span className="text-sm sm:text-base font-black font-mono text-slate-900 tracking-tight">
                        {st.unloadingAMR.id}
                      </span>
                      <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
                        {m02Estop ? (
                          <strong className="text-red-600 font-bold">已急停</strong>
                        ) : (
                          `${st.unloadingAMR.batteryPct}%`
                        )}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerEstopM02?.();
                      }}
                      className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-red-700 ${
                        m02Estop ? 'bg-red-700 animate-pulse ring-2 ring-red-400' : ''
                      }`}
                      title="M-02 下料复合机器人急停"
                    >
                      <AlertOctagon className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{m02Estop ? 'M-02已急停' : 'M-02急停'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Work Status & Control Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 gap-2 mt-2">
                <div className="text-xs font-mono text-slate-600 truncate">
                  工况: <strong className={isRunning ? 'text-emerald-700' : 'text-amber-700'}>{isRunning ? '作业中' : '就绪'}</strong>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStationForControl(st.id);
                  }}
                  className="px-3.5 sm:px-4 py-1.5 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-xs sm:text-sm rounded-xl border border-[#46b8da] shadow-xs group-hover:shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>控制</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
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
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>添加新测厚机台</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">测厚机名称 / 工位编号:</label>
                <input
                  type="text"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  placeholder="例如: 9号测厚机"
                  className="w-full px-3.5 py-2.5 bg-[#d8f3dc] text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                  <Server className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>工艺与工单参数 (MES / 调度下发)</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans space-y-1">
                  <p>• <strong className="text-slate-800">PCB长宽规格:</strong> 由系统根据当前MES工单与配方自动下发同步，无需手动录入。</p>
                  <p>• <strong className="text-slate-800">传感器参数:</strong> 由调度中控自动绑定校准并接入数据流。</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5bc0de] hover:bg-[#31b0d5] text-white text-xs sm:text-sm font-bold rounded-xl border border-[#46b8da] shadow-sm cursor-pointer"
                >
                  确定接入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Station Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-300 rounded-3xl shadow-2xl max-w-md w-full p-6 text-slate-900">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              <span>修改机台参数与编号</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">选择目标机台:</label>
                <select
                  value={selectedEditStationId}
                  onChange={(e) => {
                    const st = stations.find((s) => s.id === e.target.value);
                    setSelectedEditStationId(e.target.value);
                    if (st) {
                      setEditStationName(st.name);
                      setEditStationLot(st.currentLot);
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-slate-300 focus:outline-none"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.id}) - {st.status === 'RUNNING' ? '运行中' : '待机'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">机台名称 / 工位别名:</label>
                <input
                  type="text"
                  value={editStationName}
                  onChange={(e) => setEditStationName(e.target.value)}
                  placeholder="例如: 1号测厚机 (北区A线)"
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">生产批次 (Lot ID):</label>
                <input
                  type="text"
                  value={editStationLot}
                  onChange={(e) => setEditStationLot(e.target.value)}
                  placeholder="例如: LOT-20260811-001"
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-blue-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5bc0de] hover:bg-[#31b0d5] text-white text-xs sm:text-sm font-bold rounded-xl border border-[#46b8da] shadow-sm cursor-pointer"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Station Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-300 rounded-3xl shadow-2xl max-w-md w-full p-6 text-slate-900">
            <h3 className="text-base sm:text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>删除测厚机台</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              删除后该机台将从实时监控平铺矩阵中移除，如需重新接入可点击「添加」按钮。
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">选择要删除的机台:</label>
                <select
                  value={selectedDeleteStationId}
                  onChange={(e) => setSelectedDeleteStationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-red-50 text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-red-300 focus:outline-none"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.id}) - {st.status === 'RUNNING' ? '运行中' : '待机'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl border border-red-700 shadow-sm cursor-pointer"
                >
                  确认删除
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
