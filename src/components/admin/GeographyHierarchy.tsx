'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import * as actions from '@/app/admin/geography/actions';

const Icons = {
    ChevronRight: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
    ChevronDown: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    MapPin: ({ size = 16 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Building2: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Home: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Search: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Flag: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-7h.01" /></svg>,
    Map: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
    Users: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Grid3X3: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    Pin: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Plus: ({ size = 14 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    MoreVertical: ({ size = 20 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>,
    Trash2: ({ size = 16 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    FileUp: ({ size = 16 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    Download: ({ size = 16 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    Save: ({ size = 16 }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
    AlertCircle: ({ size = 20, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Info: ({ size = 16, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    UserPlus: ({ size = 14, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
    Loader2: ({ size = 24, className = "" }) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.929 4.929l2.828 2.828m8.486 8.486l2.828 2.828M2 12h4m12 0h4M4.929 19.071l2.828-2.828m8.486-8.486l2.828-2.828" /></svg>,
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    STATE: <Icons.Flag className="text-blue-600" />,
    DISTRICT: <Icons.Map className="text-indigo-600" />,
    MANDAL: <Icons.Building2 className="text-amber-600" />,
    SECTOR: <Icons.Grid3X3 className="text-purple-600" />,
    PANCHAYAT: <Icons.Home className="text-gray-600" />,
    AWC: <Icons.Pin className="text-red-600" />,
};

const TYPE_LABELS: Record<string, string> = {
    STATE: 'State',
    DISTRICT: 'District',
    MANDAL: 'Project / Mandal',
    SECTOR: 'Sector',
    PANCHAYAT: 'Panchayat',
    AWC: 'AWC',
};

const GeographyHierarchy: React.FC = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [treeData, setTreeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', latitude: '', longitude: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [newEntityData, setNewEntityData] = useState<any>({ name: '', code: '', type: '', parentId: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [deletePending, setDeletePending] = useState(false);
    const [unassignPendingId, setUnassignPendingId] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const handleCreate = async () => {
        if (!newEntityData.name || !newEntityData.code) {
            setValidationError('Name and Code are required');
            return;
        }
        setValidationError(null);
        setSaving(true);
        try {
            const data: any = {
                name: newEntityData.name,
                code: newEntityData.code
            };

            // Mapping parents
            if (newEntityData.type === 'DISTRICT') data.state_id = newEntityData.parentId;
            if (newEntityData.type === 'MANDAL') data.district_id = newEntityData.parentId;
            if (newEntityData.type === 'SECTOR') data.mandal_id = newEntityData.parentId;
            if (newEntityData.type === 'PANCHAYAT') data.sector_id = newEntityData.parentId;
            if (newEntityData.type === 'AWC') {
                data.sector_id = newEntityData.parentId;
                // For AWC, we might need mandal_id as well if it's required by schema
                // In v4 schema, mandal_id IS NOT NULL for awcs
                if (newEntityData.parentType === 'SECTOR') {
                    // We need to find the mandal_id of the sector
                    // The tree data search or actions
                    const sectorDetails = await actions.getEntityDetails(newEntityData.parentId, 'SECTOR');
                    data.mandal_id = sectorDetails.mandal_id;
                    data.panchayat_id = null;
                } else if (newEntityData.parentType === 'PANCHAYAT') {
                    const panchayatDetails = await actions.getEntityDetails(newEntityData.parentId, 'PANCHAYAT');
                    const sectorDetails = await actions.getEntityDetails(panchayatDetails.sector_id, 'SECTOR');
                    data.panchayat_id = newEntityData.parentId;
                    data.sector_id = panchayatDetails.sector_id;
                    data.mandal_id = sectorDetails.mandal_id;
                }
                data.latitude = newEntityData.latitude ? parseFloat(newEntityData.latitude) : null;
                data.longitude = newEntityData.longitude ? parseFloat(newEntityData.longitude) : null;
            }

            await actions.createEntity(newEntityData.type, data);
            showToast('success', 'Created successfully');
            setIsAdding(false);
            setNewEntityData({ name: '', code: '', type: '', parentId: '' });
            fetchHierarchy();
        } catch (err: any) {
            showToast('error', 'Error creating: ' + err.message);
        } finally {
            setSaving(false);
        }
    };


    const fetchHierarchy = async () => {
        setLoading(true);
        try {
            const data = await actions.getGeographicTree();

            const buildTree = () => {
                const nodes: any[] = [];
                const getAwcs = (parentId: string, parentType: 'PANCHAYAT' | 'SECTOR' | 'MANDAL') => {
                    const field = parentType === 'PANCHAYAT' ? 'panchayat_id' : parentType === 'SECTOR' ? 'sector_id' : 'mandal_id';
                    return data.awcs
                        .filter(a => a[field] === parentId)
                        .map(a => ({ ...a, type: 'AWC' }));
                };
                const getPanchayats = (sectorId: string) => {
                    return data.panchayats
                        .filter(p => p.sector_id === sectorId)
                        .map(p => ({
                            ...p,
                            type: 'PANCHAYAT',
                            children: getAwcs(p.id, 'PANCHAYAT')
                        }));
                };
                const getSectors = (mandalId: string) => {
                    return data.sectors
                        .filter(s => s.mandal_id === mandalId)
                        .map(s => ({
                            ...s,
                            type: 'SECTOR',
                            children: [
                                ...getPanchayats(s.id),
                                ...data.awcs.filter(a => a.sector_id === s.id && !a.panchayat_id).map(a => ({ ...a, type: 'AWC' }))
                            ]
                        }));
                };
                const getMandals = (districtId: string) => {
                    return data.mandals
                        .filter(m => m.district_id === districtId)
                        .map(m => ({
                            ...m,
                            type: 'MANDAL',
                            children: getSectors(m.id)
                        }));
                };
                const getDistricts = (stateId: string) => {
                    return data.districts
                        .filter(d => d.state_id === stateId)
                        .map(d => ({
                            ...d,
                            type: 'DISTRICT',
                            children: getMandals(d.id)
                        }));
                };
                if (data.states.length > 0) {
                    data.states.forEach(s => nodes.push({ ...s, type: 'STATE', children: getDistricts(s.id) }));
                } else if (data.districts.length > 0) {
                    data.districts.forEach(d => nodes.push({ ...d, type: 'DISTRICT', children: getMandals(d.id) }));
                } else if (data.mandals.length > 0) {
                    data.mandals.forEach(m => nodes.push({ ...m, type: 'MANDAL', children: getSectors(m.id) }));
                }
                return nodes;
            };

            const fullTree = buildTree();
            setTreeData(fullTree);
            if (expandedNodes.size === 0 && fullTree.length > 0) {
                const autoExpand = new Set<string>();
                fullTree.forEach(n => {
                    autoExpand.add(n.id);
                    n.children?.slice(0, 3).forEach((c: any) => autoExpand.add(c.id));
                });
                setExpandedNodes(autoExpand);
            }
        } catch (err) {
            console.error('Failed to fetch hierarchy', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const handleNodeSelect = async (node: any) => {
        setDetailLoading(true);
        try {
            const details = await actions.getEntityDetails(node.id, node.type);
            setSelectedNode({ ...node, ...details });
            setFormData({
                name: details.name || '',
                code: details.code || '',
                latitude: details.latitude?.toString() || '',
                longitude: details.longitude?.toString() || ''
            });
        } catch (err) {
            console.error(err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedNode) return;
        setSaving(true);
        try {
            const updates: any = { name: formData.name, code: formData.code };
            if (selectedNode.type === 'AWC') {
                updates.latitude = formData.latitude ? parseFloat(formData.latitude) : null;
                updates.longitude = formData.longitude ? parseFloat(formData.longitude) : null;
            }
            await actions.updateEntity(selectedNode.id, selectedNode.type, updates);
            showToast('success', 'Updated successfully');
            fetchHierarchy();
        } catch (err: any) {
            showToast('error', 'Error updating: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUnassign = async (userId: string) => {
        if (!selectedNode) return;
        if (unassignPendingId !== userId) {
            setUnassignPendingId(userId);
            setTimeout(() => setUnassignPendingId(null), 3000);
            return;
        }
        setUnassignPendingId(null);
        try {
            await actions.unassignUser(userId, selectedNode.type);
            handleNodeSelect(selectedNode);
            showToast('success', 'User unassigned');
        } catch (err: any) {
            showToast('error', 'Failed to unassign: ' + err.message);
        }
    };

    const handleDelete = async () => {
        if (!selectedNode) return;
        if (!deletePending) {
            setDeletePending(true);
            setTimeout(() => setDeletePending(false), 3000);
            return;
        }
        setDeletePending(false);
        setSaving(true);
        try {
            await actions.deleteEntity(selectedNode.id, selectedNode.type);
            setSelectedNode(null);
            fetchHierarchy();
            showToast('success', 'Deleted successfully');
        } catch (err: any) {
            showToast('error', 'Delete failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(treeData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "geographic_hierarchy.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        showToast('info', 'Bulk import: use the User Bulk Import page or seed via full_schema.sql.');
    };

    const handleAssignClick = () => {
        router.push('/admin/users/bulk?tab=BULK_ASSIGN');
    };

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const next = new Set(expandedNodes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedNodes(next);
    };

    const renderTree = (nodes: any[], level: number = 0) => {
        return nodes.map((node) => {
            const isExpanded = expandedNodes.has(node.id);
            const isSelected = selectedNode?.id === node.id;
            const hasChildren = node.children && node.children.length > 0;
            const childCount = node.children?.length || 0;

            if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !node.children?.some((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
                return null;
            }

            return (
                <div key={node.id} className="select-none">
                    <div
                        className={`flex items-center group py-2 px-3 my-0.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'
                            }`}
                        style={{ paddingLeft: `${level * 20 + 8}px` }}
                        onClick={() => handleNodeSelect(node)}
                    >
                        <div
                            className={`w-6 flex items-center justify-center transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}
                            onClick={(e) => toggleExpand(node.id, e)}
                        >
                            {hasChildren && (isExpanded ? <Icons.ChevronDown size={14} /> : <Icons.ChevronRight size={14} />)}
                        </div>
                        <div className={`mr-2.5 ${isSelected ? 'text-white' : ''}`}>
                            {TYPE_ICONS[node.type] || <Icons.MapPin size={16} />}
                        </div>
                        <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="text-[13px] font-semibold truncate mr-2">{node.name}</span>
                            <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold uppercase shrink-0 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                                    {childCount > 0 && `(${childCount})`}
                                </span>
                            </div>
                        </div>
                    </div>
                    {isExpanded && hasChildren && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            {renderTree(node.children!, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.json"
                className="hidden"
            />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold border ${
                    toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    toast.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
                                              'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                    {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.message}
                </div>
            )}

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[24px] font-semibold text-black leading-tight">Geographic Hierarchy</h1>
                    <p className="text-[13px] text-gray-500">Manage administrative units and assigned personnel</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleImportClick}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded text-[13px] font-bold hover:bg-gray-50 text-gray-700 shadow-sm transition-all"
                    >
                        <Icons.FileUp size={16} />
                        <span>Bulk Import</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded text-[13px] font-bold hover:bg-gray-800 transition-all shadow-md shadow-black/5"
                    >
                        <Icons.Download size={16} />
                        <span>Export Full Tree</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-6 pb-6">
                <div className="w-[450px] bg-white border border-[#E5E5E5] rounded-xl flex flex-col shadow-sm overflow-hidden shrink-0">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hierarchy Tree</h3>
                            <button
                                onClick={() => {
                                    setIsAdding(true);
                                    setNewEntityData({ name: '', code: '', type: 'STATE', parentId: '' });
                                }}
                                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                                title="Add State"
                            >
                                <Icons.Plus size={16} />
                            </button>
                        </div>
                        <div className="relative">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search hierarchy..."
                                className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-0.5">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <Icons.Loader2 className="animate-spin text-black" size={32} />
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Loading Infrastructure...</p>
                            </div>
                        ) : treeData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <Icons.Info size={32} className="text-gray-200 mb-2" />
                                <p className="text-[13px] text-gray-400 font-medium italic">No geographic data found in database.</p>
                            </div>
                        ) : renderTree(treeData)}
                    </div>
                </div>

                <div className="flex-1 flex flex-col space-y-4">
                    {detailLoading ? (
                        <div className="flex-1 bg-white border border-[#E5E5E5] rounded-xl p-8 flex flex-col items-center justify-center space-y-4 shadow-sm">
                            <Icons.Loader2 className="animate-spin text-black" size={32} />
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fetching Node Details...</p>
                        </div>
                    ) : isAdding ? (
                        <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h2 className="text-[20px] font-bold text-black">Add New {TYPE_LABELS[newEntityData.type]}</h2>
                                    {newEntityData.parentId && (
                                        <p className="text-[13px] text-gray-500">Under: {selectedNode?.name}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 border border-gray-200 rounded text-[13px] font-bold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Entity Name</label>
                                    <input
                                        type="text"
                                        value={newEntityData.name}
                                        onChange={(e) => setNewEntityData({ ...newEntityData, name: e.target.value })}
                                        className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black transition-all outline-none text-[14px] font-medium"
                                        placeholder={`e.g. ${TYPE_LABELS[newEntityData.type]} Name`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Entity Code</label>
                                    <input
                                        type="text"
                                        value={newEntityData.code}
                                        onChange={(e) => setNewEntityData({ ...newEntityData, code: e.target.value })}
                                        className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black transition-all outline-none text-[14px] font-medium uppercase"
                                        placeholder={`e.g. ${newEntityData.type.substring(0, 3)}001`}
                                    />
                                </div>
                                {newEntityData.type === 'AWC' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Latitude</label>
                                            <input
                                                type="text"
                                                value={newEntityData.latitude || ''}
                                                onChange={(e) => setNewEntityData({ ...newEntityData, latitude: e.target.value })}
                                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black transition-all outline-none text-[14px] font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Longitude</label>
                                            <input
                                                type="text"
                                                value={newEntityData.longitude || ''}
                                                onChange={(e) => setNewEntityData({ ...newEntityData, longitude: e.target.value })}
                                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black transition-all outline-none text-[14px] font-medium"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {validationError && (
                                <div className="text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {validationError}
                                </div>
                            )}
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleCreate}
                                    disabled={saving}
                                    className="px-8 py-2.5 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors flex items-center space-x-2 shadow-lg shadow-black/10 disabled:opacity-50"
                                >
                                    <Icons.Plus size={16} />
                                    <span>{saving ? 'Creating...' : `Create ${TYPE_LABELS[newEntityData.type]}`}</span>
                                </button>
                            </div>
                        </div>
                    ) : selectedNode ? (
                        <>
                            <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-3">
                                            <h2 className="text-[20px] font-bold text-black">{selectedNode.name}</h2>
                                            <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] font-bold uppercase text-gray-500">
                                                {TYPE_LABELS[selectedNode.type] || selectedNode.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-6 text-[13px] text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <Icons.Grid3X3 size={14} className="text-gray-400" />
                                                <span>{selectedNode.children?.length || 0} Units</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Icons.Users size={14} className="text-gray-400" />
                                                <span>{selectedNode.personnel?.length || 0} Personnel</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {selectedNode.type !== 'AWC' && (
                                            <button
                                                onClick={() => {
                                                    setIsAdding(true);
                                                    let nextType = '';
                                                    switch (selectedNode.type) {
                                                        case 'STATE': nextType = 'DISTRICT'; break;
                                                        case 'DISTRICT': nextType = 'MANDAL'; break;
                                                        case 'MANDAL': nextType = 'SECTOR'; break;
                                                        case 'SECTOR': nextType = 'PANCHAYAT'; break;
                                                        case 'PANCHAYAT': nextType = 'AWC'; break;
                                                    }
                                                    setNewEntityData({
                                                        name: '',
                                                        code: '',
                                                        type: nextType,
                                                        parentId: selectedNode.id,
                                                        parentType: selectedNode.type
                                                    });
                                                }}
                                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded text-[11px] font-bold hover:bg-gray-200 transition-all shadow-sm"
                                            >
                                                <Icons.Plus size={14} />
                                                <span>Add {selectedNode.type === 'SECTOR' ? 'Panchayat' : selectedNode.type === 'PANCHAYAT' ? 'AWC' : 'Child'}</span>
                                            </button>
                                        )}
                                        {selectedNode.type === 'SECTOR' && (
                                            <button
                                                onClick={() => {
                                                    setIsAdding(true);
                                                    setNewEntityData({
                                                        name: '',
                                                        code: '',
                                                        type: 'AWC',
                                                        parentId: selectedNode.id,
                                                        parentType: 'SECTOR'
                                                    });
                                                }}
                                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded text-[11px] font-bold hover:bg-gray-200 transition-all shadow-sm"
                                            >
                                                <Icons.Plus size={14} />
                                                <span>Add AWC</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={handleDelete}
                                            className={`p-2 rounded-lg transition-all text-sm font-bold ${deletePending ? 'bg-red-600 text-white px-3' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                            title={deletePending ? 'Click again to confirm delete' : 'Delete this entity'}
                                        >
                                            {deletePending ? 'Confirm?' : <Icons.Trash2 size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Entity Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black transition-all outline-none text-[14px] font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Entity Code</label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black transition-all outline-none text-[14px] font-medium uppercase"
                                        />
                                    </div>
                                    {selectedNode.type === 'AWC' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Latitude</label>
                                                <input
                                                    type="text"
                                                    value={formData.latitude}
                                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                                    className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black transition-all outline-none text-[14px] font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Longitude</label>
                                                <input
                                                    type="text"
                                                    value={formData.longitude}
                                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                                    className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black transition-all outline-none text-[14px] font-medium"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-gray-100 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Assigned Personnel</h3>
                                        <button
                                            onClick={handleAssignClick}
                                            className="text-[11px] font-bold text-blue-600 flex items-center hover:underline"
                                        >
                                            <Icons.UserPlus size={14} className="mr-1" />
                                            Assign New
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedNode.personnel?.map((user: any) => (
                                            <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[11px] font-bold uppercase shadow-sm">
                                                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-black leading-none mb-1">{user.name}</p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'} uppercase tracking-tighter`}>{user.role}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    <button
                                                        onClick={() => handleUnassign(user.id)}
                                                        className={`text-[11px] font-bold transition-all opacity-0 group-hover:opacity-100 ${unassignPendingId === user.id ? 'text-white bg-red-600 px-2 py-0.5 rounded opacity-100' : 'text-red-500'}`}
                                                    >
                                                        {unassignPendingId === user.id ? 'Confirm?' : 'Unassign'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedNode.personnel?.length === 0 && (
                                            <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <p className="text-[13px] text-gray-400 italic">No personnel assigned to this {selectedNode.type.toLowerCase()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-8 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-8 py-2.5 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors flex items-center space-x-2 shadow-lg shadow-black/10 disabled:opacity-50"
                                    >
                                        <Icons.Save size={16} />
                                        <span>{saving ? 'Applying...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-[#E5E5E5] border-dashed rounded-xl p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                                <Icons.Info size={32} />
                            </div>
                            <h3 className="text-[16px] font-bold text-black mb-1">No Entity Selected</h3>
                            <p className="text-[13px] text-gray-500 max-w-[240px]">Select an administrative unit from the hierarchy tree to manage its details and staff.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default GeographyHierarchy;
