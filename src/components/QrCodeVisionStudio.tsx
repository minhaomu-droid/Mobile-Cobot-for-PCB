import React, { useState } from 'react';
import { QrCode, Camera, Sliders, CheckCircle2, Sparkles, Sun, Eye, Copy, RefreshCw } from 'lucide-react';

export type QrViewpointId = 'DOCKING' | 'PCB_LOT' | 'CARRIER';

interface QrViewpointConfig {
  id: QrViewpointId;
  name: string;
  shortLabel: string;
  codeContent: string;
  codeType: 'QR Code' | 'DataMatrix' | 'Micro QR';
  confidence: number;
  decodeTimeMs: number;
  description: string;
  resolution: string;
}

const VIEWPOINTS: QrViewpointConfig[] = [
  {
    id: 'DOCKING',
    name: '视角 1: 机台对接码',
    shortLabel: '视角1 机台码',
    codeContent: 'STATION-THK-01#DOCK_ALIGN_X12.4_Y0.0',
    codeType: 'QR Code',
    confidence: 99.8,
    decodeTimeMs: 14,
    description: '测厚机入料口高精度光学对接基准码',
    resolution: '1920×1080 @ 30fps',
  },
  {
    id: 'PCB_LOT',
    name: '视角 2: PCB料盒批次码',
    shortLabel: '视角2 PCB料盒码',
    codeContent: 'LOT-20260811-001#PCB-510x410-T1.6-4L',
    codeType: 'DataMatrix',
    confidence: 99.6,
    decodeTimeMs: 16,
    description: 'PCB 批次物料仓与尺寸规格追踪码',
    resolution: '1920×1080 @ 30fps',
  },
  {
    id: 'CARRIER',
    name: '视角 3: 载具对中定位码',
    shortLabel: '视角3 载具码',
    codeContent: 'CARRIER-TRAY-08A#ORIGIN_Z0.0_CAL_OK',
    codeType: 'QR Code',
    confidence: 99.9,
    decodeTimeMs: 12,
    description: '机械臂搬运托盘与治具零点对中码',
    resolution: '1920×1080 @ 30fps',
  },
];

interface QrCodeVisionStudioProps {
  onShowToast?: (msg: string) => void;
}

