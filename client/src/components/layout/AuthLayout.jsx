import React from "react";
import { Link } from "react-router-dom";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left Panel: App Banner & CSS Illustration */}
      <div className="w-full md:w-1/2 auth-panel-gradient text-white p-8 md:p-16 flex flex-col justify-between items-center relative overflow-hidden">
        {/* Subtle decorative circles for depth */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

        {/* Top spacer or minor text */}
        <div className="hidden md:block"></div>

        {/* CSS Phone & Card Illustration */}
        <div className="flex flex-col items-center my-auto z-10">
          <div className="relative w-48 h-96 bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center p-3 transition-transform hover:scale-105 duration-500">
            {/* Speaker bar */}
            <div className="w-20 h-4 bg-slate-800 rounded-full mb-4"></div>
            
            {/* Phone Screen Mock Contents */}
            <div className="w-full flex-grow bg-[#2563EB]/20 rounded-[2rem] p-3 flex flex-col justify-start gap-3 relative overflow-hidden">
              {/* Floating Card 1 */}
              <div className="w-[110%] -rotate-12 bg-emerald-300 text-slate-800 p-3 rounded-xl shadow-lg border border-emerald-400 absolute top-8 -left-2 transform hover:translate-y-[-4px] transition-transform duration-300">
                <div className="text-[9px] font-bold tracking-wider mb-2">LEDGER CARD</div>
                <div className="text-[11px] font-mono font-bold">**** **** 9204</div>
              </div>
              
              {/* Floating Card 2 */}
              <div className="w-[110%] rotate-6 bg-blue-400 text-white p-3 rounded-xl shadow-lg border border-blue-500 absolute top-28 -right-2 transform hover:translate-y-[-4px] transition-transform duration-300">
                <div className="text-[9px] font-bold tracking-wider mb-2">LEDGER CARD</div>
                <div className="text-[11px] font-mono font-bold">**** **** 1121</div>
              </div>

              {/* Little stats panel inside phone */}
              <div className="absolute bottom-4 left-3 right-3 bg-white/10 backdrop-blur-md rounded-xl p-2 text-[10px] text-white">
                <div className="font-semibold">Recent Activity</div>
                <div className="flex justify-between mt-1 text-[8px] opacity-80">
                  <span>Transfer Sent</span>
                  <span className="font-bold font-mono">-$250.00</span>
                </div>
              </div>
            </div>
            {/* Home indicator */}
            <div className="w-16 h-1 bg-slate-800 rounded-full mt-2"></div>
          </div>

          {/* Tagline */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mt-8 tracking-tight">
            Ledger is personal<br />finance, made simple.
          </h2>
          <p className="text-sm text-blue-100 text-center mt-3 max-w-sm opacity-90 leading-relaxed">
            All your accounts, cards, savings, and investments in one place.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-blue-200/70 mt-8 md:mt-0">
          © {new Date().getFullYear()} Ledger Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Content Form */}
      <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">
        {/* Brand Header */}
        <div className="absolute top-8 right-8 text-right">
          <div className="text-2xl font-black tracking-tight text-blue-600">Ledger</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Online Banking</div>
        </div>

        {/* Inner Content Area */}
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
