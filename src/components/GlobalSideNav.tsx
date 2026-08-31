import React from 'react';
import {
  Cpu,
  Bot,
  Bell,
  Network,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ShieldAlert,
  AlertOctagon,
  Power
} from 'lucide-react';
import { PanelState, UserRole } from '../types';
import { RhinoroboLogo } from './RhinoroboLogo';

interface GlobalSideNavProps {
  currentPanel: PanelState;
  userRole?: UserRole;
  onSelectPanel: (panel: PanelState) => void;
  onLogout: () => void;
  unhandledAlarmsCount?: number;
  m01Estop?: boolean;
  m02Estop?: boolean;
  onTriggerEstopM01?: () => void;
  onTriggerEstopM02?: () => void;
}

export const GlobalSideNav: React.FC<GlobalSideNavProps> = ({
  currentPanel,
  userRole = 'OPERATOR',
  onSelectPanel,
  onLogout,
  unhandledAlarmsCount = 1,
  m01Estop = false,
  m02Estop = false,
  onTriggerEstopM01,
  onTriggerEstopM02,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  // Check if current user is an Engineer or Admin
  const isEngineerOrAdmin = userRole === 'ENGINEER' || userRole === 'ADMIN';

  // Base navigation items available to all users (Operators, Engineers, Admins):
  // 1. 测厚机列表
  // 2. 测厚机操作界面
  // 3. 复合机器人操作 (机器人遥操)
  // 4. 报警信息 (报警日志)
  const baseNavItems = [
    {
      id: 'HOME_STATION_LIST' as PanelState,
      label: '测厚机列表',
      shortLabel: '列表',
      icon: LayoutGrid,
      badge: null,
      adminOnly: false,
    },
    {
      id: 'STATION_OPERATION' as PanelState,
      label: '测厚机操作界面',
      shortLabel: '操作',
      icon: Cpu,
      badge: null,
      adminOnly: false,
    },
    {
      id: 'ROBOT_TELEOP' as PanelState,
      label: '复合机器人操作',
      shortLabel: '遥操',
      icon: Bot,
      badge: null,
      adminOnly: false,
    },
    {
      id: 'ALARM_LOGS' as PanelState,
      label: '报警信息',
      shortLabel: '报警',
      icon: Bell,
      badge: unhandledAlarmsCount > 0 ? unhandledAlarmsCount : null,
      adminOnly: false,
    },
  ];

  // Advanced engineering items (ONLY visible to Senior Engineers & Admins):
  // 5. 部署与调度
  // 6. 系统设置
  const engineerNavItems = [
    {
      id: 'DEPLOYMENT_SCHEDULING' as PanelState,
      label: '部署与调度',
      shortLabel: '调度',
      icon: Network,
      badge: null,
      adminOnly: true,
    },
    {
      id: 'SYSTEM_SETTINGS' as PanelState,
      label: '系统设置',
      shortLabel: '设置',
      icon: Settings,
      badge: null,
      adminOnly: true,
    },
  ];

  // Filter items based on user role permissions
  const navItems = isEngineerOrAdmin
    ? [...baseNavItems, ...engineerNavItems]
    : baseNavItems;

  return (
    <aside
      className={`bg-white border-r-2 border-slate-300 flex flex-col justify-between py-3.5 select-none transition-all duration-300 z-20 shrink-0 shadow-sm ${
        collapsed ? 'w-18 px-2' : 'w-56 sm:w-60 px-3'
      }`}
    >
      {/* Top Logo & Collapse Toggle */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <RhinoroboLogo size="small" collapsed={collapsed} />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title={collapsed ? '展开导航栏' : '收起导航栏'}
          >
            {collapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="w-full space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPanel(item.id)}
                className={`w-full flex items-center rounded-xl py-3 px-3 transition-all relative cursor-pointer group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-black'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold'
                } ${collapsed ? 'justify-center' : 'justify-start gap-3'}`}
                title={item.label}
              >
                {/* Icon Container with Badge */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    className={`w-5.5 h-5.5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-600'
                    }`}
                  />
                  {item.badge !== null && (
                    <span className="absolute -top-1.5 -right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Text Label */}
                {!collapsed && (
                  <span className="text-sm sm:text-[15px] leading-tight truncate tracking-tight text-left flex-1">
                    {item.label}
                  </span>
                )}

                {/* Active Indicator Bar on left/right when active */}
                {isActive && !collapsed && (
                  <span className="w-1.5 h-4.5 bg-white rounded-full shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Emergency Stops & Logout Section */}
      <div className="pt-3.5 border-t border-slate-200 flex flex-col gap-3">
        {/* Dedicated Robot E-Stop Buttons for M-01 and M-02 */}
        <div className="flex flex-col gap-2">
          {!collapsed && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-600 tracking-wide">机器人独立急停</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
          )}

          {/* M-01 E-Stop Button */}
          <button
            onClick={onTriggerEstopM01}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-black text-sm sm:text-[15px] text-white bg-red-600 hover:bg-red-700 active:bg-red-800 border-2 border-red-700 shadow-sm transition-all cursor-pointer active:scale-95 ${
              m01Estop ? 'bg-red-700 animate-pulse ring-2 ring-red-400' : ''
            }`}
            title="M-01 上料复合机器人急停 (E-STOP)"
          >
            <AlertOctagon className="w-5 h-5 text-white shrink-0" />
            {!collapsed && <span>{m01Estop ? 'M-01已急停' : 'M-01急停'}</span>}
            {collapsed && <span className="text-xs font-bold">M-01</span>}
          </button>

          {/* M-02 E-Stop Button */}
          <button
            onClick={onTriggerEstopM02}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-black text-sm sm:text-[15px] text-white bg-red-600 hover:bg-red-700 active:bg-red-800 border-2 border-red-700 shadow-sm transition-all cursor-pointer active:scale-95 ${
              m02Estop ? 'bg-red-700 animate-pulse ring-2 ring-red-400' : ''
            }`}
            title="M-02 收料复合机器人急停 (E-STOP)"
          >
            <AlertOctagon className="w-5 h-5 text-white shrink-0" />
            {!collapsed && <span>{m02Estop ? 'M-02已急停' : 'M-02急停'}</span>}
            {collapsed && <span className="text-xs font-bold">M-02</span>}
          </button>
        </div>

        {/* Bottom Logout Button */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center rounded-xl py-2.5 px-3 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 transition-all cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-start gap-2.5'
          }`}
          title="退出登录"
        >
          <LogOut className="w-4.5 h-4.5 text-slate-600 hover:text-red-600 shrink-0" />
          {!collapsed && <span className="text-sm font-bold">退出登录</span>}
        </button>
      </div>
    </aside>
  );
};