export const QrCodeVisionStudio: React.FC<QrCodeVisionStudioProps> = ({ onShowToast }) => {
  const [selectedViewpoint, setSelectedViewpoint] = useState<QrViewpointId>('DOCKING');
  const [isContinuousScan, setIsContinuousScan] = useState<boolean>(true);
  const [exposureTime, setExposureTime] = useState<number>(15); // ms
  const [lightingLevel, setLightingLevel] = useState<number>(80); // %
  const [isLightOn, setIsLightOn] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [enhanceContrast, setEnhanceContrast] = useState<boolean>(true);

  const currentConfig = VIEWPOINTS.find((v) => v.id === selectedViewpoint) || VIEWPOINTS[0];

  const handleCaptureSnapshot = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      onShowToast?.(`【拍照完成】已成功捕获 ${currentConfig.name}，解析内容: ${currentConfig.codeContent}`);
    }, 300);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(currentConfig.codeContent);
    onShowToast?.(`已复制识别内容: ${currentConfig.codeContent}`);
  };

  return (
    <div className="bg-white border-2 border-slate-300 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs select-none">
      {/* 1. Header: 模块标题与拍照设置展开按键 */}
      <div className="flex items-center justify-between pb-1.5 px-0.5 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs sm:text-sm font-black text-slate-800">二维码视觉拍照与实时识别</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              showSettingsDrawer
                ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
            title="展开/收起简易拍照设置"
          >
            <Sliders className="w-3 h-3 text-blue-600" />
            <span>{showSettingsDrawer ? '收起设置' : '拍照设置'}</span>
          </button>
        </div>
      </div>

      {/* 2. 3个不同视角切换按键 (视角 1 / 视角 2 / 视角 3) */}
      <div className="grid grid-cols-3 gap-1 my-1.5">
        {VIEWPOINTS.map((vp) => {
          const isSelected = vp.id === selectedViewpoint;
          return (
            <button
              key={vp.id}
              onClick={() => {
                setSelectedViewpoint(vp.id);
                onShowToast?.(`已切换至【${vp.name}】`);
              }}
              className={`py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-blue-600 text-white font-black border-blue-700 shadow-xs ring-1 ring-blue-400'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[11px] sm:text-xs leading-tight truncate">{vp.shortLabel}</div>
            </button>
          );
        })}
      </div>

      {/* 3. 简易拍照设置面板 (可折叠抽屉) */}
      {showSettingsDrawer && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 mb-1.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 border-b border-slate-200 pb-1">
            <span className="flex items-center gap-1 text-slate-800">
              <Camera className="w-3 h-3 text-blue-600" />
              简易相机参数设置
            </span>
            <span className="font-mono text-[10px] text-slate-500">{currentConfig.resolution}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 曝光时间选择 */}
            <div className="bg-white p-1.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">曝光时间 (Exposure)</span>
              <div className="flex items-center gap-1">
                {[8, 15, 30].map((t) => (
                  <button
                    key={t}
                    onClick={() => setExposureTime(t)}
                    className={`flex-1 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      exposureTime === t
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {t}ms
                  </button>
                ))}
              </div>
            </div>

            {/* 补光灯强度 */}
            <div className="bg-white p-1.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                  <Sun className="w-2.5 h-2.5 text-amber-500" />
                  补光灯
                </span>
                <span className="font-mono text-[10px] font-bold text-amber-700">{isLightOn ? `${lightingLevel}%` : '关闭'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="10"
                  value={lightingLevel}
                  disabled={!isLightOn}
                  onChange={(e) => setLightingLevel(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <button
                  onClick={() => setIsLightOn(!isLightOn)}
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold border cursor-pointer ${
                    isLightOn ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {isLightOn ? '开' : '关'}
                </button>
              </div>
            </div>
          </div>

          {/* 图像增强与识别模式 */}
          <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-200 text-[10px]">
            <label className="flex items-center gap-1 text-slate-700 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={enhanceContrast}
                onChange={(e) => setEnhanceContrast(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span>高对比度算法增强</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsContinuousScan(!isContinuousScan)}
                className={`px-2 py-0.5 rounded font-bold border transition-all cursor-pointer ${
                  isContinuousScan
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isContinuousScan ? '● 连续实时识别' : '○ 单次抓拍模式'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 实时的二维码采集图像窗口 (白底工业取景器设计，尺寸扩大) */}
      <div
        className={`relative w-full h-44 sm:h-52 bg-white rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-300 transition-all ${
          isCapturing ? 'brightness-95 ring-4 ring-blue-400' : ''
        }`}
      >
        {/* Camera Live Visual Feed - Clean Crisp Light Industrial Viewfinder */}
        <svg viewBox="0 0 320 200" className="w-full h-full">
          <defs>
            <pattern id="cameraGridLight" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Clean White Grid Viewfinder */}
          <rect width="320" height="200" fill="#f8fafc" />
          <rect width="320" height="200" fill="url(#cameraGridLight)" />

          {/* Viewpoint 1: Docking QR Pattern */}
          {selectedViewpoint === 'DOCKING' && (
            <g transform="translate(95, 35)">
              {/* White Background with Subtle Border for QR */}
              <rect x="0" y="0" width="130" height="130" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Three Big Corner Markers */}
              {/* Top-Left */}
              <rect x="10" y="10" width="30" height="30" fill="#0f172a" />
              <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
              <rect x="19" y="19" width="12" height="12" fill="#0f172a" />

              {/* Top-Right */}
              <rect x="90" y="10" width="30" height="30" fill="#0f172a" />
              <rect x="95" y="15" width="20" height="20" fill="#ffffff" />
              <rect x="99" y="19" width="12" height="12" fill="#0f172a" />

              {/* Bottom-Left */}
              <rect x="10" y="90" width="30" height="30" fill="#0f172a" />
              <rect x="15" y="95" width="20" height="20" fill="#ffffff" />
              <rect x="19" y="99" width="12" height="12" fill="#0f172a" />

              {/* Data Matrix / QR Inner Blocks */}
              <rect x="48" y="12" width="7" height="7" fill="#0f172a" />
              <rect x="62" y="12" width="7" height="7" fill="#0f172a" />
              <rect x="76" y="12" width="7" height="7" fill="#0f172a" />
              <rect x="48" y="25" width="7" height="7" fill="#0f172a" />
              <rect x="68" y="25" width="7" height="7" fill="#0f172a" />
              <rect x="54" y="38" width="22" height="7" fill="#0f172a" />

              <rect x="12" y="48" width="7" height="7" fill="#0f172a" />
              <rect x="25" y="48" width="7" height="7" fill="#0f172a" />
              <rect x="38" y="48" width="7" height="7" fill="#0f172a" />
              <rect x="52" y="48" width="26" height="7" fill="#0f172a" />
              <rect x="90" y="48" width="7" height="7" fill="#0f172a" />
              <rect x="108" y="48" width="7" height="7" fill="#0f172a" />

              <rect x="18" y="62" width="7" height="7" fill="#0f172a" />
              <rect x="32" y="62" width="14" height="7" fill="#0f172a" />
              <rect x="58" y="62" width="14" height="7" fill="#0f172a" />
              <rect x="85" y="62" width="14" height="7" fill="#0f172a" />
              <rect x="110" y="62" width="7" height="7" fill="#0f172a" />

              <rect x="12" y="75" width="7" height="7" fill="#0f172a" />
              <rect x="45" y="75" width="14" height="7" fill="#0f172a" />
              <rect x="72" y="75" width="14" height="7" fill="#0f172a" />
              <rect x="98" y="75" width="20" height="7" fill="#0f172a" />

              <rect x="50" y="88" width="7" height="7" fill="#0f172a" />
              <rect x="64" y="88" width="20" height="7" fill="#0f172a" />
              <rect x="96" y="88" width="7" height="7" fill="#0f172a" />
              <rect x="110" y="88" width="7" height="7" fill="#0f172a" />

              <rect x="50" y="102" width="14" height="7" fill="#0f172a" />
              <rect x="74" y="102" width="7" height="7" fill="#0f172a" />
              <rect x="90" y="102" width="14" height="7" fill="#0f172a" />
              <rect x="110" y="102" width="7" height="7" fill="#0f172a" />

              <rect x="50" y="114" width="7" height="7" fill="#0f172a" />
              <rect x="68" y="114" width="14" height="7" fill="#0f172a" />
              <rect x="94" y="114" width="22" height="7" fill="#0f172a" />
            </g>
          )}

          {/* Viewpoint 2: PCB Lot DataMatrix Pattern */}
          {selectedViewpoint === 'PCB_LOT' && (
            <g transform="translate(95, 35)">
              {/* White Background */}
              <rect x="0" y="0" width="130" height="130" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />

              {/* DataMatrix L-Finder Pattern (Left & Bottom solid borders) */}
              <rect x="12" y="12" width="7" height="106" fill="#0f172a" />
              <rect x="12" y="111" width="106" height="7" fill="#0f172a" />

              {/* Top & Right Alternating Clocking Borders */}
              {[19, 33, 47, 61, 75, 89, 103, 111].map((x) => (
                <rect key={`t-${x}`} x={x} y="12" width="7" height="7" fill="#0f172a" />
              ))}
              {[19, 33, 47, 61, 75, 89, 97].map((y) => (
                <rect key={`r-${y}`} x="111" y={y} width="7" height="7" fill="#0f172a" />
              ))}

              {/* DataMatrix Internal Modules */}
              <rect x="26" y="26" width="14" height="14" fill="#0f172a" />
              <rect x="52" y="26" width="7" height="20" fill="#0f172a" />
              <rect x="72" y="26" width="20" height="7" fill="#0f172a" />
              <rect x="98" y="26" width="7" height="7" fill="#0f172a" />

              <rect x="26" y="46" width="20" height="7" fill="#0f172a" />
              <rect x="52" y="52" width="14" height="14" fill="#0f172a" />
              <rect x="72" y="39" width="7" height="20" fill="#0f172a" />
              <rect x="85" y="46" width="20" height="7" fill="#0f172a" />

              <rect x="26" y="66" width="7" height="26" fill="#0f172a" />
              <rect x="39" y="72" width="14" height="7" fill="#0f172a" />
              <rect x="59" y="72" width="20" height="14" fill="#0f172a" />
              <rect x="85" y="66" width="14" height="7" fill="#0f172a" />
              <rect x="98" y="79" width="7" height="20" fill="#0f172a" />

              <rect x="39" y="92" width="14" height="14" fill="#0f172a" />
              <rect x="59" y="92" width="7" height="14" fill="#0f172a" />
              <rect x="72" y="92" width="20" height="7" fill="#0f172a" />
              <rect x="85" y="99" width="14" height="7" fill="#0f172a" />
            </g>
          )}

          {/* Viewpoint 3: Carrier Alignment QR Pattern */}
          {selectedViewpoint === 'CARRIER' && (
            <g transform="translate(95, 35)">
              {/* White Background */}
              <rect x="0" y="0" width="130" height="130" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Three Big Corner Markers */}
              <rect x="10" y="10" width="30" height="30" fill="#1e3a8a" />
              <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
              <rect x="19" y="19" width="12" height="12" fill="#1e3a8a" />

              <rect x="90" y="10" width="30" height="30" fill="#1e3a8a" />
              <rect x="95" y="15" width="20" height="20" fill="#ffffff" />
              <rect x="99" y="19" width="12" height="12" fill="#1e3a8a" />

              <rect x="10" y="90" width="30" height="30" fill="#1e3a8a" />
              <rect x="15" y="95" width="20" height="20" fill="#ffffff" />
              <rect x="19" y="99" width="12" height="12" fill="#1e3a8a" />

              {/* Center Alignment Pattern */}
              <rect x="83" y="83" width="20" height="20" fill="#1e3a8a" />
              <rect x="87" y="87" width="12" height="12" fill="#ffffff" />
              <rect x="91" y="91" width="4" height="4" fill="#1e3a8a" />

              {/* Blocks */}
              <rect x="48" y="12" width="14" height="7" fill="#1e3a8a" />
              <rect x="68" y="12" width="14" height="7" fill="#1e3a8a" />
              <rect x="52" y="26" width="22" height="7" fill="#1e3a8a" />
              <rect x="46" y="39" width="7" height="14" fill="#1e3a8a" />
              <rect x="59" y="39" width="20" height="7" fill="#1e3a8a" />

              <rect x="12" y="50" width="20" height="7" fill="#1e3a8a" />
              <rect x="39" y="50" width="26" height="7" fill="#1e3a8a" />
              <rect x="72" y="50" width="14" height="7" fill="#1e3a8a" />
              <rect x="92" y="50" width="26" height="7" fill="#1e3a8a" />

              <rect x="12" y="64" width="14" height="7" fill="#1e3a8a" />
              <rect x="33" y="64" width="20" height="7" fill="#1e3a8a" />
              <rect x="59" y="64" width="14" height="7" fill="#1e3a8a" />
              <rect x="79" y="64" width="20" height="7" fill="#1e3a8a" />
              <rect x="105" y="64" width="14" height="7" fill="#1e3a8a" />

              <rect x="20" y="77" width="26" height="7" fill="#1e3a8a" />
              <rect x="52" y="77" width="20" height="7" fill="#1e3a8a" />
              <rect x="110" y="77" width="9" height="7" fill="#1e3a8a" />

              <rect x="48" y="90" width="14" height="7" fill="#1e3a8a" />
              <rect x="66" y="90" width="11" height="7" fill="#1e3a8a" />
              <rect x="110" y="90" width="9" height="20" fill="#1e3a8a" />

              <rect x="48" y="103" width="26" height="7" fill="#1e3a8a" />
              <rect x="52" y="114" width="14" height="7" fill="#1e3a8a" />
              <rect x="72" y="114" width="31" height="7" fill="#1e3a8a" />
            </g>
          )}

          {/* Green Targeting Bounding Box with Corner Accents */}
          <g>
            <rect
              x="82"
              y="22"
              width="156"
              height="156"
              fill="none"
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.85"
            />
            {/* Top-Left Corner Bracket */}
            <path d="M 76 38 L 76 16 L 98 16" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
            {/* Top-Right Corner Bracket */}
            <path d="M 222 16 L 244 16 L 244 38" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
            {/* Bottom-Left Corner Bracket */}
            <path d="M 76 162 L 76 184 L 98 184" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
            {/* Bottom-Right Corner Bracket */}
            <path d="M 222 184 L 244 184 L 244 162" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />

            {/* Center Crosshair */}
            <line x1="160" y1="10" x2="160" y2="28" stroke="#16a34a" strokeWidth="1.5" />
            <line x1="160" y1="172" x2="160" y2="190" stroke="#16a34a" strokeWidth="1.5" />
            <line x1="68" y1="100" x2="86" y2="100" stroke="#16a34a" strokeWidth="1.5" />
            <line x1="234" y1="100" x2="252" y2="100" stroke="#16a34a" strokeWidth="1.5" />
            <circle cx="160" cy="100" r="3.5" fill="none" stroke="#16a34a" strokeWidth="1.5" />
          </g>

          {/* Status Overlay Tag */}
          <rect x="8" y="8" width="84" height="20" rx="4" fill="#059669" />
          <text x="14" y="22" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
            ● 识别: 99.8%
          </text>
        </svg>

        {/* Live Snapshot Trigger Floating Button */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={handleCaptureSnapshot}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-sm border border-blue-500 active:scale-95 cursor-pointer"
            title="拍照抓拍当前二维码"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>拍照抓拍</span>
          </button>
        </div>

        {/* Bottom Overlay Info Tag */}
        <div className="absolute bottom-1.5 left-2 right-2 bg-white/95 backdrop-blur-xs border border-slate-300 px-2 py-0.5 rounded-md flex items-center justify-between text-[10px] font-mono text-slate-700 shadow-2xs">
          <span className="truncate text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {currentConfig.codeType} 解码成功 ({currentConfig.decodeTimeMs}ms)
          </span>
          <span className="text-slate-500 shrink-0 font-bold">Exp: {exposureTime}ms</span>
        </div>
      </div>

      {/* 5. 实时二维码解析结果展示卡片 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 mt-1.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-bold">二维码解析数据:</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              置信度 {currentConfig.confidence}%
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
              title="复制识别结果"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-white px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs text-slate-900 break-all select-all flex items-center justify-between">
          <span className="text-blue-900">{currentConfig.codeContent}</span>
        </div>

        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
          <span>用途: {currentConfig.description}</span>
          <button
            onClick={handleCaptureSnapshot}
            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>重新识别</span>
          </button>
        </div>
      </div>
    </div>
  );
};
