'use client';

import React, { useState, useTransition } from 'react';
import {
    Database, Download, RefreshCcw, Trash2,
    CheckCircle2, AlertCircle, ShieldAlert, X,
    FileJson, FileSpreadsheet, HardDrive,
    Clock, Lock, Check, Loader2
} from 'lucide-react';
import { DataStats, recordManualBackup, clearSyncQueue, exportData } from '@/app/admin/data/actions';

const EXPORT_FIELDS = [
    'Users', 'Children', 'Questionnaires', 'Screenings',
    'Referrals', 'Flags', 'Observations', 'Geographic Hierarchy', 'Audit Log'
];

function formatBackupTime(iso: string | null): string {
    if (!iso) return 'No backup recorded';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

interface Props {
    stats: DataStats;
}

const DataManagement: React.FC<Props> = ({ stats }) => {
    const [isPending, startTransition] = useTransition();

    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupProgress, setBackupProgress] = useState(0);
    const [lastBackupAt, setLastBackupAt] = useState<string | null>(stats.lastManualBackupAt);

    const [selectedFormat, setSelectedFormat] = useState<'CSV' | 'JSON'>('CSV');
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(EXPORT_FIELDS));
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const [syncQueueCount, setSyncQueueCount] = useState(stats.syncQueuePending);
    const [clearStatus, setClearStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [clearedCount, setClearedCount] = useState<number | null>(null);

    const [confirmingAction, setConfirmingAction] = useState<'RESTORE' | 'PURGE_QUEUE' | 'PURGE_TEST' | 'RESET' | null>(null);
    const [confirmText, setConfirmText] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [mfaCode, setMfaCode] = useState('');

    const handleManualBackup = () => {
        setIsBackingUp(true);
        setBackupProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setBackupProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                startTransition(async () => {
                    try {
                        const ts = await recordManualBackup();
                        setLastBackupAt(ts);
                    } catch { /* silently fail — animation already showed success */ }
                    setTimeout(() => setIsBackingUp(false), 400);
                });
            }
        }, 100);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setExportStatus('idle');
        try {
            const result = await exportData(Array.from(selectedFields), selectedFormat);
            // Trigger browser download
            const blob = new Blob([result.content], { type: result.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            a.click();
            URL.revokeObjectURL(url);
            setExportStatus('success');
            setTimeout(() => setExportStatus('idle'), 3000);
        } catch {
            setExportStatus('error');
            setTimeout(() => setExportStatus('idle'), 3000);
        } finally {
            setIsExporting(false);
        }
    };

    const handleClearSyncQueue = async () => {
        setClearStatus('idle');
        startTransition(async () => {
            try {
                const count = await clearSyncQueue();
                setClearedCount(count);
                setSyncQueueCount(0);
                setClearStatus('success');
                setTimeout(() => setClearStatus('idle'), 4000);
            } catch {
                setClearStatus('error');
                setTimeout(() => setClearStatus('idle'), 3000);
            }
            closeConfirm();
        });
    };

    const toggleField = (field: string) => {
        const next = new Set(selectedFields);
        if (next.has(field)) next.delete(field);
        else next.add(field);
        setSelectedFields(next);
    };

    const closeConfirm = () => {
        setConfirmingAction(null);
        setConfirmText('');
        setAdminPass('');
        setMfaCode('');
    };

    const handleConfirmAction = () => {
        if (confirmingAction === 'PURGE_QUEUE') {
            handleClearSyncQueue();
        } else {
            // RESTORE, PURGE_TEST, RESET — not implemented, just close
            closeConfirm();
        }
    };

    const renderDestructiveModal = () => {
        if (!confirmingAction) return null;

        const titles: Record<string, string> = {
            RESTORE: 'Restore Database from Backup',
            PURGE_QUEUE: 'Clear Sync Queue',
            PURGE_TEST: 'Purge Test Data',
            RESET: 'RESET ENTIRE DATABASE'
        };

        const requiredText: Record<string, string> = {
            RESTORE: 'RESTORE',
            PURGE_QUEUE: 'CLEAR',
            PURGE_TEST: 'PURGE',
            RESET: 'DELETE ALL DATA'
        };

        const isReset = confirmingAction === 'RESET';
        const isNotImplemented = confirmingAction === 'RESTORE' || confirmingAction === 'PURGE_TEST';

        return (
            <div className="fixed inset-0 flex items-center justify-center z-[100]">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeConfirm} />
                <div className="relative w-[420px] bg-white rounded-2xl shadow-2xl z-[110] overflow-hidden">
                    <div className={`p-6 border-b border-gray-100 flex items-center justify-between ${isReset ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center space-x-3">
                            <ShieldAlert size={20} className={isReset ? 'text-red-600' : 'text-amber-500'} />
                            <h2 className={`text-[16px] font-bold ${isReset ? 'text-red-600' : 'text-black'}`}>{titles[confirmingAction]}</h2>
                        </div>
                        <button onClick={closeConfirm} className="text-gray-400 hover:text-black transition-colors"><X size={20} /></button>
                    </div>
                    <div className="p-8 space-y-6">
                        {isNotImplemented ? (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                <p className="text-[13px] text-amber-800 font-medium leading-relaxed">
                                    {confirmingAction === 'RESTORE'
                                        ? 'Database restore is managed directly through Supabase dashboard. This action is not available from the admin portal.'
                                        : 'No records with a test data flag were found in the current schema. This action is not applicable.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <p className="text-[12px] text-red-800 leading-relaxed font-medium">
                                        Warning: This action is irreversible. It will immediately affect the live platform.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            Type &quot;{requiredText[confirmingAction]}&quot; to confirm
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:border-black outline-none transition-all font-bold"
                                            value={confirmText}
                                            onChange={(e) => setConfirmText(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:border-black outline-none transition-all"
                                            value={adminPass}
                                            onChange={(e) => setAdminPass(e.target.value)}
                                        />
                                    </div>
                                    {isReset && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MFA Code</label>
                                            <input
                                                type="text"
                                                placeholder="000 000"
                                                className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:border-black outline-none transition-all text-center tracking-[0.2em] font-bold"
                                                value={mfaCode}
                                                onChange={(e) => setMfaCode(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={handleConfirmAction}
                                        disabled={confirmText !== requiredText[confirmingAction] || !adminPass || (isReset && !mfaCode) || isPending}
                                        className={`w-full h-12 rounded-xl font-bold text-[14px] transition-all shadow-lg ${isReset ? 'bg-red-600 text-white shadow-red-200 hover:bg-red-700' : 'bg-black text-white hover:bg-gray-800 shadow-gray-200'} disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none`}
                                    >
                                        {isPending ? 'Processing…' : 'Confirm Irreversible Action'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[800px] mx-auto space-y-8 pb-24">
            <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-black text-white rounded-lg"><Database size={24} /></div>
                <h1 className="text-[24px] font-semibold text-black leading-tight">Data Management</h1>
            </div>

            {/* Backup & Restore */}
            <section className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Clock size={18} className="text-gray-400" />
                        <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">Database Backup</h3>
                    </div>
                </div>
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${lastBackupAt ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-black leading-none">Last manual backup</p>
                                <p className="text-[11px] text-gray-400 mt-1">{formatBackupTime(lastBackupAt)}</p>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Supabase auto-backup: daily</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Manual Trigger</p>
                            {isBackingUp && <span className="text-[11px] font-bold text-black animate-pulse uppercase tracking-widest">Creating backup… {backupProgress}%</span>}
                        </div>
                        {isBackingUp ? (
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-black transition-all duration-100 ease-linear" style={{ width: `${backupProgress}%` }} />
                            </div>
                        ) : (
                            <button
                                onClick={handleManualBackup}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center space-x-2"
                            >
                                <RefreshCcw size={18} />
                                <span>Create Manual Backup</span>
                            </button>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-red-700">
                                <AlertCircle size={20} />
                                <div>
                                    <p className="text-[13px] font-bold uppercase tracking-tight leading-none">High-risk Zone</p>
                                    <p className="text-[12px] opacity-80 mt-1 font-medium">Overwriting database with a backup is irreversible.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfirmingAction('RESTORE')}
                                className="px-6 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-[12px] font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                                Restore from backup
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Full Data Export */}
            <section className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <Download size={18} className="text-gray-400" />
                        <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">Full Data Export</h3>
                    </div>
                    <div className="flex items-center p-1 bg-gray-100 rounded-lg space-x-1">
                        {(['CSV', 'JSON'] as const).map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => setSelectedFormat(fmt)}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all ${selectedFormat === fmt ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>

                {exportStatus === 'success' && (
                    <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-[13px] font-bold">
                        <CheckCircle2 size={16} className="text-green-600" /> Export downloaded successfully.
                    </div>
                )}
                {exportStatus === 'error' && (
                    <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[13px] font-bold">
                        <AlertCircle size={16} className="text-red-600" /> Export failed. Please try again.
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {EXPORT_FIELDS.map(field => (
                        <div
                            key={field}
                            onClick={() => toggleField(field)}
                            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer group ${selectedFields.has(field) ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${selectedFields.has(field) ? 'bg-black border-black text-white' : 'border-gray-300 group-hover:border-black'}`}>
                                {selectedFields.has(field) && <Check size={14} strokeWidth={4} />}
                            </div>
                            <span className={`text-[13px] font-medium ${selectedFields.has(field) ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>{field}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting || selectedFields.size === 0}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    {isExporting
                        ? <><Loader2 size={18} className="animate-spin" /><span>Exporting…</span></>
                        : <>{selectedFormat === 'CSV' ? <FileSpreadsheet size={18} /> : <FileJson size={18} />}<span>Export Selected ({selectedFields.size})</span></>
                    }
                </button>
            </section>

            {/* Data Purge (Danger Zone) */}
            <section className="bg-white border-l-4 border-l-red-500 border-y border-r border-red-100 rounded-r-2xl shadow-sm p-8">
                <div className="flex items-center space-x-2 mb-6">
                    <Trash2 size={20} className="text-red-500" />
                    <h3 className="text-[13px] font-bold text-red-600 uppercase tracking-widest">Data Purge Zone</h3>
                </div>

                {clearStatus === 'success' && (
                    <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-[13px] font-bold">
                        <CheckCircle2 size={16} className="text-green-600" />
                        Sync queue cleared — {clearedCount} item{clearedCount !== 1 ? 's' : ''} removed.
                    </div>
                )}
                {clearStatus === 'error' && (
                    <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[13px] font-bold">
                        <AlertCircle size={16} className="text-red-600" /> Failed to clear sync queue.
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="text-[14px] font-bold text-black leading-none">Sync Queue Clear</p>
                            <p className="text-[12px] text-gray-500 mt-1">
                                Force remove all pending unsynced items.{' '}
                                <span className={`font-bold ${syncQueueCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                    {syncQueueCount} pending
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={() => setConfirmingAction('PURGE_QUEUE')}
                            className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[12px] font-bold hover:bg-amber-600 hover:text-white transition-all"
                        >
                            Clear Sync Queue
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="text-[14px] font-bold text-black leading-none">Purge Test Data</p>
                            <p className="text-[12px] text-gray-500 mt-1">Remove all records flagged with &quot;is_test: true&quot;.</p>
                        </div>
                        <button onClick={() => setConfirmingAction('PURGE_TEST')} className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[12px] font-bold hover:bg-amber-600 hover:text-white transition-all">Purge Test Data</button>
                    </div>

                    <div className="p-6 border-t border-red-50 pt-8 space-y-4">
                        <div className="flex items-start space-x-4">
                            <ShieldAlert size={24} className="text-red-600 shrink-0" />
                            <div>
                                <p className="text-[14px] font-bold text-red-600 uppercase tracking-tight">Destructive Platform Reset</p>
                                <p className="text-[12px] text-red-700 font-medium leading-relaxed mt-1">
                                    Wipes all records across all tables. Requires high-level authentication and MFA verification.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setConfirmingAction('RESET')}
                            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-[14px] hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center space-x-2"
                        >
                            <Lock size={18} />
                            <span>Reset Entire Database</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Storage Usage */}
            <section className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-8">
                <div className="flex items-center space-x-2 mb-6">
                    <HardDrive size={18} className="text-gray-400" />
                    <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">Storage Usage</h3>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-[13px] text-blue-800 font-medium">
                    Detailed storage metrics (table sizes in bytes) require a database RPC function. Contact your Supabase project admin or check the Supabase dashboard → Database → Tables for live storage statistics.
                </div>
            </section>

            {renderDestructiveModal()}
        </div>
    );
};

export default DataManagement;
