'use client'

import React, { useState } from 'react';
import { 
  User, Shield, Settings, Bell, Database, LogOut, 
  ChevronRight, Edit2, CheckCircle2, Globe, Lock, 
  Smartphone, History, AlertTriangle, RefreshCw, Download,
  ExternalLink, X
} from 'lucide-react';

const SettingsView: React.FC = () => {
  const [coverageTarget, setCoverageTarget] = useState(80);
  const [escalationThreshold, setEscalationThreshold] = useState(14);
  const [referralThreshold, setReferralThreshold] = useState(14);
  const [capacityAlert, setCapacityAlert] = useState(90);
  const [syncEnabled, setSyncEnabled] = useState(true);

  const [showIPModal, setShowIPModal] = useState(false);

  const commissioner = {
    name: 'R. K. Lakshman',
    role: 'State Commissioner — ICDS, Andhra Pradesh',
    email: 'commissioner@ap.gov.in',
    phone: '+91 98480 12345',
    avatar: 'https://picsum.photos/seed/commissioner/200/200'
  };

  const whitelistedIPs = [
    { ip: '10.24.1.45', label: 'Office Main Gateway', date: 'Jan 12, 2024' },
    { ip: '10.24.8.11', label: 'Secretariat Secure Node', date: 'Feb 04, 2024' },
    { ip: '192.168.1.102', label: 'Resident Commissioner Node', date: 'Mar 15, 2024' },
  ];

  return (
    <div className="animate-in fade-in duration-700 pb-24 flex justify-center">
      <div className="w-full max-w-[700px] space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-[28px] font-bold text-black tracking-tight mb-1">Profile & Settings</h1>
            <p className="text-[14px] text-[#888888] font-medium">Manage executive access and statewide operational protocols</p>
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm flex items-center gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] rounded-lg text-[12px] font-black uppercase tracking-widest hover:bg-[#F9F9F9] transition-all">
              <Edit2 size={14} /> Edit Profile
            </button>
          </div>
          <div className="relative shrink-0">
            <img src={commissioner.avatar} alt="Avatar" className="w-20 h-20 rounded-2xl border-2 border-black object-cover shadow-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-[22px] font-bold text-black tracking-tight leading-none mb-1">{commissioner.name}</h2>
            <p className="text-[14px] text-[#888] font-medium mb-3">{commissioner.role}</p>
            <div className="flex gap-4">
               <span className="text-[12px] font-bold text-[#555] flex items-center gap-1.5"><Globe size={14} /> {commissioner.email}</span>
               <span className="text-[12px] font-bold text-[#555] flex items-center gap-1.5"><Smartphone size={14} /> {commissioner.phone}</span>
            </div>
          </div>
        </div>

        {/* SECURITY */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#F5F5F5] bg-[#F9F9F9]/30">
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-[#888] flex items-center gap-2">
              <Shield size={16} /> Security & Authentication
            </h3>
          </div>
          <div className="divide-y divide-[#F5F5F5]">
            <SettingRow icon={<Lock size={18} />} title="Change Password" desc="Last changed 42 days ago" action="Update" />
            <div className="flex items-center justify-between p-6 hover:bg-[#FBFBFB] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center text-[#888] border border-[#F0F0F0]"><Smartphone size={20} /></div>
                <div>
                   <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-black">Two-Factor Authentication</span>
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-black uppercase rounded tracking-widest border border-green-100">Enabled ✓</span>
                   </div>
                   <p className="text-[12px] text-[#888]">Authenticator app paired: iPhone 15 Pro</p>
                </div>
              </div>
              <button className="text-[13px] font-bold text-black hover:underline underline-offset-4 decoration-1">Manage</button>
            </div>
            <SettingRow 
              icon={<Globe size={18} />} 
              title="IP Whitelist" 
              desc="3 authorised IP addresses configured" 
              action="Manage" 
              onClick={() => setShowIPModal(true)}
            />
            <SettingRow icon={<Smartphone size={18} />} title="Active Sessions" desc="1 active device in Amaravati, AP" action="View / Revoke" />
            <SettingRow icon={<History size={18} />} title="Login History" desc="View recent platform access logs" action="Audit Logs" />
          </div>
        </div>

        {/* STATE CONFIGURATION */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#F5F5F5] bg-[#F9F9F9]/30">
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-[#888] flex items-center gap-2">
              <Settings size={16} /> State Protocols & Thresholds
            </h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
               <div>
                  <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-2">State Coverage Target</label>
                  <div className="flex items-center gap-4">
                     <input 
                        type="range" min="50" max="100" value={coverageTarget} onChange={(e) => setCoverageTarget(parseInt(e.target.value))}
                        className="flex-1 accent-black" 
                     />
                     <span className="text-[18px] font-black w-12 text-right">{coverageTarget}%</span>
                  </div>
               </div>
               <div>
                  <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-2">Facility Capacity Alert</label>
                  <div className="flex items-center gap-4">
                     <input 
                        type="range" min="70" max="100" value={capacityAlert} onChange={(e) => setCapacityAlert(parseInt(e.target.value))}
                        className="flex-1 accent-black" 
                     />
                     <span className="text-[18px] font-black w-12 text-right">{capacityAlert}%</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block">District Escalation Limit</label>
                  <div className="relative">
                     <input 
                        type="number" value={escalationThreshold} onChange={(e) => setEscalationThreshold(parseInt(e.target.value))}
                        className="w-full h-11 bg-[#F9F9F9] border border-[#E5E5E5] px-4 rounded-lg font-bold text-[14px] outline-none focus:ring-1 focus:ring-black"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-[#AAA] uppercase">Days</span>
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block">Referral Overdue Limit</label>
                  <div className="relative">
                     <input 
                        type="number" value={referralThreshold} onChange={(e) => setReferralThreshold(parseInt(e.target.value))}
                        className="w-full h-11 bg-[#F9F9F9] border border-[#E5E5E5] px-4 rounded-lg font-bold text-[14px] outline-none focus:ring-1 focus:ring-black"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-[#AAA] uppercase">Days</span>
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-[#F5F5F5] flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black text-white rounded flex items-center justify-center">
                     <RefreshCw size={20} />
                  </div>
                  <div>
                     <span className="text-[14px] font-bold text-black block">National Benchmark Sync</span>
                     <p className="text-[12px] text-[#888]">Auto-update targets from Central Ministry directive feed</p>
                  </div>
               </div>
               <div 
                 onClick={() => setSyncEnabled(!syncEnabled)}
                 className={`w-12 h-6 rounded-full cursor-pointer transition-all relative ${syncEnabled ? 'bg-black' : 'bg-gray-200'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${syncEnabled ? 'left-7' : 'left-1'}`} />
               </div>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#F5F5F5] bg-[#F9F9F9]/30">
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-[#888] flex items-center gap-2">
              <Bell size={16} /> Alert Preferences
            </h3>
          </div>
          <div className="divide-y divide-[#F5F5F5]">
             <NotificationToggle label="Critical statewide escalations" desc="Email + SMS + In-app Alert" defaultOn={true} />
             <NotificationToggle label="Weekly state summary report" desc="Every Monday morning (Email)" defaultOn={true} />
             <NotificationToggle label="District coverage drop alert (<50%)" desc="Immediate In-app Alert" defaultOn={true} />
             <NotificationToggle label="Diagnostic facility capacity crises" desc="Push Notification" defaultOn={true} />
             <NotificationToggle label="National directive feed updates" desc="Dashboard Newsflash" defaultOn={false} />
             <NotificationToggle label="Programme milestone achievements" desc="Periodic Summary" defaultOn={true} />
          </div>
        </div>

        {/* DATA MANAGEMENT */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#F5F5F5] bg-[#F9F9F9]/30">
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-[#888] flex items-center gap-2">
              <Database size={16} /> Data Governance
            </h3>
          </div>
          <div className="p-8">
             <div className="flex items-center justify-between mb-8">
                <div className="flex gap-4 items-center">
                   <div className="w-12 h-12 bg-[#F9F9F9] rounded-lg border border-[#EEE] flex items-center justify-center text-[#AAA]">
                      <RefreshCw size={24} />
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                         <span className="text-[14px] font-bold text-black">Master State Data Sync</span>
                         <span className="text-[10px] font-black text-green-600 uppercase">Online ✓</span>
                      </div>
                      <p className="text-[12px] text-[#888]">Last synchronised: 1 min ago • 5,10,000 records</p>
                   </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded font-black text-[12px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                   <Download size={16} /> Export All Data (CSV)
                </button>
             </div>
             <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg flex justify-between items-center group cursor-pointer hover:bg-white hover:border-black transition-all">
                <div className="flex items-center gap-3">
                   <ExternalLink size={18} className="text-[#AAA]" />
                   <span className="text-[13px] font-bold text-[#555]">API Access & Documentation</span>
                </div>
                <ChevronRight size={16} className="text-[#AAA] group-hover:text-black transition-all" />
             </div>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="pt-10 flex flex-col items-center">
           <button className="flex items-center gap-3 px-12 py-4 bg-red-50 text-red-600 rounded-xl font-black text-[14px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 border border-red-100 mb-4">
              <LogOut size={20} /> Sign Out of State Command
           </button>
           <p className="text-[11px] font-bold text-[#AAA] uppercase tracking-widest">Portal Version 5.4.1 (Tier 5)</p>
        </div>
      </div>

      {/* IP WHITELIST MODAL */}
      {showIPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center bg-black text-white">
                 <h3 className="font-black uppercase tracking-widest text-[14px]">Manage IP Whitelist</h3>
                 <button onClick={() => setShowIPModal(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6">
                 <p className="text-[13px] text-[#555] leading-relaxed">
                    Access to the Tier 5 Commissioner Portal is restricted to these approved network identifiers.
                 </p>
                 <div className="space-y-3">
                    {whitelistedIPs.map(item => (
                       <div key={item.ip} className="flex items-center justify-between p-4 bg-[#F9F9F9] rounded-lg border border-[#EEE]">
                          <div>
                             <span className="text-[14px] font-black text-black block">{item.ip}</span>
                             <span className="text-[11px] text-[#888] font-bold uppercase">{item.label}</span>
                          </div>
                          <button className="text-[11px] font-black text-red-600 uppercase hover:underline">Remove</button>
                       </div>
                    ))}
                 </div>
                 <div className="pt-4 space-y-3">
                    <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block">Add New Trusted IP</label>
                    <div className="flex gap-2">
                       <input type="text" placeholder="e.g. 172.16.254.1" className="flex-1 bg-[#F9F9F9] border border-[#EEE] px-4 py-2 rounded font-bold text-[14px] outline-none focus:ring-1 focus:ring-black" />
                       <button className="bg-black text-white px-6 py-2 rounded font-black text-[12px] uppercase tracking-widest">Add</button>
                    </div>
                 </div>
              </div>
              <div className="p-6 bg-[#F9F9F9] border-t border-[#EEE] text-center">
                 <p className="text-[11px] font-bold text-[#AAA] leading-relaxed">
                    Note: Manual whitelisting is only permitted from registered government terminal endpoints.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SettingRow: React.FC<{ icon: React.ReactNode, title: string, desc: string, action: string, onClick?: () => void }> = ({ icon, title, desc, action, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-6 hover:bg-[#FBFBFB] transition-colors ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center text-[#888] border border-[#F0F0F0]">
        {icon}
      </div>
      <div>
        <span className="text-[15px] font-bold text-black block">{title}</span>
        <p className="text-[12px] text-[#888]">{desc}</p>
      </div>
    </div>
    <button className="text-[13px] font-bold text-black hover:underline underline-offset-4 decoration-1">{action}</button>
  </div>
);

const NotificationToggle: React.FC<{ label: string, desc: string, defaultOn: boolean }> = ({ label, desc, defaultOn }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-6 hover:bg-[#FBFBFB] transition-colors">
      <div className="flex-1">
        <span className="text-[14px] font-bold text-black block">{label}</span>
        <p className="text-[12px] text-[#888]">{desc}</p>
      </div>
      <div 
        onClick={() => setOn(!on)}
        className={`w-11 h-5 rounded-full cursor-pointer transition-all relative ${on ? 'bg-black' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${on ? 'left-6.5' : 'left-0.5'}`} style={{ left: on ? '26px' : '2px' }} />
      </div>
    </div>
  );
};

export default SettingsView;
