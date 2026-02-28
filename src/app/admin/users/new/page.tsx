import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function NewUserPage() {
    const supabase = await createClient()

    const [
        { data: awcs },
        { data: mandals },
        { data: districts },
    ] = await Promise.all([
        supabase.from('awcs').select('*').order('name'),
        supabase.from('mandals').select('*').order('name'),
        supabase.from('districts').select('*').order('name'),
    ])

    async function createUser(formData: FormData) {
        'use server'

        const role = formData.get('role') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const name = formData.get('name') as string
        const phone = formData.get('phone') as string
        const awc_id = formData.get('awc_id') as string
        const mandal_id = formData.get('mandal_id') as string
        const district_id = formData.get('district_id') as string

        const adminClient = createAdminClient()

        const { data, error } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role },
        })

        if (error || !data.user) return

        await adminClient
            .from('profiles')
            .upsert({
                id: data.user.id,
                name,
                email,
                phone: phone || null,
                role,
                awc_id: awc_id || null,
                mandal_id: mandal_id || null,
                district_id: district_id || null,
            })
            .eq('id', data.user.id)

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
            <h1 className="text-2xl font-bold text-slate-800">Add User</h1>

            <form action={createUser} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                        name="name"
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. Lakshmi Devi"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. lakshmi@jiveesha.in"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="Min 8 characters"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                        name="phone"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                        placeholder="e.g. 9876543210"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                        name="role"
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                    >
                        <option value="">Select role</option>
                        {roles.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400 mb-3">Assign to geographic entity based on role</p>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">AWC (for AWW)</label>
                            <select
                                name="awc_id"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                            >
                                <option value="">Select AWC</option>
                                {awcs?.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mandal (for Supervisor / CDPO)</label>
                            <select
                                name="mandal_id"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                            >
                                <option value="">Select Mandal</option>
                                {mandals?.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">District (for District Officer)</label>
                            <select
                                name="district_id"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white"
                            >
                                <option value="">Select District</option>
                                {districts?.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors"
                    >
                        Create User
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
