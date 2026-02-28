import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AWCsPage() {
    const supabase = await createClient()

    const { data: awcs } = await supabase
        .from('awcs')
        .select(`
      *,
      mandals(name),
      sectors(name),
      panchayats(name)
    `)
        .order('name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">AWCs</h1>
                    <p className="text-sm text-slate-500 mt-1">{awcs?.length ?? 0} Anganwadi Centres total</p>
                </div>
                <Link
                    href="/admin/geography/awcs/new"
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors no-underline"
                >
                    Add AWC
                </Link>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-800">
                        <tr>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Code</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Village</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Mandal</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Sector</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Target</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {awcs?.map((awc) => (
                            <tr key={awc.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">{awc.name}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{awc.code}</td>
                                <td className="px-4 py-3 text-slate-400">{awc.village_name ?? '—'}</td>
                                <td className="px-4 py-3 text-slate-400">{(awc.mandals as any)?.name}</td>
                                <td className="px-4 py-3 text-slate-400">{(awc.sectors as any)?.name}</td>
                                <td className="px-4 py-3 text-slate-400">{awc.target_children}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${awc.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {awc.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/geography/awcs/${awc.id}`}
                                        className="text-slate-400 hover:text-white text-xs underline"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {(!awcs || awcs.length === 0) && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                                    No AWCs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}