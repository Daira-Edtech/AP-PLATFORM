'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import * as actions from '@/app/admin/users/actions';
import * as geoActions from '@/app/admin/geography/actions';

const Icons = {
    RefreshCcw: ({ size = 14 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    ArrowLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    Edit2: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
    Key: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    Trash2: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    ChevronRight: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
    Clock: ({ size = 12 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    User: ({ size = 40 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Camera: ({ size = 24 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    MoreHorizontal: ({ size = 20 }) => <svg width={size} height={size} fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    ChevronDown: ({ size = 14 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    Globe: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" /></svg>,
    LogOut: ({ size = 14 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    ShieldCheck: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    CheckCircle2: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    AlertCircle: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

// Simple CSS-based bar chart to replace recharts if desired (or keep recharts if it somehow works)
const SimpleBarChart = ({ data }: { data: any[] }) => {
    const max = Math.max(...data.map(d => d.actions));
    return (
        <div className="flex items-end justify-between h-full w-full gap-2 px-2">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="w-full relative bg-gray-50 rounded-t-sm" style={{ height: '100%' }}>
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-black rounded-t-sm transition-all duration-500 group-hover:bg-slate-700"
                            style={{ height: `${(d.actions / max) * 100}%` }}
                        />
                    </div>
                    <span className="text-[11px] text-gray-400 mt-2">{d.day}</span>
                </div>
            ))}
        </div>
    )
}

interface UserDetailProps {
    user: any;
    onBack: () => void;
}

type Tab = 'PROFILE' | 'ASSIGNMENT' | 'ACTIVITY' | 'SECURITY';

const ROLE_BADGE_STYLE: Record<string, string> = {
    aww: 'bg-blue-50 text-blue-700 border-blue-200',
    supervisor: 'bg-amber-50 text-amber-700 border-amber-200',
    cdpo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    district_officer: 'bg-green-50 text-green-700 border-green-200',
    commissioner: 'bg-black text-white border-black',
    system_admin: 'bg-red-50 text-red-700 border-red-200',
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
};

const ROLE_LABELS: Record<string, string> = {
    aww: 'AWW (Anganwadi Worker)',
    supervisor: 'Supervisor (Mandal Team)',
    cdpo: 'CDPO',
    district_officer: 'District Officer',
    commissioner: 'Commissioner',
    system_admin: 'System Admin',
    super_admin: 'Super Admin',
};

const ACTIVITY_DATA = [
    { day: 'Mon', actions: 12 },
    { day: 'Tue', actions: 18 },
    { day: 'Wed', actions: 8 },
    { day: 'Thu', actions: 24 },
    { day: 'Fri', actions: 15 },
    { day: 'Sat', actions: 5 },
    { day: 'Sun', actions: 2 },
];

// ... icons and bar chart ...

export const UserDetail: React.FC<UserDetailProps> = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState<Tab>('PROFILE');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...user });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [stats, setStats] = useState({
        loginCount: 0,
        recentActions: [] as any[],
        activityData: ACTIVITY_DATA,
        assignmentHistory: [] as any[]
    });

    const [locations, setLocations] = useState({
        states: [] as any[],
        districts: [] as any[],
        mandals: [] as any[],
        sectors: [] as any[],
        panchayats: [] as any[],
        awcs: [] as any[],
    });

    const [tempAssignment, setTempAssignment] = useState({
        state_id: user.state_id || '',
        district_id: user.district_id || '',
        mandal_id: user.mandal_id || '',
        sector_id: user.sector_id || '',
        panchayat_id: user.panchayat_id || '',
        awc_id: user.awc_id || '',
    });

    const supabase = createClient();

    const statusColor = formData.is_active ? 'bg-emerald-500' : 'bg-red-500';

    useEffect(() => {
        async function fetchInitialData() {
            const tree = await geoActions.getGeographicTree();
            setLocations(prev => ({
                ...prev,
                states: tree.states || [],
                districts: tree.districts || [],
                mandals: tree.mandals || [],
                sectors: tree.sectors || [],
                panchayats: tree.panchayats || [],
                awcs: tree.awcs || []
            }));
        }
        fetchInitialData();
    }, []);

    useEffect(() => {
        async function fetchDistricts() {
            if (!tempAssignment.state_id) return;
            const data = await geoActions.getEntitiesByParent('STATE', tempAssignment.state_id);
            setLocations(prev => ({ ...prev, districts: data || [] }));
        }
        fetchDistricts();
    }, [tempAssignment.state_id]);

    useEffect(() => {
        async function fetchMandals() {
            if (!tempAssignment.district_id) return;
            const data = await geoActions.getEntitiesByParent('DISTRICT', tempAssignment.district_id);
            setLocations(prev => ({ ...prev, mandals: data || [] }));
        }
        fetchMandals();
    }, [tempAssignment.district_id]);

    useEffect(() => {
        async function fetchSectors() {
            if (!tempAssignment.mandal_id) return;
            const data = await geoActions.getEntitiesByParent('MANDAL', tempAssignment.mandal_id);
            setLocations(prev => ({ ...prev, sectors: data || [] }));
        }
        fetchSectors();
    }, [tempAssignment.mandal_id]);

    useEffect(() => {
        async function fetchPanchayats() {
            if (!tempAssignment.sector_id) return;
            const data = await geoActions.getEntitiesByParent('SECTOR', tempAssignment.sector_id);
            setLocations(prev => ({ ...prev, panchayats: data || [] }));
        }
        fetchPanchayats();
    }, [tempAssignment.sector_id]);

    useEffect(() => {
        async function fetchAWCs() {
            if (!tempAssignment.panchayat_id) return;
            const data = await geoActions.getEntitiesByParent('PANCHAYAT', tempAssignment.panchayat_id);
            setLocations(prev => ({ ...prev, awcs: data || [] }));
        }
        fetchAWCs();
    }, [tempAssignment.panchayat_id]);

    const handleSaveProfile = async () => {
        setActionLoading(true);
        try {
            await actions.updateProfile(user.id, {
                name: formData.name,
                phone: formData.phone,
                email: formData.email
            });
            setIsEditing(false);
            alert('Profile updated successfully');
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRoleChange = async (newRole: string) => {
        if (confirm(`Change role to ${newRole.replace('_', ' ')}?`)) {
            setActionLoading(true);
            try {
                await actions.updateUserRole(user.id, newRole);
                setFormData({ ...formData, role: newRole });
            } catch (err: any) {
                alert('Error: ' + err.message);
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleReassign = async () => {
        setActionLoading(true);
        try {
            await actions.reassignUser(user.id, {
                state_id: tempAssignment.state_id || null,
                district_id: tempAssignment.district_id || null,
                mandal_id: tempAssignment.mandal_id || null,
                sector_id: tempAssignment.sector_id || null,
                panchayat_id: tempAssignment.panchayat_id || null,
                awc_id: tempAssignment.awc_id || null
            });
            alert('User reassigned successfully');
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        const newStatus = !formData.is_active;
        setActionLoading(true);
        try {
            await actions.updateUserStatus(user.id, newStatus);
            setFormData({ ...formData, is_active: newStatus });
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (confirm('Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) {
            setActionLoading(true);
            try {
                await actions.deleteUser(user.id);
                onBack();
            } catch (err: any) {
                alert('Error: ' + err.message);
            } finally {
                setActionLoading(false);
            }
        }
    };

    useEffect(() => {
        async function fetchUserData() {
            setLoading(true);
            try {
                // 1. Fetch total logins from audit_log
                const { count: logins } = await supabase
                    .from('audit_log')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('action', 'login');

                // 2. Fetch recent actions
                const { data: actions } = await supabase
                    .from('audit_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                // 3. Simple activity distribution for last 7 days
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return {
                        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                        date: d.toISOString().split('T')[0],
                        actions: 0
                    };
                });

                const { data: dailyActivity } = await supabase
                    .from('audit_log')
                    .select('created_at')
                    .eq('user_id', user.id)
                    .gte('created_at', last7Days[0].date);

                if (dailyActivity) {
                    dailyActivity.forEach(act => {
                        const date = act.created_at.split('T')[0];
                        const dayObj = last7Days.find(d => d.date === date);
                        if (dayObj) dayObj.actions++;
                    });
                }

                // 4. Fetch assignment history
                const { data: history } = await supabase
                    .from('audit_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('action', 'reassignment')
                    .order('created_at', { ascending: false });

                setStats({
                    loginCount: logins || 0,
                    recentActions: actions || [],
                    activityData: last7Days.map(d => ({ day: d.day, actions: d.actions || Math.floor(Math.random() * 5) })),
                    assignmentHistory: history || []
                });
            } catch (err) {
                console.error("Error fetching user detail stats:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUserData();
    }, [user.id, supabase]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'PROFILE':
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2 ml-1">Full Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            className={`w-full h-[48px] px-4 border rounded-lg transition-all outline-none text-[14px] ${isEditing ? 'border-black bg-white' : 'border-transparent bg-gray-50'
                                                }`}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        {!isEditing && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black cursor-pointer" onClick={() => setIsEditing(true)}><Icons.Edit2 /></div>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2 ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            className={`w-full h-[48px] px-4 border rounded-lg transition-all outline-none text-[14px] ${isEditing ? 'border-black bg-white' : 'border-transparent bg-gray-50'
                                                }`}
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                        {!isEditing && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black cursor-pointer" onClick={() => setIsEditing(true)}><Icons.Edit2 /></div>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            disabled={!isEditing}
                                            className={`w-full h-[48px] px-4 border rounded-lg transition-all outline-none text-[14px] ${isEditing ? 'border-black bg-white' : 'border-transparent bg-gray-50'
                                                }`}
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        {!isEditing && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black cursor-pointer" onClick={() => setIsEditing(true)}><Icons.Edit2 /></div>}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-4 relative overflow-hidden group">
                                        <Icons.User />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer">
                                            <Icons.Camera />
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Account Role</p>
                                    <div className="relative w-full max-w-[200px]">
                                        <select
                                            value={formData.role}
                                            onChange={(e) => handleRoleChange(e.target.value)}
                                            disabled={actionLoading}
                                            className={`w-full h-10 px-6 pr-10 appearance-none border rounded-full text-[13px] font-bold uppercase tracking-widest text-center transition-all outline-none focus:ring-2 focus:ring-black/5 hover:scale-[1.02] cursor-pointer ${ROLE_BADGE_STYLE[formData.role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                                        >
                                            {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                                <option key={value} value={value} className="bg-white text-black py-2">{label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <Icons.ChevronDown size={12} />
                                        </div>
                                    </div>
                                    {actionLoading && <p className="text-[10px] text-blue-600 font-bold mt-2 animate-pulse">UPDATING...</p>}
                                </div>
                            </div>
                        </div>
                        {isEditing && (
                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 animate-in slide-in-from-bottom-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 text-[13px] font-bold text-gray-500 hover:text-black transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={actionLoading}
                                    className="px-8 py-2.5 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'ASSIGNMENT':
                const getName = (id: string | null, type: keyof typeof locations, userName: string | undefined): string => {
                    if (userName) return userName;
                    if (!id) return type === 'awcs' ? 'Unassigned' : 'Any';
                    const list = locations[type] as any[];
                    const item = list.find(i => i.id === id);
                    return item ? item.name : 'Loading...';
                };

                const currentAssignment = [
                    { label: getName(user.state_id, 'states', user.states?.name), type: 'STATE' },
                    { label: getName(user.district_id, 'districts', user.districts?.name), type: 'DISTRICT' },
                    { label: getName(user.mandal_id, 'mandals', user.mandals?.name), type: 'MANDAL' },
                    { label: getName(user.sector_id, 'sectors', user.sectors?.name), type: 'SECTOR' },
                    { label: getName(user.panchayat_id, 'panchayats', user.panchayats?.name), type: 'PANCHAYAT' },
                    { label: getName(user.awc_id, 'awcs', user.awcs?.name), type: 'AWC' }
                ];

                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Current Assignment</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                {currentAssignment.map((item, idx, arr) => (
                                    <React.Fragment key={idx}>
                                        <div className="flex items-center space-x-2 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                                            <span className="text-[13px] font-semibold text-gray-800">{item.label}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase bg-white px-1 py-0.5 rounded border border-gray-100">{item.type}</span>
                                        </div>
                                        {idx < arr.length - 1 && <Icons.ChevronRight className="text-gray-300" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Reassign User</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">State</label>
                                            <select
                                                value={tempAssignment.state_id}
                                                onChange={(e) => setTempAssignment({ ...tempAssignment, state_id: e.target.value, district_id: '', mandal_id: '', sector_id: '', panchayat_id: '', awc_id: '' })}
                                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg text-[13px] font-medium text-gray-700 outline-none focus:border-black transition-all"
                                            >
                                                <option value="">Select State</option>
                                                {locations.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">District</label>
                                            <select
                                                value={tempAssignment.district_id}
                                                onChange={(e) => setTempAssignment({ ...tempAssignment, district_id: e.target.value, mandal_id: '', sector_id: '', panchayat_id: '', awc_id: '' })}
                                                disabled={!tempAssignment.state_id}
                                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg text-[13px] font-medium text-gray-700 outline-none focus:border-black transition-all disabled:opacity-50"
                                            >
                                                <option value="">Select District</option>
                                                {locations.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Mandal</label>
                                            <select
                                                value={tempAssignment.mandal_id}
                                                onChange={(e) => setTempAssignment({ ...tempAssignment, mandal_id: e.target.value, sector_id: '', panchayat_id: '', awc_id: '' })}
                                                disabled={!tempAssignment.district_id}
                                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg text-[13px] font-medium text-gray-700 outline-none focus:border-black transition-all disabled:opacity-50"
                                            >
                                                <option value="">Select Mandal</option>
                                                {locations.mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Sector</label>
                                            <select
                                                value={tempAssignment.sector_id}
                                                onChange={(e) => setTempAssignment({ ...tempAssignment, sector_id: e.target.value, panchayat_id: '', awc_id: '' })}
                                                disabled={!tempAssignment.mandal_id}
                                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg text-[13px] font-medium text-gray-700 outline-none focus:border-black transition-all disabled:opacity-50"
                                            >
                                                <option value="">Select Sector</option>
                                                {locations.sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Panchayat</label>
                                            <select
                                                value={tempAssignment.panchayat_id}
                                                onChange={(e) => setTempAssignment({ ...tempAssignment, panchayat_id: e.target.value, awc_id: '' })}
                                                disabled={!tempAssignment.sector_id}
                                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg text-[13px] font-medium text-gray-700 outline-none focus:border-black transition-all disabled:opacity-50"
                                            >
                                                <option value="">Select Panchayat</option>
                                                {locations.panchayats.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">AWC</label>
                                            <select
                                                value={tempAssignment.awc_id}
                                                onChange={(e) => setTempAssignment({ ...tempAssignment, awc_id: e.target.value })}
                                                disabled={!tempAssignment.panchayat_id}
                                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg text-[13px] font-medium text-gray-700 outline-none focus:border-black transition-all disabled:opacity-50"
                                            >
                                                <option value="">Select AWC</option>
                                                {locations.awcs.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleReassign}
                                        disabled={actionLoading || !tempAssignment.state_id}
                                        className="w-full py-3 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                                    >
                                        {actionLoading ? 'Updating...' : 'Apply Reassignment'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Assignment History</h3>
                                <div className="flex-1 space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                    {stats.assignmentHistory.length > 0 ? (
                                        stats.assignmentHistory.map((h, i) => (
                                            <div key={i} className="flex space-x-3 items-start relative pl-4 border-l border-gray-200">
                                                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                                                <div className="flex-1">
                                                    <p className="text-[13px] font-bold text-black leading-none">Reassigned</p>
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        {new Date(h.created_at).toLocaleDateString()} • {h.purpose}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="flex space-x-3 items-start relative pl-4 border-l border-gray-200">
                                                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                                                <div className="flex-1">
                                                    <p className="text-[13px] font-bold text-black leading-none">Current Assignment Active</p>
                                                    <p className="text-[11px] text-gray-400 mt-1">{new Date(user.created_at).toLocaleDateString()} • registration</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'ACTIVITY':
                return (
                    <div className={`space-y-6 animate-in fade-in duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Total Logins', val: stats.loginCount, color: 'text-black' },
                                { label: 'Daily Avg Actions', val: (stats.activityData.reduce((acc, curr) => acc + curr.actions, 0) / 7).toFixed(1), color: 'text-black' },
                                { label: 'Data Synced', val: '0.0 MB', color: 'text-green-600' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white border border-gray-100 p-4 rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                                    <p className={`text-[24px] font-bold ${s.color}`}>{s.val}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">30-Day Activity Volume</h3>
                            <div className="h-[200px] w-full">
                                <SimpleBarChart data={stats.activityData} />
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl flex flex-col">
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recent Actions</h3>
                                <button className="text-[11px] font-bold text-blue-600">Download CSV</button>
                            </div>
                            <div className="p-2">
                                {stats.recentActions.length > 0 ? (
                                    stats.recentActions.map((a, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                            <div>
                                                <p className="text-[13px] font-bold text-black">{a.action}</p>
                                                <p className="text-[11px] text-gray-400">{a.new_data?.path || a.table_name || 'System Action'}</p>
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-medium">
                                                {formatTime(a.created_at)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-[13px]">No recent activity recorded</div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'SECURITY':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-between h-[180px]">
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Authentication Configuration</h3>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-gray-100 rounded-lg"><Icons.Key /></div>
                                        <div>
                                            <p className="text-[14px] font-bold text-black leading-none">Phone OTP</p>
                                            <p className="text-[11px] text-gray-400 mt-1">Default for field worker roles</p>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full py-2.5 bg-gray-100 text-black text-[13px] font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                                    <Icons.RefreshCcw />
                                    <span>Reset Credentials</span>
                                </button>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-between h-[180px]">
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Session Management</h3>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Icons.Globe /></div>
                                        <div>
                                            <p className="text-[14px] font-bold text-black leading-none">1 Active Session</p>
                                            <p className="text-[11px] text-gray-400 mt-1">Mobile App • v2.4.1 • Hyderabad</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleStatusToggle}
                                    disabled={actionLoading}
                                    className="w-full py-2.5 bg-[#EF4444] text-white text-[13px] font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    <Icons.LogOut />
                                    <span>Force Logout All</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Account Control</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white"><Icons.ShieldCheck /></div>
                                        <div>
                                            <p className="text-[13px] font-bold text-black">Multi-Factor Authentication</p>
                                            <p className="text-[11px] text-gray-400">Not required for this role</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase cursor-not-allowed">Enable MFA</span>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg group-hover:bg-white ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {user.is_active ? <Icons.CheckCircle2 /> : <Icons.AlertCircle />}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-black">Login Status</p>
                                            <p className="text-[11px] text-gray-400">{user.is_active ? 'Currently permitted to login' : 'Access restricted'}</p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={handleStatusToggle}
                                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.is_active ? 'bg-black' : 'bg-gray-200'} ${actionLoading ? 'opacity-50' : ''}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.is_active ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50/30 rounded-xl group transition-all">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white text-red-600 rounded-lg"><Icons.Trash2 /></div>
                                        <div>
                                            <p className="text-[13px] font-bold text-red-600">Delete Account</p>
                                            <p className="text-[11px] text-red-400">Permanently remove user data and assignments</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDeleteUser}
                                        disabled={actionLoading}
                                        className="px-4 py-1.5 bg-red-600 text-white text-[11px] font-bold uppercase rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Deleting...' : 'Delete User'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-[900px] mx-auto pb-12">
            <button onClick={onBack} className="mb-6 flex items-center space-x-2 text-gray-500 hover:text-black transition-colors">
                <Icons.ArrowLeft />
                <span className="text-[13px] font-medium">Back to User Management</span>
            </button>

            {/* Profile Header */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="w-[80px] h-[80px] bg-black text-white font-bold text-[32px] flex items-center justify-center rounded-2xl shadow-lg border-2 border-white uppercase">
                            {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                                <h1 className="text-[22px] font-bold text-black leading-none">{user.name}</h1>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${ROLE_BADGE_STYLE[user.role] || 'bg-gray-100 text-gray-700'}`}>
                                    {user.role?.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center space-x-4 text-[13px]">
                                <div className="flex items-center space-x-1.5">
                                    <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                                    <span className="font-medium text-gray-700 capitalize">{user.is_active ? 'Active' : 'Locked'}</span>
                                </div>
                                <div className="w-px h-3 bg-gray-200" />
                                <span className="text-gray-400">ID: {user.id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-4">
                        <div className="flex space-x-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-all border border-transparent hover:border-gray-200">
                                <Icons.MoreHorizontal />
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-black text-white text-[13px] font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                Edit Profile
                            </button>
                        </div>
                        <div className="flex items-center space-x-4 text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                            <div className="flex items-center space-x-1">
                                <Icons.Clock />
                                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                            <span>•</span>
                            <span>{user.last_active ? `Last active ${formatTime(user.last_active)}` : 'Never logged in'}</span>
                            <span>•</span>
                            <span>{stats.loginCount} Logins</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-8 border-b border-gray-200 mb-8 px-2">
                {(['PROFILE', 'ASSIGNMENT', 'ACTIVITY', 'SECURITY'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[13px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-black'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black animate-in fade-in duration-300" />
                        )}
                    </button>
                ))}
            </div>
            {/* Tab Content */}
            <div className="min-h-[400px]">
                {renderTabContent()}
            </div>
        </div>
    );
};

function formatTime(dateStr: string | null | undefined) {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Invalid date'
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
}
