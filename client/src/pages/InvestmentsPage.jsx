import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { TrendingUp, ArrowUpRight, ShieldAlert, Coins } from "lucide-react";

const InvestmentsPage = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Investments</h1>
        <p className="text-slate-400 text-xs mt-0.5">Track and scale your investment portfolio and asset metrics</p>
      </div>

      {/* Portfolio overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Portfolio Value</span>
          <h4 className="text-2xl font-bold text-slate-800 mt-1">15,420.00 INR</h4>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% this month
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Return</span>
          <h4 className="text-2xl font-bold text-slate-800 mt-1">+1,850.00 INR</h4>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> +8.5% total return
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Annual Yield</span>
          <h4 className="text-2xl font-bold text-slate-800 mt-1">10.5% APY</h4>
          <span className="text-[10px] text-slate-400 font-semibold block mt-2">
            Projected yearly earnings
          </span>
        </div>

      </div>

      {/* SVG Growth Graph & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Growth Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Portfolio Performance</h3>
              <p className="text-xs text-slate-400">Total portfolio valuation trend</p>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
              <span className="text-[10px] font-semibold text-slate-500">Mutual Funds</span>
            </div>
          </div>

          {/* SVG Line Graph */}
          <div className="w-full h-48 pt-4">
            <svg viewBox="0 0 500 150" className="w-full h-full text-blue-500">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4D7CFE" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4D7CFE" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,120 Q75,100 150,70 T300,50 T450,20 L500,10 L500,150 L0,150 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M0,120 Q75,100 150,70 T300,50 T450,20 L500,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Dot highlights */}
              <circle cx="150" cy="70" r="5" fill="#FFFFFF" stroke="currentColor" strokeWidth="2" />
              <circle cx="300" cy="50" r="5" fill="#FFFFFF" stroke="currentColor" strokeWidth="2" />
              <circle cx="500" cy="10" r="5" fill="#FFFFFF" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-2 mt-4">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-500" /> Asset allocation
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Equities / Stocks</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Fixed Income / Bonds</span>
                  <span>25%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Crypto / Alternate Assets</span>
                  <span>10%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: "10%" }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 text-[10px] text-slate-500 leading-relaxed mt-6">
            <p className="font-bold flex items-center gap-1 mb-1 text-slate-700">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              Risk Disclosure:
            </p>
            Values are for simulation only. Ledger is preparing backend investment accounts.
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default InvestmentsPage;
