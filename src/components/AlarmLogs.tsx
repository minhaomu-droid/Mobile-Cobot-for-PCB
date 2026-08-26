import React, { useState } from 'react';
import { BellRing, ShieldAlert, CheckCircle2, Download, Search, Filter, RefreshCw } from 'lucide-react';
import { AlarmItem } from '../types';

interface AlarmLogsProps {
  alarms: AlarmItem[];
  onClearAlarm: (alarmId: string) => void;
}

export const AlarmLogs: React.FC<AlarmLogsProps> = ({ alarms, onClearAlarm }) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = alarms.filter((item) => {
    const matchesLevel = filterLevel === 'ALL' || item.level === filterLevel;
    const matchesSearch =
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stationName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 h-full overflow-y-auto text-slate-900 bg-slate-50 flex flex-col justify-between select-none">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-bold text-slate-900">系统报警事件与日志 (Alarm Audit Logs)</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索告警代码/设备/内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 w-48 sm:w-64"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl === 'ALL' ? '全部' : lvl === 'CRITICAL' ? '严重' : lvl === 'WARNING' ? '警告' : '提示'}
              </button>
            ))}
          </div>

          {/* Export Log */}
          <button
            onClick={() => alert('已导出日志 CSV 文件至 Pad 本地存储 (/Download/Yobot_Alarms_20260811.csv)')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">导出日志</span>
          </button>
        </div>
      </div>

      {/* Alarms Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">时间</th>
                <th className="py-3 px-4">告警代码</th>
                <th className="py-3 px-4">关联测厚机/设备</th>
                <th className="py-3 px-4">等级</th>
                <th className="py-3 px-4 font-sans">详细描述</th>
                <th className="py-3 px-4">处理状态</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-600 font-bold">{item.timestamp}</td>
                  <td className="py-3 px-4 text-blue-700 font-bold">{item.code}</td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">{item.stationName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                        item.level === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : item.level === 'WARNING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {item.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-sans">{item.message}</td>
                  <td className="py-3 px-4">
                    {item.handled ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 已消除 ({item.handledBy || '系统'})
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold flex items-center gap-1 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" /> 未消除 (未处理)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!item.handled && (
                      <button
                        onClick={() => onClearAlarm(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-lg transition-all text-[11px] cursor-pointer shadow-sm"
                      >
                        标记清除
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
  );
};

