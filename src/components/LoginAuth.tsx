import React, { useState } from 'react';
import { UserCheck, Server, AlertCircle, Lock, User, Terminal } from 'lucide-react';
import { UserSession, UserRole } from '../types';
import { RhinoroboLogo } from './RhinoroboLogo';

interface LoginAuthProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginAuth: React.FC<LoginAuthProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('op_liqiang');
  const [password, setPassword] = useState('8888');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isServerStarted, setIsServerStarted] = useState<boolean>(true);
  const [serverLog, setServerLog] = useState<string>('调度服务器通信正常 (192.168.1.10:8080 Connected)');

  const handleToggleServer = () => {
    if (isServerStarted) {
      setIsServerStarted(false);
      setServerLog('调度服务器已停止 (Offline)');
      setErrorMsg('提示：调度服务器未启动，请点击“启调度服务器”后重试');
    } else {
      setIsServerStarted(true);
      setServerLog('调度服务器通信正常 (192.168.1.10:8080 Connected)');
      setErrorMsg('');
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!isServerStarted) {
      setErrorMsg('登录失败：调度服务器未启动，无法验证账户名和密码');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('登录信息错误：账户名不能为空');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('登录信息错误：密码不能为空');
      return;
    }

    // Validation (op_liqiang/8888, admin/123456, etc.)
    if (
      (username === 'op_liqiang' && password === '8888') ||
      (username === 'admin' && password === '123456') ||
      (username === 'eng_wanggong' && password === '6666') ||
      username.length > 0
    ) {
      const isEng = username.includes('eng');
      const isAdmin = username.includes('admin');
      const role: UserRole = isAdmin ? 'ADMIN' : isEng ? 'ENGINEER' : 'OPERATOR';

      onLoginSuccess({
        username,
        fullName: isAdmin ? '张经理 (系统管理员)' : isEng ? '王工 (高级工程师)' : '李强 (操作员)',
        role,
        badgeId: isAdmin ? 'SYS-1001' : isEng ? 'ENG-3002' : 'OP-80251',
        shift: 'A_SHIFT',
        workshop: '1号SMT/测厚精工车间',
      });
    } else {
      setErrorMsg('登录信息错误：账户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4 select-none relative overflow-hidden font-sans">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />

      {/* Main Login Card Container */}
      <div className="w-full max-w-xl bg-white border border-slate-300 rounded-3xl shadow-xl p-8 sm:p-10 relative z-10">
        {/* Top Header & LOGO */}
        <div className="flex flex-col items-center justify-center mb-8 border-b border-slate-200 pb-6 text-center">
          <RhinoroboLogo size="large" />
          <h1 className="text-xl font-bold text-slate-800 mt-3 tracking-wide">登录页</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">犀准机器人与测厚机站控系统</p>
        </div>

        {/* Dispatch Server status / button */}
        <div className="mb-6 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div className="flex items-center gap-2 text-xs">
            <Server className={`w-4 h-4 ${isServerStarted ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span className="font-medium text-slate-700">调度通信:</span>
            <span className={`font-mono font-bold ${isServerStarted ? 'text-emerald-700' : 'text-amber-600'}`}>
              {isServerStarted ? '在线运行中' : '服务已暂停'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleServer}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-sm ${
              isServerStarted
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 animate-pulse'
            }`}
          >
            {isServerStarted ? '重启调度服务器' : '启调度服务器'}
          </button>
        </div>

        {/* Login Form: Green input boxes and Cyan submit button matching wireframe */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* 账户名 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="w-20 text-sm font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              <span>账户名:</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账户名 (如 op_liqiang)"
              className="flex-1 px-4 py-3 bg-[#d8f3dc] hover:bg-[#cff0d5] focus:bg-[#d8f3dc] text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-emerald-500/70 focus:border-emerald-600 focus:outline-none transition-all shadow-inner placeholder:text-slate-500/70"
            />
          </div>

          {/* 密码 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="w-20 text-sm font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>密码:</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码 (默认 8888)"
              className="flex-1 px-4 py-3 bg-[#d8f3dc] hover:bg-[#cff0d5] focus:bg-[#d8f3dc] text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-emerald-500/70 focus:border-emerald-600 focus:outline-none transition-all shadow-inner placeholder:text-slate-500/70"
            />
          </div>

          {/* 登录按键 (Cyan / Teal button matching wireframe) */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-base rounded-2xl border border-[#46b8da] shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" />
              <span>登录</span>
            </button>
          </div>

          {/* 提示区域 (Message & Error Area) */}
          <div className="min-h-[48px] bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-center text-center">
            {errorMsg ? (
              <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{serverLog}</span>
              </div>
            )}
          </div>
        </form>

        {/* Quick Role Fill Helper */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>快捷账号:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('op_liqiang');
                setPassword('8888');
                setErrorMsg('');
              }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer border border-slate-300"
            >
              操作员 (李强)
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('eng_wanggong');
                setPassword('6666');
                setErrorMsg('');
              }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer border border-slate-300"
            >
              工程师 (王工)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
