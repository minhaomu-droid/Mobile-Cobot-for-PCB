import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  Bot,
  Compass,
  Zap,
  Split,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Sparkles,
  Sliders,
  Terminal,
  HelpCircle,
  Check,
} from 'lucide-react';
import { BlocklyNode, BlocklyProgram, BlockCategory } from '../types';

interface BlocklyProgrammingProps {
  onShowToast: (msg: string) => void;
  onNavigateToTeleop?: () => void;
}

// 动作指令库 (按 5 大功能类别划分)
const AVAILABLE_BLOCKS: Array<{
  category: BlockCategory;
  categoryLabel: string;
  color: string;
  bgLight: string;
  borderLight: string;
  items: Array<{
    type: string;
    name: string;
    icon: any;
    defaultParams: Record<string, any>;
    description: string;
  }>;
}> = [
  {
    category: 'CHASSIS',
    categoryLabel: '底盘移动与导航',
    color: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    items: [
      {
        type: 'NAV_GOTO',
        name: '底盘导航至工位',
        icon: Compass,
        defaultParams: { 目标工位: '1号测厚机 上料位', 速度: 0.5, 容差毫米: 5 },
        description: '自主寻路移动至指定工厂地标',
      },
      {
        type: 'NAV_ROTATE',
        name: '底盘原地定角旋转',
        icon: Compass,
        defaultParams: { 旋转角度: 90, 旋转角速度: 30 },
        description: '双轮差速原地旋转对准测厚台',
      },
      {
        type: 'NAV_RELOCALIZE',
        name: '激光打点重定位',
        icon: Compass,
        defaultParams: { 搜索半径米: 1.5, 最小置信度: 90 },
        description: '触发激光雷达全局点云精准对齐',
      },
    ],
  },
  {
    category: 'VISION',
    categoryLabel: '末端视觉与二维码定位',
    color: 'text-cyan-800',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    items: [
      {
        type: 'VISION_LIGHT',
        name: '设置末端补光灯',
        icon: Eye,
        defaultParams: { 亮度百分比: 85, 模式: '环形无影灯' },
        description: '开启机械臂末端高亮补光照明',
      },
      {
        type: 'VISION_SCAN_QR',
        name: '扫描二维码提取批次',
        icon: Eye,
        defaultParams: { 码制: '二维码/DataMatrix', 变量存储: '批次号', 超时秒数: 3.0 },
        description: '识别基板料盘上的二维码与批次信息',
      },
      {
        type: 'VISION_SERVO_ALIGN',
        name: '视觉闭环伺服对准',
        icon: Eye,
        defaultParams: { 目标高度毫米: 150, 最大允许误差毫米: 0.05, 重试次数: 3 },
        description: '手眼视觉闭环微调机械臂末端对中',
      },
      {
        type: 'VISION_CHECK_BOARD',
        name: '视觉检测工件有无',
        icon: Eye,
        defaultParams: { 模板名称: '覆铜板标准件', 匹配置信度: 85 },
        description: '图像匹配确认工件到位且无歪斜',
      },
    ],
  },
  {
    category: 'ARM',
    categoryLabel: '机械臂笛卡尔与关节运动',
    color: 'text-indigo-800',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    items: [
      {
        type: 'ARM_MOVEL',
        name: '空间直线运动 (直线走位)',
        icon: Bot,
        defaultParams: { X轴: 480.0, Y轴: -80.0, Z轴: 240.0, 速度毫米秒: 50 },
        description: '机械臂末端空间直线插补至目标位姿',
      },
      {
        type: 'ARM_JOG_Z',
        name: '末端工具 Z 轴相对升降',
        icon: Bot,
        defaultParams: { 下降偏移量毫米: -55.0, 速度毫米秒: 20 },
        description: '贴近台面进行取料或放料',
      },
      {
        type: 'ARM_MOVEJ_HOME',
        name: '机械臂回安全待机位',
        icon: Bot,
        defaultParams: { 速度百分比: 40, 安全避障路径: true },
        description: '安全姿态回原点，避免碰撞测厚机',
      },
    ],
  },
  {
    category: 'IO',
    categoryLabel: '末端气爪与气路控制',
    color: 'text-purple-800',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    items: [
      {
        type: 'IO_VACUUM_ON',
        name: '开启真空吸盘吸附',
        icon: Zap,
        defaultParams: { 目标负压: -60, 等待确认: true, 超时秒数: 2.5 },
        description: '启动电磁真空阀并检测负压传感器达标',
      },
      {
        type: 'IO_VACUUM_OFF',
        name: '破真空吹气释放料片',
        icon: Zap,
        defaultParams: { 吹气时长秒: 0.4 },
        description: '正压脉冲吹气快速脱料，防止黏连',
      },
      {
        type: 'IO_SET_DO',
        name: '输出信号与测厚机握手',
        icon: Zap,
        defaultParams: { 信号端口: 1, 状态: '高电平/接通' },
        description: '触发机台声光提醒或向测厚机发送就绪信号',
      },
    ],
  },
  {
    category: 'LOGIC',
    categoryLabel: '流程控制与逻辑判断',
    color: 'text-amber-800',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    items: [
      {
        type: 'LOGIC_WAIT',
        name: '延时等待',
        icon: Split,
        defaultParams: { 等待秒数: 1.0 },
        description: '暂停指定时间等待机台动作就绪',
      },
      {
        type: 'LOGIC_IF_VISION',
        name: '条件分支: 若视觉对位成功',
        icon: Split,
        defaultParams: { 判定条件: '视觉对位成功' },
        description: '根据视觉识别结果执行对应分支',
      },
      {
        type: 'LOGIC_LOOP',
        name: '循环执行',
        icon: Split,
        defaultParams: { 循环次数: 5 },
        description: '重复执行内部子动作指令',
      },
      {
        type: 'LOGIC_MES_REPORT',
        name: '测厚数据与工单上报系统',
        icon: Split,
        defaultParams: { 自动上传: true, 附加时间戳: true },
        description: '将当前批次号及采集厚度上传至车间管理系统',
      },
    ],
  },
];

