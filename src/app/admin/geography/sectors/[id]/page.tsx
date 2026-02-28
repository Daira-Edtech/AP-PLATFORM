import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EditSectorPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const isNew = id === 'new'

    const { data: mandals } = await supabase.from('mandals').select('*').order('name')

    const { data: sector } = isNew
        ? { data: null }
        : await supabase.from('sectors').select('*').eq('id', id).single()

    async function save(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const payload = {
            name: formData.get('name') as string,
            code: formData.get('code') as string,
            mandal_id: formData.get('mandal_id') as string,
        }

        if (isNew) {
            await supabase.from('sectors').insert(payload)
        } else {
            await supabase.from('sectors').update(payload).eq('id', id)
        }

        redirect('/admin/geography/sectors')
    }

    return (
        <div className="space-y-6 max-w-lg">
            <h1 className="text-2xl font-bold text-slate-800">
                {isNew ? 'Add Sector' : 'Edit Sector'}
            </h1>

            <form action={save} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                        name="name"
                        defaultValue={sector?.name ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. Kondapur Sector 1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                    <input
                        name="code"
                        defaultValue={sector?.code ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. AP-GNT-KDP-S1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mandal</label>
                    <select
                        name="mandal_id"
                        defaultValue={sector?.mandal_id ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    >
                        <option value="">Select mandal</option>
                        {mandals?.map((mandal) => (
                            <option key={mandal.id} value={mandal.id}>{mandal.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors"
                    >
                        {isNew ? 'Create Sector' : 'Save Changes'}
                    </button>
                    <a
                        href="/admin/geography/sectors"
                        className="px-4 py-2 rounded-md text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors no-underline"
                    >
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    )
}