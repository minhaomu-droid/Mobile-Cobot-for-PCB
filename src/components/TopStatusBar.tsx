import React from 'react';
import {
  Cpu,
  Wifi,
  Tablet,
  User,
  Zap,
  Clock,
  AlertOctagon,
  Bell,
  RefreshCw,
  Power
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
      className={`bg-white border-b-2 border-slate-300 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs shrink-0 select-none ${className}`}
    >
      {/* Group 1: 核心网络与终端信息 (调度/WiFi/Pad电量/操作员) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* 1. 调度服务器连接 */}
        <div className="bg-[#f0f5fa] hover:bg-[#e4eff8] border border-[#d9e6f2] px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-sans text-slate-700 shadow-xs transition-all">
          <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-600 text-xs font-medium">调度服务:</span>
          <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
            {serverIp}:{serverPort}
          </span>
        </div>

        {/* 2. WiFi 连接 */}
        <div className="bg-[#f0f5fa] hover:bg-[#e4eff8] border border-[#d9e6f2] px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs sm:text-sm font-sans text-slate-700 shadow-xs transition-all">
          <Wifi className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-800 text-xs sm:text-sm">WiFi 6</span>
        </div>

        {/* 3. 当前 Pad 终端 */}
        <div className="bg-[#f0f5fa] hover:bg-[#e4eff8] border border-[#d9e6f2] px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs sm:text-sm font-sans text-slate-700 shadow-xs transition-all">
          <Tablet className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-bold text-slate-800 text-xs sm:text-sm">Pad终端</span>
          <span className="text-emerald-600 font-mono font-black text-xs sm:text-sm flex items-center gap-0.5">
            {isCharging && (
              <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
            )}
            {batteryPct}%
          </span>
        </div>

        {/* 4. 当前操作员 */}
        <div className="bg-[#f0f5fa] hover:bg-[#e4eff8] border border-[#d9e6f2] px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-sans text-slate-700 shadow-xs transition-all">
          <User className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-black text-slate-900 text-xs sm:text-sm">
            {userSession?.fullName ? userSession.fullName.split(' ')[0] : '李强'}
          </span>
          <span className={`${roleBadgeColor} text-xs font-bold px-2 py-0.5 rounded-full shadow-xs leading-none`}>
            {roleText}
          </span>
        </div>
      </div>

      {/* Group 2: 全局安全与状态 */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
        {/* RMS 同步状态 */}
        <div
          onClick={onSyncRMS}
          className="hidden md:flex bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl items-center gap-1.5 text-xs sm:text-sm font-sans font-bold transition-all cursor-pointer shadow-xs"
          title="RMS数据实时同步中，点击手动刷新"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs sm:text-sm">RMS已同步</span>
          <RefreshCw className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        </div>

        {/* 警告与报警日志入口 */}
        <button
          onClick={onNavigateToAlarms}
          className={`px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold border transition-all cursor-pointer shadow-xs ${
            unhandledAlarmsCount > 0
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="点击查看报警信息日志"
        >
          <Bell className={`w-4 h-4 ${unhandledAlarmsCount > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
          <span className="text-xs sm:text-sm">报警:</span>
          {unhandledAlarmsCount > 0 ? (
            <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-xs">
              {unhandledAlarmsCount}条
            </span>
          ) : (
            <span className="text-emerald-700 text-xs font-bold">正常</span>
          )}
        </button>

        {/* 实时时钟 */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-2xl text-slate-800 font-mono font-black text-xs sm:text-sm border border-slate-200 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentTime}</span>
        </div>
      </div>
    </div>
  );
};