// 预置标准工艺流程模板 (针对 2 台机器人: M-01 上料, M-02 收料)
const PRESET_PROGRAMS: BlocklyProgram[] = [
  {
    id: 'PROG-01',
    name: '【推荐】标准测厚上料作业流程 (扫码定位+真空吸取送板)',
    description: '底盘进站 ➔ 开启末端补光 ➔ 视觉扫描二维码 ➔ 视觉闭环对准 ➔ 机械臂下降 ➔ 真空吸附 ➔ 送达测厚机台面',
    targetRobot: 'M-01 上料复合机器人',
    version: 'v3.2',
    updatedAt: '2026-08-14 10:15',
    nodes: [
      {
        id: 'node-1',
        category: 'CHASSIS',
        type: 'NAV_GOTO',
        name: '底盘导航至 1号测厚机 (ST-01) 上料口',
        iconName: 'Compass',
        color: 'border-blue-200 bg-blue-50/70',
        params: { 目标工位: '1号测厚机 (ST-01) 上料口', 速度: 0.5, 容差毫米: 5 },
        enabled: true,
      },
      {
        id: 'node-2',
        category: 'VISION',
        type: 'VISION_LIGHT',
        name: '开启末端高亮环形补光灯',
        iconName: 'Eye',
        color: 'border-cyan-200 bg-cyan-50/70',
        params: { 亮度百分比: 90, 模式: '环形无影灯' },
        enabled: true,
      },
      {
        id: 'node-3',
        category: 'VISION',
        type: 'VISION_SCAN_QR',
        name: '扫描工件二维码并提取批次号',
        iconName: 'Eye',
        color: 'border-cyan-200 bg-cyan-50/70',
        params: { 码制: '二维码', 变量存储: '批次号', 超时秒数: 3.0 },
        enabled: true,
      },
      {
        id: 'node-4',
        category: 'VISION',
        type: 'VISION_SERVO_ALIGN',
        name: '基于二维码执行视觉伺服对准',
        iconName: 'Eye',
        color: 'border-cyan-200 bg-cyan-50/70',
        params: { 目标高度毫米: 150, 最大允许误差毫米: 0.05, 重试次数: 3 },
        enabled: true,
      },
      {
        id: 'node-5',
        category: 'ARM',
        type: 'ARM_MOVEL',
        name: '机械臂直线运动至抓取预备位',
        iconName: 'Bot',
        color: 'border-indigo-200 bg-indigo-50/70',
        params: { X轴: 480.0, Y轴: -80.0, Z轴: 240.0, 速度毫米秒: 50 },
        enabled: true,
      },
      {
        id: 'node-6',
        category: 'ARM',
        type: 'ARM_JOG_Z',
        name: '末端吸盘相对下移贴近板材',
        iconName: 'Bot',
        color: 'border-indigo-200 bg-indigo-50/70',
        params: { 下降偏移量毫米: -55.0, 速度毫米秒: 25 },
        enabled: true,
      },
      {
        id: 'node-7',
        category: 'IO',
        type: 'IO_VACUUM_ON',
        name: '开启电磁真空吸附锁定',
        iconName: 'Zap',
        color: 'border-purple-200 bg-purple-50/70',
        params: { 目标负压: -65, 等待确认: true, 超时秒数: 2.0 },
        enabled: true,
      },
      {
        id: 'node-8',
        category: 'ARM',
        type: 'ARM_JOG_Z',
        name: '末端提升离开料架并送入测厚台',
        iconName: 'Bot',
        color: 'border-indigo-200 bg-indigo-50/70',
        params: { 提升偏移量毫米: 60.0, 速度毫米秒: 40 },
        enabled: true,
      },
      {
        id: 'node-9',
        category: 'LOGIC',
        type: 'LOGIC_MES_REPORT',
        name: '上料完成信号与工单上报系统',
        iconName: 'Split',
        color: 'border-amber-200 bg-amber-50/70',
        params: { 自动上传: true, 附加时间戳: true },
        enabled: true,
      },
    ],
  },
  {
    id: 'PROG-02',
    name: '测厚完成收料与成品码垛作业流程',
    description: '测厚完成信号握手 ➔ 机械臂移动至测厚机出料位 ➔ 真空吸盘抓取 ➔ 搬运至成品托盘并正压吹气释放',
    targetRobot: 'M-02 收料复合机器人',
    version: 'v2.1',
    updatedAt: '2026-08-14 09:30',
    nodes: [
      {
        id: 'node-21',
        category: 'CHASSIS',
        type: 'NAV_GOTO',
        name: '底盘导航至 1号测厚机 (ST-01) 出料口',
        iconName: 'Compass',
        color: 'border-blue-200 bg-blue-50/70',
        params: { 目标工位: '1号测厚机 (ST-01) 出料口', 速度: 0.4, 容差毫米: 5 },
        enabled: true,
      },
      {
        id: 'node-22',
        category: 'ARM',
        type: 'ARM_MOVEL',
        name: '机械臂伸出至出料抓取点',
        iconName: 'Bot',
        color: 'border-indigo-200 bg-indigo-50/70',
        params: { X轴: 450.0, Y轴: -50.0, Z轴: 200.0, 速度毫米秒: 60 },
        enabled: true,
      },
      {
        id: 'node-23',
        category: 'IO',
        type: 'IO_VACUUM_ON',
        name: '开启真空吸盘吸取测厚合格基板',
        iconName: 'Zap',
        color: 'border-purple-200 bg-purple-50/70',
        params: { 目标负压: -60, 等待确认: true, 超时秒数: 2.0 },
        enabled: true,
      },
      {
        id: 'node-24',
        category: 'CHASSIS',
        type: 'NAV_GOTO',
        name: '底盘移动至 成品暂存区 B1',
        iconName: 'Compass',
        color: 'border-blue-200 bg-blue-50/70',
        params: { 目标工位: '成品暂存区 B1', 速度: 0.5, 容差毫米: 5 },
        enabled: true,
      },
      {
        id: 'node-25',
        category: 'IO',
        type: 'IO_VACUUM_OFF',
        name: '破真空吹气释放料片至托盘',
        iconName: 'Zap',
        color: 'border-purple-200 bg-purple-50/70',
        params: { 吹气时长秒: 0.5 },
        enabled: true,
      },
      {
        id: 'node-26',
        category: 'ARM',
        type: 'ARM_MOVEJ_HOME',
        name: '机械臂回到待机安全姿态',
        iconName: 'Bot',
        color: 'border-indigo-200 bg-indigo-50/70',
        params: { 速度百分比: 50, 安全避障路径: true },
        enabled: true,
      },
    ],
  },
  {
    id: 'PROG-03',
    name: '低电量自主回充与视觉对桩流程',
    description: '电量低于设定阈值 ➔ 导航至自动充电区 ➔ 末端视觉对准充电极板 ➔ 接通充电回路',
    targetRobot: '通用 (M-01 上料 / M-02 收料)',
    version: 'v1.5',
    updatedAt: '2026-08-14 08:20',
    nodes: [
      {
        id: 'node-31',
        category: 'CHASSIS',
        type: 'NAV_GOTO',
        name: '底盘导航至 自动充电桩 #01',
        iconName: 'Compass',
        color: 'border-blue-200 bg-blue-50/70',
        params: { 目标工位: '自动充电桩 #01', 速度: 0.3, 容差毫米: 10 },
        enabled: true,
      },
      {
        id: 'node-32',
        category: 'VISION',
        type: 'VISION_SERVO_ALIGN',
        name: '末端相机视觉对准充电触点',
        iconName: 'Eye',
        color: 'border-cyan-200 bg-cyan-50/70',
        params: { 目标高度毫米: 80, 最大允许误差毫米: 0.02, 重试次数: 5 },
        enabled: true,
      },
      {
        id: 'node-33',
        category: 'IO',
        type: 'IO_SET_DO',
        name: '接通充电继电器与接触器',
        iconName: 'Zap',
        color: 'border-purple-200 bg-purple-50/70',
        params: { 信号端口: 2, 状态: '高电平/接通' },
        enabled: true,
      },
    ],
  },
];

