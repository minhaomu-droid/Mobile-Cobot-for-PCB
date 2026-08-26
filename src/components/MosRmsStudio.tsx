import React, { useState, useEffect } from 'react';
import {
  Server,
  Radio,
  Cpu,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Send,
  Zap,
  Lock,
  Unlock,
  Sliders,
  Layers,
  FileCode,
  Check,
  X,
  FileText,
  Activity,
  Maximize2,
  Minimize2,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  Settings,
  HelpCircle,
  Clock,
  Sparkles,
  Network
} from 'lucide-react';
import {
  UserRole,
  ThicknessStation,
  MosMachineType,
  MosRmsTaskPayload,
  LaserDoorStatus,
  ThicknessSensorSignalStatus,
  MosProtocolLogItem,
  LaserDeviceCommand
} from '../types';

interface MosRmsStudioProps {
  userRole: UserRole;
  stations: ThicknessStation[];
  onShowToast: (msg: string) => void;
  onElevateRole?: (role: UserRole) => void;
}

export const MosRmsStudio: React.FC<MosRmsStudioProps> = ({
  userRole,
  stations,
  onShowToast,
  onElevateRole,
}) => {
  const isEngineer = userRole === 'ENGINEER' || userRole === 'ADMIN';

  // Sub-view Tab: 'STUDIO' (5大核心职责交互) | 'OPTIMIZATION' (架构优化建议) | 'PACKET_LOGS' (协议报文监控)
  const [activeSubTab, setActiveSubTab] = useState<'STUDIO' | 'OPTIMIZATION' | 'PACKET_LOGS'>('STUDIO');

  // Protocol Logs state
  const [logs, setLogs] = useState<MosProtocolLogItem[]>([
    {
      id: 'LOG-1001',
      direction: 'MES_TO_MOS',
      method: 'POST',
      endpoint: '/mes/api/v1/order-dispatch',
      summary: 'MES 下发测厚工单 (WO-2026-0817A, LOT-003)',
      statusCode: 200,
      payload: { mes_order_no: 'MES-2026-0817-0021', machine_id: 'ST-01', pcb_spec: '510x410mm', thickness: 1.25 },
      response: { success: true, code: 0, message: 'ACCEPTED' },
      timestamp: '10:14:02.120',
      latencyMs: 12,
    },
    {
      id: 'LOG-1002',
      direction: 'MOS_TO_RMS',
      method: 'POST',
      endpoint: '/rms/api/v1/tasks',
      summary: 'MOS 转换并同步订单至 RMS 调度系统',
      statusCode: 200,
      payload: {
        task_id: 'T-20260817-000101',
        machine_type: 'THICKNESS_TESTER',
        machine_id: 'ST-01',
        priority: 5,
        deadline: Date.now() + 3600000,
        material: { material_type: 'PCB-FR4', material_shape: 'RECT', dimensions: { length: 510, width: 410 }, material_thickness: 1.25 },
      },
      response: { success: true, code: 0, message: 'OK', data: { task_id: 'T-20260817-000101', status: 'CREATED', accepted_at: Date.now() } },
      timestamp: '10:14:02.340',
      latencyMs: 18,
    },
    {
      id: 'LOG-1003',
      direction: 'PLC_TO_MOS',
      method: 'POST',
      endpoint: '/mos/api/v1/plc/sensor-event',
      summary: 'ST-01 测厚机 PLC 光电传感器触发：可上料 (LOAD_READY)',
      statusCode: 200,
      payload: { station: 'ST-01', photoSensor_in: 1, readyForLoading: true },
      response: { received: true },
      timestamp: '10:14:05.812',
      latencyMs: 4,
    },
    {
      id: 'LOG-1004',
      direction: 'MOS_TO_RMS',
      method: 'POST',
      endpoint: '/rms/api/v1/device-status',
      summary: 'MOS 转发测厚机上料信号至 RMS: LOAD_READY',
      statusCode: 200,
      payload: { device_type: 'THICKNESS_SENSOR', device_id: 'ST-01', device_status: 'LOAD_READY', timestamp: Date.now() },
      response: { success: true, code: 0, message: 'OK' },
      timestamp: '10:14:05.830',
      latencyMs: 9,
    },
  ]);

  const addLog = (log: Omit<MosProtocolLogItem, 'id' | 'timestamp'>) => {
    const newLog: MosProtocolLogItem = {
      ...log,
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Selected Log for detail modal / drawer
  const [selectedLog, setSelectedLog] = useState<MosProtocolLogItem | null>(null);

  // ============================================================
  // 职责 1: 接收 MES 工单，把工单同步到 RMS (State & Handlers)
  // ============================================================
  const [taskFormMachineType, setTaskFormMachineType] = useState<MosMachineType>('THICKNESS_TESTER');
  const [taskFormMachineId, setTaskFormMachineId] = useState<string>('ST-01');
  const [taskFormMaterialType, setTaskFormMaterialType] = useState<string>('PCB-FR4-HighDensity');
  const [taskFormLength, setTaskFormLength] = useState<number>(510);
  const [taskFormWidth, setTaskFormWidth] = useState<number>(410);
  const [taskFormThickness, setTaskFormThickness] = useState<number>(1.25);
  const [taskFormPriority, setTaskFormPriority] = useState<number>(5);
  const [taskFormMesOrderNo, setTaskFormMesOrderNo] = useState<string>('MES-2026-0817-0099');
  const [createdTaskId, setCreatedTaskId] = useState<string>('T-20260817-000101');
  const [taskStatusResult, setTaskStatusResult] = useState<string | null>(null);

  const handleSyncMesOrderToRms = () => {
    if (!isEngineer) {
      onShowToast('权限拦截：MOS 与 RMS 协议底层调度调试仅向工程师/管理员开放');
      return;
    }
    const newTaskId = `T-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
    setCreatedTaskId(newTaskId);

    const payload: MosRmsTaskPayload = {
      task_id: newTaskId,
      machine_type: taskFormMachineType,
      machine_id: taskFormMachineId,
      priority: taskFormPriority,
      deadline: Date.now() + 7200000,
      material: {
        material_type: taskFormMaterialType,
        material_shape: 'RECT',
        dimensions: { length: taskFormLength, width: taskFormWidth },
        material_thickness: taskFormThickness,
      },
      extra: {
        mes_order_no: taskFormMesOrderNo,
        lot_no: 'LOT-20260817-A01',
        operator_id: 'OP-502',
      },
    };

    addLog({
      direction: 'MOS_TO_RMS',
      method: 'POST',
      endpoint: '/rms/api/v1/tasks',
      summary: `[职责1] 下发工单 ${taskFormMesOrderNo} ➔ RMS 任务 [${newTaskId}]`,
      statusCode: 200,
      payload,
      response: {
        success: true,
        code: 0,
        message: 'OK',
        data: {
          task_id: newTaskId,
          status: 'CREATED',
          accepted_at: Date.now(),
        },
      },
      latencyMs: 14,
    });

    setTaskStatusResult(`已成功下发至 RMS 调度器 (任务ID: ${newTaskId})，料架计数已同步重置`);
    onShowToast(`【职责1】MES 工单已转换并成功下发到 RMS (Task: ${newTaskId})`);
  };

  const handleCancelTask = () => {
    if (!isEngineer) {
      onShowToast('权限不足');
      return;
    }
    addLog({
      direction: 'MOS_TO_RMS',
      method: 'POST',
      endpoint: `/rms/api/v1/tasks/${createdTaskId}/cancel`,
      summary: `[职责1] 取消 RMS 调度任务 [${createdTaskId}]`,
      statusCode: 200,
      payload: { reason: 'MES_RECALL_OR_MANUAL_CANCEL' },
      response: { success: true, code: 0, message: 'OK', data: { task_id: createdTaskId } },
      latencyMs: 11,
    });
    setTaskStatusResult(`任务 ${createdTaskId} 已取消`);
    onShowToast(`【职责1】已向 RMS 发送取消任务请求 [${createdTaskId}]`);
  };

  const handleQueryTaskStatus = () => {
    addLog({
      direction: 'MOS_TO_RMS',
      method: 'GET',
      endpoint: `/rms/api/v1/tasks/${createdTaskId}`,
      summary: `[职责1-降级查询] 查询任务状态 [${createdTaskId}]`,
      statusCode: 200,
      payload: {},
      response: {
        success: true,
        code: 0,
        message: 'OK',
        data: {
          task_id: createdTaskId,
          sub_task_id: `${createdTaskId}-CR001-1`,
          status: 'RUNNING',
          robot_id: 'M-01 (CR-001)',
          machine_id: taskFormMachineId,
          created_at: Date.now() - 30000,
          updated_at: Date.now(),
        },
      },
      latencyMs: 8,
    });
    setTaskStatusResult(`查询结果: 任务执行中 (RUNNING), 负责机器人: M-01 (CR-001)`);
    onShowToast(`【职责1】已从 RMS 获取任务最新状态`);
  };

  // ============================================================
  // 职责 2: 测厚机 PLC 上料/下料信号上报 (State & Handlers)
  // ============================================================
  const [stationSignals, setStationSignals] = useState<Record<string, ThicknessSensorSignalStatus>>({
    'ST-01': 'LOAD_READY',
    'ST-02': 'IDLE',
  });

  const handleSendThicknessSignal = (stId: string, signal: ThicknessSensorSignalStatus) => {
    if (!isEngineer) {
      onShowToast('权限拦截：测厚机 PLC 信号强制改写仅工程师可用');
      return;
    }
    setStationSignals((prev) => ({ ...prev, [stId]: signal }));

    // 1. PLC to MOS Log
    addLog({
      direction: 'PLC_TO_MOS',
      method: 'POST',
      endpoint: `/mos/api/v1/plc/${stId}/io-trigger`,
      summary: `[职责2] PLC 采集 ${stId} 信号变更 ➔ ${signal}`,
      statusCode: 200,
      payload: { station_id: stId, signal, register_address: '0x3010', timestamp: Date.now() },
      response: { ack: true },
      latencyMs: 3,
    });

    // 2. MOS to RMS POST /rms/api/v1/device-status
    addLog({
      direction: 'MOS_TO_RMS',
      method: 'POST',
      endpoint: '/rms/api/v1/device-status',
      summary: `[职责2] 上报测厚机状态至 RMS: ${stId} ➔ ${signal}`,
      statusCode: 200,
      payload: {
        device_type: 'THICKNESS_SENSOR',
        device_id: stId,
        device_status: signal,
        task_id: createdTaskId,
        timestamp: Date.now(),
      },
      response: { success: true, code: 0, message: 'OK' },
      latencyMs: 10,
    });

    onShowToast(`【职责2】已向 RMS 上报测厚机 [${stId}] 信号: ${signal === 'LOAD_READY' ? '可上料' : signal === 'UNLOAD_READY' ? '可下料' : '空闲'}`);
  };

  // ============================================================
  // 职责 3 & 4: 镭射机开关门控制与门状态发给 RMS (State & Handlers)
  // ============================================================
  const [laserDoorState, setLaserDoorState] = useState<LaserDoorStatus>('DOOR_CLOSED');
  const [laserCurrentOpId, setLaserCurrentOpId] = useState<string | null>(null);
  const [isLaserDoorBusy, setIsLaserDoorBusy] = useState<boolean>(false);

  const handleSimulateRmsDoorCommand = (command: LaserDeviceCommand) => {
    if (!isEngineer) {
      onShowToast('权限拦截：镭射机门控协议调试仅工程师可用');
      return;
    }
    if (isLaserDoorBusy) {
      onShowToast('安全互斥拦截：当前已有正在执行的门动作操作号 (op_id)');
      return;
    }

    const opId = `OP-${Date.now().toString().slice(-6)}`;
    setLaserCurrentOpId(opId);
    setIsLaserDoorBusy(true);

    // 1. RMS -> MOS POST /mos/api/v1/device-control
    addLog({
      direction: 'RMS_TO_MOS',
      method: 'POST',
      endpoint: '/mos/api/v1/device-control',
      summary: `[职责3] 接收 RMS 镭射机控制请求: M-101 ➔ ${command === 'DOOR_OPEN' ? '开门' : '关门'}`,
      statusCode: 200,
      payload: {
        op_id: opId,
        task_id: createdTaskId,
        device_type: 'LASER_MACHINE',
        device_id: 'M-101',
        device_command: command,
        timestamp: Date.now(),
      },
      response: { success: true, code: 0, message: 'OK', data: { op_id: opId } },
      latencyMs: 6,
    });

    // 2. Immediate state transition to DOOR_MOVING
    setLaserDoorState('DOOR_MOVING');
    addLog({
      direction: 'MOS_TO_RMS',
      method: 'POST',
      endpoint: '/rms/api/v1/device-status',
      summary: `[职责4] MOS 上报镭射机 M-101 状态: DOOR_MOVING (门运动中)`,
      statusCode: 200,
      payload: {
        device_type: 'LASER_MACHINE',
        device_id: 'M-101',
        device_status: 'DOOR_MOVING',
        task_id: createdTaskId,
        timestamp: Date.now(),
      },
      response: { success: true, code: 0, message: 'OK' },
      latencyMs: 7,
    });

    // 3. Physical simulated completion after 1.5 seconds
    setTimeout(() => {
      const finalState: LaserDoorStatus = command === 'DOOR_OPEN' ? 'DOOR_OPENED' : 'DOOR_CLOSED';
      setLaserDoorState(finalState);
      setIsLaserDoorBusy(false);

      addLog({
        direction: 'MOS_TO_RMS',
        method: 'POST',
        endpoint: '/rms/api/v1/device-status',
        summary: `[职责4] MOS 上报镭射机 M-101 状态: ${finalState} (到位闭环)`,
        statusCode: 200,
        payload: {
          device_type: 'LASER_MACHINE',
          device_id: 'M-101',
          device_status: finalState,
          task_id: createdTaskId,
          timestamp: Date.now(),
        },
        response: { success: true, code: 0, message: 'OK' },
        latencyMs: 9,
      });

      onShowToast(`【职责4】镭射机门已${command === 'DOOR_OPEN' ? '开启到位 (DOOR_OPENED)' : '关闭到位 (DOOR_CLOSED)'}，状态已同步 RMS`);
    }, 1500);
  };

  // ============================================================
  // 职责 5: 围栏光栅触发急停发给 RMS (State & Handlers)
  // ============================================================
  const [isCurtainTriggered, setIsCurtainTriggered] = useState<boolean>(false);
  const [curtainAffectedRobots, setCurtainAffectedRobots] = useState<string[]>([]);
  const [estopLatency, setEstopLatency] = useState<number>(14);

  const handleTriggerCurtainEstop = () => {
    if (!isEngineer) {
      onShowToast('权限拦截：光栅急停联动测试仅工程师可用');
      return;
    }
    const areaId = 'CURTAIN-ZONE-01';
    setIsCurtainTriggered(true);
    const affected = ['CR-001 (上料AMR)', 'CR-002 (下料AMR)'];
    setCurtainAffectedRobots(affected);
    setEstopLatency(12);

    addLog({
      direction: 'MOS_TO_RMS',
      method: 'POST',
      endpoint: '/rms/api/v1/emergency-stop',
      summary: `[职责5] ⚠️ 安全围栏光栅触发急停 ➔ RMS (区域: ${areaId})`,
      statusCode: 200,
      payload: {
        area_id: areaId,
        trigger: 'SAFETY_CURTAIN',
        timestamp: Date.now(),
      },
      response: {
        success: true,
        code: 0,
        message: 'OK',
        data: {
          robots_notified: ['CR-001', 'CR-002'],
          preemption_zones_freed: ['ZONE-01-CROSSING', 'ZONE-02-CORRIDOR'],
          latency_ms: 12,
        },
      },
      latencyMs: 12,
    });

    onShowToast(`【职责5 ⚠️】安全光栅触发！已在 12ms 内向 RMS 发送急停广播，抢占区已强制 FREE`);
  };

  const handleResetCurtainEstop = () => {
    if (!isEngineer) {
      onShowToast('权限不足');
      return;
    }
    setIsCurtainTriggered(false);
    setCurtainAffectedRobots([]);

    addLog({
      direction: 'MOS_TO_RMS',
      method: 'POST',
      endpoint: '/rms/api/v1/emergency-stop/reset-confirm',
      summary: `[职责5] 人工安全确认完成，解除 CURTAIN-ZONE-01 急停锁定`,
      statusCode: 200,
      payload: { area_id: 'CURTAIN-ZONE-01', operator: 'Senior Engineer', timestamp: Date.now() },
      response: { success: true, code: 0, message: 'RESTORED' },
      latencyMs: 15,
    });

    onShowToast(`【职责5】安全光栅急停已解除，抢占区与调度系统恢复`);
  };

  return (
    <div className="space-y-4">
      {/* 权限状态与安全认证条 (Engineer Permission Bar) */}
      <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isEngineer
          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
          : 'bg-amber-50/80 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
            isEngineer ? 'bg-emerald-600' : 'bg-amber-500'
          }`}>
            {isEngineer ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide">
                上位机 MOS ↔ RMS 协议协同与外设工作台
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                isEngineer
                  ? 'bg-emerald-200 text-emerald-800 border border-emerald-400'
                  : 'bg-amber-200 text-amber-900 border border-amber-400'
              }`}>
                {isEngineer ? '高级工程师权限 (完全开放)' : '操作员只读模式 (受限)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono mt-0.5">
              通讯规范: HTTP/JSON RESTful • MOS端口: :8080 • RMS端口: :9090 • 约束: 光栅急停 &lt;100ms
            </p>
          </div>
        </div>

        {/* Quick Role Switcher for Test and Demonstration */}
        <div className="flex items-center gap-2">
          {!isEngineer ? (
            <button
              onClick={() => {
                if (onElevateRole) onElevateRole('ENGINEER');
                onShowToast('已提权为【高级工程师】：全套 MOS ↔ RMS 协议测试与信号改写已解锁');
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>工程师一键认证/解锁</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onElevateRole) onElevateRole('OPERATOR');
                onShowToast('已切换为操作员身份：查看只读与权限拦截效果');
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>切回操作员模式</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs: 1. 五大核心职责调试 | 2. 架构协议优化建议 | 3. 实时报文监视器 */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('STUDIO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'STUDIO'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>5大核心职责交互控制台</span>
          </button>

          <button
            onClick={() => setActiveSubTab('OPTIMIZATION')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'OPTIMIZATION'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>架构与协议优化分析建议</span>
          </button>

          <button
            onClick={() => setActiveSubTab('PACKET_LOGS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'PACKET_LOGS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
            <span>全链路 RESTful 报文监控 ({logs.length})</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
          心跳周期: 1000ms • 链路协议: HTTP/JSON RESTful
        </div>
      </div>

      {/* ============================================================ */}
      {/* 视图 1: 五大核心职责实操调试工作台 */}
      {/* ============================================================ */}
      {activeSubTab === 'STUDIO' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* ------------------------------------------------------------ */}
            {/* 职责 1: 接收 MES 工单，把工单同步到 RMS (Left 7 Cols) */}
            {/* ------------------------------------------------------------ */}
            <div className="lg:col-span-7 bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">
                      接收 MES 工单，把工单同步到 RMS
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      端点: POST /rms/api/v1/tasks • 重置料架计数并派发
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold">
                  MES ➔ MOS ➔ RMS
                </span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">机台类型 (machine_type)</label>
                  <select
                    value={taskFormMachineType}
                    onChange={(e) => {
                      const mType = e.target.value as MosMachineType;
                      setTaskFormMachineType(mType);
                      setTaskFormMachineId(mType === 'THICKNESS_TESTER' ? 'ST-01' : 'M-101');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold"
                  >
                    <option value="THICKNESS_TESTER">THICKNESS_TESTER (测厚机)</option>
                    <option value="LASER_MACHINE">LASER_MACHINE (镭射机)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">机台编号 (machine_id)</label>
                  <input
                    type="text"
                    value={taskFormMachineId}
                    onChange={(e) => setTaskFormMachineId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">MES工单号 (mes_order_no)</label>
                  <input
                    type="text"
                    value={taskFormMesOrderNo}
                    onChange={(e) => setTaskFormMesOrderNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">物料规格 (L × W mm)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={taskFormLength}
                      onChange={(e) => setTaskFormLength(Number(e.target.value))}
                      className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-xs text-center"
                      placeholder="长"
                    />
                    <span className="text-slate-400">×</span>
                    <input
                      type="number"
                      value={taskFormWidth}
                      onChange={(e) => setTaskFormWidth(Number(e.target.value))}
                      className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-xs text-center"
                      placeholder="宽"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">板材厚度 (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taskFormThickness}
                    onChange={(e) => setTaskFormThickness(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-center font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">调度优先级 (0~9)</label>
                  <select
                    value={taskFormPriority}
                    onChange={(e) => setTaskFormPriority(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold"
                  >
                    <option value={9}>9 (最高优先级/加急)</option>
                    <option value={5}>5 (正常生产任务)</option>
                    <option value={1}>1 (低优先级/首件)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncMesOrderToRms}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>同步工单至 RMS (POST /tasks)</span>
                  </button>

                  <button
                    onClick={handleQueryTaskStatus}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>查询状态 (GET)</span>
                  </button>

                  <button
                    onClick={handleCancelTask}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-300 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>取消任务</span>
                  </button>
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  当前任务: <strong>{createdTaskId}</strong>
                </span>
              </div>

              {taskStatusResult && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px] font-mono text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{taskStatusResult}</span>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* 职责 2: 测厚机需要上料/下料信号发给 RMS (Right 5 Cols) */}
            {/* ------------------------------------------------------------ */}
            <div className="lg:col-span-5 bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">
                      测厚机上料/下料信号发给 RMS
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      端点: POST /rms/api/v1/device-status
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                  PLC ➔ MOS ➔ RMS
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Station 1 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 block">1号测厚机 (ST-01)</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      当前信号: <strong className="text-blue-700">{stationSignals['ST-01']}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendThicknessSignal('ST-01', 'LOAD_READY')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stationSignals['ST-01'] === 'LOAD_READY'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      可上料 (LOAD)
                    </button>
                    <button
                      onClick={() => handleSendThicknessSignal('ST-01', 'UNLOAD_READY')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stationSignals['ST-01'] === 'UNLOAD_READY'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      可下料 (UNLOAD)
                    </button>
                  </div>
                </div>

                {/* Station 2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 block">2号测厚机 (ST-02)</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      当前信号: <strong className="text-blue-700">{stationSignals['ST-02']}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendThicknessSignal('ST-02', 'LOAD_READY')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stationSignals['ST-02'] === 'LOAD_READY'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      可上料 (LOAD)
                    </button>
                    <button
                      onClick={() => handleSendThicknessSignal('ST-02', 'UNLOAD_READY')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stationSignals['ST-02'] === 'UNLOAD_READY'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      可下料 (UNLOAD)
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-100 p-2 rounded-lg leading-relaxed">
                ℹ️ 测厚机为开放式机台无需开关门，PLC 通过光电感应放料板到位后直接给到 MOS，MOS 转发 RMS 派发对应单 CR (负责上料或下料)。
              </div>
            </div>
          </div>

          {/* Bottom Grid for Duties 3, 4 & 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* ------------------------------------------------------------ */}
            {/* 职责 3 & 4: 镭射机开关门请求接收 + 门状态上报 RMS (7 Cols) */}
            {/* ------------------------------------------------------------ */}
            <div className="lg:col-span-7 bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    3/4
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">
                      接收 RMS 镭射机开关门请求 & 门状态上报
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      端点: POST /mos/api/v1/device-control ↔ POST /rms/api/v1/device-status
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
                  CR ➔ RMS ➔ MOS ➔ 镭射机 ➔ RMS
                </span>
              </div>

              {/* Door Visualizer & Status Block */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Visual Animated Door Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                    laserDoorState === 'DOOR_OPENED'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : laserDoorState === 'DOOR_MOVING'
                      ? 'bg-amber-100 border-amber-400 text-amber-700 animate-pulse'
                      : 'bg-slate-200 border-slate-400 text-slate-700'
                  }`}>
                    {laserDoorState === 'DOOR_OPENED' ? (
                      <Unlock className="w-6 h-6" />
                    ) : laserDoorState === 'DOOR_MOVING' ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">镭射机 M-101 门控机构</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                        laserDoorState === 'DOOR_OPENED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : laserDoorState === 'DOOR_MOVING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-200 text-slate-800 border border-slate-300'
                      }`}>
                        {laserDoorState === 'DOOR_OPENED' ? '已开门 (DOOR_OPENED)' : laserDoorState === 'DOOR_MOVING' ? '门运动中 (DOOR_MOVING)' : '已关门 (DOOR_CLOSED)'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      操作流水号: {laserCurrentOpId || '无活动 op_id'} • 互斥状态: {isLaserDoorBusy ? '正在运动 (锁定)' : '空闲可操作'}
                    </p>
                  </div>
                </div>

                {/* Control Triggers */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSimulateRmsDoorCommand('DOOR_OPEN')}
                    disabled={isLaserDoorBusy || laserDoorState === 'DOOR_OPENED'}
                    className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      laserDoorState === 'DOOR_OPENED' || isLaserDoorBusy
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>模拟 CR 请求开门</span>
                  </button>

                  <button
                    onClick={() => handleSimulateRmsDoorCommand('DOOR_CLOSE')}
                    disabled={isLaserDoorBusy || laserDoorState === 'DOOR_CLOSED'}
                    className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      laserDoorState === 'DOOR_CLOSED' || isLaserDoorBusy
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-700 hover:bg-slate-800 text-white active:scale-95'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>模拟 CR 请求关门</span>
                  </button>
                </div>
              </div>

              {/* Safety Rules Display */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-600">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block">安全约束 1</span>
                  开门必须由 CR 发起，禁止镭射机自动随意开门
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block">安全约束 2</span>
                  同一设备同时只允许一个 op_id 互斥执行
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block">安全约束 3</span>
                  开关门期间机器人底盘与手臂必须锁定禁止移动
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* 职责 5: 围栏光栅急停信号发给 RMS (5 Cols) */}
            {/* ------------------------------------------------------------ */}
            <div className="lg:col-span-5 bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">
                      围栏光栅触发急停发给 RMS
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      端点: POST /rms/api/v1/emergency-stop
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-mono font-bold">
                  光栅 ➔ MOS ➔ RMS ➔ CR
                </span>
              </div>

              {/* Curtain Trigger Box */}
              <div className={`p-3 rounded-xl border-2 transition-all ${
                isCurtainTriggered
                  ? 'bg-red-50 border-red-400 text-red-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-5 h-5 ${isCurtainTriggered ? 'text-red-600 animate-bounce' : 'text-slate-400'}`} />
                    <span className="text-xs font-black">
                      {isCurtainTriggered ? '🚨 安全围栏光栅被触发 (急停激活)' : '外围围栏光栅回路正常 (使能)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    区域: CURTAIN-ZONE-01
                  </span>
                </div>

                {isCurtainTriggered && (
                  <div className="space-y-1 text-[11px] font-mono bg-white/80 p-2 rounded-lg border border-red-200 mb-2">
                    <div>● RMS 广播急停通知机器人: <strong>{curtainAffectedRobots.join(', ')}</strong></div>
                    <div>● 抢占区状态: <strong>强制释放 (FREE)</strong>，禁止派发新任务</div>
                    <div>● 通信响应时延: <strong className="text-emerald-700">{estopLatency} ms</strong> (&lt; 100ms 达标)</div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {!isCurtainTriggered ? (
                    <button
                      onClick={handleTriggerCurtainEstop}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>模拟光栅遮挡 / 闯入急停</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleResetCurtainEstop}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>解除光栅急停 (人工复核确认)</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono bg-slate-100 p-2 rounded-lg">
                ⚠️ 协议硬性指标：RMS 收到急停信号后，须在 100ms 内向受影响区域所有 CR 下发急停指令，急停期间抢占区强制释放。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 视图 2: 系统架构与协议优化深度分析建议 */}
      {/* ============================================================ */}
      {activeSubTab === 'OPTIMIZATION' && (
        <div className="space-y-4">
          {/* Comparison Card: 测厚机 vs 镭射机 */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>部署场景对比与业务流向特性 (测厚机场景 vs 镭射机场景)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">对比维度</th>
                    <th className="p-2.5 text-blue-800">测厚机场景 (单 CR + 双机台)</th>
                    <th className="p-2.5 text-indigo-800">镭射机场景 (单 CR + 单机台)</th>
                    <th className="p-2.5 text-emerald-800">上位机 MOS 处理要点</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-2.5 font-bold">CR 分工协作</td>
                    <td className="p-2.5">上料/下料分离，单 CR 可同时服务 2 台测厚机</td>
                    <td className="p-2.5">上下料一体，单次 1 CR 对应 1 台镭射机</td>
                    <td className="p-2.5 text-slate-600">MOS 接收 MES 单个工单后按机台号转派 RMS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">机台就绪与门控</td>
                    <td className="p-2.5">开放式机台无门，PLC 直接上报可上料/可下料</td>
                    <td className="p-2.5">封闭式门控，开门由 CR 发起，MOS 控制气缸开关</td>
                    <td className="p-2.5 text-slate-600">处理 op_id 互斥与门运动中 (MOVING) 状态闭环</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">首件与循环控制</td>
                    <td className="p-2.5">首件可选，PAD 可跳过直接执行循环任务</td>
                    <td className="p-2.5">每个工单必须执行首件任务，确认后再下发循环</td>
                    <td className="p-2.5 text-slate-600">首件任务状态严格同步，防漏测放行</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">安全急停防线</td>
                    <td className="p-2.5">外围围栏光栅 ➔ MOS ➔ RMS ➔ 广播受影响 CR</td>
                    <td className="p-2.5">门机电互锁 + CR 内部锁定 + 光栅急停</td>
                    <td className="p-2.5 text-slate-600">&lt; 100ms 毫秒级转发，抢占区强制 FREE</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5 大工业级落地优化建议 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 优化 1 */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Radio className="w-4 h-4" />
                <h4 className="text-xs font-black">1. 心跳容错与降级断网重试补偿</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                <strong>现状痛点：</strong>HTTP RESTful 协议在车间强电磁干扰环境下偶发丢包，可能导致回调丢失。<br />
                <strong>优化对策：</strong>建议在 MOS 与 RMS 间建立 1000ms 双向心跳；MOS 客户端对关键状态请求配置 <strong>3次指数退避重试</strong>，超限后启用本地缓存队列并自动降级为 <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">GET /tasks/&#123;id&#125;</code> 轮询对账。
              </p>
            </div>

            {/* 优化 2 */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-indigo-700">
                <Network className="w-4 h-4" />
                <h4 className="text-xs font-black">2. 海康 AGV 抢占区防死锁租约机制</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                <strong>现状痛点：</strong>测厚机区域有多台 CR 与海康 AGV 路线交叉，互锁若无超时易出现互相等待死锁。<br />
                <strong>优化对策：</strong>在 RMS ↔ HikScheduler 互锁协议中引入 <strong>Lease 租约超时机制（如 15 秒续约）</strong> 与优先级仲裁（生产加急工单 &gt; 循环搬运 &gt; 巡检空跑），死锁检测触发后自动让行回退。
              </p>
            </div>

            {/* 优化 3 */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-black">3. 镭射机开门超时防撞二次互锁</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                <strong>现状痛点：</strong>镭射机气缸如果卡死或气压不足，门未完全打开若机械臂贸然伸入可能撞损。<br />
                <strong>优化对策：</strong>增加 <strong>15秒门运动超时熔断保护</strong>；在机械臂末端加装超声波/激光测距传感器，只有在接收到 <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">DOOR_OPENED</code> 且末端传感器验证净空通过时才使能机械臂伸出。
              </p>
            </div>

            {/* 优化 4 */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <Sliders className="w-4 h-4" />
                <h4 className="text-xs font-black">4. PLC 信号防抖滤波与料架计数幂等</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                <strong>现状痛点：</strong>PLC 光电传感器可能受板材反光干扰产生抖动误报；网络重传可能导致 WMS 计数重复递增。<br />
                <strong>优化对策：</strong>MOS 上位机驱动层增加 <strong>200ms 防抖滤波</strong>；向 RMS/WMS 上报料架计数时严格携带全链路唯一的 <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">sub_task_id</code>，实现全局幂等计数。
              </p>
            </div>

            {/* 优化 5 */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="w-4 h-4" />
                <h4 className="text-xs font-black">5. 安全光栅区域化微切断与三重复位</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                <strong>现状痛点：</strong>单处光栅触发如果整厂急停会大幅影响 OEE 稼动率。<br />
                <strong>优化对策：</strong>划分安全网格分区（Zone 01 / Zone 02），仅对闯入物理区域内的 CR 施加硬急停，邻近区域 CR 降速为 0.1m/s 安全避让；解除急停需满足“物理光栅复位 + MOS 工程师签名确认 + 机器人 SLAM 零位校验”三重闭环。
              </p>
            </div>

            {/* 优化 6 */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-purple-700">
                <Lock className="w-4 h-4" />
                <h4 className="text-xs font-black">6. 严格工程师 RBAC 权限隔离体系</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                <strong>现状痛点：</strong>操作员若误触底层协议下发或改写 PLC 信号可能导致物理撞机。<br />
                <strong>优化对策：</strong>将所有底层 RESTful 接口调试、PLC 信号强置、门控与急停模拟严格绑定至 <strong>ENGINEER / ADMIN</strong> 角色令牌，现场 Pad 终端支持刷工牌 NFC 快速鉴权。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 视图 3: 全链路 RESTful 协议报文监控诊断流 */}
      {/* ============================================================ */}
      {activeSubTab === 'PACKET_LOGS' && (
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-800">
                MOS ↔ RMS ↔ MES ↔ PLC 全链路通讯报文追踪器
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogs([])}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 cursor-pointer"
              >
                清空日志
              </button>
              <span className="text-[10px] font-mono text-slate-500">
                实时监听端口 :8080 (RESTful)
              </span>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[480px] space-y-2 font-mono text-xs pr-1">
            {logs.map((log) => {
              const isMosToRms = log.direction === 'MOS_TO_RMS';
              const isRmsToMos = log.direction === 'RMS_TO_MOS';
              const isMes = log.direction === 'MES_TO_MOS';
              const isPlc = log.direction === 'PLC_TO_MOS';

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-2.5 transition-all cursor-pointer flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        isMosToRms
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : isRmsToMos
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : isPlc
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-purple-100 text-purple-800 border border-purple-300'
                      }`}>
                        {log.direction}
                      </span>
                      <span className="font-bold text-slate-800">{log.method}</span>
                      <span className="text-slate-600 font-bold">{log.endpoint}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{log.latencyMs}ms</span>
                      <span className="text-emerald-700 font-bold">HTTP {log.statusCode}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 font-sans flex items-center justify-between">
                    <span>{log.summary}</span>
                    <span className="text-[10px] text-blue-600 font-mono hover:underline">
                      查看 JSON 报文 ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JSON Payload Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl max-w-2xl w-full p-5 space-y-3 font-mono text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {selectedLog.method} {selectedLog.endpoint}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans">
                    {selectedLog.summary} • {selectedLog.timestamp} ({selectedLog.latencyMs}ms)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="font-bold text-slate-700 block mb-1 text-[11px]">Request Body (请求载荷):</span>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto text-[11px] max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>

              {selectedLog.response && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1 text-[11px]">Response (响应报文):</span>
                  <pre className="bg-slate-900 text-blue-400 p-3 rounded-xl overflow-x-auto text-[11px] max-h-40 border border-slate-800">
                    {JSON.stringify(selectedLog.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
