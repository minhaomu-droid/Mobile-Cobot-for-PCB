export type PanelState =
  | 'LOGIN'
  | 'HOME_STATION_LIST'
  | 'STATION_OPERATION'
  | 'ROBOT_TELEOP'
  | 'BLOCKLY_PROGRAMMING'
  | 'DEPLOYMENT_SCHEDULING'
  | 'ALARM_LOGS'
  | 'SYSTEM_SETTINGS';

export type UserRole = 'OPERATOR' | 'ENGINEER' | 'ADMIN';

export interface UserSession {
  username: string;
  fullName: string;
  role: UserRole;
  badgeId: string;
  shift: 'A_SHIFT' | 'B_SHIFT' | 'C_SHIFT';
  workshop: string;
}

export type MachineStatus = 'RUNNING' | 'STANDBY' | 'ALARM' | 'MAINTENANCE';

export interface AMRRobotState {
  id: string;
  name: string;
  type: 'LOADING' | 'UNLOADING';
  status: 'IDLE' | 'NAVIGATING' | 'PICKING' | 'PLACING' | 'ERROR';
  batteryPct: number;
  ipAddress: string;
  speed: number; // m/s
  vacuumPressure: number; // kPa (e.g. -85)
  jointAngles: number[]; // J1 ~ J6
  currentTask: string;
  processedBoards: number;
  totalBoardsGoal: number;
  alarmMessage?: string;
  chassisPose?: {
    x: number; // m
    y: number; // m
    theta: number; // deg
    confidence: number; // % e.g. 99.8
    lidarStatus: 'NORMAL' | 'WARNING' | 'OCCLUDED';
  };
  controlMode?: 'MANUAL' | 'AUTO';
  gripperState?: 'OPEN' | 'CLOSED';
}

export interface ThicknessStation {
  id: string;
  name: string; // e.g. "1号测厚机"
  status: MachineStatus;
  currentLot: string;
  nominalThickness: number; // mm (e.g. 1.250)
  currentThickness: number; // mm
  pcbDimensions: string; // mm (e.g. "510 × 410 mm")
  upperSensorVal: number;
  lowerSensorVal: number;
  toleranceUpper: number; // +0.030
  toleranceLower: number; // -0.030
  passCount: number;
  failCount: number;
  totalBoardsGoal?: number;
  taskMode?: 'RESUME' | 'RESTART';
  rmsSyncTime?: string;
  loadingAMR: AMRRobotState;
  unloadingAMR: AMRRobotState;
  lastInspectionTime: string;
  mesSyncStatus?: 'CONNECTED' | 'SYNCING' | 'OFFLINE';
  mesWorkOrder?: string;
  mesRecipeId?: string;
}

export interface AlarmItem {
  id: string;
  code: string;
  stationName: string;
  robotId?: string; // 关联复合机器人ID，如 'M-01' 或 'M-02'
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: string;
  handled: boolean;
  handledBy?: string;
}

export type ActiveModalType = 
  | 'NONE'
  | 'SAFETY_LOCK_CONFIRM'
  | 'FIRST_ARTICLE_CONFIRM'
  | 'REMAINING_BOARDS_INPUT'
  | 'TASK_SAFETY_CONFIRM'
  | 'GRIPPER_SAFETY_CONFIRM'
  | 'CLEAR_ALARM_HOLD'
  | 'ESTOP_WARNING'
  | 'DISPATCH_SERVER_CONFIG';

export interface SystemConfig {
  // Pad Terminal & Display
  serverIp: string;
  serverPort: number;
  padRefreshRate: '60Hz' | '120Hz' | '144Hz';
  screenBrightness: number; // 20 ~ 100%
  screenSleepTimeout: '1m' | '5m' | '15m' | 'never';
  edgeRejection: 'off' | '12px' | '24px';
  hapticFeedback: boolean;
  simulatedDeviceFrame: boolean;
  padBatteryPct: number;
  padResolution: string;
  theme: 'industrial_light' | 'slate_dark';

  // Sound & Poka-Yoke
  beeperEnabled: boolean;
  beeperVolume: number; // 0 ~ 100
  pokaYokeHoldSeconds: number; // e.g. 2.0
  andonTowerInterlock: boolean;
  safetyDoorInterlock: boolean;

  // Communication & Protocols
  wsPingInterval: number; // ms e.g. 1000
  mqttBrokerUrl: string;
  mqttTopic: string;
  plcIpAddress: string;
  plcPort: number;
  plcSlaveId: number;
  networkAutoReconnect: boolean;

