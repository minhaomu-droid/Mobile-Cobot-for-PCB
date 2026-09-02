import React from 'react';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PanelState, UserRole } from '../types';
import { RhinoroboLogo } from './RhinoroboLogo';

interface GlobalSideNavProps {
  currentPanel?: PanelState;
  userRole?: UserRole;
  onSelectPanel?: (panel: PanelState) => void;
  onLogout: () => void;
  unhandledAlarmsCount?: number;
  m01Estop?: boolean;
  m02Estop?: boolean;
  onTriggerEstopM01?: () => void;
  onTriggerEstopM02?: () => void;
}

export const GlobalSideNav: React.FC<GlobalSideNavProps> = ({
  onLogout,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={`bg-white border-r-2 border-slate-300 flex flex-col justify-between py-4 select-none transition-all duration-300 z-20 shrink-0 shadow-sm h-screen ${
        collapsed ? 'w-18 px-2' : 'w-52 sm:w-56 px-3.5'
      }`}
    >
      {/* Top Logo & Branding */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 overflow-hidden">
          <RhinoroboLogo size="small" collapsed={collapsed} />
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Middle Area: Clean Spacer */}
      <div className="flex-1" />

      {/* Bottom: Logout Button Only */}
      <div className="pt-3 border-t border-slate-200">
        <button
          onClick={onLogout}
          className={`w-full flex items-center rounded-xl py-3 px-3 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 transition-all cursor-pointer group shadow-2xs ${
            collapsed ? 'justify-center' : 'justify-start gap-2.5'
          }`}
          title="退出登录"
        >
          <LogOut className="w-5 h-5 text-slate-600 group-hover:text-red-600 shrink-0 transition-colors" />
          {!collapsed && <span className="text-sm font-bold">退出登录</span>}
        </button>
      </div>
    </aside>
  );
};

