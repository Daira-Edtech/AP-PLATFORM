'use client'

import React, { useState, useEffect, useMemo } from 'react';
import * as actions from '@/app/admin/users/actions';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import * as geoActions from '@/app/admin/geography/actions';

// Icons as SVG components to avoid lucide-react dependency
const Icons = {
    UploadCloud: () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
    FileText: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    CheckCircle2: ({ size = 18, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    AlertTriangle: ({ size = 18, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    XCircle: ({ size = 18, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Loader2: ({ size = 24, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.929 4.929l2.828 2.828m8.486 8.486l2.828 2.828M2 12h4m12 0h4M4.929 19.071l2.828-2.828m8.486-8.486l2.828-2.828" /></svg>,
    Download: ({ size = 20, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    Trash2: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    X: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    ChevronRight: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
    ArrowRight: ({ size = 16 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
    UserCheck: ({ size = 16 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    RefreshCcw: ({ size = 14 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    ShieldX: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM21 21l-6-6m6 0l-6 6" /></svg>,
    Key: ({ size = 18 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    Search: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    ChevronDown: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    Check: ({ size = 14, strokeWidth = 2 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M5 13l4 4L19 7" /></svg>
};

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-500',
    INACTIVE: 'bg-gray-400',
    LOCKED: 'bg-red-500',
    PENDING: 'bg-amber-500'
};

type BulkOpsTab = 'IMPORT_USERS' | 'BULK_ASSIGN' | 'BULK_ACTIONS';
type ImportStep = 'UPLOAD' | 'VALIDATION' | 'PROCESSING' | 'RESULTS';

interface BulkOpsProps {
    users: any[];
    states: any[];
}

const BulkOps: React.FC<BulkOpsProps> = ({ users: initialUsers, states }) => {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as BulkOpsTab | null;

    const [activeTab, setActiveTab] = useState<BulkOpsTab>(tabParam || 'IMPORT_USERS');
    const [actionLoading, setActionLoading] = useState(false);

    // Import Users State
    const [importStep, setImportStep] = useState<ImportStep>('UPLOAD');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [importLogs, setImportLogs] = useState<string[]>([]);
    const [validationRows, setValidationRows] = useState<any[]>([]);
    const [importResults, setImportResults] = useState<{ success: number, failed: number, errors: any[] } | null>(null);

    // Bulk Assign State
    const [selectedAssignUserIds, setSelectedAssignUserIds] = useState<Set<string>>(new Set());
    const [assignTarget, setAssignTarget] = useState({
        state: '',
        district: '',
        mandal: '',
        sector: '',
        panchayat: '',
        awc: ''
    });

    const [districts, setDistricts] = useState<any[]>([]);
    const [mandals, setMandals] = useState<any[]>([]);
    const [sectors, setSectors] = useState<any[]>([]);
    const [panchayats, setPanchayats] = useState<any[]>([]);
    const [awcs, setAwcs] = useState<any[]>([]);

    // Bulk Actions State
    const [bulkActionTargetIds, setBulkActionTargetIds] = useState<Set<string>>(new Set());
    const [selectedAction, setSelectedAction] = useState('');

    // Toast + confirm state
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [assignConfirmPending, setAssignConfirmPending] = useState(false);
    const [bulkActionConfirmPending, setBulkActionConfirmPending] = useState(false);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const supabase = createClient();

    // Cascading Fetchers
    useEffect(() => {
        if (assignTarget.state) {
            geoActions.getEntitiesByParent('STATE', assignTarget.state)
                .then(setDistricts);
            setAssignTarget(prev => ({ ...prev, district: '', mandal: '', sector: '', panchayat: '', awc: '' }));
        } else {
            setDistricts([]);
            setAssignTarget(prev => ({ ...prev, district: '', mandal: '', sector: '', panchayat: '', awc: '' }));
        }
    }, [assignTarget.state]);

    useEffect(() => {
        if (assignTarget.district) {
            geoActions.getEntitiesByParent('DISTRICT', assignTarget.district)
                .then(setMandals);
            setAssignTarget(prev => ({ ...prev, mandal: '', sector: '', panchayat: '', awc: '' }));
        } else {
            setMandals([]);
            setAssignTarget(prev => ({ ...prev, mandal: '', sector: '', panchayat: '', awc: '' }));
        }
    }, [assignTarget.district]);

    useEffect(() => {
        if (assignTarget.mandal) {
            geoActions.getEntitiesByParent('MANDAL', assignTarget.mandal)
                .then(setSectors);
            setAssignTarget(prev => ({ ...prev, sector: '', panchayat: '', awc: '' }));
        } else {
            setSectors([]);
            setAssignTarget(prev => ({ ...prev, sector: '', panchayat: '', awc: '' }));
        }
    }, [assignTarget.mandal]);

    useEffect(() => {
        if (assignTarget.sector) {
            geoActions.getEntitiesByParent('SECTOR', assignTarget.sector)
                .then(setPanchayats);
            setAssignTarget(prev => ({ ...prev, panchayat: '', awc: '' }));
        } else {
            setPanchayats([]);
            setAssignTarget(prev => ({ ...prev, panchayat: '', awc: '' }));
        }
    }, [assignTarget.sector]);

    useEffect(() => {
        if (assignTarget.panchayat) {
            geoActions.getEntitiesByParent('PANCHAYAT', assignTarget.panchayat)
                .then(setAwcs);
            setAssignTarget(prev => ({ ...prev, awc: '' }));
        } else if (assignTarget.sector) {
            geoActions.getAwcsBySector(assignTarget.sector)
                .then(setAwcs);
            setAssignTarget(prev => ({ ...prev, awc: '' }));
        } else {
            setAwcs([]);
            setAssignTarget(prev => ({ ...prev, awc: '' }));
        }
    }, [assignTarget.panchayat, assignTarget.sector]);


    const handleFileUpload = (file: File) => {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').filter(r => r.trim());
            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

            const parsed = rows.slice(1).map((row, idx) => {
                const values = row.split(',').map(v => v.trim());
                const obj: any = {};
                headers.forEach((h, i) => obj[h] = values[i]);

                // Validation
                const errors = [];
                if (!obj.name) errors.push('Missing Name');
                if (!obj.email) errors.push('Missing Email');
                if (!obj.role) errors.push('Missing Role');

                return {
                    row: idx + 2,
                    ...obj,
                    status: errors.length > 0 ? 'ERROR' : 'VALID',
                    message: errors.join(', ')
                };
            });
            setValidationRows(parsed);
        };
        reader.readAsText(file);
    };

    const startImport = async () => {
        setImportStep('PROCESSING');
        setProcessingProgress(0);
        setImportLogs(['Initializing connection...', 'Preparing user data...']);

        const validUsers = validationRows.filter(r => r.status === 'VALID');

        try {
            const response = await fetch('/api/admin/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: validUsers })
            });
            const data = await response.json();

            if (data.results) {
                setImportResults(data.results);
                setImportStep('RESULTS');
            } else {
                throw new Error(data.error || 'Import failed');
            }
        } catch (err: any) {
            showToast('error', err.message);
            setImportStep('UPLOAD');
        }
    };

    const handleBulkAssign = async () => {
        if (selectedAssignUserIds.size === 0) return;
        if (!assignConfirmPending) {
            setAssignConfirmPending(true);
            setTimeout(() => setAssignConfirmPending(false), 3000);
            return;
        }
        setAssignConfirmPending(false);
        setActionLoading(true);
        try {
            await actions.bulkReassign(Array.from(selectedAssignUserIds), {
                state_id: assignTarget.state || null,
                district_id: assignTarget.district || null,
                mandal_id: assignTarget.mandal || null,
                sector_id: assignTarget.sector || null,
                panchayat_id: assignTarget.panchayat || null,
                awc_id: assignTarget.awc || null
            });
            showToast('success', `${selectedAssignUserIds.size} user(s) reassigned successfully`);
            setSelectedAssignUserIds(new Set());
        } catch (err: any) {
            showToast('error', 'Error: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkAction = async () => {
        if (bulkActionTargetIds.size === 0 || !selectedAction) return;
        if (!bulkActionConfirmPending) {
            setBulkActionConfirmPending(true);
            setTimeout(() => setBulkActionConfirmPending(false), 3000);
            return;
        }
        setBulkActionConfirmPending(false);
        setActionLoading(true);
        try {
            switch (selectedAction) {
                case 'Enable Accounts':
                    await actions.bulkUpdateStatus(Array.from(bulkActionTargetIds), true);
                    break;
                case 'Disable Accounts':
                    await actions.bulkUpdateStatus(Array.from(bulkActionTargetIds), false);
                    break;
                case 'Delete Accounts':
                    await actions.bulkDeleteUsers(Array.from(bulkActionTargetIds));
                    break;
                default:
                    showToast('error', `Action "${selectedAction}" is not implemented yet`);
                    setActionLoading(false);
                    return;
            }
            showToast('success', `"${selectedAction}" applied to ${bulkActionTargetIds.size} user(s)`);
            setBulkActionTargetIds(new Set());
        } catch (err: any) {
            showToast('error', 'Error: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const renderImportUsers = () => {
        switch (importStep) {
            case 'UPLOAD':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-8 rounded-xl border border-[#E5E5E5] shadow-sm">
                            <h3 className="text-[14px] font-bold text-black uppercase tracking-widest mb-6">Import Users from CSV</h3>
                            <div
                                className="w-full h-[180px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center hover:border-black hover:bg-gray-50 transition-all cursor-pointer group"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.csv';
                                    input.onchange = (e: any) => handleFileUpload(e.target.files[0]);
                                    input.click();
                                }}
                            >
                                <Icons.UploadCloud />
                                <p className="text-[14px] text-gray-500 font-medium mt-3">
                                    {selectedFile ? selectedFile.name : 'Drag & drop CSV file or click to browse'}
                                </p>
                                {selectedFile && <p className="text-[12px] text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>}
                            </div>

                            <div className="mt-6 flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        const headers = 'name,email,password,phone,role,state_id,district_id,mandal_id,sector_id,panchayat_id,awc_id\n';
                                        const blob = new Blob([headers], { type: 'text/csv' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'jiveesha_user_template.csv';
                                        a.click();
                                    }}
                                    className="text-[13px] text-black font-semibold underline flex items-center hover:text-gray-600 transition-colors"
                                >
                                    <Icons.FileText />
                                    <span className="ml-2">Download template CSV</span>
                                </button>
                                <button
                                    disabled={!selectedFile}
                                    onClick={() => setImportStep('VALIDATION')}
                                    className="px-8 py-3 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 disabled:bg-gray-200 transition-all"
                                >
                                    Upload & Validate
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-start space-x-3">
                            <Icons.AlertTriangle className="text-amber-500 mt-0.5" />
                            <div className="text-[12px] text-gray-600">
                                <p className="font-bold text-black mb-1 uppercase tracking-tight">Required CSV Headers</p>
                                <p>name, email, password, phone, role, state_id, district_id, mandal_id, sector_id, panchayat_id, awc_id</p>
                            </div>
                        </div>
                    </div>

                );
            case 'VALIDATION':
                const stats = {
                    total: validationRows.length,
                    valid: validationRows.filter(r => r.status === 'VALID').length,
                    errors: validationRows.filter(r => r.status === 'ERROR').length,
                };
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-[14px] font-bold text-black uppercase tracking-widest">Validation Results</h3>
                                <div className="flex items-center space-x-3">
                                    <Badge label={`Total: ${stats.total}`} color="bg-gray-100 text-gray-600" />
                                    <Badge label={`Valid: ${stats.valid}`} color="bg-green-100 text-green-700" />
                                    <Badge label={`Errors: ${stats.errors}`} color="bg-red-100 text-red-700" />
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                            <th className="px-6 py-4 w-12">Row</th>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {validationRows.map((row) => (
                                            <tr key={row.row} className={`text-[13px] ${row.status === 'ERROR' ? 'bg-red-50/50' : ''}`}>
                                                <td className="px-6 py-4 font-bold text-gray-400">{row.row}</td>
                                                <td className="px-6 py-4 font-semibold text-black">{row.name || <span className="text-red-500 italic">Empty</span>}</td>
                                                <td className="px-6 py-4 text-gray-600">{row.email || <span className="text-red-500 italic">Empty</span>}</td>
                                                <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-bold uppercase">{row.role || 'AWW'}</span></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        {row.status === 'VALID' ? <Icons.CheckCircle2 size={14} className="text-green-500" /> : <Icons.XCircle size={14} className="text-red-500" />}
                                                        <span className={`text-[11px] font-bold uppercase ${row.status === 'VALID' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {row.status}
                                                            {row.message && <span className="block text-[9px] lowercase font-normal opacity-70 tracking-tight">{row.message}</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-6 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                                <button className="text-[13px] text-blue-600 font-bold hover:underline" onClick={() => {
                                    const csvRows = validationRows.filter(r => r.status === 'ERROR').map(r => `${r.row},${r.email},${r.message}`).join('\n');
                                    const blob = new Blob([`Row,Email,Error\n${csvRows}`], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a'); a.href = url; a.download = 'errors.csv'; a.click();
                                }}>Download error report</button>
                                <div className="flex space-x-3">
                                    <button onClick={() => setImportStep('UPLOAD')} className="px-6 py-2.5 bg-white border border-gray-200 text-black rounded-lg text-[13px] font-bold hover:bg-gray-50">Fix & Re-upload</button>
                                    <button onClick={startImport} disabled={stats.valid === 0} className="px-8 py-2.5 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 disabled:opacity-50">Import Valid Only ({stats.valid})</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'PROCESSING':
                return (
                    <div className="max-w-[600px] mx-auto space-y-8 animate-in zoom-in duration-300">
                        <div className="bg-white p-8 rounded-xl border border-[#E5E5E5] shadow-sm text-center">
                            <Icons.Loader2 size={48} className="text-black mx-auto mb-6" />
                            <h3 className="text-[18px] font-bold text-black mb-2">Processing Import</h3>
                            <p className="text-[14px] text-gray-500 mb-8">Creating user accounts and setting up profiles in Supabase...</p>
                            <div className="animate-pulse flex items-center justify-center space-x-2 text-blue-600 font-bold text-sm tracking-widest">
                                <span>SYNCING DATABASE</span>
                                <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'RESULTS':
                return (
                    <div className="max-w-[500px] mx-auto bg-white p-8 rounded-xl border border-gray-100 shadow-xl animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className={`w-16 h-16 ${importResults?.failed === 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'} rounded-full flex items-center justify-center`}>
                                <Icons.CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-black">Import Process Finished</h2>
                                <p className="text-gray-500 text-sm mt-1">{importResults?.success} users created successfully. {importResults?.failed} failures.</p>
                            </div>

                            {importResults?.errors && importResults.errors.length > 0 && (
                                <div className="w-full bg-red-50 p-4 rounded-lg border border-red-100 text-left max-h-[200px] overflow-y-auto">
                                    <p className="text-[10px] font-bold text-red-400 uppercase mb-2">Error Log</p>
                                    {importResults.errors.map((e, i) => (
                                        <p key={i} className="text-[11px] text-red-600 mb-1 font-medium italic">
                                            • {e.email}: {e.error}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <div className="flex w-full space-x-3 pt-4">
                                <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-black text-white text-[13px] font-bold rounded-lg hover:bg-gray-900 transition-colors">Done</button>
                                <button onClick={() => setImportStep('UPLOAD')} className="flex-1 py-3 bg-gray-100 text-black text-[13px] font-bold rounded-lg hover:bg-gray-200 transition-colors tracking-tight uppercase">Import More</button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    const renderBulkAssign = () => {
        const unassignedUsers = initialUsers.filter(u => !u.awc_id || !u.panchayat_id || !u.sector_id || !u.mandal_id || !u.district_id || !u.state_id);
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h3 className="text-[14px] font-bold text-black uppercase tracking-widest">Unassigned Users</h3>
                            <div className="px-3 py-1 bg-red-50 text-red-700 text-[11px] font-bold rounded-full uppercase">{unassignedUsers.length} Pending</div>
                        </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-4 w-12"><Checkbox checked={selectedAssignUserIds.size === unassignedUsers.length && unassignedUsers.length > 0} onChange={() => {
                                        if (selectedAssignUserIds.size === unassignedUsers.length) setSelectedAssignUserIds(new Set());
                                        else setSelectedAssignUserIds(new Set(unassignedUsers.map(u => u.id)));
                                    }} /></th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {unassignedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4"><Checkbox checked={selectedAssignUserIds.has(user.id)} onChange={() => {
                                            const next = new Set(selectedAssignUserIds);
                                            if (next.has(user.id)) next.delete(user.id);
                                            else next.add(user.id);
                                            setSelectedAssignUserIds(next);
                                        }} /></td>
                                        <td className="px-6 py-4 font-semibold text-black text-[13px]">{user.name}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-gray-600 uppercase">{user.role}</span></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-[11px] font-medium text-gray-500 uppercase">{user.is_active ? 'ACTIVE' : 'LOCKED'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {unassignedUsers.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-medium italic">No unassigned users found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm space-y-6">
                    <h3 className="text-[14px] font-bold text-black uppercase tracking-widest">Assign Selected to Hierarchy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <select
                            value={assignTarget.state}
                            onChange={(e) => setAssignTarget({ ...assignTarget, state: e.target.value })}
                            className="h-11 px-4 bg-gray-50 border-none rounded-lg text-[13px] font-medium outline-none"
                        >
                            <option value="">Select State</option>
                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                            value={assignTarget.district}
                            onChange={(e) => setAssignTarget({ ...assignTarget, district: e.target.value })}
                            disabled={!assignTarget.state}
                            className="h-11 px-4 bg-gray-50 border-none rounded-lg text-[13px] font-medium outline-none disabled:opacity-50"
                        >
                            <option value="">Select District</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select
                            value={assignTarget.mandal}
                            onChange={(e) => setAssignTarget({ ...assignTarget, mandal: e.target.value })}
                            disabled={!assignTarget.district}
                            className="h-11 px-4 bg-gray-50 border-none rounded-lg text-[13px] font-medium outline-none disabled:opacity-50"
                        >
                            <option value="">Select Mandal</option>
                            {mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <select
                            value={assignTarget.sector}
                            onChange={(e) => setAssignTarget({ ...assignTarget, sector: e.target.value })}
                            disabled={!assignTarget.mandal}
                            className="h-11 px-4 bg-gray-50 border-none rounded-lg text-[13px] font-medium outline-none disabled:opacity-50"
                        >
                            <option value="">Select Sector</option>
                            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                            value={assignTarget.panchayat}
                            onChange={(e) => setAssignTarget({ ...assignTarget, panchayat: e.target.value })}
                            disabled={!assignTarget.sector}
                            className="h-11 px-4 bg-gray-50 border-none rounded-lg text-[13px] font-medium outline-none disabled:opacity-50"
                        >
                            <option value="">Select Panchayat</option>
                            {panchayats.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select
                            value={assignTarget.awc}
                            onChange={(e) => setAssignTarget({ ...assignTarget, awc: e.target.value })}
                            disabled={!assignTarget.panchayat && !assignTarget.sector}
                            className="h-11 px-4 bg-gray-50 border-none rounded-lg text-[13px] font-medium outline-none disabled:opacity-50"
                        >
                            <option value="">Select AWC</option>
                            {awcs.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleBulkAssign}
                            disabled={selectedAssignUserIds.size === 0 || actionLoading}
                            className={`px-8 py-3 rounded-lg text-[13px] font-bold disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg ${
                                assignConfirmPending ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-black text-white hover:bg-gray-800 shadow-black/5'
                            }`}
                        >
                            <Icons.UserCheck size={16} />
                            <span>{actionLoading ? 'Assigning...' : assignConfirmPending ? `Confirm assign ${selectedAssignUserIds.size} users?` : `Assign ${selectedAssignUserIds.size || ''} Users`}</span>
                        </button>
                    </div>
                </div>

            </div>
        );
    };

    const renderBulkActions = () => {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-[14px] font-bold text-black uppercase tracking-widest">Perform Bulk Action</h3>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <select
                                    value={selectedAction}
                                    onChange={(e) => setSelectedAction(e.target.value)}
                                    className="appearance-none bg-gray-50 border-none rounded-lg px-4 pr-10 py-2 text-[13px] font-bold text-black outline-none focus:ring-1 focus:ring-black"
                                >
                                    <option value="">Select Action</option>
                                    <option value="Enable Accounts">Enable Accounts</option>
                                    <option value="Disable Accounts">Disable Accounts</option>
                                    <option value="Delete Accounts">Delete Accounts</option>
                                </select>
                                <Icons.ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <button
                                onClick={handleBulkAction}
                                disabled={bulkActionTargetIds.size === 0 || !selectedAction || actionLoading}
                                className={`px-6 py-2 rounded-lg text-[13px] font-bold disabled:opacity-50 transition-all ${
                                    bulkActionConfirmPending ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-black text-white hover:bg-gray-800'
                                }`}
                            >
                                {actionLoading ? 'Applying...' : bulkActionConfirmPending ? `Confirm "${selectedAction}"?` : `Apply to ${bulkActionTargetIds.size || ''} Selected`}
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-4 w-12"><Checkbox checked={bulkActionTargetIds.size === initialUsers.length} onChange={() => {
                                        if (bulkActionTargetIds.size === initialUsers.length) setBulkActionTargetIds(new Set());
                                        else setBulkActionTargetIds(new Set(initialUsers.map(u => u.id)));
                                    }} /></th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {initialUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4"><Checkbox checked={bulkActionTargetIds.has(user.id)} onChange={() => {
                                            const next = new Set(bulkActionTargetIds);
                                            if (next.has(user.id)) next.delete(user.id);
                                            else next.add(user.id);
                                            setBulkActionTargetIds(next);
                                        }} /></td>
                                        <td className="px-6 py-4 font-semibold text-black text-[13px]">{user.name}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-gray-600 uppercase">{user.role}</span></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-[11px] font-medium text-gray-500 uppercase">{user.is_active ? 'ACTIVE' : 'LOCKED'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[12px] text-gray-400 font-medium">{user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold border ${
                    toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                </div>
            )}
            <div>
                <h1 className="text-[24px] font-semibold text-black leading-tight">Bulk Operations</h1>
                <p className="text-[13px] text-gray-500 tracking-tight">Manage user database at scale</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-8 border-b border-gray-200 mb-8 px-2">
                {[
                    { id: 'IMPORT_USERS', label: 'Import Users' },
                    { id: 'BULK_ASSIGN', label: 'Bulk Assign' },
                    { id: 'BULK_ACTIONS', label: 'Bulk Actions' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as BulkOpsTab)}
                        className={`pb-4 text-[13px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-black'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black animate-in fade-in duration-300" />
                        )}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'IMPORT_USERS' && renderImportUsers()}
                {activeTab === 'BULK_ASSIGN' && renderBulkAssign()}
                {activeTab === 'BULK_ACTIONS' && renderBulkActions()}
            </div>
        </div>
    );
};

const Badge = ({ label, color }: { label: string; color: string }) => (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border border-transparent ${color}`}>
        {label}
    </span>
);

const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-black border-black text-white' : 'border-gray-300 hover:border-black'
            }`}
    >
        {checked && <Icons.Check size={14} strokeWidth={4} />}
    </button>
);

export default BulkOps;
