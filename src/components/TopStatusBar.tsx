import React from 'react';
import {
  Cpu,
  Wifi,
  Tablet,
  User,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Bell,
  RefreshCw,
  Server
} from 'lucide-react';
import { UserSession } from '../types';

interface TopStatusBarProps {
  userSession?: UserSession;
  serverIp?: string;
  serverPort?: string;
  latencyMs?: number;
  batteryPct?: number;
  isCharging?: boolean;
  isEstopTriggered?: boolean;
  unhandledAlarmsCount?: number;
  latestAlarmMsg?: string;
  onOpenEstopModal?: () => void;
  onNavigateToAlarms?: () => void;
  onSyncRMS?: () => void;
  className?: string;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  userSession,
  serverIp = '192.168.1.100',
  serverPort = '8080',
  latencyMs = 4,
  batteryPct = 98,
  isCharging = true,
  isEstopTriggered = false,
  unhandledAlarmsCount = 1,
  latestAlarmMsg = 'ST-01: 上料夹爪光电检测到物料倾斜',
  onOpenEstopModal,
  onNavigateToAlarms,
  onSyncRMS,
  className = '',
}) => {
  const [currentTime, setCurrentTime] = React.useState<string>('');

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('zh-CN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const roleText =
    userSession?.role === 'ADMIN'
      ? '管理员'
      : userSession?.role === 'ENGINEER'
      ? '高级工程师'
      : '操作员';

  const roleBadgeColor =
    userSession?.role === 'ADMIN'
      ? 'bg-purple-600 text-white'
      : userSession?.role === 'ENGINEER'
      ? 'bg-amber-600 text-white'
      : 'bg-blue-600 text-white';

  return (
    <div
      className={`bg-white border-b-2 border-slate-300 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0 select-none ${className}`}
    >
      {/* Group 1: 核心网络与终端信息 (调度/WiFi/Pad电量/操作员) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. 调度服务器连接 */}
        <div className="bg-[#f0f5fa] hover:bg-[#e4eff8] border border-[#d9e6f2] px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-sans text-slate-700 shadow-xs transition-all">
          <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-slate-600 text-[11px]">调度服务:</span>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {serverIp}:{serverPort}
          </span>
          <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md leading-none">
            {latencyMs}ms
          </span>
        </div>

        {/* 2. WiFi (5G) 连接 */}
        <div className="bg-[#f0f5fa] hover:bg-[#e4eff8] border border-[#d9e6f2] px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-sans text-slate-700 shadow-xs transition-all">
          <Wifi className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-medium text-slate-800 text-[11px]">WiFi 6 (5G)</span>
        </div>

        {/* 3. 当前 Pad 终端 (无重复，明确为平板电量) */}
        <div className="bg-[#f0f5fa] hover:bg-[#e4eff8] border border-[#d9e6f2] px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-sans text-slate-700 shadow-xs transition-all">
          <Tablet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-medium text-slate-800 text-[11px]">Pad终端</span>
          <span className="bg-slate-200/80 text-slate-600 text-[9px] font-mono font-bold px-1 py-0.5 rounded leading-none">
            2.9K/144Hz
          </span>
          <span className="text-emerald-600 font-mono font-bold text-[11px] flex items-center gap-0.5">
            {isCharging && (
              <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
            )}
            {batteryPct}%
          </span>
        </div>

        {/* 4. 当前操作员 */}
        <div className="bg-[#f0f5fa] hover:bg-[#e4eff8] border border-[#d9e6f2] px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-sans text-slate-700 shadow-xs transition-all">
          <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-900 text-xs">
            {userSession?.fullName ? userSession.fullName.split(' ')[0] : '李强'}
          </span>
          <span className={`${roleBadgeColor} text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs leading-none`}>
            {roleText}
          </span>
        </div>
      </div>

      {/* Group 2: 全局安全与报警状态 (每页常驻显示：急停状态 + 报警日志 + RMS同步) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 5. 急停状态 (E-Stop Status) */}
        <button
          onClick={onOpenEstopModal}
          className={`px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-sans font-bold border transition-all cursor-pointer shadow-xs ${
            isEstopTriggered
              ? 'bg-red-600 text-white border-red-700 animate-pulse'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          }`}
          title="点击查看安全回路与急停控制"
        >
          {isEstopTriggered ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span>急停触发 (E-STOP)</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px]">安全回路: 正常</span>
            </>
          )}
        </button>

        {/* 6. 警告与报警日志入口 (Alarm Logs Status) */}
        <button
          onClick={onNavigateToAlarms}
          className={`px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-sans font-bold border transition-all cursor-pointer shadow-xs ${
            unhandledAlarmsCount > 0
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="点击查看报警信息日志"
        >
          <Bell className={`w-3.5 h-3.5 ${unhandledAlarmsCount > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
          <span className="text-[11px]">报警:</span>
          {unhandledAlarmsCount > 0 ? (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {unhandledAlarmsCount}条未处理
            </span>
          ) : (
            <span className="text-emerald-700 text-[10px]">无异常</span>
          )}
        </button>

        {/* 7. RMS 同步状态 */}
        <div
          onClick={onSyncRMS}
          className="bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-xs"
          title="RMS数据实时同步中，点击手动刷新"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-sans text-[11px]">RMS已同步</span>
          <RefreshCw className="w-3 h-3 text-emerald-700 shrink-0" />
        </div>

        {/* 8. 实时时钟 */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-2xl text-slate-700 font-mono font-bold text-xs border border-slate-200">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{currentTime}</span>
        </div>
      </div>
    </div>
  );
};
