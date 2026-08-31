import React, { useState } from 'react';
import { ActiveModalType } from '../types';
import {
  AlertTriangle,
  ShieldCheck,
  X,
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  HandMetal,
  Layers,
  HelpCircle
} from 'lucide-react';

interface ModalLightboxProps {
  activeModal: ActiveModalType;
  onCloseModal: () => void;
  onConfirmStartLoading: (boardCount?: number) => void;
  onConfirmBoardsInput: (count: number, width?: string) => void;
  onConfirmTaskSafety?: (mode: 'RESUME' | 'RESTART') => void;
  onConfirmGripperAction?: (action: 'OPEN' | 'CLOSE') => void;
  onResetEstop: () => void;
  pendingTaskMode?: 'RESUME' | 'RESTART';
  pendingGripperAction?: 'OPEN' | 'CLOSE';
}

export const ModalLightbox: React.FC<ModalLightboxProps> = ({
  activeModal,
  onCloseModal,
  onConfirmStartLoading,
  onConfirmBoardsInput,
  onConfirmTaskSafety,
  onConfirmGripperAction,
  onResetEstop,
  pendingTaskMode = 'RESUME',
  pendingGripperAction = 'OPEN',
}) => {
  if (activeModal === 'NONE') return null;

  // State for PCB Board Count in Start & Remaining Modal
  const [boardCountInput, setBoardCountInput] = useState<string>('150');
  const [boardWidthInput, setBoardWidthInput] = useState<string>('410 mm');

  // Checklist for Task Safety Confirmation (人工确认环节)
  const [checkArmSafe, setCheckArmSafe] = useState(true);
  const [checkVacuumSafe, setCheckVacuumSafe] = useState(true);
  const [checkAreaClear, setCheckAreaClear] = useState(true);

  // Checklist for Gripper Safety Confirmation (夹具安全确认)
  const [checkTrayAligned, setCheckTrayAligned] = useState(true);
  const [checkDropSafe, setCheckDropSafe] = useState(true);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none font-sans animate-fade-in">
      {/* Lightbox Container */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl shadow-2xl max-w-lg w-full p-6 text-slate-900 relative">
        {/* Close Cross Button */}
        <button
          onClick={onCloseModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Modal 1: 启动上下料 - 卡扣安全与当前PCB板数量确认弹窗 */}
        {activeModal === 'SAFETY_LOCK_CONFIRM' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">卡扣状态与PCB板数安全确认</h3>
                <p className="text-[11px] text-slate-500 font-mono">启动自动上下料循环前的人工安全防呆</p>
              </div>
            </div>

            {/* Exact Wireframe Text */}
            <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-4 text-slate-800 text-xs sm:text-sm leading-relaxed">
              请确认上下料承载件的所有卡扣处于打开状态，确定请点击确定继续下发工作任务，否则点击取消返回。如卡扣未打开造成的损失由操作人员负责!
            </div>

            {/* PCB Board Count Confirmation Field */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs sm:text-sm font-bold text-slate-800 shrink-0">
                  确认当前PCB板数量:
                </label>
                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                  <input
                    type="number"
                    value={boardCountInput}
                    onChange={(e) => setBoardCountInput(e.target.value)}
                    min="1"
                    max="9999"
                    className="w-full px-3 py-2 bg-[#d8f3dc] text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-emerald-500 focus:outline-none shadow-inner text-center"
                  />
                  <span className="text-xs font-bold text-slate-600 shrink-0">片</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">系统将以当前确认的板数设定为本次测厚作业目标计划</p>
            </div>

            {/* Buttons: [确定] [取消] (Cyan styling matching wireframe) */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => {
                  const count = parseInt(boardCountInput) || 150;
                  onConfirmStartLoading(count);
                }}
                className="px-6 py-2.5 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-bold text-sm rounded-xl border border-[#46b8da] shadow-md transition-all active:scale-95 cursor-pointer"
              >
                确定
              </button>
              <button
                onClick={onCloseModal}
                className="px-6 py-2.5 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-bold text-sm rounded-xl border border-[#46b8da] shadow-md transition-all active:scale-95 cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 2. Modal 2: 手动继续参数设定 (设定剩余板数) */}
        {activeModal === 'REMAINING_BOARDS_INPUT' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">手动继续参数设定</h3>
              <p className="text-xs text-slate-500 mt-0.5">请输入剩余板数量以恢复待命作业</p>
            </div>

            {/* Green Input Fields matching wireframe */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="w-24 text-sm font-bold text-slate-800 text-right shrink-0">
                  剩余板数量:
                </label>
                <input
                  type="number"
                  value={boardCountInput}
                  onChange={(e) => setBoardCountInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#d8f3dc] text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-emerald-500 focus:outline-none shadow-inner"
                />
              </div>
            </div>

            {/* Buttons: [确定] [取消] */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  const count = parseInt(boardCountInput) || 100;
                  onConfirmBoardsInput(count, boardWidthInput);
                }}
                className="px-6 py-2.5 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-bold text-sm rounded-xl border border-[#46b8da] shadow-md transition-all active:scale-95 cursor-pointer"
              >
                确定
              </button>
              <button
                onClick={onCloseModal}
                className="px-6 py-2.5 bg-[#5bc0de] hover:bg-[#31b0d5] text-white font-bold text-sm rounded-xl border border-[#46b8da] shadow-md transition-all active:scale-95 cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 3. Modal: 任务安全人工确认环节 (Task Execution Safety Verification) */}
        {activeModal === 'TASK_SAFETY_CONFIRM' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-300 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {pendingTaskMode === 'RESTART' ? '重新开始任务 - 安全防呆确认' : '继续执行任务 - 安全状态确认'}
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  {pendingTaskMode === 'RESTART'
                    ? '将重置当前批次计数，从第 1 片开始全新作业'
                    : '将从当前工位进度继续自动上下料测厚作业'}
                </p>
              </div>
            </div>

            {/* Human Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 text-xs text-slate-800 font-sans">
              <div className="font-bold text-slate-700 mb-1">请操作员逐项核对并勾选安全状态：</div>
              <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={checkArmSafe}
                  onChange={(e) => setCheckArmSafe(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>1. 确认机械臂处于安全运行空间，无卡阻与机械干涉</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={checkVacuumSafe}
                  onChange={(e) => setCheckVacuumSafe(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>2. 确认吸盘夹爪状态正常，上下料料架无歪斜或重叠</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={checkAreaClear}
                  onChange={(e) => setCheckAreaClear(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>3. 确认复合机器人移动通道安全，无人员侵入作业区</span>
              </label>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onCloseModal}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
              >
                取消返回
              </button>
              <button
                disabled={!checkArmSafe || !checkVacuumSafe || !checkAreaClear}
                onClick={() => onConfirmTaskSafety && onConfirmTaskSafety(pendingTaskMode)}
                className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  checkArmSafe && checkVacuumSafe && checkAreaClear
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>确认无误，下发启动</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Modal: 夹具控制安全确认 (Gripper Action Safety Confirmation) */}
        {activeModal === 'GRIPPER_SAFETY_CONFIRM' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-600">
                <HandMetal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {pendingGripperAction === 'OPEN' ? '夹具打开 / 破气释放安全确认' : '夹具闭合 / 抽真空吸附确认'}
                </h3>
                <p className="text-xs text-amber-700 font-sans font-bold">
                  【防掉板安全联锁】请确认工件承托状态以避免 PCB 坠落损坏
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2.5 text-xs text-slate-800 font-sans">
              <label className="flex items-center gap-2.5 cursor-pointer hover:bg-amber-100/50 p-1.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={checkTrayAligned}
                  onChange={(e) => setCheckTrayAligned(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
                <span>1. 确认末端执行器已贴合料盘/测厚托台表面</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer hover:bg-amber-100/50 p-1.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={checkDropSafe}
                  onChange={(e) => setCheckDropSafe(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
                <span>2. 确认释放或夹取动作不会造成高空坠板或工件碰撞</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onCloseModal}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                disabled={!checkTrayAligned || !checkDropSafe}
                onClick={() => onConfirmGripperAction && onConfirmGripperAction(pendingGripperAction)}
                className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  checkTrayAligned && checkDropSafe
                    ? 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>确认执行夹具动作</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. Modal: Emergency Stop Reset */}
        {activeModal === 'ESTOP_WARNING' && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-red-600 text-white mx-auto flex items-center justify-center shadow-lg border-2 border-red-300">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-red-600">紧急停止回路状态 (E-STOP)</h3>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                所有复合机器人与测厚机台伺服轴已切断驱动使能
              </p>
            </div>

            <div className="bg-red-50 p-3.5 rounded-2xl border border-red-200 text-xs text-left space-y-1.5 text-red-900 font-mono">
              <p className="font-bold">安全复位步骤：</p>
              <p>1. 检查各机台与机器人周边无人员及机械干涉；</p>
              <p>2. 顺时针旋转释放机台与 Pad 端硬件急停按钮；</p>
              <p>3. 点击下方按钮向安全 PLC 下发安全回路复位使能脉冲。</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onCloseModal}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
              >
                关闭
              </button>
              <button
                onClick={onResetEstop}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl border border-red-500 shadow-md cursor-pointer"
              >
                复位安全回路
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
