import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { CreditCard, Plus, Shield, Cpu, Wifi } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AccountsPage = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Accounts and Cards</h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage your digital credit cards and checking accounts</p>
        </div>
        <button
          onClick={() => alert("Card application features are coming soon!")}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow hover:bg-slate-800 transition-smooth"
        >
          <Plus className="w-4 h-4" />
          Request Card
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Visa Platinum Premium Dark Blue Card */}
        <div className="relative overflow-hidden w-full h-48 bg-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-900 flex flex-col justify-between group cursor-pointer transition-smooth hover:scale-102">
          <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[100%] rounded-full bg-blue-600/30 blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Platinum Debit</p>
              <h4 className="text-xs font-bold text-slate-200 mt-0.5">Ledger Black</h4>
            </div>
            <Wifi className="w-4 h-4 text-slate-400 rotate-90" />
          </div>

          <div className="flex gap-2 items-center">
            <Cpu className="w-8 h-8 text-amber-300" />
            <div className="w-6 h-4 bg-slate-800 rounded opacity-60"></div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-mono tracking-widest font-bold">•••• •••• •••• 9204</p>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1">{user?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-semibold text-slate-300">12/29</span>
            </div>
          </div>
        </div>

        {/* Coral Orange Virtual Card */}
        <div className="relative overflow-hidden w-full h-48 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-2xl p-6 shadow-xl border border-orange-400/20 flex flex-col justify-between group cursor-pointer transition-smooth hover:scale-102">
          <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[100%] rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] uppercase font-bold text-orange-100 tracking-wider">Virtual Card</p>
              <h4 className="text-xs font-bold text-white mt-0.5">Ledger Light</h4>
            </div>
            <Wifi className="w-4 h-4 text-orange-200 rotate-90" />
          </div>

          <Cpu className="w-8 h-8 text-amber-200" />

          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-mono tracking-widest font-bold">•••• •••• •••• 1121</p>
              <p className="text-[9px] uppercase font-bold text-orange-100 tracking-wider mt-1">{user?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-semibold text-orange-50">06/28</span>
            </div>
          </div>
        </div>

        {/* Placeholder for Adding a New Card */}
        <div 
          onClick={() => alert("Card registration is not yet enabled on the backend.")}
          className="border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-48 cursor-pointer transition-smooth"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-700">Add New Card</span>
          <span className="text-[10px] text-slate-400 mt-1">Order physical or virtual debit card</span>
        </div>

      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mt-8 max-w-2xl">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          Security Information
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Ledger cards utilize end-to-end payment security protocols. You can freeze your card or reset the credentials at any time. For backend safety, avoid sharing your private account keys with third-party software vendors.
        </p>
      </div>

    </DashboardLayout>
  );
};

export default AccountsPage;
