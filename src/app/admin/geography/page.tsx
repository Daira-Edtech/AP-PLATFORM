import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function GeographyPage() {
    const supabase = await createClient()

    const [
        { count: totalDistricts },
        { count: totalMandals },
        { count: totalSectors },
        { count: totalPanchayats },
        { count: totalAWCs },
    ] = await Promise.all([
        supabase.from('districts').select('*', { count: 'exact', head: true }),
        supabase.from('mandals').select('*', { count: 'exact', head: true }),
        supabase.from('sectors').select('*', { count: 'exact', head: true }),
        supabase.from('panchayats').select('*', { count: 'exact', head: true }),
        supabase.from('awcs').select('*', { count: 'exact', head: true }),
    ])

    const sections = [
        { label: 'Districts', count: totalDistricts ?? 0, href: '/admin/geography/districts', description: 'Manage all districts in Andhra Pradesh' },
        { label: 'Mandals', count: totalMandals ?? 0, href: '/admin/geography/mandals', description: 'Manage mandals within districts' },
        { label: 'Sectors', count: totalSectors ?? 0, href: '/admin/geography/sectors', description: 'Manage sectors within mandals' },
        { label: 'Panchayats', count: totalPanchayats ?? 0, href: '/admin/geography/panchayats', description: 'Manage panchayats within sectors' },
        { label: 'AWCs', count: totalAWCs ?? 0, href: '/admin/geography/awcs', description: 'Manage Anganwadi Centres' },
    ]

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Geography</h1>
            <p className="text-sm text-slate-500">Manage the full hierarchy — State / District / Mandal / Sector / Panchayat / AWC</p>

            <div className="grid grid-cols-3 gap-4">
                {sections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-lg p-5 hover:border-slate-600 transition-colors no-underline block"
                    >
                        <div className="text-3xl font-bold text-white">{section.count}</div>
                        <div className="text-base font-semibold text-slate-200 mt-1">{section.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{section.description}</div>
                    </Link>
                ))}
            </div>
        </div>
    )
}