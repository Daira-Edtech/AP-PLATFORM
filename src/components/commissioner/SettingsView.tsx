'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  User, Shield, Settings, Bell, Database, LogOut,
  ChevronRight, Edit2, CheckCircle2, Globe, Lock,
  Smartphone, History, AlertTriangle, RefreshCw, Download,
  ExternalLink, X
} from 'lucide-react';

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

const SettingsView: React.FC = () => {
  const router = useRouter();
  const [coverageTarget, setCoverageTarget] = useState(80);
  const [escalationThreshold, setEscalationThreshold] = useState(14);
  const [referralThreshold, setReferralThreshold] = useState(14);
  const [capacityAlert, setCapacityAlert] = useState(90);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [dataStats, setDataStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/commissioner/settings?type=profile').then(r => r.json()),
          fetch('/api/commissioner/settings?type=data-stats').then(r => r.json()),
        ]);
        setProfile(profileRes);
        setDataStats(statsRes);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      setSigningOut(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Fetch children data for export
      const res = await fetch('/api/commissioner/children?type=list&page=1&pageSize=10000');
      const data = await res.json();
      const rows = data.data || [];

      if (rows.length === 0) {
        alert('No data to export.');
        setExporting(false);
        return;
      }

      // Build CSV
      const headers = ['Name', 'Gender', 'Age', 'District', 'Mandal', 'AWC', 'Risk Level', 'Last Screening'];
      const csvRows = [headers.join(',')];
      rows.forEach((r: any) => {
        csvRows.push([
          `"${r.name || ''}"`,
          r.gender || '',
          r.age || '',
          `"${r.district || ''}"`,
          `"${r.mandal || ''}"`,
          `"${r.awc || ''}"`,
          r.riskLevel || '',
          r.lastScreening || '',
        ].join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jiveesha-children-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const roleLabel: Record<string, string> = {
    'commissioner': 'State Commissioner — ICDS',
    'cdpo': 'Child Development Project Officer',
    'supervisor': 'Supervisor',
    'aww': 'Anganwadi Worker',
    'district_officer': 'District Programme Officer',
  };

  const formatNumber = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)} Lakh`;
    if (n >= 1000) return n.toLocaleString('en-IN');
    return String(n);
  };

  const avatarUrl = profile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'U')}&background=000&color=fff&bold=true&size=200`;

  if (loading) {
    return (
      <div className="animate-in fade-in duration-700 pb-24 flex justify-center">
        <div className="w-full max-w-[700px] space-y-8">
          <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-96" /></div>
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

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
          <div className="relative shrink-0">
            <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl border-2 border-black object-cover shadow-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-[22px] font-bold text-black tracking-tight leading-none mb-1">{profile?.name || 'Unknown'}</h2>
            <p className="text-[14px] text-[#888] font-medium mb-3">
              {roleLabel[profile?.role] || profile?.role}{profile?.stateName && profile.stateName !== 'N/A' ? `, ${profile.stateName}` : ''}
            </p>
            <div className="flex gap-4">
              <span className="text-[12px] font-bold text-[#555] flex items-center gap-1.5"><Globe size={14} /> {profile?.email || 'N/A'}</span>
              <span className="text-[12px] font-bold text-[#555] flex items-center gap-1.5"><Smartphone size={14} /> {profile?.phone || 'N/A'}</span>
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
            <SettingRow icon={<Lock size={18} />} title="Change Password" desc="Update your account password" action="Update" />
            <div className="flex items-center justify-between p-6 hover:bg-[#FBFBFB] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center text-[#888] border border-[#F0F0F0]"><Smartphone size={20} /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-black">Two-Factor Authentication</span>
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase rounded tracking-widest border border-zinc-200">Managed by Provider</span>
                  </div>
                  <p className="text-[12px] text-[#888]">Authentication is managed through Supabase Auth</p>
                </div>
              </div>
            </div>
            <SettingRow
              icon={<History size={18} />}
              title="Account Activity"
              desc={profile?.lastLoginAt
                ? `Last login: ${new Date(profile.lastLoginAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} • ${profile.loginCount} total sign-ins`
                : 'No login history available'
              }
              action="View"
            />
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
                  <Database size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-black">State Data Overview</span>
                    <span className="text-[10px] font-black text-green-600 uppercase">Live ✓</span>
                  </div>
                  {dataStats ? (
                    <p className="text-[12px] text-[#888]">
                      {formatNumber(dataStats.totalChildren)} children • {formatNumber(dataStats.totalProfiles)} workers • {formatNumber(dataStats.totalAwcs)} AWCs • {formatNumber(dataStats.totalSessions)} sessions
                    </p>
                  ) : (
                    <p className="text-[12px] text-[#888]">Loading data statistics...</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded font-black text-[12px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} /> {exporting ? 'Exporting...' : 'Export All Data (CSV)'}
              </button>
            </div>

            {/* Data Summary Cards */}
            {dataStats && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-[#F9F9F9] border border-[#EEE] rounded-lg p-4 text-center">
                  <span className="text-[20px] font-black block">{formatNumber(dataStats.totalChildren)}</span>
                  <span className="text-[9px] font-black text-[#888] uppercase tracking-widest">Children</span>
                </div>
                <div className="bg-[#F9F9F9] border border-[#EEE] rounded-lg p-4 text-center">
                  <span className="text-[20px] font-black block">{formatNumber(dataStats.totalProfiles)}</span>
                  <span className="text-[9px] font-black text-[#888] uppercase tracking-widest">Workers</span>
                </div>
                <div className="bg-[#F9F9F9] border border-[#EEE] rounded-lg p-4 text-center">
                  <span className="text-[20px] font-black block">{dataStats.totalAwcs}</span>
                  <span className="text-[9px] font-black text-[#888] uppercase tracking-widest">AWCs</span>
                </div>
                <div className="bg-[#F9F9F9] border border-[#EEE] rounded-lg p-4 text-center">
                  <span className="text-[20px] font-black block">{formatNumber(dataStats.totalSessions)}</span>
                  <span className="text-[9px] font-black text-[#888] uppercase tracking-widest">Sessions</span>
                </div>
              </div>
            )}

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
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 px-12 py-4 bg-red-50 text-red-600 rounded-xl font-black text-[14px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 border border-red-100 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={20} /> {signingOut ? 'Signing Out...' : 'Sign Out of State Command'}
          </button>
          <p className="text-[11px] font-bold text-[#AAA] uppercase tracking-widest">
            {profile?.createdAt ? `Account created: ${new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Jiveesha Platform'}
          </p>
        </div>
      </div>
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
