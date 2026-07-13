import React from "react";
import { Copy, Check } from "lucide-react";

const AccountCard = ({ account, balance, ownerName, variant = "dark" }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(account._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedBalance = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: account.currency || "INR",
  }).format(balance || 0);

  if (variant === "dark") {
    return (
      <div className="relative overflow-hidden w-full bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 transition-smooth hover:translate-y-[-4px] duration-300">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Checking Account</p>
            <h3 className="text-3xl font-extrabold tracking-tight mt-1">{formattedBalance}</h3>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
            {account.status}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Number (ID)</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono tracking-wider font-semibold text-slate-200">
                {account._id}
              </span>
              <button 
                onClick={copyToClipboard}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-md transition-smooth"
                title="Copy Account ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-slate-800/80 pt-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Owner</p>
              <p className="text-sm font-semibold text-white mt-0.5">{ownerName}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500">Created At</p>
              <p className="text-xs text-slate-300 font-medium">
                {new Date(account.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Peach/Orange Card Variant
  return (
    <div className="relative overflow-hidden w-full bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-2xl p-6 shadow-xl border border-orange-500/30 transition-smooth hover:translate-y-[-4px] duration-300">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs uppercase font-bold text-orange-100 tracking-wider">Available Balance</p>
          <h3 className="text-3xl font-extrabold tracking-tight mt-1">{formattedBalance}</h3>
        </div>
        <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
          ACTIVE
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] text-orange-100 font-bold uppercase tracking-wider">Account Number</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono tracking-wider font-semibold text-orange-50">
              {account._id}
            </span>
            <button 
              onClick={copyToClipboard}
              className="text-orange-200 hover:text-white p-1 hover:bg-white/10 rounded-md transition-smooth"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-orange-200" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-orange-300/30 pt-4">
          <div>
            <p className="text-[10px] text-orange-100 font-bold uppercase tracking-wider">Cardholder</p>
            <p className="text-sm font-semibold text-white mt-0.5">{ownerName}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono tracking-wider font-semibold text-orange-50">12/28</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
