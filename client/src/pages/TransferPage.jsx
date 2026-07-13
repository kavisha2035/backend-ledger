import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { accountService, transactionService } from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Send, UserPlus, Check, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Plus } from "lucide-react";

const TransferPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedFromAcc, setSelectedFromAcc] = useState(null);
  const [balance, setBalance] = useState(0);

  // Form states
  const [transferType, setTransferType] = useState("other"); // 'own' or 'other'
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Collapse state for other details
  const [showOtherDetails, setShowOtherDetails] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryEmail, setBeneficiaryEmail] = useState("");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Saved beneficiaries mock details
  const savedBeneficiaries = [
    { name: "Maria", email: "maria@example.com", accountId: "8b7f3b89-0a8c-4d1b-ac9e-88a38d7c2a11" },
    { name: "Leonard", email: "leonard@example.com", accountId: "8b7f3b89-0a8c-4d1b-ac9e-88a38d7c2a12" },
    { name: "Sarah", email: "sarah@example.com", accountId: "8b7f3b89-0a8c-4d1b-ac9e-88a38d7c2a13" },
  ];

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const userAccounts = await accountService.getAll();
      setAccounts(userAccounts);
      if (userAccounts.length > 0) {
        setSelectedFromAcc(userAccounts[0]);
        const bal = await accountService.getBalance(userAccounts[0]._id);
        setBalance(bal);
      }
    } catch (err) {
      setError("Failed to load account information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleFromAccountChange = async (accId) => {
    const acc = accounts.find((a) => a._id === accId);
    if (acc) {
      setSelectedFromAcc(acc);
      try {
        const bal = await accountService.getBalance(acc._id);
        setBalance(bal);
      } catch (err) {
        setError("Failed to retrieve account balance.");
      }
    }
  };

  const handleBeneficiarySelect = (beneficiaryAccId, name = "") => {
    setBeneficiary(beneficiaryAccId);
    if (name) {
      setBeneficiaryName(name);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedFromAcc) {
      setError("Please select a source account.");
      return;
    }

    if (!beneficiary) {
      setError("Please specify a beneficiary account ID.");
      return;
    }

    if (beneficiary === selectedFromAcc._id) {
      setError("Source account and beneficiary account cannot be the same.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    if (Number(amount) > balance) {
      setError(`Insufficient balance. Available balance is ${balance} INR.`);
      return;
    }

    setSubmitting(true);
    // Generate idempotency key for safe API transfer
    const idempotencyKey = `tx_key_${selectedFromAcc._id}_${Date.now()}`;
    const txDesc = purpose || (beneficiaryName ? `Transfer to ${beneficiaryName}` : "Funds Transfer");

    try {
      // Execute transaction on backend
      await transactionService.create(
        selectedFromAcc._id,
        beneficiary,
        amount,
        idempotencyKey,
        txDesc
      );

      setSuccess(`Successfully transferred ${amount} INR to account ...${beneficiary.slice(-6)}`);
      setAmount("");
      setBeneficiary("");
      setBeneficiaryName("");
      setBeneficiaryEmail("");
      setPurpose("");
      setReference("");
      
      // Update balance
      const newBal = await accountService.getBalance(selectedFromAcc._id);
      setBalance(newBal);
    } catch (err) {
      setError(err.response?.data?.message || "Transaction failed. Please make sure the destination account ID exists.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 text-sm">Loading accounts...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Transfer</h1>
        <p className="text-slate-400 text-xs mt-0.5">Move funds between your checking accounts or send globally</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Accounts Available</h3>
          <p className="text-slate-400 text-xs mb-6">Create an account in the overview dashboard first before transferring.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Transfer Form Box */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleTransfer} className="space-y-6">
                
                {/* Select Payer (Source Account) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Select Payer Account
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {accounts.map((acc) => {
                      const isSelected = selectedFromAcc?._id === acc._id;
                      return (
                        <div
                          key={acc._id}
                          onClick={() => handleFromAccountChange(acc._id)}
                          className={`cursor-pointer border-2 rounded-2xl p-4 flex justify-between items-center transition-smooth ${
                            isSelected 
                              ? "border-blue-500 bg-blue-50/20" 
                              : "border-slate-150 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-700">Checking Account ({acc.currency})</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{acc._id}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Balance</span>
                            <span className="text-sm font-bold text-slate-800 font-mono">
                              {isSelected ? balance : "Select to view"} INR
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transfer Type Tabs */}
                <div>
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Transfer destination
                  </span>
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferType("other");
                        setBeneficiary("");
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-smooth ${
                        transferType === "other"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Other account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransferType("own");
                        if (accounts.length > 1) {
                          // Select other own account as default beneficiary
                          const other = accounts.find((a) => a._id !== selectedFromAcc?._id);
                          if (other) setBeneficiary(other._id);
                        } else {
                          alert("You only have one account. Please create another account first to transfer to own.");
                        }
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-smooth ${
                        transferType === "own"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Own account
                    </button>
                  </div>
                </div>

                {/* Beneficiary Details */}
                {transferType === "other" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Beneficiary Account ID (UUID)
                    </label>
                    <input
                      type="text"
                      required
                      value={beneficiary}
                      onChange={(e) => setBeneficiary(e.target.value)}
                      placeholder="e.g. 6a900718-443d-4ab0-a69e-fc657033e503"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-smooth"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Select Own Beneficiary Account
                    </label>
                    <select
                      value={beneficiary}
                      onChange={(e) => setBeneficiary(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-smooth"
                    >
                      <option value="">-- Choose Account --</option>
                      {accounts
                        .filter((a) => a._id !== selectedFromAcc?._id)
                        .map((a) => (
                          <option key={a._id} value={a._id}>
                            Own Account (...{a._id.slice(-6)}) - {a.currency}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Amount and Date Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Amount (INR)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-smooth"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-smooth"
                    />
                  </div>
                </div>

                {/* Collapsible Other Details Section */}
                <div className="border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowOtherDetails(!showOtherDetails)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-smooth"
                  >
                    {showOtherDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showOtherDetails ? "Hide extra details" : "Add other data (Purpose, Beneficiary Name, Reference)"}
                  </button>

                  {showOtherDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fadeIn">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Transfer Purpose
                        </label>
                        <input
                          type="text"
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="e.g. Rent, Groceries, Gift"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Beneficiary's name
                        </label>
                        <input
                          type="text"
                          value={beneficiaryName}
                          onChange={(e) => setBeneficiaryName(e.target.value)}
                          placeholder="e.g. Nicola Rich"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Beneficiary's email
                        </label>
                        <input
                          type="email"
                          value={beneficiaryEmail}
                          onChange={(e) => setBeneficiaryEmail(e.target.value)}
                          placeholder="e.g. nicola@gmail.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Player's reference
                        </label>
                        <input
                          type="text"
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          placeholder="e.g. Ledger ref"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm shadow-md transition-smooth flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Processing transfer..." : "Continue"}
                </button>

              </form>
            </div>
          </div>

          {/* Right Panel: Saved Beneficiaries */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-500" />
                Saved Beneficiaries
              </h3>
              
              <div className="grid grid-cols-4 gap-4 items-center mb-6">
                <button
                  onClick={() => {
                    const id = prompt("Enter Beneficiary Account ID:");
                    const name = prompt("Enter Beneficiary Name:");
                    if (id && name) {
                      handleBeneficiarySelect(id, name);
                    }
                  }}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-200 transition-smooth">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 mt-1.5 group-hover:text-blue-500 transition-smooth">Add New</span>
                </button>

                {savedBeneficiaries.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => handleBeneficiarySelect(b.accountId, b.name)}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm group-hover:border-blue-400 group-hover:bg-blue-100 transition-smooth">
                      {b.name.charAt(0)}
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 mt-1.5 group-hover:text-slate-800 transition-smooth truncate max-w-full">
                      {b.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-[10px] text-blue-700 leading-relaxed">
                <p className="font-bold flex items-center gap-1 mb-1 text-blue-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Pro Tip:
                </p>
                Click on any saved beneficiary above to automatically fill the destination Account ID field in the form.
              </div>
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
};

export default TransferPage;
