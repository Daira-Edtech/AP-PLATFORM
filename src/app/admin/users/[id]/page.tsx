import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EditUserPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const [
        { data: user },
        { data: awcs },
        { data: mandals },
        { data: districts },
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('awcs').select('*').order('name'),
        supabase.from('mandals').select('*').order('name'),
        supabase.from('districts').select('*').order('name'),
    ])

    if (!user) redirect('/admin/users')

    async function save(formData: FormData) {
        'use server'
        const supabase = await createClient()

        await supabase
            .from('profiles')
            .update({
                name: formData.get('name') as string,
                phone: formData.get('phone') as string || null,
                role: formData.get('role') as string,
                awc_id: formData.get('awc_id') as string || null,
                mandal_id: formData.get('mandal_id') as string || null,
                district_id: formData.get('district_id') as string || null,
                is_active: formData.get('is_active') === 'true',
            })
            .eq('id', id)

        redirect('/admin/users')
    }

    const roles = [
        { value: 'aww', label: 'AWW (Anganwadi Worker)' },
        { value: 'supervisor', label: 'Supervisor (Mandal Team)' },
        { value: 'cdpo', label: 'CDPO' },
        { value: 'district_officer', label: 'District Officer' },
        { value: 'commissioner', label: 'Commissioner' },
        { value: 'system_admin', label: 'System Admin' },
    ]

    return (
        <div className="space-y-6 max-w-lg">
            <h1 className="text-2xl font-bold text-slate-800">Edit User</h1>

            <form action={save} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                        name="name"
                        defaultValue={user.name}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                        name="phone"
                        defaultValue={user.phone ?? ''}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                        name="role"
                        defaultValue={user.role}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    >
                        {roles.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                    <p className="text-xs text-slate-400">Geographic assignment</p>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">AWC</label>
                        <select
                            name="awc_id"
                            defaultValue={user.awc_id ?? ''}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        >
                            <option value="">None</option>
                            {awcs?.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mandal</label>
                        <select
                            name="mandal_id"
                            defaultValue={user.mandal_id ?? ''}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        >
                            <option value="">None</option>
                            {mandals?.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                        <select
                            name="district_id"
                            defaultValue={user.district_id ?? ''}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        >
                            <option value="">None</option>
                            {districts?.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                        name="is_active"
                        defaultValue={user.is_active ? 'true' : 'false'}
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
                        Save Changes
                    </button>

                    <a
                        href="/admin/users"
                        className="px-4 py-2 rounded-md text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors no-underline"
                    >
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    )
}