  // AMR Fleet & Motion Limit
  maxLinearSpeed: number; // m/s (0.2 ~ 1.5)
  maxAngularSpeed: number; // rad/s
  radarSafeDecelDist: number; // m (e.g. 0.8)
  radarEstopDist: number; // m (e.g. 0.25)
  lowBatteryAutoDockPct: number; // % (e.g. 20)
  fullChargeCutoffPct: number; // % (e.g. 95)
  vacuumThresholdKpa: number; // kPa (e.g. -60)

  // Thickness Gauge & Quality Specs
  nominalThicknessMm: number; // mm (e.g. 1.250)
  toleranceUpperMm: number; // mm (e.g. +0.030)
  toleranceLowerMm: number; // mm (e.g. -0.030)
  consecutiveNgLimit: number; // e.g. 3
  sampleIntervalBoards: number; // e.g. 100
  upperLaserOffsetMm: number;
  lowerLaserOffsetMm: number;

  // User & Audit
  autoLogoutMinutes: number; // 0 for off, or 5/10/15/30
  nfcCardBindingEnabled: boolean;
  auditLogUpload: boolean;

  // Storage & Backup
  dataRetentionDays: number; // 30, 90, 365
  autoExportReportCsv: boolean;
}

// Fleet Dispatch & Deployment Types
export type DispatchTaskType = 'FEEDING' | 'DISCHARGING' | 'CHARGING' | 'INSPECTION' | 'PARKING';
export type DispatchPriority = 'URGENT' | 'HIGH' | 'NORMAL';
export type DispatchStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PAUSED' | 'CANCELED';

export interface DispatchTask {
  id: string;
  orderNumber: string;
  taskType: DispatchTaskType;
  title: string;
  assignedAMR: string;
  sourceStation: string;
  targetStation: string;
  priority: DispatchPriority;
  status: DispatchStatus;
  progressPct: number;
  lotId: string;
  startTime: string;
}

export interface CalibrationPoint {
  id: string;
  name: string;
  stationId: string;
  type: 'PICKUP' | 'DROPOFF' | 'CHARGER' | 'STANDBY' | 'RESTRICTED';
  xCoord: number; // in meters (e.g. 12.45)
  yCoord: number; // in meters (e.g. 8.30)
  headingDeg: number; // orientation e.g. 90.0
  status: 'CALIBRATED' | 'OFFSET' | 'UNVERIFIED';
  offsetMm: number; // mm error
  lastCalibrated: string;
  armCartesianPose?: CartesianPose; // Cartesian pick/place teaching coordinates
}

// Cartesian Motion & Tool Center Point (TCP)
export interface CartesianPose {
  x: number; // mm (前后)
  y: number; // mm (左右)
  z: number; // mm (垂直高度)
  rx: number; // deg (Roll 滚转角)
  ry: number; // deg (Pitch 俯仰角)
  rz: number; // deg (Yaw 偏航角)
}

export type CoordinateFrame = 'BASE' | 'TOOL' | 'WORKPIECE';

export interface VirtualZone {
  id: string;
  name: string;
  type: 'FORBIDDEN' | 'SPEED_LIMIT' | 'ONE_WAY' | 'PRECISION_ALIGN';
  polygon: [number, number][]; // coordinates in meters
  speedLimit?: number; // m/s
  directionAngle?: number; // degrees for one-way
}

export interface ChassisMapData {
  id: string;
  name: string;
  version: string;
  widthMeters: number;
  heightMeters: number;
  resolutionMeters: number; // e.g. 0.05 (5cm grid)
  origin: [number, number];
  createdTime: string;
  isCurrent: boolean;
  algorithm: 'Cartographer 2D' | 'FAST-LIO 3D' | 'Gmapping' | 'LOAM';
  virtualZones: VirtualZone[];
  relocalizationConfidence: number; // %
}

// End-Effector Vision & QR Alignment Types
export interface VisionAlignmentState {
  cameraActive: boolean;
  exposureTimeUs: number; // e.g. 1200
  gainDb: number; // e.g. 6.0
  ringLightPct: number; // 0 ~ 100%
  detectMode: 'QR_CODE' | 'DATAMATRIX' | 'FIDUCIAL_MARK' | 'FEATURE_EDGE';
  autoFocus: boolean;
  targetLocked: boolean;
  detectedCode: string; // e.g. "LOT-202608-A19"
  offsetU: number; // px
  offsetV: number; // px
  deltaXmm: number; // mm
  deltaYmm: number; // mm
  deltaZmm: number; // mm
  deltaYawDeg: number; // deg
  confidence: number; // %
  lastScanTimestamp: string;
}

