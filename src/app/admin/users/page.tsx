import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function UsersPage() {
    const supabase = createAdminClient()

    const [{ data: users }, { data: authData }] = await Promise.all([
        supabase
            .from('profiles')
            .select(`
      *,
      awcs(name),
      mandals(name),
      districts(name)
    `)
            .order('created_at', { ascending: false }),
        supabase.auth.admin.listUsers(),
    ])

    // Build a map of auth user emails by ID
    const authEmailMap = new Map<string, string>()
    if (authData?.users) {
        for (const au of authData.users) {
            if (au.email) authEmailMap.set(au.id, au.email)
        }
    }

    // Merge auth email into profiles where profiles.email is missing
    const enrichedUsers = users?.map((u) => ({
        ...u,
        email: u.email || authEmailMap.get(u.id) || null,
    }))

    const roleColors: Record<string, string> = {
        system_admin: 'bg-purple-100 text-purple-700',
        aww: 'bg-blue-100 text-blue-700',
        supervisor: 'bg-yellow-100 text-yellow-700',
        cdpo: 'bg-green-100 text-green-700',
        district_officer: 'bg-orange-100 text-orange-700',
        commissioner: 'bg-red-100 text-red-700',
    }



    return (
        <div className="space-y-6">


            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Users</h1>
                    <p className="text-sm text-slate-500 mt-1">{enrichedUsers?.length ?? 0} users total</p>
                </div>
                <Link
                    href="/admin/users/new"
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors no-underline"
                >
                    Add User
                </Link>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-800">
                        <tr>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Phone</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Assigned To</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrichedUsers?.map((user) => {
                            const assignedTo =
                                (user.awcs as any)?.name ||
                                (user.mandals as any)?.name ||
                                (user.districts as any)?.name ||
                                '—'

                            return (
                                <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-white">{user.name}</td>
                                    <td className="px-4 py-3 text-slate-400">{user.email ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-400">{user.phone ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">{assignedTo}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="text-slate-400 hover:text-white text-xs underline"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                        {(!enrichedUsers || enrichedUsers.length === 0) && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
