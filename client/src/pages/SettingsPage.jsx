import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import { User, Shield, Bell, CheckSquare, Save } from "lucide-react";

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");

  // Local state for settings form
  const nameParts = (user?.name || "").split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("+91 99999 99999");
  const [address, setAddress] = useState("123 Sesame Street");
  const [zip, setZip] = useState("110001");
  const [city, setCity] = useState("New Delhi");

  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage("");
    setTimeout(() => {
      setSaving(false);
      setSavedMessage("Settings saved successfully (Local Mock update)!");
      setTimeout(() => setSavedMessage(""), 3000);
    }, 1000);
  };

  const tabs = [
    { id: "personal", label: "Personal info", icon: User },
    { id: "security", label: "Password and security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "plan", label: "Choose plan", icon: CheckSquare },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Account Settings</h1>
        <p className="text-slate-400 text-xs mt-0.5">Configure your profile info, security keys and alerts</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        
        {/* Settings Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-smooth ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {savedMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-xl text-xs font-semibold">
            {savedMessage}
          </div>
        )}

        {/* Tab 1: Personal Info form */}
        {activeTab === "personal" && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold text-2xl uppercase">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700">Profile picture</h3>
                <span className="text-[10px] text-slate-400">PNG or JPG. Max 2MB.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email address</label>
              <input
                type="email"
                disabled
                value={email}
                title="Email is locked to user account credentials"
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 cursor-not-allowed"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">Authentication email cannot be altered directly.</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Phone number (Locked)</label>
              <input
                type="text"
                disabled
                value={phone}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Street address (Locked)</label>
              <input
                type="text"
                disabled
                value={address}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">ZIP code (Locked)</label>
                <input
                  type="text"
                  disabled
                  value={zip}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">City (Locked)</label>
                <input
                  type="text"
                  disabled
                  value={city}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow transition-smooth flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}

        {/* Tab 2: Security */}
        {activeTab === "security" && (
          <div className="py-8 text-center text-slate-400 text-xs max-w-md mx-auto">
            <h3 className="font-bold text-slate-800 mb-2">Password & security settings</h3>
            <p className="leading-relaxed mb-4">You can update your security credentials or generate API keys. These actions are disabled during mock mode.</p>
            <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-bold cursor-not-allowed text-xs">
              Change Password
            </button>
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === "notifications" && (
          <div className="py-8 text-center text-slate-400 text-xs max-w-md mx-auto">
            <h3 className="font-bold text-slate-800 mb-2">Notification preferences</h3>
            <p className="leading-relaxed">Receive SMS, email or browser alerts on transaction activities. Setup alerts globally inside ledger config.</p>
          </div>
        )}

        {/* Tab 4: Choose Plan */}
        {activeTab === "plan" && (
          <div className="py-8 text-center text-slate-400 text-xs max-w-md mx-auto">
            <h3 className="font-bold text-slate-800 mb-2">Current Subscription Plan</h3>
            <p className="leading-relaxed mb-4">You are currently on the **Free Developer Plan**.</p>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 font-bold rounded-full text-[10px]">
              ACTIVE PLAN
            </span>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
