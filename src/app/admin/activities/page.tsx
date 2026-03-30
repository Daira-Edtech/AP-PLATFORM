import { createClient } from '@/lib/supabase/server'
import { Info, Layers } from 'lucide-react'

export const metadata = {
    title: 'Activity Library | Admin',
}

const DOMAIN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    GM: { label: 'Gross Motor',      color: 'text-blue-700',   bg: 'bg-blue-50' },
    FM: { label: 'Fine Motor',       color: 'text-purple-700', bg: 'bg-purple-50' },
    LC: { label: 'Language & Comm.', color: 'text-green-700',  bg: 'bg-green-50' },
    COG: { label: 'Cognitive',       color: 'text-amber-700',  bg: 'bg-amber-50' },
    SE: { label: 'Social-Emotional', color: 'text-rose-700',   bg: 'bg-rose-50' },
    health:    { label: 'Health',    color: 'text-teal-700',   bg: 'bg-teal-50' },
    nutrition: { label: 'Nutrition', color: 'text-orange-700', bg: 'bg-orange-50' },
}

const DIFFICULTY_COLOR: Record<string, string> = {
    easy:   'text-green-600 bg-green-50',
    medium: 'text-amber-600 bg-amber-50',
    hard:   'text-red-600 bg-red-50',
}

export default async function ActivitiesPage() {
    const supabase = await createClient()

    // Aggregates: count by domain, difficulty, source
    const [{ data: allRecs }, { data: recentRecs }] = await Promise.all([
        supabase
            .from('activity_recommendations')
            .select('domain, difficulty, source'),
        supabase
            .from('activity_recommendations')
            .select('child_id, domain, activity_title, difficulty, source, created_at')
            .order('created_at', { ascending: false })
            .limit(20),
    ])

    const domainCounts: Record<string, number> = {}
    const difficultyCounts: Record<string, number> = {}
    const sourceCounts: Record<string, number> = {}

    for (const rec of allRecs ?? []) {
        if (rec.domain) domainCounts[rec.domain] = (domainCounts[rec.domain] || 0) + 1
        if (rec.difficulty) difficultyCounts[rec.difficulty] = (difficultyCounts[rec.difficulty] || 0) + 1
        if (rec.source) sourceCounts[rec.source] = (sourceCounts[rec.source] || 0) + 1
    }

    const totalRecs = allRecs?.length ?? 0

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[var(--color-dark-slate)] tracking-tight">Activity Library</h1>
                <p className="text-sm text-[var(--color-subtle-text)] mt-1">Overview of auto-generated activity recommendations</p>
            </div>

            {/* Info banner */}
            <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-blue-800">Activity Catalog — Planned Feature</p>
                    <p className="text-sm text-blue-700 mt-0.5">
                        A reusable activities library is planned for a future phase. This page shows AI-generated
                        activity recommendations produced automatically from child screening sessions across all AWCs.
                    </p>
                </div>
            </div>

            {totalRecs === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-app-bg)] flex items-center justify-center mb-4">
                        <Layers className="w-8 h-8 text-[var(--color-placeholder)]" />
                    </div>
                    <p className="text-base font-bold text-[var(--color-dark-slate)]">No recommendations yet</p>
                    <p className="text-sm text-[var(--color-subtle-text)] mt-1 max-w-sm">
                        Activity recommendations are generated automatically when children complete screening sessions.
                    </p>
                </div>
            ) : (
                <>
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[var(--color-card-bg)] rounded-xl p-4 border border-[var(--color-border-mute)]">
                            <p className="text-3xl font-black text-[var(--color-dark-slate)]">{totalRecs.toLocaleString()}</p>
                            <p className="text-xs font-bold text-[var(--color-subtle-text)] uppercase tracking-wider mt-1">Total Recommendations</p>
                        </div>
                        <div className="bg-[var(--color-card-bg)] rounded-xl p-4 border border-[var(--color-border-mute)]">
                            <p className="text-3xl font-black text-[var(--color-dark-slate)]">{sourceCounts['ai_generated'] ?? 0}</p>
                            <p className="text-xs font-bold text-[var(--color-subtle-text)] uppercase tracking-wider mt-1">AI Generated</p>
                        </div>
                        <div className="bg-[var(--color-card-bg)] rounded-xl p-4 border border-[var(--color-border-mute)]">
                            <p className="text-3xl font-black text-[var(--color-dark-slate)]">{difficultyCounts['easy'] ?? 0}</p>
                            <p className="text-xs font-bold text-[var(--color-subtle-text)] uppercase tracking-wider mt-1">Easy Difficulty</p>
                        </div>
                    </div>

                    {/* Domain distribution */}
                    <div>
                        <h2 className="text-sm font-bold text-[var(--color-subtle-text)] uppercase tracking-wider mb-3">By Domain</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).map(([domain, count]) => {
                                const cfg = DOMAIN_CONFIG[domain] ?? { label: domain, color: 'text-gray-700', bg: 'bg-gray-50' }
                                const pct = totalRecs > 0 ? Math.round((count / totalRecs) * 100) : 0
                                return (
                                    <div key={domain} className={`${cfg.bg} rounded-xl p-4 border border-transparent`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-black uppercase tracking-wider ${cfg.color}`}>{domain}</span>
                                            <span className={`text-xs font-bold ${cfg.color}`}>{pct}%</span>
                                        </div>
                                        <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
                                        <p className="text-xs text-[var(--color-subtle-text)] mt-1">{cfg.label}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Recent recommendations */}
                    <div>
                        <h2 className="text-sm font-bold text-[var(--color-subtle-text)] uppercase tracking-wider mb-3">
                            Recent Recommendations (latest 20)
                        </h2>
                        <div className="bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-border-mute)] overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-border-mute)] bg-[var(--color-app-bg)]">
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--color-placeholder)] uppercase tracking-wider">Child</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--color-placeholder)] uppercase tracking-wider">Domain</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--color-placeholder)] uppercase tracking-wider">Activity</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--color-placeholder)] uppercase tracking-wider">Difficulty</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--color-placeholder)] uppercase tracking-wider">Source</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--color-placeholder)] uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border-mute)]">
                                    {(recentRecs ?? []).map((rec, i) => {
                                        const domCfg = rec.domain ? (DOMAIN_CONFIG[rec.domain] ?? DOMAIN_CONFIG.GM) : null
                                        const diffCls = rec.difficulty ? (DIFFICULTY_COLOR[rec.difficulty] ?? '') : ''
                                        return (
                                            <tr key={i} className="hover:bg-[var(--color-app-bg)] transition-colors">
                                                <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-subtle-text)]">
                                                    {rec.child_id.slice(0, 8)}…
                                                </td>
                                                <td className="px-4 py-3">
                                                    {domCfg && (
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${domCfg.bg} ${domCfg.color}`}>
                                                            {rec.domain}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-[var(--color-dark-slate)] max-w-xs truncate">
                                                    {rec.activity_title}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {rec.difficulty && (
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${diffCls}`}>
                                                            {rec.difficulty}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-[var(--color-subtle-text)] capitalize">
                                                    {rec.source?.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-[var(--color-subtle-text)] whitespace-nowrap">
                                                    {new Date(rec.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
