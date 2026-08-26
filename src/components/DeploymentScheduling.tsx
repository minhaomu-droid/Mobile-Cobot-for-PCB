import React, { useState } from 'react';
import {
  Network,
  MapPin,
  ListOrdered,
  Layers,
  Play,
  Pause,
  RefreshCw,
  Plus,
  ArrowRight,
  Bot,
  BatteryCharging,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Sliders,
  Radio,
  FileCheck,
  Compass,
  Lock,
  ChevronRight,
  Eye,
  Settings2,
  Map as MapIcon,
  Crosshair,
  Move,
} from 'lucide-react';
import {
  DispatchTask,
  CalibrationPoint,
  ThicknessStation,
  DispatchPriority,
  DispatchTaskType,
  UserRole,
} from '../types';
import { ChassisMapStudio } from './ChassisMapStudio';
import { MosRmsStudio } from './MosRmsStudio';

interface DeploymentSchedulingProps {
  stations: ThicknessStation[];
  tasks: DispatchTask[];
  calibrationPoints: CalibrationPoint[];
  onAddTask: (task: Omit<DispatchTask, 'id' | 'orderNumber' | 'startTime'>) => void;
  onUpdateTaskStatus: (taskId: string, status: DispatchTask['status']) => void;
  onUpdateCalibration: (pointId: string, deltaX: number, deltaY: number, deltaHeading: number) => void;
  onSyncFleetMap: () => void;
  onShowToast: (msg: string) => void;
  userRole?: UserRole;
  onElevateRole?: (role: UserRole) => void;
}