export const BlocklyProgramming: React.FC<BlocklyProgrammingProps> = ({
  onShowToast,
  onNavigateToTeleop,
}) => {
  // 当前选择的流程模板
  const [selectedProgramId, setSelectedProgramId] = useState<string>('PROG-01');
  const [programs, setPrograms] = useState<BlocklyProgram[]>(PRESET_PROGRAMS);
  const currentProgram = programs.find((p) => p.id === selectedProgramId) || programs[0];

  // 视图模式：流程图管线 vs 底层脚本预览
  const [viewMode, setViewMode] = useState<'BLOCKS' | 'CODE_PREVIEW'>('BLOCKS');

  // 仿真运行器状态
  const [executing, setExecuting] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [execLogs, setExecLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' }>>([
    { time: '10:14:00', text: '工艺流程示教引擎就绪，等待下发执行指令', type: 'info' },
  ]);

  const execTimerRef = useRef<any>(null);

  // 添加日志
  const appendLog = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setExecLogs((prev) => [{ time, text, type }, ...prev.slice(0, 49)]);
  };

  // 向当前流程中添加动作节点
  const handleAddBlock = (category: BlockCategory, type: string, name: string, defaultParams: Record<string, any>) => {
    const nextNode: BlocklyNode = {
      id: `node-${Date.now()}`,
      category,
      type,
      name,
      iconName: category === 'CHASSIS' ? 'Compass' : category === 'VISION' ? 'Eye' : category === 'ARM' ? 'Bot' : category === 'IO' ? 'Zap' : 'Split',
      color:
        category === 'CHASSIS'
          ? 'border-blue-200 bg-blue-50/70'
          : category === 'VISION'
          ? 'border-cyan-200 bg-cyan-50/70'
          : category === 'ARM'
          ? 'border-indigo-200 bg-indigo-50/70'
          : category === 'IO'
          ? 'border-purple-200 bg-purple-50/70'
          : 'border-amber-200 bg-amber-50/70',
      params: { ...defaultParams },
      enabled: true,
    };

    setPrograms((prev) =>
      prev.map((p) => (p.id === currentProgram.id ? { ...p, nodes: [...p.nodes, nextNode] } : p))
    );
    onShowToast(`已添加动作节点: [${name}]`);
  };

  // 修改节点参数
  const handleUpdateParam = (nodeId: string, paramKey: string, value: any) => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== currentProgram.id) return p;
        return {
          ...p,
          nodes: p.nodes.map((n) => (n.id === nodeId ? { ...n, params: { ...n.params, [paramKey]: value } } : n)),
        };
      })
    );
  };

  // 删除动作节点
  const handleDeleteBlock = (nodeId: string) => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== currentProgram.id) return p;
        return {
          ...p,
          nodes: p.nodes.filter((n) => n.id !== nodeId),
        };
      })
    );
    onShowToast('动作节点已移除');
  };

  // 上移/下移动作节点
  const handleMoveBlock = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentProgram.nodes.length) return;

    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== currentProgram.id) return p;
        const copy = [...p.nodes];
        const temp = copy[index];
        copy[index] = copy[targetIdx];
        copy[targetIdx] = temp;
        return { ...p, nodes: copy };
      })
    );
  };

  // 复制动作节点
  const handleDuplicateBlock = (index: number) => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== currentProgram.id) return p;
        const copy = [...p.nodes];
        const src = copy[index];
        const dup: BlocklyNode = {
          ...src,
          id: `node-${Date.now()}`,
          name: `${src.name} (副本)`,
          params: { ...src.params },
        };
        copy.splice(index + 1, 0, dup);
        return { ...p, nodes: copy };
      })
    );
    onShowToast('已复制动作节点');
  };

  // 启动仿真运行
  const handleStartRun = () => {
    if (currentProgram.nodes.length === 0) {
      onShowToast('当前流程为空，请先从左侧动作库添加指令');
      return;
    }
    setExecuting(true);
    setPaused(false);
    setCurrentStepIndex(0);
    appendLog(`开始执行工艺流程: [${currentProgram.name}]，执行车辆: ${currentProgram.targetRobot}`, 'info');
  };

  const handlePauseRun = () => {
    setPaused(true);
    appendLog('流程执行已暂停', 'warn');
  };

  const handleResumeRun = () => {
    setPaused(false);
    appendLog('流程恢复继续执行', 'info');
  };

  const handleStepNext = () => {
    if (currentStepIndex >= currentProgram.nodes.length - 1) {
      handleStopRun();
      appendLog('单步调试完成，所有步骤均已成功执行', 'success');
      return;
    }
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    const node = currentProgram.nodes[nextIdx];
    appendLog(`[单步执行] 第 ${nextIdx + 1} 步: ${node.name}`, 'info');
  };

  const handleStopRun = () => {
    setExecuting(false);
    setPaused(false);
    setCurrentStepIndex(-1);
    if (execTimerRef.current) clearInterval(execTimerRef.current);
    appendLog('流程执行停止，机械臂与底盘处于安全就绪状态', 'info');
  };

  // 仿真循环执行
  useEffect(() => {
    if (!executing || paused) return;

    const timer = setTimeout(() => {
      if (currentStepIndex < currentProgram.nodes.length - 1) {
        const nextIdx = currentStepIndex + 1;
        setCurrentStepIndex(nextIdx);
        const node = currentProgram.nodes[nextIdx];
        if (node.category === 'VISION') {
          appendLog(`[视觉对位] ${node.name}: 识别到批次 LOT-202608-001，手眼偏差 X:+0.02mm, Y:-0.01mm (对位精准)`, 'success');
        } else if (node.category === 'IO') {
          appendLog(`[气路动作] ${node.name}: 真空吸盘负压 -78.5 kPa (吸附锁定)`, 'success');
        } else {
          appendLog(`[动作执行] 第 ${nextIdx + 1} 步: ${node.name}`, 'info');
        }
      } else {
        setExecuting(false);
        setCurrentStepIndex(-1);
        appendLog(`[完成] 工艺流程全部顺利执行完毕，已同步至测厚机站控！`, 'success');
        onShowToast('工艺流程全部执行完成！');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [executing, paused, currentStepIndex, currentProgram]);

  // 生成 Python 控制脚本
  const generatePythonScript = () => {
    return `# -*- coding: utf-8 -*-
"""
犀准复合机器人 - 动作流程自动生成脚本
流程名称: ${currentProgram.name}
执行设备: ${currentProgram.targetRobot}
版本: ${currentProgram.version} | 生成时间: ${new Date().toLocaleString()}
"""

def execute_thickness_process():
    print("犀准复合机器人作业流程启动...")
${currentProgram.nodes
  .map((node, i) => {
    if (!node.enabled) return `    # 第 ${i + 1} 步: [已跳过] ${node.name}`;
    return `    # 第 ${i + 1} 步: ${node.name}
    robot.execute_step(action="${node.name}", params=${JSON.stringify(node.params)})`;
  })
  .join('\n\n')}
    print("工艺流程全部执行完毕，向测厚机发出就绪信号。")

if __name__ == '__main__':
    execute_thickness_process()
`;
  };

  return (
    <div className="p-4 sm:p-5 space-y-4 h-full overflow-hidden text-slate-900 bg-white flex flex-col justify-between select-none">
      {/* 顶部标题与功能栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3.5 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">动作流程编排与工艺示教</h2>
              <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                双机协同: M-01上料 / M-02收料
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              直观编排底盘导航、机械臂笛卡尔走位、末端视觉二维码识别与吸盘气路控制全流程
            </p>
          </div>
        </div>

        {/* 顶部操作按钮 */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToTeleop && (
            <button
              onClick={onNavigateToTeleop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>进入机器人遥操 (L4)</span>
            </button>
          )}

          {/* 切换视图：动作流程编排 vs 脚本代码 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('BLOCKS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'BLOCKS'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              动作流程编排
            </button>
            <button
              onClick={() => setViewMode('CODE_PREVIEW')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'CODE_PREVIEW'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              脚本代码
            </button>
          </div>

          {/* 下发到机器人 */}
          <button
            onClick={() => onShowToast('已将当前工艺流程成功编译并下发至复合机器人！')}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>下发到机器人</span>
          </button>
        </div>
      </div>

      {/* 流程选择与仿真调试控制栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 shrink-0">
        {/* 流程模板切换 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">工艺流程:</span>
          <select
            value={selectedProgramId}
            onChange={(e) => {
              setSelectedProgramId(e.target.value);
              handleStopRun();
              onShowToast(`已切换至工艺流程: [${e.target.value}]`);
            }}
            className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-2xs"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.nodes.length} 个步骤)
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500 hidden md:inline font-mono">
            目标设备: {currentProgram.targetRobot} | 版本: {currentProgram.version}
          </span>
        </div>

        {/* 仿真运行操作按钮 */}
        <div className="flex items-center gap-2">
          {!executing ? (
            <button
              onClick={handleStartRun}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>仿真运行流程</span>
            </button>
          ) : (
            <>
              {paused ? (
                <button
                  onClick={handleResumeRun}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>继续</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseRun}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>暂停</span>
                </button>
              )}

              <button
                onClick={handleStepNext}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                title="单步执行下一动作"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>单步调试</span>
              </button>

              <button
                onClick={handleStopRun}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>停止复位</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 主体编排区域 */}
      {viewMode === 'BLOCKS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* 左侧：动作指令库 (4 列) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm min-h-0 overflow-hidden">
            <div className="overflow-y-auto flex-1 pr-1 space-y-3 min-h-0">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  动作指令库 (点击添加至右侧流程)
                </span>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                  5 大分类
                </span>
              </div>

              {/* 分类动作指令列表 */}
              {AVAILABLE_BLOCKS.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${cat.bgLight} ${cat.color} border ${cat.borderLight} flex items-center justify-between`}>
                    <span>{cat.categoryLabel}</span>
                    <span className="text-[10px] font-mono opacity-80">{cat.items.length} 个指令</span>
                  </div>

                  <div className="space-y-1 pl-1">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.type}
                          onClick={() => handleAddBlock(cat.category, item.type, item.name, item.defaultParams)}
                          className="p-2 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all cursor-pointer group flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${cat.bgLight} ${cat.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-1">
                                {item.description}
                              </div>
                            </div>
                          </div>

                          <div className="p-1 rounded-md bg-white group-hover:bg-blue-600 text-slate-400 group-hover:text-white transition-all shadow-2xs">
                            <Plus className="w-3 h-3" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-600">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                支持末端视觉二维码识别与闭环伺服
              </span>
            </div>
          </div>

          {/* 中间：工艺流程步骤管线 (5 列) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm min-h-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  当前流程步骤管线 ({currentProgram.nodes.length} 步)
                </span>
                {executing && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    正在执行第 {currentStepIndex + 1} 步
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500">
                从上至下按序执行
              </div>
            </div>

            {/* 步骤卡片列表 */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2.5 min-h-0">
              {currentProgram.nodes.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Sparkles className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-600">当前流程暂无动作步骤</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    从左侧动作库点击添加，或在上方选择推荐工艺模板
                  </p>
                </div>
              ) : (
                currentProgram.nodes.map((node, index) => {
                  const isCurrent = executing && currentStepIndex === index;
                  const isPast = executing && currentStepIndex > index;
                  return (
                    <div
                      key={node.id}
                      className={`border rounded-2xl p-3 transition-all relative ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/90 shadow-md ring-2 ring-blue-400/40'
                          : isPast
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : node.enabled
                          ? 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 shadow-2xs'
                          : 'border-slate-200 bg-slate-100 opacity-50'
                      }`}
                    >
                      {/* 步骤头部 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                              isCurrent
                                ? 'bg-blue-600 text-white animate-bounce'
                                : isPast
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {index + 1}
                          </span>

                          <span className="text-xs font-bold text-slate-900">
                            {node.name}
                          </span>

                          {node.category === 'VISION' && (
                            <span className="text-[9px] font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded border border-cyan-200">
                              视觉定位
                            </span>
                          )}
                        </div>

                        {/* 步骤操作按钮 */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveBlock(index, 'UP')}
                            disabled={index === 0}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                            title="上移步骤"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveBlock(index, 'DOWN')}
                            disabled={index === currentProgram.nodes.length - 1}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                            title="下移步骤"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateBlock(index)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer"
                            title="复制步骤"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(node.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                            title="删除步骤"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 参数配置区域 */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs font-mono grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(node.params).map(([key, val]) => (
                          <div key={key} className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-sans font-semibold block">
                              {key}
                            </span>
                            {typeof val === 'number' ? (
                              <input
                                type="number"
                                value={val}
                                onChange={(e) => handleUpdateParam(node.id, key, parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-blue-700 font-bold focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                              />
                            ) : typeof val === 'boolean' ? (
                              <button
                                onClick={() => handleUpdateParam(node.id, key, !val)}
                                className={`w-full py-0.5 rounded text-[11px] font-bold border ${
                                  val
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {val ? '开启' : '关闭'}
                              </button>
                            ) : (
                              <input
                                type="text"
                                value={String(val)}
                                onChange={(e) => handleUpdateParam(node.id, key, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 font-bold focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>共 {currentProgram.nodes.length} 个动作步骤</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                语法逻辑检查通过
              </span>
            </div>
          </div>

          {/* 右侧：实时仿真执行日志与视觉反馈 (3 列) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm min-h-0 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5 shrink-0">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  实时执行输出与视觉反馈
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  通讯在线
                </span>
              </div>

              {/* 末端相机状态卡片 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-2.5 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-cyan-800 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-600" />
                    末端相机识别状态
                  </span>
                  <span className="text-[10px] text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                    60帧/秒 高清
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">已识读批次:</span>
                    <span className="font-bold text-blue-700 font-mono">LOT-202608-001</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">工件类型:</span>
                    <span className="font-bold text-slate-800">覆铜板基板 (1.250mm)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">对位偏差:</span>
                    <span className="font-bold text-emerald-600 font-mono">X: +0.02, Y: -0.01 mm</span>
                  </div>
                </div>
              </div>

              {/* 实时执行日志流 (白底高对比度工控终端) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex-1 overflow-y-auto space-y-1.5 font-mono min-h-0">
                {execLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-1 leading-snug">
                    <span className="text-slate-400 shrink-0 select-none">[{log.time}]</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-700 font-bold'
                          : log.type === 'warn'
                          ? 'text-amber-700 font-bold'
                          : 'text-slate-700'
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部操作 */}
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <button
                onClick={() => setExecLogs([{ time: '10:15:00', text: '控制台日志已清空', type: 'info' }])}
                className="text-slate-500 hover:text-slate-800 text-[11px] font-bold cursor-pointer"
              >
                清空日志
              </button>

              <button
                onClick={() => onShowToast('已导出离线执行脚本 (.py)')}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[11px] font-bold cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>导出脚本</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 代码预览视图 (白底清晰样式) */
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm min-h-0 overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">
                  自动编译生成的工业机器人底层控制脚本 (Python)
                </span>
              </div>
            </div>

            <pre className="bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-xl font-mono text-xs overflow-auto flex-1 leading-relaxed select-text min-h-0">
              <code>{generatePythonScript()}</code>
            </pre>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">
              脚本格式完全适配犀准复合机器人运动控制器
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(generatePythonScript());
                onShowToast('控制脚本已复制到剪贴板！');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 cursor-pointer shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>复制代码</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
