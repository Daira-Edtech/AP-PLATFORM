import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EditAWCPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const isNew = id === 'new'

    const [
        { data: mandals },
        { data: sectors },
        { data: panchayats },
    ] = await Promise.all([
        supabase.from('mandals').select('*').order('name'),
        supabase.from('sectors').select('*').order('name'),
        supabase.from('panchayats').select('*').order('name'),
    ])

    const { data: awc } = isNew
        ? { data: null }
        : await supabase.from('awcs').select('*').eq('id', id).single()

    async function save(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const payload = {
            name: formData.get('name') as string,
            code: formData.get('code') as string,
            village_name: formData.get('village_name') as string,
            mandal_id: formData.get('mandal_id') as string,
            sector_id: formData.get('sector_id') as string,
            panchayat_id: formData.get('panchayat_id') as string || null,
            target_children: parseInt(formData.get('target_children') as string) || 40,
            is_active: formData.get('is_active') === 'true',
        }

        if (isNew) {
            await supabase.from('awcs').insert(payload)
        } else {
            await supabase.from('awcs').update(payload).eq('id', id)
        }

        redirect('/admin/geography/awcs')
    }

    return (
        <div className="space-y-6 max-w-lg">
            <h1 className="text-2xl font-bold text-slate-800">
                {isNew ? 'Add AWC' : 'Edit AWC'}
            </h1>

            <form action={save} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                        name="name"
                        defaultValue={awc?.name ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. Rampur AWC 1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                    <input
                        name="code"
                        defaultValue={awc?.code ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. AWC-KDP-S1-RMP-01"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Village Name</label>
                    <input
                        name="village_name"
                        defaultValue={awc?.village_name ?? ''}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. Rampur"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mandal</label>
                    <select
                        name="mandal_id"
                        defaultValue={awc?.mandal_id ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    >
                        <option value="">Select mandal</option>
                        {mandals?.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
                    <select
                        name="sector_id"
                        defaultValue={awc?.sector_id ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    >
                        <option value="">Select sector</option>
                        {sectors?.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Panchayat</label>
                    <select
                        name="panchayat_id"
                        defaultValue={awc?.panchayat_id ?? ''}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    >
                        <option value="">Select panchayat (optional)</option>
                        {panchayats?.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Children</label>
                    <input
                        name="target_children"
                        type="number"
                        defaultValue={awc?.target_children ?? 40}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                        name="is_active"
                        defaultValue={awc?.is_active === false ? 'false' : 'true'}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors"
                    >
                        {isNew ? 'Create AWC' : 'Save Changes'}
                    </button>

                    <a
                        href="/admin/geography/awcs"
                        className="px-4 py-2 rounded-md text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors no-underline"
                    >
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    )
}