'use client';

import React, { useState, useTransition } from 'react';
import {
    Bell, Mail, MessageSquare, Smartphone,
    Plus, ChevronDown,
    Edit2, Save, X, Info, Settings as SettingsIcon, AlertCircle,
    CheckCircle2, Filter, Search, Loader2
} from 'lucide-react';
import { NotificationRule, saveNotificationRules } from '@/app/admin/notifications/actions';

const TEMPLATES = [
    { id: 't1', name: 'Flag Notification', subject: 'Urgent: New High-Priority Flag', lastEdited: '2 days ago' },
    { id: 't2', name: 'Password Reset', subject: 'Secure Your Account', lastEdited: '1 week ago' },
    { id: 't3', name: 'Weekly Summary', subject: 'Performance Report: {district_name}', lastEdited: '3 days ago' },
    { id: 't4', name: 'User Onboarding', subject: 'Welcome to Jiveesha ECD Platform', lastEdited: '1 month ago' },
];

interface Props {
    initialRules: NotificationRule[];
}

const NotificationManager: React.FC<Props> = ({ initialRules }) => {
    const [rules, setRules] = useState<NotificationRule[]>(initialRules);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const toggleRule = (id: string) => {
        const next = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
        setRules(next);
        setSaveStatus('idle');
        startTransition(async () => {
            try {
                await saveNotificationRules(next);
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } catch {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        });
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'push': return <Smartphone size={14} />;
            case 'email': return <Mail size={14} />;
            case 'sms': return <MessageSquare size={14} />;
            case 'in-app': return <Bell size={14} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-[900px] mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[24px] font-semibold text-black leading-tight">Notification Manager</h1>
                    <p className="text-[13px] text-gray-500">Configure system-wide notification rules</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded text-[13px] font-bold hover:bg-gray-50 text-gray-700 transition-all">
                        <SettingsIcon size={16} />
                        <span>Global Settings</span>
                    </button>
                </div>
            </div>

            {/* Save status */}
            {saveStatus === 'success' && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-[13px] font-bold">
                    <CheckCircle2 size={16} className="text-green-600" /> Rule saved successfully.
                </div>
            )}
            {saveStatus === 'error' && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[13px] font-bold">
                    <AlertCircle size={16} className="text-red-600" /> Failed to save rule. Please try again.
                </div>
            )}

            {/* ACTIVE RULES TABLE */}
            <section className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">Active Rules</h3>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Filter rules..." className="h-8 pl-8 pr-4 bg-gray-50 border-none rounded text-[11px] outline-none w-48" />
                        </div>
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400"><Filter size={16} /></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Event Trigger</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipients</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Channels</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Enabled</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <span className="text-[13px] font-bold text-black group-hover:underline">{rule.event}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[12px] text-gray-500 font-medium">{rule.recipients}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-1.5">
                                            {rule.channels.map(ch => (
                                                <div key={ch} className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-all shadow-sm border border-transparent hover:border-black" title={ch}>
                                                    {getChannelIcon(ch)}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {isPending && <Loader2 size={12} className="animate-spin text-gray-400" />}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleRule(rule.id); }}
                                                disabled={isPending}
                                                className={`w-10 h-6 rounded-full relative transition-colors disabled:opacity-60 ${rule.enabled ? 'bg-black' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${rule.enabled ? 'left-5' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CREATE CUSTOM RULE */}
                <section className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-8 space-y-6">
                    <div className="flex items-center space-x-2">
                        <Plus size={18} className="text-gray-400" />
                        <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">Create Custom Rule</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Event Trigger</label>
                            <div className="relative">
                                <select className="w-full h-11 pl-4 pr-10 bg-gray-50 border-none rounded-xl text-[13px] font-bold text-black outline-none appearance-none">
                                    <option>Select an event...</option>
                                    <option>New User Account</option>
                                    <option>Child Flag Raised</option>
                                    <option>CDPO Escalation</option>
                                    <option>Threshold Reached</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Condition (Optional)</label>
                            <div className="flex space-x-2">
                                <input type="text" placeholder="Threshold value..." className="flex-1 h-11 px-4 bg-gray-50 border-none rounded-xl text-[13px] outline-none" />
                                <div className="relative w-32">
                                    <select className="w-full h-11 pl-3 pr-8 bg-gray-50 border-none rounded-xl text-[11px] font-bold text-black outline-none appearance-none">
                                        <option>% below</option>
                                        <option>days old</option>
                                        <option>count &gt;</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Recipients</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="h-10 border border-gray-200 rounded-lg text-[12px] font-bold hover:bg-black hover:text-white transition-all">By Role</button>
                                <button className="h-10 border border-gray-200 rounded-lg text-[12px] font-bold hover:bg-black hover:text-white transition-all">Specific Users</button>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Channels</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Push', 'Email', 'SMS', 'In-App'].map(ch => (
                                    <div key={ch} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-transparent hover:border-black transition-all cursor-pointer">
                                        <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center bg-white group-hover:border-black">
                                            {ch === 'In-App' && <div className="w-3 h-3 bg-black rounded-sm" />}
                                        </div>
                                        <span className="text-[13px] font-medium">{ch}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="w-full py-4 bg-black text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-black/10">
                            <Plus size={18} />
                            <span>Create Rule</span>
                        </button>
                    </div>
                </section>

                {/* MESSAGE TEMPLATES */}
                <section className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-8 space-y-6">
                    <div className="flex items-center space-x-2">
                        <Mail size={18} className="text-gray-400" />
                        <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">Message Templates</h3>
                    </div>
                    <div className="space-y-3">
                        {TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={`w-full p-4 rounded-xl border text-left transition-all hover:shadow-md ${selectedTemplate === t.id ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[13px] font-bold text-black">{t.name}</p>
                                        <p className="text-[11px] text-gray-400 mt-1 truncate max-w-[280px]">Subject: {t.subject}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t.lastEdited}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start space-x-3">
                            <Info size={18} className="text-blue-600 mt-0.5" />
                            <p className="text-[12px] text-blue-800 leading-relaxed">
                                Templates support dynamic merge tags like <code className="bg-blue-100 px-1 rounded font-bold">{"{user_name}"}</code> and <code className="bg-blue-100 px-1 rounded font-bold">{"{child_id}"}</code>.
                            </p>
                        </div>
                    </div>

                    {selectedTemplate && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <button className="w-full h-12 bg-black text-white rounded-xl font-bold text-[13px] flex items-center justify-center space-x-2 shadow-lg shadow-black/10">
                                <Edit2 size={16} />
                                <span>Edit Selected Template</span>
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {/* TEMPLATE EDITOR (VISIBLE WHEN EDITING) - Simplified Preview */}
            {selectedTemplate && (
                <section className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Edit2 size={20} className="text-black" />
                            <h3 className="text-[16px] font-bold text-black">Edit Template: Flag Notification</h3>
                        </div>
                        <button onClick={() => setSelectedTemplate(null)} className="text-gray-400 hover:text-black"><X size={24} /></button>
                    </div>
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Subject Line</label>
                                <input
                                    type="text"
                                    defaultValue="Urgent: New High-Priority Flag for {child_name}"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Message Body</label>
                                <textarea
                                    rows={8}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium text-[14px]"
                                    defaultValue={`Hello {user_name},\n\nA new high-priority flag has been raised for {child_name} ({child_id}) in {awc_name}.\n\nPlease review the assessment immediately.\n\nPriority: {flag_priority}\nCategory: {flag_category}\n\nRegards,\nJiveesha System`}
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button className="flex-1 py-4 bg-gray-100 text-black rounded-xl font-bold text-[14px] hover:bg-gray-200 transition-all">Preview Sample</button>
                                <button className="flex-1 py-4 bg-black text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-all flex items-center justify-center space-x-2">
                                    <Save size={18} />
                                    <span>Save Template</span>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-6 bg-gray-50 p-8 rounded-2xl border border-gray-100 flex flex-col h-full">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Live Preview (Rendered)</h4>
                            <div className="bg-white rounded-xl shadow-lg p-6 flex-1 space-y-4 border border-gray-200">
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="text-[12px] text-gray-400 font-medium">To: <span className="text-black font-bold">Lakshmi Devi</span></p>
                                    <p className="text-[13px] font-bold text-black mt-1">Urgent: New High-Priority Flag for Rahul Kumar</p>
                                </div>
                                <div className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    Hello Lakshmi Devi,
                                    {"\n\n"}
                                    A new high-priority flag has been raised for Rahul Kumar (ID-10293) in Rampur AWC.
                                    {"\n\n"}
                                    Please review the assessment immediately.
                                    {"\n\n"}
                                    Priority: <span className="text-red-600 font-bold uppercase">Urgent</span>
                                    {"\n"}
                                    Category: Growth Deviation
                                    {"\n\n"}
                                    Regards,
                                    {"\n"}
                                    Jiveesha System
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-400">
                                <CheckCircle2 size={14} className="text-green-500" />
                                <span className="text-[11px] font-medium italic">Content matches formatting standards</span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* FOOTER ADVISORY */}
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-start space-x-3">
                <AlertCircle size={18} className="text-gray-400 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                    System notifications are throttled to prevent spamming. High-priority flags bypass these limits to ensure rapid intervention. Every notification is tracked in the communication audit log.
                </p>
            </div>
        </div>
    );
};

export default NotificationManager;
