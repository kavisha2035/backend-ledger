import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  SendHorizontal, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  Settings, 
  LogOut,
  User,
  Bell
} from "lucide-react";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Transfer", path: "/transfer", icon: SendHorizontal },
    { name: "Transactions", path: "/transactions", icon: Receipt },
    { name: "Accounts and Cards", path: "/accounts", icon: CreditCard },
    { name: "Investments", path: "/investments", icon: TrendingUp },
  ];

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6 shrink-0">
        <div>
          {/* Brand Logo */}
          <div className="mb-8 pl-2">
            <Link to="/dashboard">
              <div className="text-2xl font-black tracking-tight text-blue-600">Ledger</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Online Banking</div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Settings & Logout) */}
        <div className="space-y-1 pt-6 border-t border-slate-100">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth ${
              currentPath === "/settings"
                ? "bg-blue-50 text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings className={`w-5 h-5 ${currentPath === "/settings" ? "text-blue-600" : "text-slate-400"}`} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-smooth"
          >
            <LogOut className="w-5 h-5 text-slate-400 hover:text-red-500" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content view */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#F8FAFC] flex items-center justify-between px-8 border-b border-slate-100 shrink-0">
          <div className="text-slate-400 text-xs">
            {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          
          {/* User profile dropdown info */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-smooth relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-700">{user?.name || "User Account"}</div>
                <div className="text-[10px] text-slate-400">{user?.email}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Container */}
        <main className="flex-grow overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
