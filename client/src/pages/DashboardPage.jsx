import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { accountService, transactionService } from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import AccountCard from "../components/dashboard/AccountCard";
import BalanceCard from "../components/dashboard/BalanceCard";
import SpendingChart from "../components/dashboard/SpendingChart";
import TransactionList from "../components/dashboard/TransactionList";
import { Plus, Info, RefreshCw, Star } from "lucide-react";

const DashboardPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const userAccounts = await accountService.getAll();
      setAccounts(userAccounts);
      
      if (userAccounts.length > 0) {
        // Default to first account
        const activeAcc = userAccounts[0];
        setSelectedAccount(activeAcc);
        
        // Fetch balance
        const activeBalance = await accountService.getBalance(activeAcc._id);
        setBalance(activeBalance);

        // Load real transactions from DB
        const res = await transactionService.getAll(activeAcc._id, { limit: 5 });
        setTransactions(res.transactions || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user._id]);

  const handleAccountChange = async (accId) => {
    const acc = accounts.find((a) => a._id === accId);
    if (acc) {
      setSelectedAccount(acc);
      try {
        setLoading(true);
        const activeBalance = await accountService.getBalance(acc._id);
        setBalance(activeBalance);
        
        const res = await transactionService.getAll(acc._id, { limit: 5 });
        setTransactions(res.transactions || []);
      } catch (err) {
        setError("Failed to fetch balance for selected account.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateAccount = async () => {
    setCreating(true);
    setError("");
    try {
      await accountService.create("INR");
      await fetchData();
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleSeedFunds = async () => {
    if (!selectedAccount) return;
    setSeeding(true);
    setSeedError("");
    const amount = 5000;
    const idempotencyKey = `seed_${selectedAccount._id}_${Date.now()}`;
    try {
      await transactionService.createInitialFunds(selectedAccount._id, amount, idempotencyKey, "Initial Seed Funds");
      
      // Update balance & transactions
      const newBalance = await accountService.getBalance(selectedAccount._id);
      setBalance(newBalance);
      
      const res = await transactionService.getAll(selectedAccount._id, { limit: 5 });
      setTransactions(res.transactions || []);
      
      alert(`Successfully seeded ${amount} INR!`);
    } catch (err) {
      console.error(err);
      setSeedError(
        err.response?.data?.message || 
        "Forbidden: To seed funds, user must be marked as systemUser in the database."
      );
    } finally {
      setSeeding(false);
    }
  };

  // Calculate totals from transaction list
  const totalIncome = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading && accounts.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 text-sm">Loading account details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Overview</h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage and track your accounts in real time</p>
        </div>
        
        {accounts.length > 0 && (
          <div className="flex items-center gap-3">
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

            <button
              onClick={handleCreateAccount}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow hover:bg-slate-800 transition-smooth disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              New Account
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto mt-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Create Your First Checking Account</h3>
          <p className="text-slate-400 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
            Get started by creating a checking account. You can create multiple accounts and track balances separately.
          </p>
          <button
            onClick={handleCreateAccount}
            disabled={creating}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-smooth disabled:opacity-50"
          >
            {creating ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Cards and Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Card */}
              {selectedAccount && (
                <AccountCard
                  account={selectedAccount}
                  balance={balance}
                  ownerName={user?.name}
                  variant="dark"
                />
              )}
              
              {/* Secondary Visual Card (Visual template only if user has 1 account, or secondary real account if > 1) */}
              {accounts.length > 1 ? (
                <AccountCard
                  account={accounts[1]}
                  balance={0} // Default for display, can expand if needed
                  ownerName={user?.name}
                  variant="peach"
                />
              ) : (
                <div className="bg-[#FFF8F5] border border-orange-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] rounded-full bg-orange-400/10 blur-xl pointer-events-none"></div>
                  <div>
                    <h4 className="text-orange-600 font-bold text-sm mb-1 flex items-center gap-1.5">
                      <Star className="w-4 h-4" /> Seed Funds
                    </h4>
                    <p className="text-slate-500 text-[10px] leading-relaxed">
                      Seed initial funds using the system account (requires your user profile to be marked as systemUser in the database).
                    </p>
                  </div>
                  
                  {seedError && (
                    <p className="text-red-500 text-[9px] mt-2 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                      {seedError}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleSeedFunds}
                      disabled={seeding}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-bold shadow transition-smooth disabled:opacity-50"
                    >
                      {seeding ? "Seeding..." : "Seed 5,000 INR"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Income & Expense Breakdown */}
            <BalanceCard
              income={totalIncome}
              expenses={totalExpenses}
              available={balance}
              currency={selectedAccount?.currency}
            />

            {/* Chart Widget */}
            <SpendingChart />
          </div>

          {/* Right Side: Ledger Transactions list */}
          <div className="lg:col-span-1">
            <TransactionList 
              transactions={transactions} 
              currency={selectedAccount?.currency}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