// Blockly Visual Programming Types
export type BlockCategory = 'CHASSIS' | 'VISION' | 'ARM' | 'IO' | 'LOGIC';

export interface BlocklyNode {
  id: string;
  category: BlockCategory;
  type: string; // e.g. "NAV_GOTO", "VISION_SCAN_QR", "VISION_ALIGN", "ARM_MOVEL", "IO_VACUUM", "LOGIC_WAIT", "LOGIC_IF"
  name: string;
  iconName: string;
  color: string;
  params: Record<string, string | number | boolean>;
  enabled: boolean;
  comment?: string;
  children?: BlocklyNode[];
}

export interface BlocklyProgram {
  id: string;
  name: string;
  description: string;
  targetRobot: string;
  version: string;
  updatedAt: string;
  nodes: BlocklyNode[];
}

// ==========================================
// MOS ↔ RMS Protocol Types (上位机与调度系统协议规范)
// ==========================================

export type MosMachineType = 'THICKNESS_TESTER' | 'LASER_MACHINE';
export type MaterialShape = 'RECT' | 'SQUARE' | 'CIRCLE' | 'CUSTOM';

export interface MaterialDimensions {
  length?: number;
  width?: number;
  side?: number;
  radius?: number;
}

export interface MaterialInfo {
  material_type: string;
  material_shape: MaterialShape;
  dimensions: MaterialDimensions;
  material_thickness: number; // mm
}

// 1.1 MOS 下发订单/任务 Payload
export interface MosRmsTaskPayload {
  task_id: string;
  machine_type: MosMachineType;
  machine_id: string;
  priority: number; // 0 ~ 9
  deadline: number; // ms timestamp
  material: MaterialInfo;
  extra?: {
    mes_order_no?: string;
    lot_no?: string;
    operator_id?: string;
  };
}

// 1.4 任务状态回调 Payload
export type RmsTaskStatus = 'Init' | 'Release' | 'Running' | 'Complete' | 'Close' | 'Canceled';

export interface TaskStatusCallbackPayload {
  task_id: string;
  sub_task_id: string;
  robot_id: string;
  status: RmsTaskStatus;
  result?: {
    unload?: {
      left?: { ok: boolean; count?: number };
      right?: { ok: boolean; count?: number };
    };
    load?: {
      left?: { ok: boolean; count?: number };
      right?: { ok: boolean; count?: number };
    };
  };
  timestamp: number;
}

// 1.5 安全急停 Payload
export interface EmergencyStopPayload {
  area_id: string;
  trigger: 'SAFETY_CURTAIN';
  timestamp: number;
}

export interface EmergencyStopResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    robots_notified: string[];
  };
}

// 1.6 设备控制 (RMS → MOS)
export type LaserDeviceCommand = 'DOOR_OPEN' | 'DOOR_CLOSE';

export interface DeviceControlPayload {
  op_id: string;
  task_id: string;
  device_type: MosMachineType;
  device_id: string;
  device_command: LaserDeviceCommand;
  timestamp: number;
}

// 1.7 设备状态 (MOS → RMS)
export type LaserDoorStatus = 'DOOR_OPENED' | 'DOOR_MOVING' | 'DOOR_CLOSED';
export type ThicknessSensorSignalStatus = 'LOAD_READY' | 'UNLOAD_READY' | 'IDLE';

export interface DeviceStatusPayload {
  device_type: 'LASER_MACHINE' | 'THICKNESS_SENSOR';
  device_id: string;
  device_status: LaserDoorStatus | ThicknessSensorSignalStatus;
  task_id?: string;
  timestamp: number;
}

// MOS ↔ RMS Protocol Live Log Item
export interface MosProtocolLogItem {
  id: string;
  direction: 'MOS_TO_RMS' | 'RMS_TO_MOS' | 'MES_TO_MOS' | 'PLC_TO_MOS' | 'MOS_TO_MES';
  method: 'POST' | 'GET' | 'PUT';
  endpoint: string;
  summary: string;
  statusCode: number;
  payload: any;
  response?: any;
  timestamp: string;
  latencyMs: number;
}


