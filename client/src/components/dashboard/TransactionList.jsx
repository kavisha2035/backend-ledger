import React, { useState } from "react";
import { Search, ShoppingBag, Send, ArrowDownLeft, Receipt, CheckCircle } from "lucide-react";

const TransactionList = ({ transactions = [], currency = "INR" }) => {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const getIcon = (type, desc) => {
    const text = (desc || "").toLowerCase();
    if (text.includes("burger") || text.includes("food") || text.includes("grocery")) {
      return <ShoppingBag className="w-4 h-4 text-orange-500" />;
    }
    if (type === "DEBIT") {
      return <Send className="w-4 h-4 text-blue-500" />;
    }
    if (type === "CREDIT" && text.includes("initial")) {
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    }
    return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
  };

  const getBgClass = (type, desc) => {
    const text = (desc || "").toLowerCase();
    if (text.includes("burger") || text.includes("food") || text.includes("grocery")) {
      return "bg-orange-50";
    }
    if (type === "DEBIT") {
      return "bg-blue-50";
    }
    return "bg-emerald-50";
  };

  // Filter transactions
  const filtered = transactions.filter((t) => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toAccount?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fromAccount?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "ALL") return true;
    if (filter === "EXPENSES") return t.type === "DEBIT";
    if (filter === "INCOME") return t.type === "CREDIT";
    return true;
  });

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800">Transactions</h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
          {filtered.length} entries
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-3 mb-4">
        {["ALL", "EXPENSES", "INCOME"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg transition-smooth ${
              filter === tab
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1 max-h-[350px]">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No transactions found
          </div>
        ) : (
          filtered.map((t, idx) => {
            const isDebit = t.type === "DEBIT";
            const formattedAmount = new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: currency,
            }).format(t.amount);

            return (
              <div key={t._id || idx} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-smooth">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getBgClass(t.type, t.description)}`}>
                    {getIcon(t.type, t.description)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700">{t.description || "Transfer"}</h4>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {isDebit ? `To: ...${(t.toAccount || "").slice(-6)}` : `From: ...${(t.fromAccount || "").slice(-6)}`}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-bold font-mono ${isDebit ? "text-red-500" : "text-emerald-500"}`}>
                    {isDebit ? "-" : "+"}
                    {formattedAmount}
                  </div>
                  <span className="text-[9px] text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TransactionList;
