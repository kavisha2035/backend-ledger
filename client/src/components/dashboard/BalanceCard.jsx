import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

const BalanceCard = ({ income = 0, expenses = 0, available = 0, currency = "INR" }) => {
  const formatVal = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Available Balance Stats */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available Balance</span>
          <h4 className="text-xl font-bold text-slate-800 mt-1">{formatVal(available)}</h4>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      {/* Income Stats */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Income</span>
          <h4 className="text-xl font-bold text-slate-800 mt-1">{formatVal(income)}</h4>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
          <ArrowDownRight className="w-5 h-5" />
        </div>
      </div>

      {/* Expenses Stats */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Expenses</span>
          <h4 className="text-xl font-bold text-slate-800 mt-1">{formatVal(expenses)}</h4>
        </div>
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