export const DeploymentScheduling: React.FC<DeploymentSchedulingProps> = ({
  stations,
  tasks,
  calibrationPoints,
  onAddTask,
  onUpdateTaskStatus,
  onUpdateCalibration,
  onSyncFleetMap,
  onShowToast,
  userRole = 'ENGINEER',
  onElevateRole,
}) => {
  const [activeTab, setActiveTab] = useState<'MOS_RMS_STUDIO' | 'CHASSIS_MAP' | 'MAP_TOPOLOGY' | 'TASK_QUEUE' | 'CALIBRATION_DEPLOY'>('MOS_RMS_STUDIO');
  const [isFleetPaused, setIsFleetPaused] = useState<boolean>(false);
  const [selectedAmrId, setSelectedAmrId] = useState<string | null>('M-01');
  const [selectedPointId, setSelectedPointId] = useState<string | null>('CP-01');

  // Robotic Arm Cartesian Calibration Offset State (per station)
  const [armCalibrationOffsets, setArmCalibrationOffsets] = useState<Record<string, { x: number; y: number; z: number; rx: number; ry: number; rz: number }>>({
    'CP-01': { x: 425.4, y: -112.8, z: 315.6, rx: 180.0, ry: 0.0, rz: -45.0 },
    'CP-02': { x: 480.0, y: -80.0, z: 240.0, rx: 180.0, ry: 0.0, rz: -45.0 },
    'CP-03': { x: 480.0, y: -80.0, z: 185.0, rx: 180.0, ry: 0.0, rz: -45.0 },
    'CP-04': { x: 430.0, y: -110.0, z: 310.0, rx: 180.0, ry: 0.0, rz: -45.0 },
  });

  const handleAdjustArmPose = (pointId: string, axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz', delta: number) => {
    setArmCalibrationOffsets((prev) => {
      const current = prev[pointId] || { x: 420.0, y: -100.0, z: 300.0, rx: 180.0, ry: 0.0, rz: -45.0 };
      return {
        ...prev,
        [pointId]: {
          ...current,
          [axis]: Number((current[axis] + delta).toFixed(2)),
        },
      };
    });
  };

  // New Task Form Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskType, setNewTaskType] = useState<DispatchTaskType>('FEEDING');
  const [newTitle, setNewTitle] = useState('紧急基板配送至1号测厚机');
  const [newSource, setNewSource] = useState('原料暂存区 A1');
  const [newTarget, setNewTarget] = useState('1号测厚机 (ST-01)');
  const [newAssignedAmr, setNewAssignedAmr] = useState('AUTO');
  const [newPriority, setNewPriority] = useState<DispatchPriority>('HIGH');
  const [newLotId, setNewLotId] = useState('LOT-20260811-005');

  // Task Filter
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'RUNNING' | 'QUEUED' | 'PAUSED'>('ALL');

  // Map AMR list derived from 2 composite robots
  const fleetAMRs = [
    { id: 'M-01', name: 'M-01 (上料复合机器人)', x: 200, y: 140, status: 'NAVIGATING', battery: 94, task: '原料区抓取基板送往1号测厚机', station: '1号测厚机' },
    { id: 'M-02', name: 'M-02 (收料复合机器人)', x: 380, y: 140, status: 'PICKING', battery: 88, task: '测厚机取板并码垛至成品托盘', station: '1号测厚机' },
  ];

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assigned = newAssignedAmr === 'AUTO' ? 'M-01 (自动分配最佳)' : newAssignedAmr;
    onAddTask({
      taskType: newTaskType,
      title: newTitle,
      assignedAMR: assigned,
      sourceStation: newSource,
      targetStation: newTarget,
      priority: newPriority,
      status: 'QUEUED',
      progressPct: 0,
      lotId: newLotId,
    });
    setIsCreateModalOpen(false);
    onShowToast(`已成功向调度引擎派发工单：${newTitle}`);
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'ALL') return true;
    return t.status === taskFilter;
  });

  const selectedAmrData = fleetAMRs.find((a) => a.id === selectedAmrId) || fleetAMRs[0];
  const selectedPointData = calibrationPoints.find((p) => p.id === selectedPointId);

  return (
    <div className="p-4 sm:p-6 space-y-5 h-full overflow-y-auto bg-slate-50 text-slate-900 flex flex-col justify-between select-none">
      {/* Top Header & Fleet Status Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">犀准机器人 部署与车队调度中心</h2>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono">
                {isFleetPaused ? '调度已暂停' : '自动调度中'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              主服务器: 192.168.1.100 [在线] • 备用服务器: 192.168.1.101 [热备] • 通信延迟: 4ms
            </p>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Toggle Fleet Dispatch Run/Pause */}
          <button
            onClick={() => {
              setIsFleetPaused(!isFleetPaused);
              onShowToast(isFleetPaused ? '已恢复复合机器人自动调度系统' : '已暂停全车队自动调度，进入交通锁止模式');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isFleetPaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
                : 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-400'
            }`}
          >
            {isFleetPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5 fill-white" />}
            <span>{isFleetPaused ? '恢复自动调度' : '暂停调度'}</span>
          </button>

          {/* Sync Fleet Map */}
          <button
            onClick={onSyncFleetMap}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="下发当前地图拓扑与禁行区配置至 2 台复合机器人"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">同步车队地图</span>
          </button>

          {/* Create Task Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新建派发工单</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 shrink-0 gap-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('MOS_RMS_STUDIO')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MOS_RMS_STUDIO'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 bg-white/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>上位机 MOS 协同调试</span>
            <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded font-black">
              MOS ↔ RMS
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CHASSIS_MAP')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CHASSIS_MAP'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>底盘激光建图</span>
          </button>

          <button
            onClick={() => setActiveTab('MAP_TOPOLOGY')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MAP_TOPOLOGY'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-slate-700" />
            <span>车间拓扑与实时路径</span>
          </button>

          <button
            onClick={() => setActiveTab('TASK_QUEUE')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TASK_QUEUE'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-slate-700" />
            <span>调度工单队列 ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CALIBRATION_DEPLOY')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CALIBRATION_DEPLOY'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-slate-700" />
            <span>工位与机械臂标定</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> 2/2 复合机器人在线
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> 地图版本: SMT_Floor_v2.4
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> 路径算法: A*+D* Lite
          </span>
        </div>
      </div>

      {/* Tab: 上位机 MOS ↔ RMS 协议协同与外设调试工作台 */}
      {activeTab === 'MOS_RMS_STUDIO' && (
        <div className="flex-1 min-h-[560px]">
          <MosRmsStudio
            userRole={userRole}
            stations={stations}
            onShowToast={onShowToast}
            onElevateRole={onElevateRole}
          />
        </div>
      )}

      {/* Tab 0: 底盘 SLAM 激光建图与地图管理 Studio */}
      {activeTab === 'CHASSIS_MAP' && (
        <div className="flex-1 min-h-[560px]">
          <ChassisMapStudio onShowToast={onShowToast} />
        </div>
      )}

      {/* Tab 1: Workshop Map & Fleet Real-time Topology */}
      {activeTab === 'MAP_TOPOLOGY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[440px]">
          {/* Left/Center 2D Workshop SVG Canvas */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  测厚车间 2D 拓扑网格地图 (实时比例尺 1:100)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" /> 搬运中
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full" /> 抓取/放料
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" /> 待命中
                </span>
              </div>
            </div>

            {/* Interactive SVG Map Floor */}
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center p-2">
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />

              <svg className="w-full h-full max-h-[380px] select-none" viewBox="0 0 600 320">
                {/* Transit Lanes (Roads) */}
                <rect x="50" y="90" width="500" height="50" fill="#f1f5f9" stroke="#cbd5e1" strokeDasharray="4 4" />
                <rect x="50" y="190" width="500" height="50" fill="#f1f5f9" stroke="#cbd5e1" strokeDasharray="4 4" />
                <rect x="140" y="40" width="50" height="240" fill="#f1f5f9" stroke="#cbd5e1" strokeDasharray="4 4" />
                <rect x="410" y="40" width="50" height="240" fill="#f1f5f9" stroke="#cbd5e1" strokeDasharray="4 4" />

                {/* Raw Material Buffer Racks (Top-Left) */}
                <rect x="20" y="30" width="90" height="55" rx="6" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="65" y="55" fill="#3730a3" fontSize="10" fontWeight="bold" textAnchor="middle">原料暂存区 A1</text>
                <text x="65" y="70" fill="#4f46e5" fontSize="8" textAnchor="middle">待测基板: 180片</text>

                {/* Station 1 (ST-01) */}
                <g transform="translate(200, 20)">
                  <rect width="120" height="60" rx="8" fill="#ffffff" stroke="#0284c7" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))" />
                  <rect x="5" y="5" width="110" height="18" rx="4" fill="#e0f2fe" />
                  <text x="60" y="18" fill="#0369a1" fontSize="10" fontWeight="bold" textAnchor="middle">1号测厚机 (ST-01)</text>
                  <text x="60" y="36" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">实时 1.252 mm (正常)</text>
                  <text x="60" y="50" fill="#059669" fontSize="8" textAnchor="middle">加工良率: 99.76%</text>
                </g>

                {/* Station 2 (ST-02) */}
                <g transform="translate(380, 20)">
                  <rect width="120" height="60" rx="8" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                  <rect x="5" y="5" width="110" height="18" rx="4" fill="#e0f2fe" />
                  <text x="60" y="18" fill="#0369a1" fontSize="10" fontWeight="bold" textAnchor="middle">2号测厚机 (ST-02)</text>
                  <text x="60" y="36" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">实时 1.501 mm (待机)</text>
                  <text x="60" y="50" fill="#d97706" fontSize="8" textAnchor="middle">待料就绪</text>
                </g>

                {/* Automated Charging Dock (CHG-01) */}
                <rect x="20" y="235" width="90" height="50" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                <text x="65" y="258" fill="#065f46" fontSize="9" fontWeight="bold" textAnchor="middle">自动充电桩 #01</text>
                <text x="65" y="272" fill="#047857" fontSize="8" textAnchor="middle">空闲就绪 (24V/30A)</text>

                {/* Finished Goods Outgoing Rack (Bottom-Right B1) */}
                <rect x="480" y="235" width="100" height="50" rx="6" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
                <text x="530" y="258" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">成品暂存区 B1</text>
                <text x="530" y="272" fill="#16a34a" fontSize="8" textAnchor="middle">已收料码垛: 340片</text>

                {/* Animated Navigation Route Line (from A1 to ST-01 for AMR-01) */}
                <path
                  d="M 110 55 L 165 55 L 165 140 L 200 140"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Draw 2 AMR Nodes on the Map */}
                {fleetAMRs.map((amr) => {
                  const isSelected = selectedAmrId === amr.id;
                  const isError = amr.status === 'ERROR';
                  const isNav = amr.status === 'NAVIGATING';
                  const isPick = amr.status === 'PICKING' || amr.status === 'PLACING';

                  const nodeColor = isError ? '#ef4444' : isPick ? '#8b5cf6' : isNav ? '#2563eb' : '#10b981';

                  return (
                    <g
                      key={amr.id}
                      transform={`translate(${amr.x}, ${amr.y})`}
                      onClick={() => setSelectedAmrId(amr.id)}
                      className="cursor-pointer"
                    >
                      {/* Selection Ring */}
                      {isSelected && (
                        <circle cx="0" cy="0" r="18" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 2" className="animate-spin" />
                      )}

                      {/* Robot Body */}
                      <circle cx="0" cy="0" r="13" fill="#ffffff" stroke={nodeColor} strokeWidth="2.5" />
                      <circle cx="0" cy="0" r="4.5" fill={nodeColor} />

                      {/* Heading Arrow indicator */}
                      <polygon points="0,-16 -3.5,-11 3.5,-11" fill={nodeColor} />

                      {/* Label Tag */}
                      <rect x="-32" y="16" width="64" height="15" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="0" y="27" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {amr.id} ({amr.battery}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-2">
              <span>点击地图中复合机器人或测厚机查看实时遥测及调度详情</span>
              <span className="text-blue-600 font-bold">地图分辨率: 0.05m/pixel (激光雷达建图)</span>
            </div>
          </div>

          {/* Right Selected AMR / Target Node Telemetry Drawer */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedAmrData?.name || '选择车辆'}</h3>
                    <p className="text-[10px] font-mono text-slate-500">编号: {selectedAmrData?.id}</p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                    selectedAmrData?.status === 'ERROR'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : selectedAmrData?.status === 'NAVIGATING'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {selectedAmrData?.status === 'NAVIGATING'
                    ? '导航中'
                    : selectedAmrData?.status === 'PICKING'
                    ? '对接中'
                    : '待命中'}
                </span>
              </div>

              {/* AMR Detailed Telemetry Status */}
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">当前执行任务:</span>
                    <span className="font-bold text-slate-900">{selectedAmrData?.task}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">关联工位:</span>
                    <span className="font-mono font-bold text-blue-600">{selectedAmrData?.station}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">动力电池电量:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                      <BatteryCharging className="w-3.5 h-3.5" />
                      <span>{selectedAmrData?.battery}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">实时坐标 (X, Y):</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {((selectedAmrData?.x || 100) * 0.05).toFixed(2)} m, {((selectedAmrData?.y || 100) * 0.05).toFixed(2)} m
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">通信延迟:</span>
                    <span className="font-mono text-emerald-600 font-bold">3.2 ms</span>
                  </div>
                </div>

                {/* AMR Quick Dispatch Controls */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    单车调度控制指令
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onShowToast(`已向 [${selectedAmrData?.id}] 发送重新规划路径指令`)}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3 text-blue-600" />
                      <span>重新规划路径</span>
                    </button>

                    <button
                      onClick={() => onShowToast(`已指派 [${selectedAmrData?.id}] 终止当前任务并返回待命区`)}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-slate-600" />
                      <span>返回待命区</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onShowToast(`已指令 [${selectedAmrData?.id}] 进入自动回充 (目标: 自动充电桩 #01)`)}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-300 text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                    <span>立即返回自动充电桩</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Fleet Quick Switcher */}
            <div className="pt-3 border-t border-slate-200">
              <p className="text-[10px] text-slate-400 font-mono mb-1.5">快捷选择车辆:</p>
              <div className="grid grid-cols-2 gap-2">
                {fleetAMRs.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAmrId(a.id)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedAmrId === a.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dispatch Tasks & Work Order Queue */}
      {activeTab === 'TASK_QUEUE' && (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          {/* Filters & Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">当前执行工单与排队调度任务 ({tasks.length})</h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'RUNNING', 'QUEUED', 'PAUSED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      taskFilter === filter
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'ALL' ? '全部工单' : filter === 'RUNNING' ? '执行中' : filter === 'QUEUED' ? '排队中' : '暂停'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建派发</span>
              </button>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3 px-4">工单编号</th>
                    <th className="py-3 px-4">任务名称/描述</th>
                    <th className="py-3 px-4">分配车辆</th>
                    <th className="py-3 px-4">起止路线 (起点 ➔ 终点)</th>
                    <th className="py-3 px-4">优先级</th>
                    <th className="py-3 px-4">执行进度</th>
                    <th className="py-3 px-4">状态</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-blue-600">{t.orderNumber}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">
                        {t.title}
                        <span className="block text-[10px] font-mono text-slate-400">批次: {t.lotId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {t.assignedAMR}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-700">
                        <span className="font-medium text-slate-900">{t.sourceStation}</span>
                        <span className="mx-1 text-blue-500 font-bold">➔</span>
                        <span className="font-medium text-slate-900">{t.targetStation}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'URGENT'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {t.priority === 'URGENT' ? '紧急' : t.priority === 'HIGH' ? '高' : '普通'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>{t.progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                t.status === 'COMPLETED'
                                  ? 'bg-emerald-500'
                                  : t.status === 'PAUSED'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${t.progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            t.status === 'RUNNING'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : t.status === 'QUEUED'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : t.status === 'PAUSED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {t.status === 'RUNNING' ? '运输中' : t.status === 'QUEUED' ? '排队中' : t.status === 'PAUSED' ? '暂停' : '已完成'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 font-sans">
                        {t.status === 'RUNNING' && (
                          <button
                            onClick={() => {
                              onUpdateTaskStatus(t.id, 'PAUSED');
                              onShowToast(`已暂停工单 [${t.orderNumber}] 的执行`);
                            }}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer"
                          >
                            暂停
                          </button>
                        )}
                        {t.status === 'PAUSED' && (
                          <button
                            onClick={() => {
                              onUpdateTaskStatus(t.id, 'RUNNING');
                              onShowToast(`已恢复工单 [${t.orderNumber}] 的自动执行`);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer"
                          >
                            恢复
                          </button>
                        )}
                        {t.status === 'QUEUED' && (
                          <button
                            onClick={() => {
                              onUpdateTaskStatus(t.id, 'RUNNING');
                              onShowToast(`已将工单 [${t.orderNumber}] 设为紧急插单立即启动`);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer shadow-sm"
                          >
                            立即执行
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Site Calibration & SLAM Deployment */}
      {activeTab === 'CALIBRATION_DEPLOY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
          {/* Left SLAM Map Config & Landmarks Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">车间现场工位对接标定点</h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  有效标定点: {calibrationPoints.length} 个 • 激光反光柱/二维码精度 &lt; 0.5mm
                </span>
              </div>

              {/* Calibration Points Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">地标名称</th>
                      <th className="py-2.5 px-3">所属工位</th>
                      <th className="py-2.5 px-3">类型</th>
                      <th className="py-2.5 px-3">基准坐标 (X, Y)</th>
                      <th className="py-2.5 px-3">朝向角 θ</th>
                      <th className="py-2.5 px-3">补偿误差</th>
                      <th className="py-2.5 px-3">状态</th>
                      <th className="py-2.5 px-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calibrationPoints.map((pt) => {
                      const isSelected = selectedPointId === pt.id;
                      return (
                        <tr
                          key={pt.id}
                          onClick={() => setSelectedPointId(pt.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-3 font-sans font-bold text-slate-900">{pt.name}</td>
                          <td className="py-3 px-3 text-blue-600 font-bold">{pt.stationId}</td>
                          <td className="py-3 px-3 text-slate-600">
                            {pt.type === 'PICKUP' ? '上料对接' : pt.type === 'DROPOFF' ? '收料对接' : '充电桩'}
                          </td>
                          <td className="py-3 px-3 text-slate-800">
                            ({pt.xCoord.toFixed(2)}m, {pt.yCoord.toFixed(2)}m)
                          </td>
                          <td className="py-3 px-3 text-slate-800">{pt.headingDeg.toFixed(1)}°</td>
                          <td className="py-3 px-3 font-bold text-slate-700">±{pt.offsetMm.toFixed(1)} mm</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pt.status === 'CALIBRATED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {pt.status === 'CALIBRATED' ? '已校准' : '需校准'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-sans">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPointId(pt.id);
                              }}
                              className="text-xs text-blue-600 font-bold hover:underline"
                            >
                              微调 ➔
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>当前载入地图: Workshop_SMT_Main_Floor_v2.4.map</span>
              <button
                onClick={() => onShowToast('激光雷达在线重构图功能已启动，复合机器人进入扫描建图模式')}
                className="text-blue-600 font-bold hover:underline"
              >
                + 启动雷达激光在线扫图
              </button>
            </div>
          </div>

          {/* Right Fine-Tuning Calibration Control Pad */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">地标坐标微调校正</h3>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600">{selectedPointData?.id}</span>
              </div>

              {selectedPointData ? (
                <div className="space-y-4 text-xs font-sans">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono">
                    <p className="font-sans font-bold text-slate-900">{selectedPointData.name}</p>
                    <p className="text-slate-500 text-[11px]">关联工位: {selectedPointData.stationId}</p>
                    <p className="text-slate-500 text-[11px]">上次校准: {selectedPointData.lastCalibrated}</p>
                    <div className="pt-1 text-sm font-bold text-slate-900">
                      坐标: X={selectedPointData.xCoord.toFixed(3)}m, Y={selectedPointData.yCoord.toFixed(3)}m, θ={selectedPointData.headingDeg.toFixed(1)}°
                    </div>
                  </div>

                  {/* Tuning Steppers for X, Y, and Heading */}
                  <div className="space-y-2.5">
                    {/* X Coordinate Adjustment */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-700">X 轴偏移补偿 (±1mm)</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateCalibration(selectedPointData.id, -0.001, 0, 0)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-bold text-slate-800 active:scale-95 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-16 text-center font-bold text-blue-600">
                          {selectedPointData.xCoord.toFixed(3)}m
                        </span>
                        <button
                          onClick={() => onUpdateCalibration(selectedPointData.id, 0.001, 0, 0)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-bold text-slate-800 active:scale-95 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Y Coordinate Adjustment */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-700">Y 轴偏移补偿 (±1mm)</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateCalibration(selectedPointData.id, 0, -0.001, 0)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-bold text-slate-800 active:scale-95 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-16 text-center font-bold text-blue-600">
                          {selectedPointData.yCoord.toFixed(3)}m
                        </span>
                        <button
                          onClick={() => onUpdateCalibration(selectedPointData.id, 0, 0.001, 0)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-bold text-slate-800 active:scale-95 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Heading Angle Adjustment */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-700">底盘朝向角 θ (±0.5°)</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateCalibration(selectedPointData.id, 0, 0, -0.5)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-bold text-slate-800 active:scale-95 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-16 text-center font-bold text-blue-600">
                          {selectedPointData.headingDeg.toFixed(1)}°
                        </span>
                        <button
                          onClick={() => onUpdateCalibration(selectedPointData.id, 0, 0, 0.5)}
                          className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-bold text-slate-800 active:scale-95 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Robotic Arm Cartesian Pick/Place TCP Pose Calibration Section */}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Bot className="w-3.5 h-3.5 text-indigo-600" />
                          <span>机械臂笛卡尔取放料点标定</span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          毫米级微调
                        </span>
                      </div>

                      {/* Arm Cartesian XYZ Controls */}
                      <div className="grid grid-cols-3 gap-1.5 mb-2 font-mono">
                        {(['x', 'y', 'z'] as const).map((axis) => {
                          const currentArmVal =
                            armCalibrationOffsets[selectedPointData.id]?.[axis] ??
                            (axis === 'x' ? 450.0 : axis === 'y' ? -100.0 : 200.0);
                          return (
                            <div key={axis} className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-center text-xs">
                              <span className="font-bold text-slate-500 uppercase block text-[10px]">
                                {axis.toUpperCase()} (mm)
                              </span>
                              <div className="flex items-center justify-between mt-1">
                                <button
                                  onClick={() => handleAdjustArmPose(selectedPointData.id, axis, -1.0)}
                                  className="w-5 h-5 bg-white hover:bg-indigo-600 hover:text-white rounded text-slate-800 font-bold border border-slate-300 shadow-sm active:scale-95 text-xs"
                                >
                                  -
                                </button>
                                <span className="font-bold text-indigo-600 text-[11px]">
                                  {currentArmVal.toFixed(1)}
                                </span>
                                <button
                                  onClick={() => handleAdjustArmPose(selectedPointData.id, axis, 1.0)}
                                  className="w-5 h-5 bg-white hover:bg-indigo-600 hover:text-white rounded text-slate-800 font-bold border border-slate-300 shadow-sm active:scale-95 text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Arm Cartesian Rx, Ry, Rz Controls */}
                      <div className="grid grid-cols-3 gap-1.5 font-mono">
                        {(['rx', 'ry', 'rz'] as const).map((axis) => {
                          const currentRotVal =
                            armCalibrationOffsets[selectedPointData.id]?.[axis] ??
                            (axis === 'rx' ? 180.0 : axis === 'ry' ? 0.0 : -45.0);
                          return (
                            <div key={axis} className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-center text-xs">
                              <span className="font-bold text-slate-500 uppercase block text-[10px]">
                                {axis.toUpperCase()} (度)
                              </span>
                              <div className="flex items-center justify-between mt-1">
                                <button
                                  onClick={() => handleAdjustArmPose(selectedPointData.id, axis, -0.5)}
                                  className="w-5 h-5 bg-white hover:bg-indigo-600 hover:text-white rounded text-slate-800 font-bold border border-slate-300 shadow-sm active:scale-95 text-xs"
                                >
                                  -
                                </button>
                                <span className="font-bold text-amber-600 text-[11px]">
                                  {currentRotVal.toFixed(1)}°
                                </span>
                                <button
                                  onClick={() => handleAdjustArmPose(selectedPointData.id, axis, 0.5)}
                                  className="w-5 h-5 bg-white hover:bg-indigo-600 hover:text-white rounded text-slate-800 font-bold border border-slate-300 shadow-sm active:scale-95 text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 font-mono text-xs">
                  请从左侧列表选择待校正标定点
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => onShowToast('已将当前标定微调参数固化并广播下发至 2 台复合机器人')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                保存并广播固化标定参数
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Dispatch Task */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 text-slate-900 relative">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              新建并派发复合机器人调度工单
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">手动派发任务工单</p>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">任务类型</label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value as DispatchTaskType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="FEEDING">上料运输 (原料区 ➔ 测厚机)</option>
                  <option value="DISCHARGING">收料码垛 (测厚机 ➔ 成品区)</option>
                  <option value="CHARGING">自动回充 (前往自动充电桩)</option>
                  <option value="INSPECTION">异常复检 (异常品分流)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">工单标题与批次描述</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">起始工位</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="原料暂存区 A1">原料暂存区 A1</option>
                    <option value="原料暂存区 A2">原料暂存区 A2</option>
                    <option value="1号测厚机 (ST-01)">1号测厚机 (ST-01)</option>
                    <option value="2号测厚机 (ST-02)">2号测厚机 (ST-02)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">目标工位</label>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="1号测厚机 (ST-01)">1号测厚机 (ST-01)</option>
                    <option value="2号测厚机 (ST-02)">2号测厚机 (ST-02)</option>
                    <option value="成品暂存区 B1">成品暂存区 B1</option>
                    <option value="自动充电桩 #01">自动充电桩 #01</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">指派车辆</label>
                  <select
                    value={newAssignedAmr}
                    onChange={(e) => setNewAssignedAmr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="AUTO">自动最优分配</option>
                    <option value="M-01 上料机">M-01 上料机 (电量94%)</option>
                    <option value="M-02 收料机">M-02 收料机 (电量88%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">调度优先级</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as DispatchPriority)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="NORMAL">普通</option>
                    <option value="HIGH">高 (优先排队)</option>
                    <option value="URGENT">紧急 (立即插单)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>立即派发工单</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
