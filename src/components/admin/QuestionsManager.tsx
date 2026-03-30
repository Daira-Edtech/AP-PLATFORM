'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus, Search, Edit2, Trash2, X, Save,
    AlertTriangle, ChevronDown, SlidersHorizontal,
    HelpCircle, Check
} from 'lucide-react'
import {
    createQuestion, updateQuestion, deleteQuestion,
    type Question, type QuestionInput, type QuestionDomain
} from '@/app/admin/questions/actions'

const DOMAINS: { value: QuestionDomain; label: string; color: string }[] = [
    { value: 'GM', label: 'Gross Motor', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'FM', label: 'Fine Motor', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'LC', label: 'Language & Cognition', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'COG', label: 'Cognitive', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'SE', label: 'Social Emotional', color: 'bg-pink-100 text-pink-700 border-pink-200' },
]

const domainStyle = (d: string) => DOMAINS.find(x => x.value === d)?.color || 'bg-gray-100 text-gray-600 border-gray-200'
const domainLabel = (d: string) => DOMAINS.find(x => x.value === d)?.label || d

const EMPTY_FORM: QuestionInput = {
    question_number: 0,
    text_en: '',
    text_te: '',
    domain: 'GM',
    age_min_months: 0,
    age_max_months: 12,
    weight: 1.00,
    is_critical: false,
}

interface Props {
    questions: Question[]
    domainCounts: Record<string, number>
}

