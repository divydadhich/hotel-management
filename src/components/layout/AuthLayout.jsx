import { Outlet } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants';

const AuthLayout = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
    {/* Background Glows */}
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

    {/* Brand Header */}
    <div className="flex items-center gap-3 mb-8 z-10">
      <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/25">
        <span className="text-white font-extrabold text-2xl">H</span>
      </div>
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">{APP_NAME}</h1>
        <p className="text-slate-400 text-xs font-semibold tracking-wide">Multi-Tenant Hospitality SaaS</p>
      </div>
    </div>

    {/* Main Container */}
    <div className="w-full max-w-md z-10">
      <Outlet />
    </div>

    <p className="mt-8 text-slate-500 text-xs text-center z-10">
      © {new Date().getFullYear()} {APP_NAME}. Enterprise Multi-Tenant Platform.
    </p>
  </div>
);

export default AuthLayout;
