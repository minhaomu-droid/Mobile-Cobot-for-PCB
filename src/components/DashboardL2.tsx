import React, { useState, useEffect } from 'react';
import { Gauge, CheckCircle2, AlertTriangle, Play, ArrowRight, Zap, RefreshCw, Activity, Layers } from 'lucide-react';
import { ThicknessStation, PanelState } from '../types';

interface DashboardL2Props {
  stations: ThicknessStation[];
  onSelectStationForL3: (stationId: string) => void;
  onNavigateToPanel: (panel: PanelState) => void;
}

export const DashboardL2: React.FC<DashboardL2Props> = ({
  stations,
  onSelectStationForL3,
  onNavigateToPanel,
}) => {
  // Live simulated laser curve data points
  const [curveData, setCurveData] = useState<number[]>([
    1.251, 1.250, 1.252, 1.249, 1.253, 1.250, 1.251, 1.248, 1.252, 1.251, 1.250, 1.253, 1.251, 1.249, 1.250, 1.252
  ]);

  // Simulate real-time laser sensor fluctuation every 1.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurveData((prev) => {
        const nextVal = Number((1.250 + (Math.random() * 0.008 - 0.004)).toFixed(3));
        return [...prev.slice(1), nextVal];
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const totalPass = stations.reduce((acc, s) => acc + s.passCount, 0);
  const totalFail = stations.reduce((acc, s) => acc + s.failCount, 0);
  const passRate = ((totalPass / (totalPass + totalFail || 1)) * 100).toFixed(2);

  // Helper to translate AMR status to clear Chinese
  const getAMRStatusText = (status: string) => {
    switch (status) {
      case 'NAVIGATING':
        return '导航移动中';
      case 'PICKING':
        return '取料对接中';
      case 'PLACING':
        return '码垛放料中';
      case 'ERROR':
        return '故障停机';
      case 'IDLE':
      default:
        return '待命中';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full text-slate-900 bg-slate-50 select-none">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">今日加工总数</p>
            <p className="text-xl font-black font-mono text-slate-900">
              {totalPass + totalFail} <span className="text-xs font-normal text-slate-500">片</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">设备综合稼动率</p>
            <p className="text-xl font-black font-mono text-emerald-600">98.5%</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">测厚精度</p>
            <p className="text-xl font-black font-mono text-purple-700">±0.003 mm</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">复合机器人</p>
            <p className="text-xl font-black font-mono text-slate-900">2/2 在线 <span className="text-xs text-emerald-600 font-bold">91%</span></p>
          </div>
        </div>
      </div>

      {/* Middle Section: Real-time Laser Thickness Monitor Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">1号测厚机 激光双测头实时测厚波形 (标称 1.250mm)</h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> 上限 1.275mm
            </span>
            <span className="flex items-center gap-1 text-blue-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> 实时 1.252mm
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 下限 1.225mm
            </span>
          </div>
        </div>

        {/* SVG Live Waveform */}
        <div className="h-28 w-full bg-slate-50 rounded-xl border border-slate-200 p-2 relative flex items-center justify-center">
          {/* Tolerance Boundary Lines */}
          <div className="absolute inset-x-2 top-3 border-b border-dashed border-red-400 text-[9px] font-mono text-red-600 pl-2">
            +0.025mm 上公差线
          </div>
          <div className="absolute inset-x-2 top-1/2 border-b border-blue-400/60 text-[9px] font-mono text-blue-600 pl-2">
            1.250mm 标称标准值
          </div>
          <div className="absolute inset-x-2 bottom-3 border-b border-dashed border-red-400 text-[9px] font-mono text-red-600 pl-2">
            -0.025mm 下公差线
          </div>

          <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 400 80">
            <polyline
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={curveData
                .map((val, idx) => {
                  const x = (idx / (curveData.length - 1)) * 390 + 5;
                  // map 1.240~1.260 to 70~10 in SVG Y coords
                  const y = 80 - ((val - 1.240) / 0.020) * 60;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
            {curveData.map((val, idx) => {
              const x = (idx / (curveData.length - 1)) * 390 + 5;
              const y = 80 - ((val - 1.240) / 0.020) * 60;
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r={idx === curveData.length - 1 ? 4.5 : 2.5}
                  fill={idx === curveData.length - 1 ? '#2563eb' : '#0284c7'}
                  className={idx === curveData.length - 1 ? 'animate-ping' : ''}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Main Grid: All Thickness Machine Stations (L2 Cards Grid) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            全厂测厚机站控列表 ({stations.length} 台)
          </h2>
          <span className="text-xs text-slate-500 font-mono">点击卡片【控制】按键进入 L3 深度站控</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stations.map((station) => {
            const isRunning = station.status === 'RUNNING';
            const isStandby = station.status === 'STANDBY';
            const isAlarm = station.status === 'ALARM';

            return (
              <div
                key={station.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                  isAlarm
                    ? 'border-red-400 bg-red-50/30'
                    : isRunning
                    ? 'border-slate-200 hover:border-blue-400'
                    : 'border-slate-200'
                }`}
              >
                {/* Station Card Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isRunning
                            ? 'bg-emerald-500 animate-pulse shadow-sm'
                            : isStandby
                            ? 'bg-amber-500'
                            : 'bg-red-600 animate-ping shadow-sm'
                        }`}
                      />
                      <h3 className="text-base font-bold text-slate-900">{station.name}</h3>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border font-mono ${
                        isRunning
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isStandby
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      {isRunning ? '运行中' : isStandby ? '待机中' : '设备告警'}
                    </span>
                  </div>

                  {/* Current Thickness & Sensors */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">PCB规格</p>
                      <p className="text-xs font-bold font-mono text-slate-900 truncate">{station.pcbDimensions}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">实时激光测厚</p>
                      <p className={`text-xs font-bold font-mono ${isAlarm ? 'text-red-600' : 'text-blue-700'}`}>
                        {station.currentThickness.toFixed(3)} mm
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">当前批次</p>
                      <p className="text-xs font-mono text-slate-900 font-bold truncate">{station.currentLot}</p>
                    </div>
                  </div>

                  {/* Robot Status Pair (M-01 Loading & M-02 Unloading/Receiving) */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">上料 M-01</p>
                        <p className="font-bold text-slate-900">{getAMRStatusText(station.loadingAMR.status)}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                        {station.loadingAMR.batteryPct}%
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">收料 M-02</p>
                        <p className="font-bold text-slate-900">{getAMRStatusText(station.unloadingAMR.status)}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                        {station.unloadingAMR.batteryPct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    已加工进度: <span className="text-slate-900 font-bold">{station.passCount + station.failCount}</span> / {station.totalBoardsGoal || 150} 片
                  </span>

                  <button
                    onClick={() => {
                      onSelectStationForL3(station.id);
                      onNavigateToPanel('L3_STATION_CONTROL');
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
                      isAlarm
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <span>{isAlarm ? '故障排查与站控' : '进入站控 (L3)'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

