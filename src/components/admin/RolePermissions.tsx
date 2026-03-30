'use client';

import React, { useState, useEffect } from 'react';
import {
    Check, Circle, Save, RotateCcw,
    ChevronDown, ChevronRight, ShieldCheck,
    AlertCircle, Info
} from 'lucide-react';
import * as actions from '@/app/admin/roles/actions';

type PermissionLevel = 'ALLOWED' | 'DENIED' | 'READ_ONLY';

interface PermissionRow {
    id: string;
    label: string;
    roles: Record<string, PermissionLevel>;
}

interface PermissionGroup {
    id: string;
    label: string;
    features: PermissionRow[];
}

const ROLES = [
    { id: 'aww', label: 'AWW' },
    { id: 'supervisor', label: 'Supervisor' },
    { id: 'cdpo', label: 'CDPO' },
    { id: 'district_officer', label: 'District Officer' },
    { id: 'commissioner', label: 'Commissioner' },
    { id: 'system_admin', label: 'System Admin' },
    { id: 'super_admin', label: 'Super Admin' }
];

const INITIAL_PERMISSIONS: PermissionGroup[] = [
    {
        id: 'children',
        label: 'CHILDREN',
        features: [
            { id: 'reg_child', label: 'Register children', roles: { aww: 'ALLOWED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'view_own', label: 'View own AWC children', roles: { aww: 'ALLOWED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'view_mandal', label: 'View mandal children', roles: { aww: 'DENIED', supervisor: 'ALLOWED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'view_cdpo', label: 'View CDPO children', roles: { aww: 'DENIED', supervisor: 'DENIED', cdpo: 'ALLOWED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'view_district', label: 'View district children', roles: { aww: 'DENIED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'ALLOWED', commissioner: 'DENIED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'view_state', label: 'View state children', roles: { aww: 'DENIED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'ALLOWED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
        ]
    },
    {
        id: 'screening',
        label: 'SCREENING',
        features: [
            { id: 'conduct_q', label: 'Conduct questionnaire', roles: { aww: 'ALLOWED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'DENIED', super_admin: 'DENIED' } },
            { id: 'conduct_ai', label: 'Conduct AI protocols', roles: { aww: 'DENIED', supervisor: 'ALLOWED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'DENIED', super_admin: 'DENIED' } },
            { id: 'view_results', label: 'View screening results', roles: { aww: 'DENIED', supervisor: 'ALLOWED', cdpo: 'ALLOWED', district_officer: 'ALLOWED', commissioner: 'ALLOWED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'view_risk', label: 'View risk scores', roles: { aww: 'DENIED', supervisor: 'ALLOWED', cdpo: 'ALLOWED', district_officer: 'ALLOWED', commissioner: 'ALLOWED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
        ]
    },
    {
        id: 'flags',
        label: 'FLAGS & ESCALATIONS',
        features: [
            { id: 'raise_flags', label: 'Raise flags', roles: { aww: 'ALLOWED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'DENIED', super_admin: 'DENIED' } },
            { id: 'manage_flags', label: 'Manage flags', roles: { aww: 'DENIED', supervisor: 'ALLOWED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'DENIED', super_admin: 'DENIED' } },
            { id: 'view_escal', label: 'View escalations', roles: { aww: 'DENIED', supervisor: 'DENIED', cdpo: 'ALLOWED', district_officer: 'ALLOWED', commissioner: 'ALLOWED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'escal_further', label: 'Escalate further', roles: { aww: 'DENIED', supervisor: 'ALLOWED', cdpo: 'ALLOWED', district_officer: 'ALLOWED', commissioner: 'ALLOWED', system_admin: 'DENIED', super_admin: 'DENIED' } },
        ]
    },
    {
        id: 'referrals',
        label: 'REFERRALS & INTERVENTIONS',
        features: [
            { id: 'create_ref', label: 'Create referrals', roles: { aww: 'DENIED', supervisor: 'ALLOWED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'DENIED', super_admin: 'DENIED' } },
            { id: 'view_pipe', label: 'View referral pipeline', roles: { aww: 'DENIED', supervisor: 'ALLOWED', cdpo: 'ALLOWED', district_officer: 'ALLOWED', commissioner: 'ALLOWED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
        ]
    },
    {
        id: 'admin',
        label: 'ADMIN',
        features: [
            { id: 'manage_users', label: 'Manage users', roles: { aww: 'DENIED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'manage_hier', label: 'Manage hierarchy', roles: { aww: 'DENIED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
            { id: 'view_audit', label: 'View audit log', roles: { aww: 'DENIED', supervisor: 'DENIED', cdpo: 'DENIED', district_officer: 'DENIED', commissioner: 'DENIED', system_admin: 'ALLOWED', super_admin: 'ALLOWED' } },
        ]
    }
];

const RolePermissions: React.FC = () => {
    const [groups, setGroups] = useState<PermissionGroup[]>(INITIAL_PERMISSIONS);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [resetPending, setResetPending] = useState(false);

    useEffect(() => {
        const fetchPermissions = async () => {
            const res = await actions.getRolePermissions();
            if (res.success && res.data && res.data.length > 0) {
                setGroups(res.data);
            }
        };
        fetchPermissions();
    }, []);

    const toggleGroup = (groupId: string) => {
        const next = new Set(collapsedGroups);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        setCollapsedGroups(next);
    };

    const togglePermission = (groupId: string, featureId: string, roleId: string) => {
        setGroups(prevGroups => prevGroups.map(group => {
            if (group.id !== groupId) return group;
            return {
                ...group,
                features: group.features.map(feature => {
                    if (feature.id !== featureId) return feature;
                    const current = feature.roles[roleId];
                    let next: PermissionLevel;
                    if (current === 'ALLOWED') next = 'READ_ONLY';
                    else if (current === 'READ_ONLY') next = 'DENIED';
                    else next = 'ALLOWED';

                    setIsDirty(true);
                    return {
                        ...feature,
                        roles: { ...feature.roles, [roleId]: next }
                    };
                })
            };
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            await actions.updateRolePermissions(groups);
            setIsDirty(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!resetPending) {
            setResetPending(true);
            setTimeout(() => setResetPending(false), 3000);
        } else {
            setGroups(INITIAL_PERMISSIONS);
            setIsDirty(false);
            setResetPending(false);
        }
    };

    return (
        <div className="space-y-6">
            {saveStatus === 'success' && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-bold">
                    <Check size={16} className="text-green-600" />
                    Permissions updated successfully.
                </div>
            )}
            {saveStatus === 'error' && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-bold">
                    <AlertCircle size={16} className="text-red-600" />
                    Failed to update permissions. Please try again.
                </div>
            )}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[24px] font-semibold text-black leading-tight">Role Permissions</h1>
                    <p className="text-[13px] text-gray-500">Define what each role can access and do within the platform</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleReset}
                        className={`text-[13px] font-bold flex items-center space-x-2 transition-all px-3 py-1.5 rounded-lg ${
                            resetPending
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'text-gray-400 hover:text-black'
                        }`}
                    >
                        <RotateCcw size={16} />
                        <span>{resetPending ? 'Confirm reset?' : 'Reset to defaults'}</span>
                    </button>
                    <button
                        disabled={!isDirty || isSaving}
                        onClick={handleSave}
                        className={`flex items-center space-x-2 px-8 py-2.5 rounded-lg text-[13px] font-bold transition-all shadow-lg ${isDirty && !isSaving
                            ? 'bg-black text-white shadow-black/10 hover:bg-gray-800'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <Save size={16} />
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black text-white text-[11px] font-bold uppercase tracking-widest">
                            <th className="px-8 py-5 w-1/3 min-w-[280px]">Feature / Permission</th>
                            {ROLES.map(role => (
                                <th key={role.id} className="px-4 py-5 text-center">{role.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((group) => (
                            <React.Fragment key={group.id}>
                                {/* Group Header */}
                                <tr
                                    className="bg-gray-50 border-b border-gray-100 cursor-pointer group"
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    <td colSpan={ROLES.length + 1} className="px-8 py-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="text-gray-400 transition-transform duration-200">
                                                {collapsedGroups.has(group.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                            </div>
                                            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{group.label}</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Group Features */}
                                {!collapsedGroups.has(group.id) && group.features.map((feature) => (
                                    <tr key={feature.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-12 py-4">
                                            <span className="text-[14px] font-medium text-gray-800">{feature.label}</span>
                                        </td>
                                        {ROLES.map(role => (
                                            <td
                                                key={role.id}
                                                className="px-4 py-4"
                                                onClick={() => togglePermission(group.id, feature.id, role.id)}
                                            >
                                                <div className="flex justify-center cursor-pointer">
                                                    <PermissionCell level={feature.roles[role.id]} />
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend & Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2 text-black mb-2">
                        <Info size={16} />
                        <h4 className="text-[12px] font-bold uppercase tracking-widest">Permission Legend</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center text-green-600">
                                <Check size={16} strokeWidth={3} />
                            </div>
                            <span className="text-[12px] text-gray-500 font-medium">Full Access</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center text-amber-500">
                                <Circle size={8} fill="currentColor" />
                            </div>
                            <span className="text-[12px] text-gray-500 font-medium">Read Only</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center text-gray-200">
                                <div className="w-4 h-px bg-gray-300" />
                            </div>
                            <span className="text-[12px] text-gray-500 font-medium">Denied</span>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex items-start space-x-4">
                    <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-bold text-amber-900 leading-none mb-1">Security Notice</h4>
                        <p className="text-[12px] text-amber-700 leading-relaxed">
                            Updating role permissions will propagate changes to all active users immediately.
                            Users might need to refresh their session to see updated interface components.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PermissionCell = ({ level }: { level: PermissionLevel }) => {
    switch (level) {
        case 'ALLOWED':
            return (
                <div className="w-9 h-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center transition-all hover:bg-green-100">
                    <Check size={18} strokeWidth={3} />
                </div>
            );
        case 'READ_ONLY':
            return (
                <div className="w-9 h-9 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center transition-all hover:bg-amber-100">
                    <Circle size={10} fill="currentColor" />
                </div>
            );
        case 'DENIED':
            return (
                <div className="w-9 h-9 bg-gray-50 text-gray-300 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100">
                    <div className="w-4 h-[2px] bg-gray-200 rounded-full" />
                </div>
            );
        default:
            return null;
    }
};

export default RolePermissions;
