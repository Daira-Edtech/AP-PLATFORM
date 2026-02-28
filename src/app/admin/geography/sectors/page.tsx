import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SectorsPage() {
    const supabase = await createClient()

    const { data: sectors } = await supabase
        .from('sectors')
        .select(`
            *,
            mandals(name)
        `)
        .order('name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Sectors</h1>
                    <p className="text-sm text-slate-500 mt-1">{sectors?.length ?? 0} sectors total</p>
                </div>
                <Link
                    href="/admin/geography/sectors/new"
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors no-underline"
                >
                    Add Sector
                </Link>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-800">
                        <tr>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Code</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Mandal</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Created</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sectors?.map((sector) => (
                            <tr key={sector.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">{sector.name}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{sector.code}</td>
                                <td className="px-4 py-3 text-slate-400">{(sector.mandals as any)?.name}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs">
                                    {new Date(sector.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/geography/sectors/${sector.id}`}
                                        className="text-slate-400 hover:text-white text-xs underline"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {(!sectors || sectors.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                                    No sectors found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
