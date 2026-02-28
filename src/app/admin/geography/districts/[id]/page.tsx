import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EditDistrictPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const isNew = id === 'new'

    const { data: states } = await supabase.from('states').select('*').order('name')

    const { data: district } = isNew
        ? { data: null }
        : await supabase.from('districts').select('*').eq('id', id).single()

    async function save(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const payload = {
            name: formData.get('name') as string,
            code: formData.get('code') as string,
            state_id: formData.get('state_id') as string,
        }

        if (isNew) {
            await supabase.from('districts').insert(payload)
        } else {
            await supabase.from('districts').update(payload).eq('id', id)
        }

        redirect('/admin/geography/districts')
    }

    return (
        <div className="space-y-6 max-w-lg">
            <h1 className="text-2xl font-bold text-slate-800">
                {isNew ? 'Add District' : 'Edit District'}
            </h1>

            <form action={save} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                        name="name"
                        defaultValue={district?.name ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. Guntur"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                    <input
                        name="code"
                        defaultValue={district?.code ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. AP-GNT"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <select
                        name="state_id"
                        defaultValue={district?.state_id ?? ''}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    >
                        <option value="">Select state</option>
                        {states?.map((state) => (
                            <option key={state.id} value={state.id}>{state.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors"
                    >
                        {isNew ? 'Create District' : 'Save Changes'}
                    </button>

                    <Link
                        href="/admin/geography/districts"
                        className="px-4 py-2 rounded-md text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors no-underline"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}