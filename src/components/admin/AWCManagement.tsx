'use client'

import React, { useState, useMemo, useEffect } from 'react';
import * as actions from '@/app/admin/geography/awcs/actions';

const Icons = {
    Plus: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    FileUp: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    Download: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    Search: ({ size = 18, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    ChevronDown: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    MoreHorizontal: ({ size = 18, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>,
    X: ({ size = 24, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    Save: ({ size = 18, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
    AlertCircle: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Loader2: ({ size = 24, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    Info: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const AWCManagement: React.FC = () => {
    const [awcs, setAwcs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [activeFilters, setActiveFilters] = useState({
        district: 'All',
        mandal: 'All',
        sector: 'All',
        panchayat: 'All',
        assignment: 'All',
        status: 'All'
    });

    const [masterData, setMasterData] = useState<any>({
        districts: [], mandals: [], sectors: [], panchayats: [], unassignedWorkers: []
    });

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        district_id: '',
        mandal_id: '',
        sector_id: '',
        panchayat_id: '',
        target_children: 40,
        latitude: '',
        longitude: '',
        aww_id: '',
        status: 'ACTIVE'
    });

    const [editingAwc, setEditingAwc] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [awcList, masters] = await Promise.all([
                actions.getAwcs(),
                actions.getMasterData()
            ]);
            setAwcs(awcList);
            setMasterData(masters);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredAwcs = useMemo(() => {
        return awcs.filter(awc => {
            const matchesSearch = !searchTerm ||
                awc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                awc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                awc.panchayat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                awc.mandal.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDistrict = activeFilters.district === 'All' || awc.district === activeFilters.district;
            const matchesMandal = activeFilters.mandal === 'All' || awc.mandal === activeFilters.mandal;
            const matchesSector = activeFilters.sector === 'All' || awc.sector === activeFilters.sector;
            const matchesPanchayat = activeFilters.panchayat === 'All' || awc.panchayat === activeFilters.panchayat;
            const matchesStatus = activeFilters.status === 'All' || awc.status === activeFilters.status;
            const matchesAssignment = activeFilters.assignment === 'All' ||
                (activeFilters.assignment === 'Has AWW' ? !!awc.awwName : !awc.awwName);

            return matchesSearch && matchesDistrict && matchesMandal && matchesSector && matchesPanchayat && matchesStatus && matchesAssignment;
        });
    }, [awcs, searchTerm, activeFilters]);

    const filteredMandalsForForm = masterData.mandals.filter((m: any) => !formData.district_id || m.district_id === formData.district_id);
    const filteredSectorsForForm = masterData.sectors.filter((s: any) => !formData.mandal_id || s.mandal_id === formData.mandal_id);
    const filteredPanchayatsForForm = masterData.panchayats.filter((p: any) => !formData.sector_id || p.sector_id === formData.sector_id);
    const filteredWorkersForForm = masterData.unassignedWorkers.filter((w: any) => !formData.mandal_id || w.mandal_id === formData.mandal_id);

    const handleEdit = (awc: any) => {
        const district = masterData.districts.find((d: any) => d.name === awc.district);
        const mandal = masterData.mandals.find((m: any) => m.name === awc.mandal);
        const sector = masterData.sectors.find((s: any) => s.name === awc.sector);
        const panchayat = masterData.panchayats.find((p: any) => p.name === awc.panchayat);

        setEditingAwc(awc);
        setFormData({
            name: awc.name,
            code: awc.code,
            district_id: district?.id || '',
            mandal_id: mandal?.id || '',
            sector_id: sector?.id || '',
            panchayat_id: panchayat?.id || '',
            target_children: awc.childrenTarget,
            latitude: awc.latitude || '',
            longitude: awc.longitude || '',
            aww_id: '',
            status: awc.status
        });
        setIsDrawerOpen(true);
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.code || !formData.sector_id || !formData.mandal_id) {
            setFormError('Please fill mandatory fields (Name, Code, Mandal, Sector)');
            return;
        }
        setFormError(null);
        setSaving(true);
        try {
            const payload = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude as string) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude as string) : null,
                status: editingAwc ? formData.status : 'ACTIVE'
            };

            if (editingAwc) {
                await actions.updateAWC(editingAwc.id, payload);
            } else {
                await actions.createAWC(payload);
            }

            setIsDrawerOpen(false);
            setEditingAwc(null);
            setFormData({
                name: '', code: '', district_id: '', mandal_id: '', sector_id: '', panchayat_id: '',
                target_children: 40, latitude: '', longitude: '', aww_id: '', status: 'ACTIVE'
            });
            fetchData();
        } catch (err: any) {
            showToast('error', 'Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        const csvRows = [
            ['Name', 'Code', 'Panchayat', 'Mandal', 'District', 'AWW Assigned', 'Phone', 'Children Active', 'Target', 'Status', 'Lat', 'Long'].join(',')
        ];

        filteredAwcs.forEach(awc => {
            csvRows.push([
                awc.name,
                awc.code,
                awc.panchayat,
                awc.mandal,
                awc.district,
                awc.awwName || 'None',
                awc.awwPhone || 'None',
                awc.childrenActive,
                awc.childrenTarget,
                awc.status,
                awc.latitude || '',
                awc.longitude || ''
            ].join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "awc_registry_" + new Date().toISOString().split('T')[0] + ".csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const downloadSampleCSV = () => {
        const headers = 'name,code,mandal_id,sector_id,panchayat_id,target_children,latitude,longitude';
        const sample = 'Example AWC,EXA-123,' + masterData.mandals[0]?.id + ',' + masterData.sectors[0]?.id + ',,40,17.3850,78.4867';
        const content = "data:text/csv;charset=utf-8," + headers + "\n" + sample;
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(content));
        link.setAttribute("download", "awc_import_sample.csv");
        link.click();
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
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[24px] font-semibold text-black leading-tight">AWC Management</h1>
                    <p className="text-[13px] text-gray-500">{awcs.length} Anganwadi Centres registered</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => {
                            setEditingAwc(null);
                            setFormData({
                                name: '', code: '', district_id: '', mandal_id: '', sector_id: '', panchayat_id: '',
                                target_children: 40, latitude: '', longitude: '', aww_id: '', status: 'ACTIVE'
                            });
                            setIsDrawerOpen(true);
                        }}
                        className="flex items-center space-x-2 px-6 py-2 bg-black text-white rounded text-[13px] font-bold hover:bg-gray-800 transition-all shadow-md shadow-black/5"
                    >
                        <Icons.Plus />
                        <span>Add AWC</span>
                    </button>
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded text-[13px] font-bold hover:bg-gray-50 text-gray-700 transition-all"
                    >
                        <Icons.FileUp />
                        <span>Bulk Import</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 text-[13px] font-bold text-gray-400 hover:text-black hover:bg-white rounded transition-colors"
                    >
                        <Icons.Download />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 shadow-sm sticky top-[56px] z-30">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="relative w-full lg:max-w-xs shrink-0">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, code..."
                            className="w-full h-11 pl-10 pr-4 bg-[#F9F9F9] border-none rounded-lg text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <FilterDropdown
                            label="District"
                            value={activeFilters.district}
                            options={['All', ...masterData.districts.map((d: any) => d.name)]}
                            onChange={(val) => setActiveFilters({ ...activeFilters, district: val, mandal: 'All', sector: 'All', panchayat: 'All' })}
                        />
                        <FilterDropdown
                            label="Mandal"
                            value={activeFilters.mandal}
                            options={['All', ...masterData.mandals
                                .filter((m: any) => activeFilters.district === 'All' || m.district_id === masterData.districts.find((d: any) => d.name === activeFilters.district)?.id)
                                .map((m: any) => m.name)]}
                            onChange={(val) => setActiveFilters({ ...activeFilters, mandal: val, sector: 'All', panchayat: 'All' })}
                        />
                        <FilterDropdown
                            label="Sector"
                            value={activeFilters.sector}
                            options={['All', ...masterData.sectors
                                .filter((s: any) => activeFilters.mandal === 'All' || s.mandal_id === masterData.mandals.find((m: any) => m.name === activeFilters.mandal)?.id)
                                .map((s: any) => s.name)]}
                            onChange={(val) => setActiveFilters({ ...activeFilters, sector: val, panchayat: 'All' })}
                        />
                        <FilterDropdown
                            label="Panchayat"
                            value={activeFilters.panchayat}
                            options={['All', ...masterData.panchayats
                                .filter((p: any) => activeFilters.sector === 'All' || p.sector_id === masterData.sectors.find((s: any) => s.name === activeFilters.sector)?.id)
                                .map((p: any) => p.name)]}
                            onChange={(val) => setActiveFilters({ ...activeFilters, panchayat: val })}
                        />
                        <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden lg:block" />
                        <FilterDropdown
                            label="Status"
                            value={activeFilters.status}
                            options={['All', 'ACTIVE', 'INACTIVE']}
                            onChange={(val) => setActiveFilters({ ...activeFilters, status: val })}
                        />
                        <FilterDropdown
                            label="AWW"
                            value={activeFilters.assignment}
                            options={['All', 'Has AWW', 'No AWW']}
                            onChange={(val) => setActiveFilters({ ...activeFilters, assignment: val })}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4">
                        <Icons.Loader2 className="animate-spin text-black" />
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Loading AWC Registry...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                            <tr className="bg-black text-white text-[11px] font-bold uppercase tracking-widest">
                                <th className="px-6 py-5 w-12 text-center">#</th>
                                <th className="px-6 py-5">AWC Name</th>
                                <th className="px-6 py-5">Code</th>
                                <th className="px-6 py-5">Panchayat / Mandal</th>
                                <th className="px-6 py-5">District</th>
                                <th className="px-6 py-5">AWW Assigned</th>
                                <th className="px-6 py-5">Children (Target)</th>
                                <th className="px-6 py-5 text-center">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAwcs.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-20 text-center text-gray-400 italic">No AWCs found matching current filters.</td>
                                </tr>
                            ) : filteredAwcs.map((awc, idx) => {
                                const coverage = (awc.childrenActive / awc.childrenTarget) * 100 || 0;
                                const coverageColor = coverage === 0 ? 'text-red-500' : coverage < 80 ? 'text-amber-500' : 'text-green-600';

                                return (
                                    <tr
                                        key={awc.id}
                                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                        onClick={() => handleEdit(awc)}
                                    >
                                        <td className="px-6 py-4 text-center text-gray-400 font-bold text-[11px]">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-[14px] font-bold text-black">{awc.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[12px] font-mono text-gray-500">{awc.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-black">{awc.panchayat}</p>
                                            <p className="text-[11px] text-gray-400 uppercase tracking-tighter">{awc.mandal}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{awc.district}</td>
                                        <td className="px-6 py-4">
                                            {awc.awwName ? (
                                                <div>
                                                    <p className="font-bold text-black leading-none mb-1">{awc.awwName}</p>
                                                    <p className="text-[11px] text-gray-400">{awc.awwPhone}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-[#EF4444] uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className={`font-bold ${coverageColor}`}>{awc.childrenActive}</span>
                                                <span className="text-gray-300">/</span>
                                                <span className="text-gray-400">{awc.childrenTarget}</span>
                                            </div>
                                            <div className="w-16 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full ${coverage === 0 ? 'bg-red-500' : coverage < 80 ? 'bg-amber-400' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(coverage, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${awc.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-300'}`} />
                                                <span className={`text-[11px] font-bold uppercase tracking-tight ${awc.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-400'}`}>
                                                    {awc.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
                                                <Icons.MoreHorizontal />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Bulk Import Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[70] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-black">Bulk Import AWCs</h3>
                                <p className="text-xs text-gray-500">Upload centers in bulk using a CSV file</p>
                            </div>
                            <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-black"><Icons.X /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
                                <Icons.Info className="text-blue-600 mt-0.5 shrink-0" />
                                <div className="space-y-2">
                                    <p className="text-[13px] text-blue-900 font-medium">Required CSV Header Structure:</p>
                                    <code className="block bg-white/60 p-2 rounded text-[11px] font-mono text-blue-800 break-all">
                                        name, code, mandal_id, sector_id, panchayat_id, target_children, latitude, longitude
                                    </code>
                                    <p className="text-[11px] text-blue-700 italic flex items-center cursor-pointer hover:underline" onClick={downloadSampleCSV}>
                                        <Icons.Download size={12} className="mr-1" /> Download sample CSV with IDs
                                    </p>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-gray-100 rounded-2xl p-10 flex flex-col items-center justify-center space-y-4 hover:border-black/10 transition-colors pointer-events-none opacity-50">
                                <Icons.FileUp size={40} className="text-gray-300" />
                                <div className="text-center">
                                    <p className="text-sm font-bold text-black">Click to upload or drag & drop</p>
                                    <p className="text-xs text-gray-400 mt-1">Maximum file size 10MB (CSV only)</p>
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 text-center">Note: ID fields require valid UUIDs from the Geography section.</p>
                        </div>
                        <div className="p-6 bg-gray-50 flex space-x-3 text-sm font-bold">
                            <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                            <button className="flex-1 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all opacity-50 cursor-not-allowed">Start Processing</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Side Drawer for Add AWC */}
            {isDrawerOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[55] animate-in fade-in duration-300"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <div className="fixed right-0 top-0 h-full w-[420px] bg-white z-[60] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-[20px] font-bold text-black leading-tight">
                                    {editingAwc ? 'Edit Anganwadi Centre' : 'Create Anganwadi Centre'}
                                </h2>
                                <p className="text-[13px] text-gray-500 mt-1">
                                    {editingAwc ? 'Modify details of an existing unit' : 'Add a new administrative unit to the registry'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-black"
                            >
                                <Icons.X />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">AWC Identity</label>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="AWC Name (e.g. Rampur AWC)"
                                            className="w-full h-12 px-4 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-black outline-none text-[14px]"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                placeholder="AWC Code"
                                                className="flex-1 h-12 px-4 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-black outline-none text-[14px] uppercase"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            />
                                            <button
                                                onClick={() => setFormData({ ...formData, code: 'AWC-' + Math.random().toString(36).substr(2, 6).toUpperCase() })}
                                                className="px-4 bg-gray-100 text-[11px] font-bold rounded-xl hover:bg-gray-200"
                                            >AUTO</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Location Hierarchy</label>
                                    <div className="space-y-3">
                                        <DrawerSelect
                                            label="District"
                                            value={masterData.districts.find((d: any) => d.id === formData.district_id)?.name || "Select District"}
                                            options={masterData.districts}
                                            onChange={(val) => setFormData({ ...formData, district_id: val, mandal_id: '', sector_id: '', panchayat_id: '' })}
                                        />
                                        <DrawerSelect
                                            label="Mandal"
                                            value={masterData.mandals.find((m: any) => m.id === formData.mandal_id)?.name || "Select Mandal"}
                                            options={filteredMandalsForForm}
                                            onChange={(val) => setFormData({ ...formData, mandal_id: val, sector_id: '', panchayat_id: '' })}
                                        />
                                        <DrawerSelect
                                            label="Sector"
                                            value={masterData.sectors.find((s: any) => s.id === formData.sector_id)?.name || "Select Sector"}
                                            options={filteredSectorsForForm}
                                            onChange={(val) => setFormData({ ...formData, sector_id: val, panchayat_id: '' })}
                                        />
                                        <DrawerSelect
                                            label="Panchayat"
                                            value={masterData.panchayats.find((p: any) => p.id === formData.panchayat_id)?.name || "Select Panchayat (Optional)"}
                                            options={filteredPanchayatsForForm}
                                            onChange={(val) => setFormData({ ...formData, panchayat_id: val })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Operational Data</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 font-medium ml-1">Target Children</p>
                                            <input
                                                type="number"
                                                value={formData.target_children}
                                                onChange={(e) => setFormData({ ...formData, target_children: parseInt(e.target.value) })}
                                                className="w-full h-11 px-4 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-black outline-none text-[14px]"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 font-medium ml-1">Center Type</p>
                                            <DrawerSelect
                                                value="Standard"
                                                options={[{ id: 'standard', name: 'Standard' }, { id: 'mini', name: 'Mini AWC' }]}
                                                onChange={() => { }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">GPS Configuration</label>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[13px] font-medium text-gray-700">Coordinates</span>
                                            <button className="text-[11px] font-bold text-blue-600">Pick on map</button>
                                        </div>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                placeholder="Lat"
                                                className="flex-1 h-10 px-3 bg-white border border-gray-100 rounded-lg text-sm"
                                                value={formData.latitude}
                                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Long"
                                                className="flex-1 h-10 px-3 bg-white border border-gray-100 rounded-lg text-sm"
                                                value={formData.longitude}
                                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {editingAwc && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status Control</label>
                                        <div className="flex bg-gray-50 p-1 rounded-xl">
                                            <button
                                                onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}
                                                className={`flex-1 py-3 text-[13px] font-bold rounded-lg transition-all ${formData.status === 'ACTIVE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}
                                            >ACTIVE</button>
                                            <button
                                                onClick={() => setFormData({ ...formData, status: 'INACTIVE' })}
                                                className={`flex-1 py-3 text-[13px] font-bold rounded-lg transition-all ${formData.status === 'INACTIVE' ? 'bg-white text-gray-600 shadow-sm' : 'text-gray-400'}`}
                                            >INACTIVE</button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1 pt-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Personnel Assignment</label>
                                    <div className="relative group">
                                        <DrawerSelect
                                            label="Worker"
                                            value={masterData.unassignedWorkers.find((w: any) => w.id === formData.aww_id)?.name || "Assign AWW (Optional)"}
                                            options={filteredWorkersForForm}
                                            onChange={(val) => setFormData({ ...formData, aww_id: val })}
                                        />
                                        <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start space-x-2">
                                            <Icons.AlertCircle className="text-amber-600 mt-0.5 shadow-[0_0_8px_rgba(217,119,6,0.2)]" />
                                            <p className="text-[11px] text-amber-800">Only unassigned AWWs in the selected mandal will appear in this list.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-white space-y-3">
                            {formError && (
                                <div className="text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {formError}
                                </div>
                            )}
                            <button
                                onClick={handleCreate}
                                disabled={saving}
                                className="w-full h-[52px] bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center space-x-2 disabled:bg-gray-400"
                            >
                                {saving ? <Icons.Loader2 className="animate-spin" /> : <Icons.Save />}
                                <span>{saving ? (editingAwc ? 'Updating Unit...' : 'Creating Unit...') : (editingAwc ? 'Save Changes' : 'Create AWC')}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const FilterDropdown = ({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (val: string) => void }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative shrink-0">
            <button
                onClick={() => setOpen(!open)}
                className={`h-11 px-4 border rounded-lg text-[13px] font-medium flex items-center space-x-2 transition-all ${value === 'All' ? 'bg-gray-50 border-transparent text-gray-700' : 'bg-black text-white border-black'}`}
            >
                <span className={`font-bold uppercase text-[10px] mr-1 ${value === 'All' ? 'text-gray-400' : 'text-gray-300'}`}>{label}:</span>
                <span className="truncate max-w-[100px]">{value}</span>
                <Icons.ChevronDown size={14} className={`${value === 'All' ? 'text-gray-400' : 'text-white'} transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-[45]" onClick={() => setOpen(false)} />
                    <div className="absolute z-[100] mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[300px] overflow-y-auto min-w-[160px] animate-in slide-in-from-top-2 duration-200">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-[13px] border-b border-gray-50 last:border-none hover:bg-gray-50 ${value === opt ? 'font-bold text-black bg-gray-50' : 'text-gray-600'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

const DrawerSelect = ({ label, value, options, onChange }: { label?: string, value: string, options: any[], onChange: (val: string) => void }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative w-full">
            <button
                onClick={() => setOpen(!open)}
                className="w-full h-12 px-4 bg-gray-50 border-none rounded-xl flex items-center justify-between text-[14px] font-medium text-gray-700 hover:bg-gray-100 transition-all group"
            >
                <div className="flex items-center space-x-2">
                    {label && <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">{label}:</span>}
                    <span className={value.startsWith('Select') || value.startsWith('Assign') ? 'text-gray-400' : 'text-black'}>{value}</span>
                </div>
                <Icons.ChevronDown className={`text-gray-400 group-hover:text-black transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-[65]" onClick={() => setOpen(false)} />
                    <div className="absolute z-[70] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[200px] overflow-y-auto animate-in slide-in-from-top-1 duration-150">
                        {options.length === 0 ? (
                            <div className="p-4 text-[12px] text-gray-400 italic text-center">No options available for current selection</div>
                        ) : (
                            options.map((opt: any) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { onChange(opt.id); setOpen(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-[13px] border-b border-gray-50 last:border-none"
                                >
                                    {opt.name}
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AWCManagement;
