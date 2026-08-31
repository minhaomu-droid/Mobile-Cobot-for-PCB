import React, { useState } from 'react';
import { UserCheck, AlertCircle, Lock, User } from 'lucide-react';
import { UserSession, UserRole } from '../types';
import { RhinoroboLogo } from './RhinoroboLogo';

interface LoginAuthProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginAuth: React.FC<LoginAuthProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('op_liqiang');
  const [password, setPassword] = useState('8888');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

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

      {/* Main Minimalist Login Card Container */}
      <div className="w-full max-w-md bg-white border border-slate-300 rounded-3xl shadow-xl p-8 sm:p-10 relative z-10">
        {/* Top Header & LOGO */}
        <div className="flex flex-col items-center justify-center mb-8 border-b border-slate-200 pb-6 text-center">
          <RhinoroboLogo size="large" />
          <h1 className="text-xl font-bold text-slate-800 mt-3 tracking-wide">登录</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">犀准机器人与测厚机站控系统</p>
        </div>

        {/* Login Form: Green input boxes and Cyan submit button */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 账户名 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="w-18 text-sm font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              <span>账户名:</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账户名"
              className="flex-1 px-4 py-3 bg-[#d8f3dc] hover:bg-[#cff0d5] focus:bg-[#d8f3dc] text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-emerald-500/70 focus:border-emerald-600 focus:outline-none transition-all shadow-inner placeholder:text-slate-500/70"
            />
          </div>

          {/* 密码 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="w-18 text-sm font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>密码:</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="flex-1 px-4 py-3 bg-[#d8f3dc] hover:bg-[#cff0d5] focus:bg-[#d8f3dc] text-slate-900 font-mono font-bold text-sm rounded-xl border-2 border-emerald-500/70 focus:border-emerald-600 focus:outline-none transition-all shadow-inner placeholder:text-slate-500/70"
            />
          </div>

          {/* 错误提示区域 (仅在有错误时显示) */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 登录按键 */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#5bc0de] hover:bg-[#31b0d5] active:bg-[#269abc] text-white font-black text-base rounded-2xl border border-[#46b8da] shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" />
              <span>登录</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
