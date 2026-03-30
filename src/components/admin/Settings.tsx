'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    User, Shield, ShieldCheck, Key, Globe,
    Smartphone, LogOut, Clock,
    ChevronDown, Edit2, AlertCircle, Lock,
    Plus, Camera, Mail, Phone,
    Monitor, ExternalLink, Database, Activity
} from 'lucide-react';

interface CurrentUser {
    name: string;
    email: string;
    phone?: string;
    role: string;
}

interface AdminUser {
    id: string;
    name: string;
    email: string;
    status: 'ACTIVE' | 'INACTIVE';
    lastLogin: string;
}

interface SettingsProps {
    currentUser: CurrentUser;
    otherAdmins: AdminUser[];
}

const Settings: React.FC<SettingsProps> = ({ currentUser, otherAdmins }) => {
    const router = useRouter();
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const initials = currentUser.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const activeSessions = [
        { id: 's1', device: 'Current Session', location: 'Active now', ip: '—', time: 'Active now' },
    ];

    return (
        <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12 animate-in fade-in duration-500">
            <div className="xl:col-span-2 flex items-center justify-between">
                <h1 className="text-[24px] font-semibold text-[var(--color-dark-slate)]">Settings</h1>
            </div>

            {/* PROFILE CARD */}
            <section className="bg-[var(--color-card-bg)] border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center space-x-6">
                        <div className="relative group">
                            <div className="w-[80px] h-[80px] bg-black text-white font-bold text-[32px] flex items-center justify-center rounded-2xl shadow-lg border-2 border-white">
                                {initials}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer rounded-2xl">
                                <Camera size={20} />
                            </div>
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-3">
                                <h2 className="text-[22px] font-bold text-[var(--color-dark-slate)] leading-none">{currentUser.name}</h2>
                                <span className="text-[10px] text-[#EF4444] font-bold tracking-widest px-1.5 py-0.5 border border-[#EF4444] rounded uppercase">ADMIN</span>
                            </div>
                            <p className="text-[14px] text-[#888888] font-medium capitalize">{currentUser.role.replace('_', ' ')}</p>
                            <div className="flex items-center space-x-4 pt-2">
                                <div className="flex items-center space-x-1.5 text-[12px] text-[var(--color-subtle-text)]">
                                    <Mail size={12} />
                                    <span>{currentUser.email}</span>
                                </div>
                                {currentUser.phone && (
                                    <div className="flex items-center space-x-1.5 text-[12px] text-[var(--color-subtle-text)]">
                                        <Phone size={12} />
                                        <span>{currentUser.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-[var(--color-slate-light)] text-[var(--color-dark-slate)] text-[13px] font-bold rounded-lg border border-[var(--color-border-slate)] hover:bg-gray-100 transition-colors">
                            Edit Profile
                        </button>
                    </div>
                </div>
            </section>

            {/* SECURITY CARD */}
            <section className="bg-[var(--color-card-bg)] border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border-mute)] flex items-center space-x-2">
                    <Shield size={18} className="text-[var(--color-placeholder)]" />
                    <h3 className="text-[13px] font-bold text-[var(--color-dark-slate)] uppercase tracking-widest">Security</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    <div className="p-6 flex items-center justify-between group hover:bg-[var(--color-slate-light)]/50 transition-colors">
                        <div>
                            <p className="text-[14px] font-bold text-[var(--color-dark-slate)]">Change Password</p>
                            <p className="text-[12px] text-[var(--color-placeholder)] mt-0.5">Update your account password</p>
                        </div>
                        <button className="text-[13px] font-bold text-blue-600 hover:underline">Update</button>
                    </div>

                    <div className="p-6 flex items-center justify-between group hover:bg-[var(--color-slate-light)]/50 transition-colors">
                        <div>
                            <div className="flex items-center space-x-2">
                                <p className="text-[14px] font-bold text-[var(--color-dark-slate)]">Two-Factor Authentication</p>
                                <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold border border-green-100 rounded uppercase tracking-tighter">Enabled</span>
                            </div>
                            <p className="text-[12px] text-[var(--color-placeholder)] mt-0.5">MFA via Authenticator App</p>
                        </div>
                        <button className="text-[13px] font-bold text-blue-600 hover:underline">Manage MFA</button>
                    </div>

                    <div className="p-6 flex items-center justify-between group hover:bg-[var(--color-slate-light)]/50 transition-colors">
                        <div>
                            <p className="text-[14px] font-bold text-[var(--color-dark-slate)]">IP Whitelist</p>
                            <p className="text-[12px] text-[var(--color-placeholder)] mt-0.5">Manage authorized IP addresses</p>
                        </div>
                        <button className="text-[13px] font-bold text-blue-600 hover:underline">Manage IPs</button>
                    </div>

                    <div className="p-6 space-y-4">
                        <h4 className="text-[11px] font-bold text-[var(--color-placeholder)] uppercase tracking-widest">Active Sessions</h4>
                        <div className="space-y-3">
                            {activeSessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-3 bg-[var(--color-slate-light)] rounded-xl border border-[var(--color-border-slate)]">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-[var(--color-card-bg)] rounded-lg shadow-sm">
                                            <Monitor size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[var(--color-dark-slate)] leading-none">{session.device}</p>
                                            <p className="text-[11px] text-[var(--color-placeholder)] mt-1">{session.location}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-green-600">{session.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SYSTEM CONFIGURATION CARD */}
            <section className="bg-[var(--color-card-bg)] border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border-mute)] flex items-center space-x-2">
                    <Activity size={18} className="text-[var(--color-placeholder)]" />
                    <h3 className="text-[13px] font-bold text-[var(--color-dark-slate)] uppercase tracking-widest">System Configuration</h3>
                </div>
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <ConfigRow label="Base URL" value="https://admin.jiveesha.in" readOnly />
                        <ConfigRow label="Supabase Project URL" value={process.env.NEXT_PUBLIC_SUPABASE_URL || 'Configured'} readOnly />

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--color-placeholder)] uppercase tracking-widest ml-1">Auto-backup Schedule</label>
                            <div className="relative">
                                <input type="time" defaultValue="02:00" className="w-full h-11 px-4 bg-[var(--color-slate-light)] border-none rounded-lg text-[13px] font-bold outline-none" />
                                <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-placeholder)]" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--color-placeholder)] uppercase tracking-widest ml-1">Session Timeout</label>
                            <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 bg-[var(--color-slate-light)] border-none rounded-lg text-[13px] font-bold outline-none appearance-none">
                                    <option>15 minutes</option>
                                    <option>30 minutes</option>
                                    <option>1 hour</option>
                                    <option>4 hours</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-placeholder)] pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--color-placeholder)] uppercase tracking-widest ml-1">Max Login Fails</label>
                            <input type="number" defaultValue={3} className="w-full h-11 px-4 bg-[var(--color-slate-light)] border-none rounded-lg text-[13px] font-bold outline-none" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--color-placeholder)] uppercase tracking-widest ml-1">Lockout Duration</label>
                            <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 bg-[var(--color-slate-light)] border-none rounded-lg text-[13px] font-bold outline-none appearance-none">
                                    <option>15 minutes</option>
                                    <option>30 minutes</option>
                                    <option>1 hour</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-placeholder)] pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-[var(--color-border-slate)]">
                        <h4 className="text-[11px] font-bold text-[var(--color-placeholder)] uppercase tracking-widest mb-4">Password Policy</h4>
                        <div className="space-y-4">
                            <div className="xl:col-span-2 flex items-center justify-between">
                                <span className="text-[13px] font-medium text-[var(--color-dark-slate)]">Minimum length</span>
                                <div className="flex items-center space-x-3">
                                    <button className="w-8 h-8 flex items-center justify-center bg-[var(--color-slate-light)] rounded-lg font-bold">-</button>
                                    <span className="text-[13px] font-bold w-4 text-center">8</span>
                                    <button className="w-8 h-8 flex items-center justify-center bg-[var(--color-slate-light)] rounded-lg font-bold">+</button>
                                </div>
                            </div>
                            <PolicyToggle label="Require Uppercase" enabled={true} />
                            <PolicyToggle label="Require Number" enabled={true} />
                            <PolicyToggle label="Require Special Character" enabled={true} />
                        </div>
                    </div>
                </div>
            </section>

            {/* OTHER ADMINS CARD */}
            <section className="bg-[var(--color-card-bg)] border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border-mute)] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <ShieldCheck size={18} className="text-[var(--color-placeholder)]" />
                        <h3 className="text-[13px] font-bold text-[var(--color-dark-slate)] uppercase tracking-widest">Other Admins</h3>
                    </div>
                    <button className="text-[11px] font-bold text-blue-600 hover:underline flex items-center">
                        <Plus size={14} className="mr-1" />
                        Add Admin
                    </button>
                </div>
                <div className="p-4 space-y-2">
                    {otherAdmins.length === 0 ? (
                        <p className="text-center text-[12px] text-[var(--color-placeholder)] py-6">No other admins found.</p>
                    ) : (
                        otherAdmins.map(admin => (
                            <div key={admin.id} className="flex items-center justify-between p-3 hover:bg-[var(--color-slate-light)] rounded-xl transition-colors group">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-[11px] font-bold">
                                        {admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-[var(--color-dark-slate)] leading-none">{admin.name}</p>
                                        <p className="text-[11px] text-[var(--color-placeholder)] mt-1">{admin.email || admin.id.slice(0, 8) + '…'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="text-right">
                                        <p className={`text-[11px] font-bold uppercase tracking-tighter ${admin.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'}`}>{admin.status}</p>
                                        <p className="text-[10px] text-[var(--color-placeholder)]">Login: {admin.lastLogin}</p>
                                    </div>
                                    <button className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all text-[var(--color-placeholder)]">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* DANGER ZONE CARD */}
            <section className="bg-[var(--color-card-bg)] border-l-4 border-l-[#EF4444] border-y border-r border-red-50 rounded-r-2xl shadow-sm p-8 space-y-6 xl:col-span-2">
                <div className="flex items-center space-x-2">
                    <AlertCircle size={20} className="text-[#EF4444]" />
                    <h3 className="text-[13px] font-bold text-[#EF4444] uppercase tracking-widest">Danger Zone</h3>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-red-50/30 border border-red-50 rounded-xl">
                        <div>
                            <p className="text-[14px] font-bold text-[var(--color-dark-slate)]">Emergency Kill Switch</p>
                            <p className="text-[12px] text-red-600 font-medium">Disable all non-admin logins immediately.</p>
                        </div>
                        <button className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-[12px] font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                            Trigger Kill Switch
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-[var(--color-border-slate)] rounded-xl">
                        <div>
                            <p className="text-[14px] font-bold text-[var(--color-dark-slate)]">Maintenance Mode</p>
                            <p className="text-[12px] text-[var(--color-placeholder)] mt-0.5">Redirect all traffic to maintenance page.</p>
                        </div>
                        <button
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${maintenanceMode ? 'bg-[#EF4444]' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-[var(--color-card-bg)] rounded-full transition-all ${maintenanceMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* LOGOUT BUTTON & FOOTER */}
            <div className="xl:col-span-2 flex flex-col items-center justify-center space-y-8 pt-8">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-auto h-auto space-x-2 px-12 py-4 bg-black text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Sign Out Securely</span>
                </button>
                <p className="text-[11px] text-[var(--color-placeholder)] font-medium uppercase tracking-widest text-center">Jiveesha ECD System Admin Portal • Version 4.1.2-GA</p>
            </div>
        </div>
    );
};

const ConfigRow = ({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) => (
    <div className="space-y-1">
        <label className="text-[11px] font-bold text-[var(--color-placeholder)] uppercase tracking-widest ml-1">{label}</label>
        <div className={`w-full h-11 px-4 rounded-lg flex items-center justify-between text-[13px] font-medium border ${readOnly ? 'bg-gray-100 border-transparent text-[var(--color-subtle-text)]' : 'bg-[var(--color-card-bg)] border-gray-200'}`}>
            <span className="truncate">{value}</span>
            {readOnly ? <Lock size={12} className="text-[var(--color-placeholder)] shrink-0" /> : <ExternalLink size={12} className="text-[var(--color-placeholder)]" />}
        </div>
    </div>
);

const PolicyToggle = ({ label, enabled }: { label: string; enabled: boolean }) => (
    <div className="xl:col-span-2 flex items-center justify-between">
        <span className="text-[13px] text-gray-600">{label}</span>
        <button className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-black' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-[var(--color-card-bg)] rounded-full transition-all ${enabled ? 'left-6' : 'left-1'}`} />
        </button>
    </div>
);

export default Settings;
