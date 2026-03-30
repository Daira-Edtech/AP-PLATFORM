import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function MandalsPage() {
    const supabase = await createClient()

    const { data: mandals } = await supabase
        .from('mandals')
        .select(`
      *,
      districts(name)
    `)
        .order('name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-dark-slate)]">Mandals</h1>
                    <p className="text-sm text-[var(--color-subtle-text)] mt-1">{mandals?.length ?? 0} mandals total</p>
                </div>
                <Link
                    href="/admin/geography/mandals/new"
                    className="bg-slate-800 text-white px-4 py-2 rounded-[12px] text-sm hover:bg-slate-700 transition-colors no-underline"
                >
                    Add Mandal
                </Link>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-[12px] overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-primary-solid)]/50 border-b border-slate-800">
                        <tr>
                            <th className="text-left px-4 py-3 text-[var(--color-placeholder)] font-medium">Name</th>
                            <th className="text-left px-4 py-3 text-[var(--color-placeholder)] font-medium">Code</th>
                            <th className="text-left px-4 py-3 text-[var(--color-placeholder)] font-medium">District</th>
                            <th className="text-left px-4 py-3 text-[var(--color-placeholder)] font-medium">Created</th>
                            <th className="text-left px-4 py-3 text-[var(--color-placeholder)] font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mandals?.map((mandal) => (
                            <tr key={mandal.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">{mandal.name}</td>
                                <td className="px-4 py-3 text-[var(--color-placeholder)] font-mono text-xs">{mandal.code}</td>
                                <td className="px-4 py-3 text-[var(--color-placeholder)]">{(mandal.districts as any)?.name}</td>
                                <td className="px-4 py-3 text-[var(--color-placeholder)] text-xs">
                                    {new Date(mandal.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/geography/mandals/${mandal.id}`}
                                        className="text-[var(--color-placeholder)] hover:text-white text-xs underline"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {(!mandals || mandals.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-placeholder)] text-sm">
                                    No mandals found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
