import React, { useState } from 'react';
import {
  Settings,
  Tv,
  Wifi,
  Cpu,
  ShieldCheck,
  Volume2,
  Save,
  RefreshCw,
  Sliders,
  SlidersHorizontal,
  Bot,
  Activity,
  UserCheck,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Trash2,
  Lock,
  CreditCard,
  Zap,
  Gauge,
  Radio,
  Clock,
  Layers,
  Sparkles,
  Search,
  Check,
  Play,
  RotateCw,
} from 'lucide-react';
import { SystemConfig, UserSession } from '../types';

interface SystemSettingsProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => void;
}

type SettingTab =
  | 'TERMINAL'
  | 'COMMUNICATION'
  | 'ROBOT_MOTION'
  | 'THICKNESS_GAUGE'
  | 'SAFETY_POKAYOKE'
  | 'USER_PERMISSIONS'
  | 'STORAGE_OTA'
  | 'DIAGNOSTICS';

export const SystemSettings: React.FC<SystemSettingsProps> = ({ config, onUpdateConfig }) => {
  const [activeTab, setActiveTab] = useState<SettingTab>('TERMINAL');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Network Test State
  const [netTestRunning, setNetTestRunning] = useState(false);
  const [netTestResult, setNetTestResult] = useState<string | null>(null);

  // Vacuum Test State
  const [vacuumTesting, setVacuumTesting] = useState(false);
  const [vacuumResult, setVacuumResult] = useState<string | null>(null);

  // OTA Check State
  const [otaChecking, setOtaChecking] = useState(false);
  const [otaStatus, setOtaStatus] = useState<string | null>(null);

  // Self Test State
  const [selfTesting, setSelfTesting] = useState(false);
  const [selfTestProgress, setSelfTestProgress] = useState<number>(0);
  const [selfTestDone, setSelfTestDone] = useState(false);

  const showSaveNotice = (text = '配置项已成功保存至 Pad 闪存持久化') => {
    setSaveToast(text);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleTestNetwork = () => {
    setNetTestRunning(true);
    setNetTestResult(null);
    setTimeout(() => {
      setNetTestRunning(false);
      setNetTestResult('连通性测试通过: Ping=3.8ms, WebSocket握手=正常, MQTT Broker=在线, PLC Modbus=通讯就绪');
    }, 1200);
  };

  const handleTestVacuum = () => {
    setVacuumTesting(true);
    setVacuumResult(null);
    setTimeout(() => {
      setVacuumTesting(false);
      setVacuumResult('真空泵测试通过: 抽气 1.2s 达到 -84.6 kPa, 泄漏率 < 0.2 kPa/s (气密性优)');
    }, 1500);
  };

  const handleCheckOta = () => {
    setOtaChecking(true);
    setOtaStatus(null);
    setTimeout(() => {
      setOtaChecking(false);
      setOtaStatus('已是最新版本 (v3.2.8-rel)，云端暂无待升级补丁');
    }, 1600);
  };

  const handleRunFullSelfTest = () => {
    setSelfTesting(true);
    setSelfTestDone(false);
    setSelfTestProgress(15);
    setTimeout(() => setSelfTestProgress(45), 600);
    setTimeout(() => setSelfTestProgress(80), 1200);
    setTimeout(() => {
      setSelfTestProgress(100);
      setSelfTesting(false);
      setSelfTestDone(true);
    }, 1800);
  };

  const tabs: { id: SettingTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'TERMINAL', label: '终端与显示', icon: Tv },
    { id: 'COMMUNICATION', label: '通讯与调度协议', icon: Wifi },
    { id: 'ROBOT_MOTION', label: '机器人与运控限速', icon: Bot },
    { id: 'THICKNESS_GAUGE', label: '激光测厚与公差', icon: Gauge },
    { id: 'SAFETY_POKAYOKE', label: '安全防呆与声光', icon: ShieldCheck },
    { id: 'USER_PERMISSIONS', label: '用户与权限审计', icon: UserCheck },
    { id: 'STORAGE_OTA', label: '存储、报表与OTA', icon: HardDrive },
    { id: 'DIAGNOSTICS', label: '硬件诊断与自检', icon: Activity },
  ];

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col gap-4 text-slate-900 bg-slate-50 overflow-hidden select-none">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">系统全局参数与高级设置</h2>
            <p className="text-xs text-slate-500 font-mono">
              犀准复合机器人 HMI 平台 • 联想小新 Pad Pro 12.7 工业级参数与深度控制
            </p>
          </div>
        </div>

        <button
          onClick={() => showSaveNotice()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>保存全部设置</span>
        </button>
      </div>

      {/* Main Settings Grid: Left Tabs + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Left Tab Navigator */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex flex-col gap-1 overflow-y-auto shrink-0">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            设置功能分类
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}

          <div className="mt-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1 font-mono">
            <div className="text-slate-700 font-bold">硬件状态: 在线</div>
            <div>Pad 电量: {config.padBatteryPct}% (正常)</div>
            <div>固件: v3.2.8-prod</div>
          </div>
        </div>

        {/* Right Tab Content Container */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            {/* TAB 1: TERMINAL & DISPLAY */}
            {activeTab === 'TERMINAL' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Pad 终端硬件与显示设置</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Lenovo Xiaoxin Pad Pro 12.7 (2025)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Refresh Rate */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">屏幕刷新率 (Refresh Rate)</label>
                    <select
                      value={config.padRefreshRate}
                      onChange={(e) => onUpdateConfig({ padRefreshRate: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
                    >
                      <option value="60Hz">60Hz - 标准低功耗模式</option>
                      <option value="120Hz">120Hz - 高清流畅模式</option>
                      <option value="144Hz">144Hz - 极速触控 (2.9K 旗舰级推荐)</option>
                    </select>
                    <p className="text-[11px] text-slate-500">144Hz 超高刷新率可为机械臂微动寸动提供极速毫秒级触控响应。</p>
                  </div>

                  {/* Screen Brightness Slider */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>屏幕亮度 (Brightness)</span>
                      <span className="font-mono text-blue-700">{config.screenBrightness ?? 85}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={config.screenBrightness ?? 85}
                      onChange={(e) => onUpdateConfig({ screenBrightness: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>20% (暗室)</span>
                      <span>50% (标准)</span>
                      <span>100% (车间强光)</span>
                    </div>
                  </div>

                  {/* Sleep Timeout */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">自动息屏休眠 (Sleep Timeout)</label>
                    <select
                      value={config.screenSleepTimeout ?? '15m'}
                      onChange={(e) => onUpdateConfig({ screenSleepTimeout: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
                    >
                      <option value="1m">1 分钟 (临时防离开)</option>
                      <option value="5m">5 分钟</option>
                      <option value="15m">15 分钟 (工业产线推荐)</option>
                      <option value="never">从不休眠 (常亮监控模式)</option>
                    </select>
                  </div>

                  {/* Edge Rejection */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">边缘防误触算法 (Edge Rejection)</label>
                    <select
                      value={config.edgeRejection ?? '12px'}
                      onChange={(e) => onUpdateConfig({ edgeRejection: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
                    >
                      <option value="off">关闭防误触</option>
                      <option value="12px">开启 12px 边缘抑制 (标准手持推荐)</option>
                      <option value="24px">开启 24px 强力抑制 (双手托举模式)</option>
                    </select>
                  </div>

                  {/* Simulated Frame Toggle */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">物理边框展示模式 (Simulated Frame)</label>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ simulatedDeviceFrame: !config.simulatedDeviceFrame })}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                        config.simulatedDeviceFrame
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {config.simulatedDeviceFrame
                        ? '已启用：联想 Pad 12.7 大象灰金属卡槽外壳'
                        : '已禁用：全屏自适应铺满'}
                    </button>
                  </div>

                  {/* Haptic Feedback Toggle */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">按键触觉振动反馈 (Haptic Vibration)</label>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ hapticFeedback: !config.hapticFeedback })}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                        config.hapticFeedback
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {config.hapticFeedback ? '已启用：触控马达微震确认' : '已禁用：无振动'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMMUNICATION & PROTOCOLS */}
            {activeTab === 'COMMUNICATION' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">通讯协议与调度服务网络配置</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 font-bold">WebSocket • MQTT • Modbus-TCP</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* RMS Server IP & Port */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                    <div className="font-bold text-slate-800 font-sans flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      犀准调度中枢服务 (RMS Server)
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-sans font-medium">服务器 IP</label>
                      <input
                        type="text"
                        value={config.serverIp}
                        onChange={(e) => onUpdateConfig({ serverIp: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-sans font-medium">通信端口 (Port)</label>
                      <input
                        type="number"
                        value={config.serverPort}
                        onChange={(e) => onUpdateConfig({ serverPort: parseInt(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* MQTT Broker Config */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                    <div className="font-bold text-slate-800 font-sans flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-indigo-600" />
                      MQTT 车队广播消息代理 (Broker)
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-sans font-medium">Broker 地址 (tcp://)</label>
                      <input
                        type="text"
                        value={config.mqttBrokerUrl ?? 'tcp://192.168.1.100:1883'}
                        onChange={(e) => onUpdateConfig({ mqttBrokerUrl: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-sans font-medium">订阅 Topic 通道</label>
                      <input
                        type="text"
                        value={config.mqttTopic ?? 'rhinorobo/fleet'}
                        onChange={(e) => onUpdateConfig({ mqttTopic: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* PLC Modbus-TCP Config */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                    <div className="font-bold text-slate-800 font-sans flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-600" />
                      测厚机 PLC Modbus-TCP 通信
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-600 block mb-1 font-sans font-medium">PLC IP 地址</label>
                        <input
                          type="text"
                          value={config.plcIpAddress ?? '192.168.1.50'}
                          onChange={(e) => onUpdateConfig({ plcIpAddress: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-sans font-medium">Modbus 端口</label>
                        <input
                          type="number"
                          value={config.plcPort ?? 502}
                          onChange={(e) => onUpdateConfig({ plcPort: parseInt(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Heartbeat & Auto-reconnect */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      心跳包与断线自愈
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">WebSocket 心跳包周期 (Ping Interval)</label>
                      <select
                        value={config.wsPingInterval ?? 1000}
                        onChange={(e) => onUpdateConfig({ wsPingInterval: parseInt(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
                      >
                        <option value="500">500ms (高敏瞬态监控)</option>
                        <option value="1000">1000ms (推荐标准)</option>
                        <option value="2000">2000ms (省流稳定)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ networkAutoReconnect: !config.networkAutoReconnect })}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                        config.networkAutoReconnect
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {config.networkAutoReconnect ? '已启用：网络断开自动重连 (无限重试)' : '已禁用自动重连'}
                    </button>
                  </div>
                </div>

                {/* One-click Network Diagnosis Button */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">通讯连通性一键握手测试 (Ping & Handshake)</span>
                    <button
                      type="button"
                      onClick={handleTestNetwork}
                      disabled={netTestRunning}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${netTestRunning ? 'animate-spin' : ''}`} />
                      <span>{netTestRunning ? '测试握手中...' : '发起连通性自检'}</span>
                    </button>
                  </div>

                  {netTestResult && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-900 flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{netTestResult}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ROBOT & MOTION */}
            {activeTab === 'ROBOT_MOTION' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">AMR 复合机器人与运控限速参数</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">M-Series Motion Safety Controller</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Max Speed */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>巡航最高线速度 (Max Linear Speed)</span>
                      <span className="font-mono text-blue-700">{config.maxLinearSpeed ?? 0.8} m/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.5"
                      step="0.1"
                      value={config.maxLinearSpeed ?? 0.8}
                      onChange={(e) => onUpdateConfig({ maxLinearSpeed: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0.2 m/s (低速安全)</span>
                      <span>0.8 m/s (推荐)</span>
                      <span>1.5 m/s (高速穿梭)</span>
                    </div>
                  </div>

                  {/* Jog Step Speed */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>遥操微动寸动角速度 (Jog Speed Limit)</span>
                      <span className="font-mono text-blue-700">{config.maxAngularSpeed ?? 1.2} rad/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={config.maxAngularSpeed ?? 1.2}
                      onChange={(e) => onUpdateConfig({ maxAngularSpeed: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0.5 rad/s</span>
                      <span>1.2 rad/s (推荐)</span>
                      <span>2.5 rad/s</span>
                    </div>
                  </div>

                  {/* Laser Radar Safety Distance */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <span className="font-bold text-slate-700 block">激光雷达避障安全区 (LiDAR Safety Zones)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-600 block mb-1">减速探测距离 (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={config.radarSafeDecelDist ?? 0.8}
                          onChange={(e) => onUpdateConfig({ radarSafeDecelDist: parseFloat(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">急停刹停距离 (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={config.radarEstopDist ?? 0.25}
                          onChange={(e) => onUpdateConfig({ radarEstopDist: parseFloat(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Battery Dock Threshold */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <span className="font-bold text-slate-700 block">自动返航充电策略 (Auto Dock Battery)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-600 block mb-1">低电自动回充 (%)</label>
                        <input
                          type="number"
                          value={config.lowBatteryAutoDockPct ?? 20}
                          onChange={(e) => onUpdateConfig({ lowBatteryAutoDockPct: parseInt(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">满电切断断开 (%)</label>
                        <input
                          type="number"
                          value={config.fullChargeCutoffPct ?? 95}
                          onChange={(e) => onUpdateConfig({ fullChargeCutoffPct: parseInt(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vacuum Pressure Threshold */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>机械臂吸盘允许举升负压下限 (Vacuum Threshold)</span>
                      <span className="font-mono text-blue-700">{config.vacuumThresholdKpa ?? -60} kPa</span>
                    </div>
                    <input
                      type="range"
                      min="-85"
                      max="-40"
                      step="5"
                      value={config.vacuumThresholdKpa ?? -60}
                      onChange={(e) => onUpdateConfig({ vacuumThresholdKpa: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      若抓板时气管压力达不到 {config.vacuumThresholdKpa ?? -60} kPa，系统将自动触发掉板防坠保护并暂停动作。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: THICKNESS GAUGE & QUALITY */}
            {activeTab === 'THICKNESS_GAUGE' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">激光测厚仪公差与标定工艺参数</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Laser Displacement Micrometer</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                    <label className="text-slate-700 font-bold font-sans block">基准标称厚度 (Nominal mm)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={config.nominalThicknessMm ?? 1.25}
                      onChange={(e) => onUpdateConfig({ nominalThicknessMm: parseFloat(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold shadow-sm"
                    />
                    <span className="text-[11px] text-slate-400 font-sans">当前批次工件标准厚度</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                    <label className="text-slate-700 font-bold font-sans block">上限公差 (Upper Limit +Δ mm)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={config.toleranceUpperMm ?? 0.03}
                      onChange={(e) => onUpdateConfig({ toleranceUpperMm: parseFloat(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-amber-700 shadow-sm"
                    />
                    <span className="text-[11px] text-slate-400 font-sans">超差报警门限</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                    <label className="text-slate-700 font-bold font-sans block">下限公差 (Lower Limit -Δ mm)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={config.toleranceLowerMm ?? -0.03}
                      onChange={(e) => onUpdateConfig({ toleranceLowerMm: parseFloat(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-amber-700 shadow-sm"
                    />
                    <span className="text-[11px] text-slate-400 font-sans">超差报警门限</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <label className="text-slate-700 font-bold block">连续超差自动停机数量 (Consecutive NG Limit)</label>
                    <select
                      value={config.consecutiveNgLimit ?? 3}
                      onChange={(e) => onUpdateConfig({ consecutiveNgLimit: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono shadow-sm"
                    >
                      <option value="1">1 片 (极严防呆停机)</option>
                      <option value="3">3 片 (标准推荐停机)</option>
                      <option value="5">5 片</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <label className="text-slate-700 font-bold block">首件检验抽样间隔 (Sample Interval)</label>
                    <select
                      value={config.sampleIntervalBoards ?? 100}
                      onChange={(e) => onUpdateConfig({ sampleIntervalBoards: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono shadow-sm"
                    >
                      <option value="50">每 50 片抽检送样</option>
                      <option value="100">每 100 片抽检送样 (推荐)</option>
                      <option value="200">每 200 片抽检送样</option>
                    </select>
                  </div>
                </div>

                {/* Laser Offsets */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                  <span className="font-bold text-slate-800 font-sans block">激光位移传感器探头零位微调补偿 (Laser Offsets)</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-600 block mb-1 font-sans">上激光探头偏移补偿 (mm)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={config.upperLaserOffsetMm ?? 0.0}
                        onChange={(e) => onUpdateConfig({ upperLaserOffsetMm: parseFloat(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-sans">下激光探头偏移补偿 (mm)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={config.lowerLaserOffsetMm ?? 0.0}
                        onChange={(e) => onUpdateConfig({ lowerLaserOffsetMm: parseFloat(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SAFETY & POKA-YOKE */}
            {activeTab === 'SAFETY_POKAYOKE' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">安全防呆、蜂鸣音效与声光报警联动</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Poka-Yoke & Andon Safety System</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Poka Yoke Hold Seconds */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <label className="font-bold text-slate-700 block">高危动作防呆长按时长 (Poka-Yoke Hold)</label>
                    <select
                      value={config.pokaYokeHoldSeconds}
                      onChange={(e) => onUpdateConfig({ pokaYokeHoldSeconds: parseFloat(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono shadow-sm"
                    >
                      <option value="1.0">1.0 秒 (快速操作)</option>
                      <option value="2.0">2.0 秒 (工业标准推荐)</option>
                      <option value="3.0">3.0 秒 (高等级严格防呆)</option>
                    </select>
                    <p className="text-[11px] text-slate-500">
                      遥操清除轴限位错误、启动连续自动上下料等高危动作必须长按达到设定时间才能触发。
                    </p>
                  </div>

                  {/* Beeper Audio & Volume */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">触控蜂鸣音效 (Beeper Audio)</span>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ beeperEnabled: !config.beeperEnabled })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          config.beeperEnabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {config.beeperEnabled ? '已开启' : '静音'}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>音量大小 (Volume)</span>
                        <span className="font-mono text-blue-700 font-bold">{config.beeperVolume ?? 80}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.beeperVolume ?? 80}
                        onChange={(e) => onUpdateConfig({ beeperVolume: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  {/* Andon Tower Interlock */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <label className="font-bold text-slate-700 block">三色声光报警灯塔联动 (Andon Light Tower)</label>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ andonTowerInterlock: !config.andonTowerInterlock })}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                        config.andonTowerInterlock
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {config.andonTowerInterlock ? '已启用：红/黄/绿车间物理灯塔实时联动' : '已禁用灯塔联动'}
                    </button>
                  </div>

                  {/* Safety Door Interlock */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <label className="font-bold text-slate-700 block">安全光幕/防护门电子互锁 (Safety Interlock)</label>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ safetyDoorInterlock: !config.safetyDoorInterlock })}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                        config.safetyDoorInterlock
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}
                    >
                      {config.safetyDoorInterlock ? '已启用强制互锁 (开门立即 STO 停机)' : '已进入工程调试旁路模式 (Bypass)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: USERS & AUDIT TRAIL */}
            {activeTab === 'USER_PERMISSIONS' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">操作员权限体系与安全审计日志</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Role-Based Access Control</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Auto Logout */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <label className="font-bold text-slate-700 block">无操作自动锁定注销 (Auto Logout)</label>
                    <select
                      value={config.autoLogoutMinutes ?? 15}
                      onChange={(e) => onUpdateConfig({ autoLogoutMinutes: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono shadow-sm"
                    >
                      <option value="5">5 分钟</option>
                      <option value="10">10 分钟</option>
                      <option value="15">15 分钟 (推荐安全等级)</option>
                      <option value="30">30 分钟</option>
                      <option value="0">关闭自动锁定</option>
                    </select>
                  </div>

                  {/* NFC Binding */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <label className="font-bold text-slate-700 block">Pad 背部 NFC 工卡快速刷卡登录</label>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ nfcCardBindingEnabled: !config.nfcCardBindingEnabled })}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                        config.nfcCardBindingEnabled
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {config.nfcCardBindingEnabled ? '已启用：支持员工卡贴近快速认证' : '已禁用 NFC'}
                    </button>
                  </div>

                  {/* Audit Trail Upload */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs md:col-span-2">
                    <label className="font-bold text-slate-700 block">操作审计流水日志自动上传 (Audit Trail)</label>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ auditLogUpload: !config.auditLogUpload })}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                        config.auditLogUpload
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {config.auditLogUpload ? '已启用：自动向 MES 归档所有遥操、参数修改与复位动作' : '已关闭审计上传'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: STORAGE, REPORTS & OTA */}
            {activeTab === 'STORAGE_OTA' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">数据存储容量、报表导出与 OTA 固件升级</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Storage & Firmware</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data Retention */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <label className="font-bold text-slate-700 block">测厚历史数据本地保留期限 (Data Retention)</label>
                    <select
                      value={config.dataRetentionDays ?? 90}
                      onChange={(e) => onUpdateConfig({ dataRetentionDays: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono shadow-sm"
                    >
                      <option value="30">30 天</option>
                      <option value="90">90 天 (推荐)</option>
                      <option value="365">365 天 (全年生效)</option>
                    </select>
                  </div>

                  {/* Cache Cleaning */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">Pad 本地缓存空间占用</span>
                      <span className="font-mono text-slate-900 font-bold">42.8 MB / 256 GB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => showSaveNotice('本地波形与临时测试缓存已全部清空')}
                      className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>清空临时日志与波形缓存</span>
                    </button>
                  </div>
                </div>

                {/* Export Report */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">全站测厚质检与生产统计报表导出</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => showSaveNotice('已生成 1~4号测厚机今日质检汇总 CSV 并发送至本地存储')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>立即导出 CSV/Excel 报表</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    包含各批次基板标称厚度、上/下测头瞬态读数、CPK 过程能力指数、合格率及复合机器人运转周期。
                  </p>
                </div>

                {/* OTA Firmware Update */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">云端 OTA 固件更新与版本检测</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        当前运行版本: HMI v3.2.8 • AMR Kernel v5.4.1 • RMS Service v4.1.0
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckOta}
                      disabled={otaChecking}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${otaChecking ? 'animate-spin' : ''}`} />
                      <span>{otaChecking ? '检查云端中...' : '检查 OTA 更新'}</span>
                    </button>
                  </div>

                  {otaStatus && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-mono text-blue-900 flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{otaStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 8: HARDWARE DIAGNOSTICS & SELF-TEST */}
            {activeTab === 'DIAGNOSTICS' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">硬件诊断、探头自检与全系统健康扫描</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 font-bold">Hardware Self-Test Suite</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vacuum Pump Diagnostics */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">机械臂真空吸盘泵气密性打压自检</span>
                      <button
                        type="button"
                        onClick={handleTestVacuum}
                        disabled={vacuumTesting}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3 h-3" />
                        <span>{vacuumTesting ? '打压测试中...' : '触发打压'}</span>
                      </button>
                    </div>

                    {vacuumResult ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-mono text-emerald-900">
                        {vacuumResult}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        自动闭合电磁阀并开启无油真空发生器，测试 1.5 秒内能否达到 -84 kPa。
                      </p>
                    )}
                  </div>

                  {/* Laser Sensor Health */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 block">激光测厚探头光束强度</span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">上激光探头接收光强 (Upper Beam):</span>
                        <span className="text-emerald-700 font-bold">98.4% (状态优)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[98.4%]" />
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-600">下激光探头接收光强 (Lower Beam):</span>
                        <span className="text-emerald-700 font-bold">96.8% (状态优)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[96.8%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full System One-Click Self-Test */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">一键全系统硬件健康体检 (All-In-One Self Test)</span>
                      <span className="text-[11px] text-slate-500">
                        自动遍历激光位移传感器、AMR 轮电机编码器、气动管路、Pad 屏幕与通讯握手
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunFullSelfTest}
                      disabled={selfTesting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{selfTesting ? '体检扫描中...' : '开始一键全检'}</span>
                    </button>
                  </div>

                  {selfTesting && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-slate-600">
                        <span>正在进行全模块自检扫描...</span>
                        <span className="font-bold text-blue-700">{selfTestProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300"
                          style={{ width: `${selfTestProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {selfTestDone && !selfTesting && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-900 flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold">全系统健康体检已完成 (评分: 100/100 优秀)</p>
                        <p className="text-[11px] text-emerald-800">
                          4台测厚机状态正常 • 8台AMR机器人在线 • 激光标定偏差 &lt; 0.005mm • 气路密封性达标
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save & Feedback Bar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-6">
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>所有修改将在点击【保存全部设置】后自动持久化至 Pad 闪存与调度中枢</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => showSaveNotice('已恢复出厂与车间初始推荐参数')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer border border-slate-300 shadow-sm"
              >
                恢复默认
              </button>
              <button
                type="button"
                onClick={() => showSaveNotice()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存配置</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-300 text-slate-900 font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
};
