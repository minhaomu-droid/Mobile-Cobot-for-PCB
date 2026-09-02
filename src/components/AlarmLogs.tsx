import React, { useState } from 'react';
import { BellRing, ShieldAlert, CheckCircle2, Download, Search, ArrowLeft } from 'lucide-react';
import { AlarmItem } from '../types';

interface AlarmLogsProps {
  alarms: AlarmItem[];
  onClearAlarm: (alarmId: string) => void;
  onBackToHome?: () => void;
}

export const AlarmLogs: React.FC<AlarmLogsProps> = ({ alarms, onClearAlarm, onBackToHome }) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 只显示未消除的报警
  const unhandledAlarms = alarms.filter((item) => !item.handled);

  const filtered = unhandledAlarms.filter((item) => {
    const matchesLevel = filterLevel === 'ALL' || item.level === filterLevel;
    const matchesSearch =
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.robotId && item.robotId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-100/90 text-slate-900 flex flex-col p-3 sm:p-4 gap-3 overflow-hidden select-none font-sans min-h-0">
      {/* Top Header & Search Filter Bar */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
              title="返回首页 (测厚机列表)"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
              <span>首页</span>
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                系统未消除报警
              </h2>
              <span className="text-xs font-mono bg-red-50 text-red-700 px-2.5 py-0.5 rounded-lg border border-red-200 font-bold">
                {unhandledAlarms.length} 条未消除
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 ml-auto flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索告警代码/机器人/设备..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none w-48 sm:w-64"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl === 'ALL' ? '全部' : lvl === 'CRITICAL' ? '严重' : lvl === 'WARNING' ? '警告' : '提示'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alarms Table Card */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs sm:text-base font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b-2 border-slate-200 tracking-wider font-black">
              <tr>
                <th className="py-3.5 px-4 text-xs sm:text-sm">时间</th>
                <th className="py-3.5 px-4 text-xs sm:text-sm">告警代码</th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-sans">关联测厚机/设备</th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-sans">复合机器人ID</th>
                <th className="py-3.5 px-4 text-xs sm:text-sm">等级</th>
                <th className="py-3.5 px-4 font-sans text-xs sm:text-sm">详细描述</th>
                <th className="py-3.5 px-4 font-sans text-xs sm:text-sm">处理状态</th>
                <th className="py-3.5 px-4 text-right font-sans text-xs sm:text-sm">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-600 font-bold text-xs sm:text-sm whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="py-3.5 px-4 text-blue-700 font-black text-xs sm:text-sm whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-black font-sans text-xs sm:text-base whitespace-nowrap">
                      {item.stationName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                      {item.robotId && item.robotId !== '-' ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs sm:text-sm font-black">
                          {item.robotId}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold text-xs sm:text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg border text-xs sm:text-sm font-black font-mono inline-block ${
                          item.level === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : item.level === 'WARNING'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {item.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-sans font-bold text-xs sm:text-base leading-relaxed">
                      {item.message}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-sans text-xs sm:text-sm">
                      <span className="text-red-600 font-black flex items-center gap-1.5 animate-pulse">
                        <ShieldAlert className="w-4 h-4" /> 未消除 (待处理)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onClearAlarm(item.id)}
                        className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black px-3.5 py-1.5 rounded-xl transition-all text-xs sm:text-sm cursor-pointer shadow-xs active:scale-95"
                      >
                        标记清除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="font-bold text-base text-slate-700">当前无未消除报警</p>
                      <p className="text-xs text-slate-400">所有测厚机与复合机器人运行状态正常</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