export default function QuestionsManager({ questions, domainCounts }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // Filters
    const [search, setSearch] = useState('')
    const [domainFilter, setDomainFilter] = useState<QuestionDomain | ''>('')
    const [criticalOnly, setCriticalOnly] = useState(false)

    // Drawer / form state
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editing, setEditing] = useState<Question | null>(null)
    const [form, setForm] = useState<QuestionInput>(EMPTY_FORM)
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Filtered list
    const filtered = useMemo(() => {
        return questions.filter(q => {
            if (domainFilter && q.domain !== domainFilter) return false
            if (criticalOnly && !q.is_critical) return false
            if (search) {
                const s = search.toLowerCase()
                return q.text_en.toLowerCase().includes(s) || q.text_te?.toLowerCase().includes(s)
            }
            return true
        })
    }, [questions, domainFilter, criticalOnly, search])

    const openCreate = () => {
        setEditing(null)
        setForm(EMPTY_FORM)
        setFormError('')
        setDrawerOpen(true)
    }

    const openEdit = (q: Question) => {
        setEditing(q)
        setForm({
            question_number: q.question_number,
            text_en: q.text_en,
            text_te: q.text_te || '',
            domain: q.domain,
            age_min_months: q.age_min_months,
            age_max_months: q.age_max_months,
            weight: q.weight,
            is_critical: q.is_critical,
        })
        setFormError('')
        setDrawerOpen(true)
    }

    const closeDrawer = () => {
        setDrawerOpen(false)
        setEditing(null)
        setFormError('')
    }

    const handleSave = async () => {
        if (!form.text_en.trim()) { setFormError('English text is required.'); return }
        if (form.question_number < 1) { setFormError('Question number must be ≥ 1.'); return }
        if (form.age_min_months > form.age_max_months) { setFormError('Min age cannot exceed max age.'); return }

        setSaving(true)
        setFormError('')
        try {
            if (editing) {
                await updateQuestion(editing.id, form)
            } else {
                await createQuestion(form)
            }
            closeDrawer()
            startTransition(() => router.refresh())
        } catch (e: unknown) {
            setFormError(e instanceof Error ? e.message : 'Save failed.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deleteQuestion(deleteTarget.id)
            setDeleteTarget(null)
            startTransition(() => router.refresh())
        } catch {
            // keep modal open on error
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[24px] font-semibold text-black leading-tight">Questions Bank</h1>
                    <p className="text-[13px] text-gray-500">
                        {questions.length} milestone questions across 5 developmental domains
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-all shadow-md"
                >
                    <Plus size={16} />
                    <span>Add Question</span>
                </button>
            </div>

            {/* Domain summary cards */}
            <div className="grid grid-cols-5 gap-3">
                {DOMAINS.map(d => (
                    <button
                        key={d.value}
                        onClick={() => setDomainFilter(domainFilter === d.value ? '' : d.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${domainFilter === d.value ? 'ring-2 ring-black' : 'hover:shadow-sm'} ${d.color}`}
                    >
                        <p className="text-[22px] font-bold leading-none">{domainCounts[d.value] || 0}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-1">{d.value}</p>
                        <p className="text-[11px] mt-0.5 opacity-75">{d.label}</p>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex flex-wrap items-center gap-3 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search English or Telugu text…"
                        className="w-full h-9 pl-9 pr-4 bg-gray-50 rounded-lg text-xs border-none outline-none"
                    />
                </div>

                <div className="relative">
                    <select
                        value={domainFilter}
                        onChange={e => setDomainFilter(e.target.value as QuestionDomain | '')}
                        className="h-9 pl-3 pr-8 bg-gray-50 rounded-lg text-xs border-none outline-none appearance-none font-medium"
                    >
                        <option value="">All Domains</option>
                        {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.value} — {d.label}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <button
                    onClick={() => setCriticalOnly(!criticalOnly)}
                    className={`flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-bold border transition-all ${criticalOnly ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                >
                    <AlertTriangle size={13} />
                    Critical only
                </button>

                {(search || domainFilter || criticalOnly) && (
                    <button
                        onClick={() => { setSearch(''); setDomainFilter(''); setCriticalOnly(false) }}
                        className="h-9 px-3 text-xs font-bold text-gray-400 hover:text-black transition-colors"
                    >
                        Clear
                    </button>
                )}

                <span className="ml-auto text-[12px] text-gray-400 font-medium">
                    {filtered.length} of {questions.length} shown
                </span>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black text-white text-[11px] font-bold uppercase tracking-widest">
                            <th className="px-5 py-4 w-12">#</th>
                            <th className="px-5 py-4 w-24">Domain</th>
                            <th className="px-5 py-4">Question (English)</th>
                            <th className="px-5 py-4 w-28">Age Range</th>
                            <th className="px-5 py-4 w-16 text-center">Weight</th>
                            <th className="px-5 py-4 w-16 text-center">Critical</th>
                            <th className="px-5 py-4 w-20 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <HelpCircle size={32} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-[13px] text-gray-400 font-medium">
                                        {questions.length === 0 ? 'No questions added yet. Click "Add Question" to create the first milestone.' : 'No questions match the current filters.'}
                                    </p>
                                </td>
                            </tr>
                        ) : filtered.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-5 py-3">
                                    <span className="text-[13px] font-mono font-bold text-gray-500">{q.question_number}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${domainStyle(q.domain)}`}>
                                        {q.domain}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <p className="text-[13px] font-medium text-gray-900 leading-snug">{q.text_en}</p>
                                    {q.text_te && <p className="text-[11px] text-gray-400 mt-0.5">{q.text_te}</p>}
                                </td>
                                <td className="px-5 py-3">
                                    <span className="text-[12px] text-gray-600 font-medium">{q.age_min_months}–{q.age_max_months} mo</span>
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <span className="text-[12px] font-mono text-gray-600">{Number(q.weight).toFixed(2)}</span>
                                </td>
                                <td className="px-5 py-3 text-center">
                                    {q.is_critical ? (
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full">
                                            <AlertTriangle size={12} />
                                        </span>
                                    ) : (
                                        <span className="text-gray-200">—</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(q)}
                                            className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(q)}
                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Drawer overlay */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30" onClick={closeDrawer} />
                    <div className="w-[480px] bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <h2 className="text-[16px] font-bold text-black">
                                {editing ? 'Edit Question' : 'Add Question'}
                            </h2>
                            <button onClick={closeDrawer} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Question Number */}
                            <FormField label="Question Number *">
                                <input
                                    type="number"
                                    value={form.question_number || ''}
                                    onChange={e => setForm(f => ({ ...f, question_number: parseInt(e.target.value) || 0 }))}
                                    className="w-full h-10 px-3 bg-gray-50 rounded-lg text-[13px] border border-gray-200 outline-none focus:border-black transition-colors"
                                    min={1}
                                />
                            </FormField>

                            {/* Domain */}
                            <FormField label="Domain *">
                                <div className="grid grid-cols-5 gap-2">
                                    {DOMAINS.map(d => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, domain: d.value }))}
                                            className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${form.domain === d.value ? `${d.color} ring-2 ring-black` : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'}`}
                                        >
                                            {d.value}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">{domainLabel(form.domain)}</p>
                            </FormField>

                            {/* English text */}
                            <FormField label="Question Text (English) *">
                                <textarea
                                    value={form.text_en}
                                    onChange={e => setForm(f => ({ ...f, text_en: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-[13px] border border-gray-200 outline-none focus:border-black transition-colors resize-none"
                                />
                            </FormField>

                            {/* Telugu text */}
                            <FormField label="Question Text (Telugu)">
                                <textarea
                                    value={form.text_te || ''}
                                    onChange={e => setForm(f => ({ ...f, text_te: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-[13px] border border-gray-200 outline-none focus:border-black transition-colors resize-none"
                                    dir="auto"
                                />
                            </FormField>

                            {/* Age range */}
                            <FormField label="Age Range (months) *">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={form.age_min_months}
                                        onChange={e => setForm(f => ({ ...f, age_min_months: parseInt(e.target.value) || 0 }))}
                                        min={0}
                                        className="w-full h-10 px-3 bg-gray-50 rounded-lg text-[13px] border border-gray-200 outline-none focus:border-black transition-colors"
                                        placeholder="Min"
                                    />
                                    <span className="text-gray-400 text-sm shrink-0">to</span>
                                    <input
                                        type="number"
                                        value={form.age_max_months}
                                        onChange={e => setForm(f => ({ ...f, age_max_months: parseInt(e.target.value) || 0 }))}
                                        min={0}
                                        className="w-full h-10 px-3 bg-gray-50 rounded-lg text-[13px] border border-gray-200 outline-none focus:border-black transition-colors"
                                        placeholder="Max"
                                    />
                                </div>
                            </FormField>

                            {/* Weight */}
                            <FormField label="Weight (0.01 – 3.00)">
                                <input
                                    type="number"
                                    value={form.weight}
                                    onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) || 1 }))}
                                    step={0.01}
                                    min={0.01}
                                    max={3}
                                    className="w-full h-10 px-3 bg-gray-50 rounded-lg text-[13px] border border-gray-200 outline-none focus:border-black transition-colors"
                                />
                            </FormField>

                            {/* Is critical */}
                            <div className="flex items-center justify-between p-4 bg-red-50/60 border border-red-100 rounded-xl">
                                <div>
                                    <p className="text-[13px] font-bold text-gray-800">Red Flag / Critical</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Failing this question forces HIGH risk classification</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, is_critical: !f.is_critical }))}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${form.is_critical ? 'bg-red-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${form.is_critical ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {formError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-[12px]">
                                    <AlertTriangle size={14} className="shrink-0" />
                                    {formError}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={closeDrawer}
                                className="flex-1 h-10 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 h-10 bg-black text-white rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save size={15} /> {editing ? 'Update' : 'Create'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-6 space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <Trash2 size={18} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-black">Delete Question #{deleteTarget.question_number}?</p>
                                <p className="text-[12px] text-gray-500 mt-0.5">This cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-[13px] text-gray-600 bg-gray-50 rounded-lg p-3 line-clamp-2">{deleteTarget.text_en}</p>
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 h-10 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 h-10 bg-red-600 text-white rounded-lg text-[13px] font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
        {children}
    </div>
)
