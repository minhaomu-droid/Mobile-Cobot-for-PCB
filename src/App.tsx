import React, { useState } from 'react';
import {
  PanelState,
  UserSession,
  SystemConfig,
  ThicknessStation,
  AlarmItem,
  ActiveModalType,
  DispatchTask,
  CalibrationPoint,
} from './types';
import {
  INITIAL_USER_SESSION,
  INITIAL_SYSTEM_CONFIG,
  INITIAL_STATIONS,
  INITIAL_ALARMS,
  INITIAL_DISPATCH_TASKS,
  INITIAL_CALIBRATION_POINTS,
} from './mockData';

import { GlobalSideNav } from './components/GlobalSideNav';
import { TopStatusBar } from './components/TopStatusBar';
import { LoginAuth } from './components/LoginAuth';
import { HomeStationList } from './components/HomeStationList';
import { StationControlL3 } from './components/StationControlL3';
import { TeleoperationL4 } from './components/TeleoperationL4';
import { AlarmLogs } from './components/AlarmLogs';
import { DeploymentScheduling } from './components/DeploymentScheduling';
import { SystemSettings } from './components/SystemSettings';
import { ModalLightbox } from './components/ModalLightbox';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Authentication & Session
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [userSession, setUserSession] = useState<UserSession>(INITIAL_USER_SESSION);

  // System Configuration state
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_SYSTEM_CONFIG);

  // Active Panel
  const [currentPanel, setCurrentPanel] = useState<PanelState>('HOME_STATION_LIST');

  // Stations State
  const [stations, setStations] = useState<ThicknessStation[]>(INITIAL_STATIONS);
  const [selectedStationId, setSelectedStationId] = useState<string>('ST-01');

  // L4 Teleoperation Selected Robot Type
  const [selectedRobotType, setSelectedRobotType] = useState<'LOADING' | 'UNLOADING'>('LOADING');

  // Alarms State
  const [alarms, setAlarms] = useState<AlarmItem[]>(INITIAL_ALARMS);

  // Global Robot Operation Mode: AUTO (自动模式) vs MANUAL (手动模式)
  const [systemMode, setSystemMode] = useState<'AUTO' | 'MANUAL'>('AUTO');

  const handleToggleSystemMode = () => {
    const nextMode = systemMode === 'AUTO' ? 'MANUAL' : 'AUTO';
    setSystemMode(nextMode);
    showToast(
      nextMode === 'AUTO'
        ? '已切换至【自动模式】：上首件校准与自动上下料任务已就绪'
        : '已切换至【手动模式】：底盘、机械臂与夹爪手动控制已解锁'
    );
  };

  // E-Stop Safety Circuit State (System-wide + Independent M-01 / M-02)
  const [isEstopTriggered, setIsEstopTriggered] = useState<boolean>(false);
  const [m01Estop, setM01Estop] = useState<boolean>(false);
  const [m02Estop, setM02Estop] = useState<boolean>(false);

  // Handlers for independent M-01 and M-02 E-Stops
  const handleTriggerEstopM01 = () => {
    if (!m01Estop) {
      setM01Estop(true);
      setStations((prev) =>
        prev.map((s) => ({
          ...s,
          loadingAMR: {
            ...s.loadingAMR,
            status: 'ERROR',
            speed: 0.0,
            currentTask: '【M-01 硬急停已触发】机械臂与底盘伺服锁定',
          },
        }))
      );
      showToast('【M-01 急停触发】已向 M-01 (上料复合机器人) 发送硬急停指令，运动已锁定！');
    } else {
      setM01Estop(false);
      setStations((prev) =>
        prev.map((s) => ({
          ...s,
          loadingAMR: {
            ...s.loadingAMR,
            status: 'IDLE',
            currentTask: '急停已复位，伺服重新就绪',
          },
        }))
      );
      showToast('【M-01 急停复位】M-01 上料复合机器人安全回路已恢复');
    }
  };

  const handleTriggerEstopM02 = () => {
    if (!m02Estop) {
      setM02Estop(true);
      setStations((prev) =>
        prev.map((s) => ({
          ...s,
          unloadingAMR: {
            ...s.unloadingAMR,
            status: 'ERROR',
            speed: 0.0,
            currentTask: '【M-02 硬急停已触发】机械臂与底盘伺服锁定',
          },
        }))
      );
      showToast('【M-02 急停触发】已向 M-02 (收料复合机器人) 发送硬急停指令，运动已锁定！');
    } else {
      setM02Estop(false);
      setStations((prev) =>
        prev.map((s) => ({
          ...s,
          unloadingAMR: {
            ...s.unloadingAMR,
            status: 'IDLE',
            currentTask: '急停已复位，伺服重新就绪',
          },
        }))
      );
      showToast('【M-02 急停复位】M-02 收料复合机器人安全回路已恢复');
    }
  };

  // Dispatch Server Configuration
  const [dispatchServerIp, setDispatchServerIp] = useState<string>('192.168.1.100');
  const [dispatchServerPort, setDispatchServerPort] = useState<string>('8080');

  // Deployment tasks & calibration points
  const [dispatchTasks, setDispatchTasks] = useState<DispatchTask[]>(INITIAL_DISPATCH_TASKS);
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>(INITIAL_CALIBRATION_POINTS);

  // Modal Lightbox State
  const [activeModal, setActiveModal] = useState<ActiveModalType>('NONE');
  const [pendingTaskMode, setPendingTaskMode] = useState<'RESUME' | 'RESTART'>('RESUME');
  const [pendingGripperAction, setPendingGripperAction] = useState<'OPEN' | 'CLOSE'>('OPEN');

  // Toast Notification Message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Get current station object
  const currentStation =
    stations.find((s) => s.id === selectedStationId) || stations[0];

  // Count unhandled alarms for left navigation badge
  const unhandledAlarmsCount = alarms.filter((a) => !a.handled).length;
  const latestAlarmMsg = alarms.find((a) => !a.handled)?.message || 'ST-01: 上料夹爪光电检测到物料微倾';

  // Handler: Add Station in Home Station List (PCB specs and Recipe auto-dispatched by MES)
  const handleAddStation = (name: string) => {
    const newId = `ST-0${stations.length + 1}`;
    const newStation: ThicknessStation = {
      id: newId,
      name,
      status: 'STANDBY',
      currentLot: 'LOT-20260811-003',
      nominalThickness: 1.25,
      currentThickness: 1.25,
      pcbDimensions: '510 × 410 mm', // Dispatched by MES
      upperSensorVal: 0.625,
      lowerSensorVal: 0.625,
      toleranceUpper: 0.03,
      toleranceLower: -0.03,
      passCount: 0,
      failCount: 0,
      totalBoardsGoal: 150,
      taskMode: 'RESUME',
      rmsSyncTime: new Date().toLocaleTimeString(),
      mesSyncStatus: 'CONNECTED',
      mesWorkOrder: `WO-2026-0811${String.fromCharCode(65 + stations.length)}`,
      mesRecipeId: 'REC-FR4-1250',
      loadingAMR: {
        id: 'M-01',
        name: 'M-01 上料复合机器人',
        type: 'LOADING',
        status: 'IDLE',
        batteryPct: 94,
        ipAddress: '192.168.1.101',
        speed: 0.0,
        vacuumPressure: -15,
        jointAngles: [0.0, 0.0, 90.0, 0.0, -90.0, 0.0],
        currentTask: '待命就绪',
        processedBoards: 0,
        totalBoardsGoal: 150,
      },
      unloadingAMR: {
        id: 'M-02',
        name: 'M-02 收料复合机器人',
        type: 'UNLOADING',
        status: 'IDLE',
        batteryPct: 88,
        ipAddress: '192.168.1.102',
        speed: 0.0,
        vacuumPressure: -12,
        jointAngles: [0.0, 0.0, 90.0, 0.0, -90.0, 0.0],
        currentTask: '待命就绪',
        processedBoards: 0,
        totalBoardsGoal: 150,
      },
      lastInspectionTime: '刚刚',
    };
    setStations((prev) => [...prev, newStation]);
    showToast(`已接入新机台 [${name}]，MES工单与PCB长宽规格已自动同步下发`);
  };

  // Handler: Update Station
  const handleUpdateStation = (stationId: string, updatedName: string, updatedLot?: string) => {
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, name: updatedName, currentLot: updatedLot || s.currentLot } : s))
    );
    showToast(`机台 [${updatedName}] 信息修改成功`);
  };

  // Handler: Delete Station
  const handleDeleteStation = (stationId: string) => {
    if (stations.length <= 1) {
      showToast('至少保留一台测厚机台，无法全部删除');
      return;
    }
    const target = stations.find((s) => s.id === stationId);
    setStations((prev) => prev.filter((s) => s.id !== stationId));
    if (selectedStationId === stationId) {
      const remaining = stations.filter((s) => s.id !== stationId);
      if (remaining.length > 0) {
        setSelectedStationId(remaining[0].id);
      }
    }
    showToast(`已删除机台 [${target?.name || stationId}]`);
  };

  // Handler: Confirm Start Loading (Modal 1)
  const handleConfirmStartLoading = (boardCount?: number) => {
    setActiveModal('NONE');
    const finalCount = boardCount && boardCount > 0 ? boardCount : 150;
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === selectedStationId) {
          return {
            ...s,
            status: 'RUNNING',
            totalBoardsGoal: finalCount,
            loadingAMR: {
              ...s.loadingAMR,
              status: 'NAVIGATING',
              totalBoardsGoal: finalCount,
              currentTask: `自动上料抓取循环执行中 (共 ${finalCount} 片)`,
            },
            unloadingAMR: {
              ...s.unloadingAMR,
              status: 'PICKING',
              totalBoardsGoal: finalCount,
              currentTask: '接收测厚板材并码垛',
            },
          };
        }
        return s;
      })
    );
    showToast(`【卡扣与PCB板数(${finalCount}片)已确认】已启动 ${currentStation.name} 自动上下料循环！`);
  };

  // Handler: Confirm Remaining Boards & Width Input (Modal 2)
  const handleConfirmBoardsInput = (count: number, width?: string) => {
    setActiveModal('NONE');
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === selectedStationId) {
          return {
            ...s,
            totalBoardsGoal: count,
            loadingAMR: {
              ...s.loadingAMR,
              totalBoardsGoal: count,
              currentTask: `手动设定剩余 ${count} 片，继续自动作业`,
            },
          };
        }
        return s;
      })
    );
    showToast(`批次剩余板数已更新为 ${count} 片，系统恢复作业！`);
  };

  // Handler: Update Remaining Boards directly from Station Control
  const handleUpdateRemainingBoards = (stationId: string, newRemaining: number) => {
    const validRemaining = Math.max(0, newRemaining);
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === stationId) {
          const completed = s.passCount + s.failCount;
          const newGoal = completed + validRemaining;
          return {
            ...s,
            totalBoardsGoal: newGoal,
            loadingAMR: {
              ...s.loadingAMR,
              totalBoardsGoal: newGoal,
            },
            unloadingAMR: {
              ...s.unloadingAMR,
              totalBoardsGoal: newGoal,
            },
          };
        }
        return s;
      })
    );
    showToast(`机台剩余数量已更新为 ${validRemaining} 片`);
  };

  // Handler: Trigger Task Mode with Safety Confirmation
  const handleTriggerTaskMode = (mode: 'RESUME' | 'RESTART') => {
    setPendingTaskMode(mode);
    setActiveModal('TASK_SAFETY_CONFIRM');
  };

  // Handler: Confirm Task Safety and Execute
  const handleConfirmTaskSafety = (mode: 'RESUME' | 'RESTART') => {
    setActiveModal('NONE');
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === selectedStationId) {
          if (mode === 'RESTART') {
            return {
              ...s,
              status: 'RUNNING',
              passCount: 0,
              failCount: 0,
              taskMode: 'RESTART',
              loadingAMR: {
                ...s.loadingAMR,
                status: 'NAVIGATING',
                processedBoards: 0,
                currentTask: '重新开始作业：执行第1片取料',
              },
              unloadingAMR: {
                ...s.unloadingAMR,
                status: 'IDLE',
                processedBoards: 0,
                currentTask: '等待第1片测厚完成接料',
              },
            };
          } else {
            // RESUME
            return {
              ...s,
              status: 'RUNNING',
              taskMode: 'RESUME',
              loadingAMR: {
                ...s.loadingAMR,
                status: 'NAVIGATING',
                currentTask: `断点继续作业：从第 ${s.passCount + s.failCount + 1} 片继续`,
              },
              unloadingAMR: {
                ...s.unloadingAMR,
                status: 'PICKING',
                currentTask: '继续码垛接料',
              },
            };
          }
        }
        return s;
      })
    );
    showToast(
      mode === 'RESTART'
        ? `【人工安全确认完成】${currentStation.name} 已重新开始全新批次任务`
        : `【人工安全确认完成】${currentStation.name} 已从断点继续执行作业`
    );
  };

  // Handler: Request Gripper Safety Confirm
  const handleRequestGripperSafetyConfirm = (action: 'OPEN' | 'CLOSE') => {
    setPendingGripperAction(action);
    setActiveModal('GRIPPER_SAFETY_CONFIRM');
  };

  // Handler: Confirm Gripper Action
  const handleConfirmGripperAction = (action: 'OPEN' | 'CLOSE') => {
    setActiveModal('NONE');
    showToast(`【防掉板安全联锁已确认】夹具已执行 [${action === 'OPEN' ? '打开/破气释放' : '闭合/真空吸附'}] 动作`);
  };

  // Handler: Trigger Pause
  const handleTriggerPause = () => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === selectedStationId) {
          return {
            ...s,
            status: 'STANDBY',
            loadingAMR: { ...s.loadingAMR, status: 'IDLE', currentTask: '暂停中 (等待恢复)' },
            unloadingAMR: { ...s.unloadingAMR, status: 'IDLE', currentTask: '暂停中 (等待恢复)' },
          };
        }
        return s;
      })
    );
    showToast(`已暂停 ${currentStation.name} 及上下料复合机器人运行`);
  };

  // Handler: Trigger Safe Stop (Stop after current workpiece finish)
  const handleTriggerSafeStop = () => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === selectedStationId) {
          return {
            ...s,
            loadingAMR: { ...s.loadingAMR, currentTask: '安全停止中 (当前作业完成后停止)' },
            unloadingAMR: { ...s.unloadingAMR, currentTask: '安全停止中 (当前作业完成后停止)' },
          };
        }
        return s;
      })
    );
    showToast(`已设置【安全停止】：${currentStation.name} 及上下料机器人将在当前单片作业完成后平稳停止`);
  };

  // Handler: Trigger Global E-Stop (Stop both M-01 & M-02 immediately)
  const handleTriggerGlobalEstop = () => {
    setM01Estop(true);
    setM02Estop(true);
    setIsEstopTriggered(true);
    setStations((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'STANDBY',
        loadingAMR: { ...s.loadingAMR, status: 'ESTOP', currentTask: '【急停触发】伺服动力已切断' },
        unloadingAMR: { ...s.unloadingAMR, status: 'ESTOP', currentTask: '【急停触发】伺服动力已切断' },
      }))
    );
    showToast('【全局停止 E-STOP 已触发】立即切断上料(M-01)与下料(M-02)两台复合机器人所有伺服动力！');
  };

  // Handler: Trigger First Article
  const handleTriggerFirstArticle = () => {
    showToast('首件自动送样校准流程已启动，激光传感器自动调零校准');
  };

  // Handler: Reset Robot with Mode
  const handleResetRobot = (robotName: string, resetType?: 'ARM' | 'ROBOT' | 'GRIPPER') => {
    const typeText =
      resetType === 'ARM'
        ? '机械臂复位点'
        : resetType === 'ROBOT'
        ? '机器人整机复位点'
        : resetType === 'GRIPPER'
        ? '夹具定位点'
        : '伺服使能复位';
    showToast(`已向 [${robotName}] 发送【${typeText}】指令`);
  };

  // Handler: Sync to RMS/MES
  const handleSyncRMS = () => {
    const syncTime = new Date().toLocaleTimeString();
    setStations((prev) =>
      prev.map((s) => ({
        ...s,
        rmsSyncTime: syncTime,
        mesSyncStatus: 'CONNECTED',
      }))
    );
    showToast(`[${syncTime}] 任务数量、工单与生产数据已同步至车间调度 RMS (MES) 系统`);
  };

  // Handler: Clear Alarm
  const handleClearAlarm = (alarmId: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, handled: true, handledBy: userSession.fullName } : a))
    );
    showToast(`已清除告警编号 [${alarmId}]`);
  };

  // Handler: Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPanel('LOGIN');
    showToast('已退出登录，返回登录页');
  };

  // Handler: Update System Configuration
  const handleUpdateConfig = (newCfg: Partial<SystemConfig>) => {
    setSystemConfig((prev) => ({ ...prev, ...newCfg }));
    showToast('系统设置参数已保存并下发至控制器');
  };

  // 1. 登录页 (Login Page)
  if (!isLoggedIn || currentPanel === 'LOGIN') {
    return (
      <>
        <LoginAuth
          serverIp={dispatchServerIp}
          serverPort={dispatchServerPort}
          onOpenServerConfigModal={() => setActiveModal('DISPATCH_SERVER_CONFIG')}
          onLoginSuccess={(session) => {
            setUserSession(session);
            setIsLoggedIn(true);
            setCurrentPanel('HOME_STATION_LIST');
            showToast(`登录成功，当前身份: ${session.fullName} (${session.role === 'OPERATOR' ? '操作员' : '高级工程师'})`);
          }}
        />

        {/* Modal for dispatch server config on login page */}
        <ModalLightbox
          activeModal={activeModal}
          serverIp={dispatchServerIp}
          serverPort={dispatchServerPort}
          onSaveServerConfig={(ip, port) => {
            setDispatchServerIp(ip);
            setDispatchServerPort(port);
            showToast(`调度服务通信配置已更新为: ${ip}:${port}`);
          }}
          onCloseModal={() => setActiveModal('NONE')}
          onConfirmStartLoading={handleConfirmStartLoading}
          onConfirmBoardsInput={handleConfirmBoardsInput}
          onResetEstop={() => {
            setIsEstopTriggered(false);
            setActiveModal('NONE');
          }}
        />

        {/* Global Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-white border-2 border-slate-300 text-slate-900 font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-row overflow-hidden select-none">
      {/* Persistent Left Navigation Sidebar */}
      <GlobalSideNav
        currentPanel={currentPanel}
        userRole={userSession.role}
        onSelectPanel={(panel) => setCurrentPanel(panel)}
        onLogout={handleLogout}
        unhandledAlarmsCount={unhandledAlarmsCount}
        m01Estop={m01Estop}
        m02Estop={m02Estop}
        onTriggerEstopM01={handleTriggerEstopM01}
        onTriggerEstopM02={handleTriggerEstopM02}
      />

      {/* Main Working View Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100">
        {/* Top Real-time Hardware & Safety Status Bar (Every page displays E-stop, Alarms, Pad Battery, RMS Sync) */}
        <TopStatusBar
          userSession={userSession}
          serverIp={dispatchServerIp}
          serverPort={dispatchServerPort}
          isEstopTriggered={isEstopTriggered}
          unhandledAlarmsCount={unhandledAlarmsCount}
          latestAlarmMsg={latestAlarmMsg}
          onOpenEstopModal={() => setActiveModal('ESTOP_WARNING')}
          onNavigateToAlarms={() => setCurrentPanel('ALARM_LOGS')}
          onSyncRMS={handleSyncRMS}
          systemMode={systemMode}
          onToggleSystemMode={handleToggleSystemMode}
        />

        {/* 1. 测厚机列表 (Home Station List) */}
        {currentPanel === 'HOME_STATION_LIST' && (
          <HomeStationList
            stations={stations}
            onSelectStationForControl={(stId) => {
              setSelectedStationId(stId);
              setCurrentPanel('STATION_OPERATION');
            }}
            onLogout={handleLogout}
            onAddStation={handleAddStation}
            onUpdateStation={handleUpdateStation}
            onDeleteStation={handleDeleteStation}
            onDirectRobotControl={(robotType) => {
              setSelectedRobotType(robotType);
              setCurrentPanel('ROBOT_TELEOP');
            }}
            m01Estop={m01Estop}
            m02Estop={m02Estop}
            onTriggerEstopM01={handleTriggerEstopM01}
            onTriggerEstopM02={handleTriggerEstopM02}
          />
        )}

        {/* 2. 测厚机操作界面 (Station Operation View with Task Management & 3 Reset Points) */}
        {currentPanel === 'STATION_OPERATION' && (
          <StationControlL3
            station={currentStation}
            allStations={stations}
            onSelectStation={(stId) => setSelectedStationId(stId)}
            onNavigateToPanel={(panel) => setCurrentPanel(panel)}
            onSelectRobotForL4={(rType) => setSelectedRobotType(rType)}
            onOpenSafetyLockModal={() => setActiveModal('SAFETY_LOCK_CONFIRM')}
            onOpenRemainingBoardsModal={() => setActiveModal('REMAINING_BOARDS_INPUT')}
            onTriggerTaskMode={handleTriggerTaskMode}
            onTriggerPause={handleTriggerPause}
            onTriggerSafeStop={handleTriggerSafeStop}
            onTriggerGlobalEstop={handleTriggerGlobalEstop}
            onTriggerFirstArticle={handleTriggerFirstArticle}
            onOpenFirstArticleModal={() => setActiveModal('FIRST_ARTICLE_CONFIRM')}
            onResetRobot={handleResetRobot}
            onSyncRMS={handleSyncRMS}
            onBackToHome={() => setCurrentPanel('HOME_STATION_LIST')}
            onLogout={handleLogout}
            m01Estop={m01Estop}
            m02Estop={m02Estop}
            onTriggerEstopM01={handleTriggerEstopM01}
            onTriggerEstopM02={handleTriggerEstopM02}
            onUpdateRemainingBoards={handleUpdateRemainingBoards}
            systemMode={systemMode}
            onShowToast={showToast}
          />
        )}

        {/* 3. 复合机器人操作 (Composite Robot Teleoperation View with Chassis Manual/Auto & Gripper Safety) */}
        {currentPanel === 'ROBOT_TELEOP' && (
          <TeleoperationL4
            station={currentStation}
            selectedRobotType={selectedRobotType}
            onSelectRobotType={(rType) => setSelectedRobotType(rType)}
            onNavigateBackToL3={() => setCurrentPanel('STATION_OPERATION')}
            onBackToHome={() => setCurrentPanel('HOME_STATION_LIST')}
            pokaYokeHoldSeconds={2.0}
            onRequestGripperSafetyConfirm={handleRequestGripperSafetyConfirm}
            onLogout={handleLogout}
            m01Estop={m01Estop}
            m02Estop={m02Estop}
            onTriggerEstopM01={handleTriggerEstopM01}
            onTriggerEstopM02={handleTriggerEstopM02}
            systemMode={systemMode}
            onToggleSystemMode={handleToggleSystemMode}
          />
        )}

        {/* 4. 报警信息 / 日志 (Alarm Audit Logs) */}
        {currentPanel === 'ALARM_LOGS' && (
          <AlarmLogs
            alarms={alarms}
            onClearAlarm={handleClearAlarm}
            onBackToHome={() => setCurrentPanel('HOME_STATION_LIST')}
          />
        )}

        {/* 5. 部署与调度 (Deployment & Scheduling - Engineer/Admin Only) */}
        {currentPanel === 'DEPLOYMENT_SCHEDULING' && (
          <DeploymentScheduling
            stations={stations}
            tasks={dispatchTasks}
            calibrationPoints={calibrationPoints}
            userRole={userSession.role}
            onElevateRole={(role) => {
              setUserSession((prev) => ({
                ...prev,
                role,
                fullName: role === 'OPERATOR' ? '李工 (产线操作员)' : '张工 (资深自动化工程师)',
              }));
            }}
            onAddTask={(task) => {
              const newTask: DispatchTask = {
                ...task,
                id: `TASK-${Date.now()}`,
                orderNumber: `ORD-${Date.now().toString().slice(-4)}`,
                startTime: new Date().toLocaleTimeString(),
              };
              setDispatchTasks((prev) => [newTask, ...prev]);
              showToast(`已创建调度任务 [${newTask.id}]`);
            }}
            onUpdateTaskStatus={(taskId, status) => {
              setDispatchTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, status } : t))
              );
              showToast(`任务 [${taskId}] 状态已更新为 ${status}`);
            }}
            onUpdateCalibration={(pointId, dx, dy, dh) => {
              setCalibrationPoints((prev) =>
                prev.map((p) =>
                  p.id === pointId
                    ? { ...p, deltaX: dx, deltaY: dy, deltaHeading: dh, status: 'VERIFIED' }
                    : p
                )
              );
              showToast(`已校准工位锚点 [${pointId}]`);
            }}
            onSyncFleetMap={() => showToast('已完成车队地图与 SLAM 锚点同步')}
            onShowToast={showToast}
          />
        )}

        {/* 6. 系统设置 (System Settings - Engineer/Admin Only) */}
        {currentPanel === 'SYSTEM_SETTINGS' && (
          <SystemSettings
            config={systemConfig}
            onUpdateConfig={handleUpdateConfig}
          />
        )}
      </div>

      {/* Modals: Task Safety, Gripper Safety, Lock Confirm, Remaining Boards, E-Stop, Dispatch Server Config */}
      <ModalLightbox
        activeModal={activeModal}
        pendingTaskMode={pendingTaskMode}
        pendingGripperAction={pendingGripperAction}
        serverIp={dispatchServerIp}
        serverPort={dispatchServerPort}
        onSaveServerConfig={(ip, port) => {
          setDispatchServerIp(ip);
          setDispatchServerPort(port);
          showToast(`调度服务通信配置已更新为: ${ip}:${port}`);
        }}
        onCloseModal={() => setActiveModal('NONE')}
        onConfirmStartLoading={handleConfirmStartLoading}
        onConfirmBoardsInput={handleConfirmBoardsInput}
        onConfirmTaskSafety={handleConfirmTaskSafety}
        onConfirmGripperAction={handleConfirmGripperAction}
        onConfirmFirstArticle={handleTriggerFirstArticle}
        onResetEstop={() => {
          setIsEstopTriggered(false);
          setActiveModal('NONE');
          showToast('急停回路已复位，伺服已重新使能');
        }}
      />

      {/* Global Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border-2 border-slate-300 text-slate-900 font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
