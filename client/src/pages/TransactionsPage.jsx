import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { accountService, transactionService } from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import TransactionList from "../components/dashboard/TransactionList";
import { ArrowLeftRight, RefreshCw, Download } from "lucide-react";

const TransactionsPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const userAccounts = await accountService.getAll();
      setAccounts(userAccounts);
      
      if (userAccounts.length > 0) {
        setSelectedAccount(userAccounts[0]);
      }
    } catch (err) {
      setError("Failed to fetch transaction accounts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId, pageNum) => {
    try {
      setError("");
      const res = await transactionService.getAll(accountId, { page: pageNum, limit });
      setTransactions(res.transactions || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      setError("Failed to load transactions from server.");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions(selectedAccount._id, page);
    }
  }, [selectedAccount, page]);

  const handleAccountChange = (accId) => {
    const acc = accounts.find((a) => a._id === accId);
    if (acc) {
      setSelectedAccount(acc);
      setPage(1); // Reset page to 1 on account switch
    }
  };

  const handleExportStatement = async () => {
    if (!selectedAccount) return;
    try {
      const blob = await transactionService.exportStatement(selectedAccount._id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `statement_${selectedAccount._id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export account statement.");
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 text-sm">Loading transactions...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Transactions history</h1>
          <p className="text-slate-400 text-xs mt-0.5">Track, search and review all credits and debits on your accounts</p>
        </div>

        {accounts.length > 0 && (
          <select
            value={selectedAccount?._id || ""}
            onChange={(e) => handleAccountChange(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-smooth"
          >
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                Account (...{acc._id.slice(-6)}) - {acc.currency}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Transactions Found</h3>
          <p className="text-slate-400 text-xs">You must create a checking account and perform a transfer to see history.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Ledger Statement</h3>
                <p className="text-[10px] text-slate-400 font-mono">Account ID: {selectedAccount?._id}</p>
              </div>
            </div>
            
            <button
              onClick={handleExportStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-smooth"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          
          <TransactionList transactions={transactions} currency={selectedAccount?.currency} />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 rounded-lg text-xs font-bold transition-smooth"
              >
                Previous
              </button>
              <span className="text-[11px] text-slate-500 font-medium">
                Page {page} of {totalPages} ({total} total transactions)
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 rounded-lg text-xs font-bold transition-smooth"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default TransactionsPage;
