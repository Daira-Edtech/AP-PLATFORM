'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { UserDetail } from './UserDetail'

interface UserTableProps {
    users: any[]
}

export function UserTable({ users: initialUsers }: UserTableProps) {
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('All Roles')
    const [statusFilter, setStatusFilter] = useState('All')
    const [assignmentFilter, setAssignmentFilter] = useState('All')
    const [districtFilter, setDistrictFilter] = useState('All Districts')

    // Dynamically get unique districts from users
    const districtOptions = useMemo(() => {
        const districts = new Set<string>()
        districts.add('All Districts')
        initialUsers.forEach(u => {
            const dName = u.districts?.name
            if (dName) districts.add(dName)
        })
        return Array.from(districts)
    }, [initialUsers])

    const filteredUsers = useMemo(() => {
        return initialUsers.filter(user => {
            const matchesSearch =
                user.name?.toLowerCase().includes(search.toLowerCase()) ||
                user.email?.toLowerCase().includes(search.toLowerCase()) ||
                user.phone?.toLowerCase().includes(search.toLowerCase())

            const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter.toLowerCase().replace(' ', '_')

            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Active' && user.is_active) ||
                (statusFilter === 'Locked' && !user.is_active)

            const hasAssignment = !!(user.awc_id || user.mandal_id || user.district_id)
            const matchesAssignment = assignmentFilter === 'All' ||
                (assignmentFilter === 'Assigned' && hasAssignment) ||
                (assignmentFilter === 'Unassigned' && !hasAssignment)

            const userDistrict = user.districts?.name
            const matchesDistrict = districtFilter === 'All Districts' || userDistrict === districtFilter

            return matchesSearch && matchesRole && matchesStatus && matchesAssignment && matchesDistrict
        })
    }, [initialUsers, search, roleFilter, statusFilter, assignmentFilter, districtFilter])

    const handleExport = () => {
        if (filteredUsers.length === 0) return

        const headers = ['Name', 'Role', 'Email', 'Phone', 'Assigned To', 'District', 'Status']
        const csvContent = [
            headers.join(','),
            ...filteredUsers.map(u => [
                `"${u.name}"`,
                `"${u.role}"`,
                `"${u.email || ''}"`,
                `"${u.phone || ''}"`,
                `"${u.awcs?.name || u.mandals?.name || u.districts?.name || 'Unassigned'}"`,
                `"${u.districts?.name || 'All'}"`,
                `"${u.is_active ? 'Active' : 'Locked'}"`
            ].map(field => field.replace(/"/g, '""')).join(',')) // Escape double quotes within fields
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `jiveesha_users_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const roleColors: Record<string, string> = {
        system_admin: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        aww: 'bg-blue-50 text-blue-600 border-blue-100',
        supervisor: 'bg-yellow-50 text-yellow-700 border-yellow-100',
        cdpo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        district_officer: 'bg-orange-50 text-orange-700 border-orange-100',
        commissioner: 'bg-red-50 text-red-700 border-red-100',
    }

    if (selectedUser) {
        return <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        {initialUsers.length.toLocaleString()} users across 7 roles
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-slate-900 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Export All
                    </button>
                    <Link
                        href="/admin/users/bulk"
                        className="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors border border-slate-200 flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Bulk Operations
                    </Link>
                    <Link
                        href="/admin/users/new"
                        className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all shadow-sm flex items-center gap-2"
                    >
                        <span className="text-lg leading-none">+</span> Add User
                    </Link>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, phone, email, or AWC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-slate-200 focus:outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <FilterDropdown label="Role" value={roleFilter} options={['All Roles', 'AWW', 'Supervisor', 'CDPO', 'District Officer', 'Commissioner', 'System Admin', 'Super Admin']} onChange={setRoleFilter} />
                        <FilterDropdown label="Status" value={statusFilter} options={['All', 'Active', 'Locked']} onChange={setStatusFilter} />
                        <FilterDropdown label="Assignment" value={assignmentFilter} options={['All', 'Assigned', 'Unassigned']} onChange={setAssignmentFilter} />
                        <FilterDropdown label="District" value={districtFilter} options={districtOptions} onChange={setDistrictFilter} />
                    </div>
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Showing {filteredUsers.length} of {initialUsers.length} results
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black text-white uppercase text-[10px] font-black tracking-widest">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800 text-white focus:ring-0" />
                                </th>
                                <th className="px-4 py-4">Name <span className="ml-1 opacity-50">⇅</span></th>
                                <th className="px-4 py-4">Role <span className="ml-1 opacity-50">⇅</span></th>
                                <th className="px-4 py-4">Phone/Email</th>
                                <th className="px-4 py-4">Assigned To <span className="ml-1 opacity-50">⇅</span></th>
                                <th className="px-4 py-4">District <span className="ml-1 opacity-50">⇅</span></th>
                                <th className="px-4 py-4">Status <span className="ml-1 opacity-50">⇅</span></th>
                                <th className="px-4 py-4">Last Active <span className="ml-1 opacity-50">⇅</span></th>
                                <th className="px-4 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => {
                                const assignedTo =
                                    (user.awcs as any)?.name ||
                                    (user.panchayats as any)?.name ||
                                    (user.sectors as any)?.name ||
                                    (user.mandals as any)?.name ||
                                    (user.districts as any)?.name ||
                                    (user.states as any)?.name

                                return (
                                    <tr
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-4 py-5 w-10" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="rounded border-slate-300 text-black focus:ring-black" />
                                        </td>
                                        <td className="px-4 py-5 font-bold text-slate-900">{user.name}</td>
                                        <td className="px-4 py-5">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border font-black uppercase ${roleColors[user.role] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {user.role?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 text-slate-500 font-medium whitespace-nowrap">
                                            {user.phone || user.email || '—'}
                                        </td>
                                        <td className="px-4 py-5">
                                            {assignedTo ? (
                                                <span className="font-bold text-slate-700">{assignedTo}</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-5 font-bold text-slate-600">
                                            {(user.districts as any)?.name || 'All'}
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                <span className="font-bold text-slate-700">{user.is_active ? 'Active' : 'Locked'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-slate-400 font-medium whitespace-nowrap">
                                            {formatTime(user.last_active)}
                                        </td>
                                        <td className="px-4 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button className="text-slate-300 hover:text-slate-900 transition-colors p-1">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-medium">
                                        No users match your current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function formatTime(dateStr: string | null) {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
}

function FilterDropdown({ label, value, options, onChange }: any) {
    return (
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shrink-0">
            <span className="text-slate-400 font-medium">{label}:</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="font-bold text-slate-900 focus:outline-none bg-transparent cursor-pointer"
            >
                {options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    )
}
