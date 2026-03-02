import { createAdminClient } from '@/lib/supabase/admin'
import { UserTable } from '@/components/admin/UserTable'

export default async function UsersPage() {
    const supabase = createAdminClient()

    // Fetch data with a stable join and separate geography for manual resolution
    const [usersRes, authRes, geoTree] = await Promise.all([
        supabase
            .from('profiles')
            .select(`
                *,
                states(name),
                districts(name),
                mandals(name),
                sectors(name),
                panchayats(name),
                awcs(name)
            `)
            .order('created_at', { ascending: false }),
        supabase.auth.admin.listUsers(),
        Promise.all([
            supabase.from('states').select('id, name'),
            supabase.from('districts').select('id, name'),
            supabase.from('mandals').select('id, name'),
            supabase.from('sectors').select('id, name'),
            supabase.from('panchayats').select('id, name'),
            supabase.from('awcs').select('id, name')
        ])
    ])

    let users = usersRes.data || [];
    const authData = authRes.data;

    if (usersRes.error) {
        console.warn('Management join error (falling back):', usersRes.error.message);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error && data) users = data;
    }

    // Build resolution maps for all 6 levels
    const maps = {
        state: new Map(geoTree[0].data?.map(i => [i.id, i.name]) || []),
        district: new Map(geoTree[1].data?.map(i => [i.id, i.name]) || []),
        mandal: new Map(geoTree[2].data?.map(i => [i.id, i.name]) || []),
        sector: new Map(geoTree[3].data?.map(i => [i.id, i.name]) || []),
        panchayat: new Map(geoTree[4].data?.map(i => [i.id, i.name]) || []),
        awc: new Map(geoTree[5].data?.map(i => [i.id, i.name]) || [])
    };

    // Build a map of auth users
    const authUserMap = new Map<string, { email?: string, last_login?: string }>()
    if (authData?.users) {
        for (const au of authData.users) {
            authUserMap.set(au.id, { email: au.email, last_login: au.last_sign_in_at })
        }
    }

    // Merge auth data and resolve missing geography names
    const enrichedUsers = users.map((u) => {
        const auth = authUserMap.get(u.id);

        // Manual name resolution as backup for join failures
        const states = u.states || (u.state_id ? { name: maps.state.get(u.state_id) } : null);
        const districts = u.districts || (u.district_id ? { name: maps.district.get(u.district_id) } : null);
        const mandals = u.mandals || (u.mandal_id ? { name: maps.mandal.get(u.mandal_id) } : null);
        const sectors = u.sectors || (u.sector_id ? { name: maps.sector.get(u.sector_id) } : null);
        const panchayats = u.panchayats || (u.panchayat_id ? { name: maps.panchayat.get(u.panchayat_id) } : null);
        const awcs = u.awcs || (u.awc_id ? { name: maps.awc.get(u.awc_id) } : null);

        return {
            ...u,
            states,
            districts,
            mandals,
            sectors,
            panchayats,
            awcs,
            email: u.email || auth?.email || null,
            last_active: auth?.last_login || null
        }
    });

    return <UserTable users={enrichedUsers} />
}
