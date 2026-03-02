'use server'

import { createAdminClient as getAdminClient } from '@/lib/supabase/admin'

import { revalidatePath } from 'next/cache'

export async function getGeographicTree() {
    const supabase = getAdminClient()

    const [
        { data: states },
        { data: districts },
        { data: mandals },
        { data: sectors },
        { data: panchayats },
        { data: awcs }
    ] = await Promise.all([
        supabase.from('states').select('*').order('name'),
        supabase.from('districts').select('*').order('name'),
        supabase.from('mandals').select('*').order('name'),
        supabase.from('sectors').select('*').order('name'),
        supabase.from('panchayats').select('*').order('name'),
        supabase.from('awcs').select('*').order('name')
    ])

    return {
        states: states || [],
        districts: districts || [],
        mandals: mandals || [],
        sectors: sectors || [],
        panchayats: panchayats || [],
        awcs: awcs || []
    }
}

export async function getEntityDetails(id: string, type: string) {
    const supabase = getAdminClient()
    let table = ''

    switch (type) {
        case 'STATE': table = 'states'; break;
        case 'DISTRICT': table = 'districts'; break;
        case 'MANDAL': table = 'mandals'; break;
        case 'SECTOR': table = 'sectors'; break;
        case 'PANCHAYAT': table = 'panchayats'; break;
        case 'AWC': table = 'awcs'; break;
        default: return null;
    }

    const { data: entity } = await supabase.from(table).select('*').eq('id', id).single()

    let personnel: any[] = []

    if (type === 'STATE') {
        // State level + all below
        const { data: profiles } = await supabase.from('profiles').select('id, name, role, is_active').eq('state_id', id)
        personnel = profiles || []

        const { data: dIds } = await supabase.from('districts').select('id').eq('state_id', id)
        const districtIds = dIds?.map(d => d.id) || []
        if (districtIds.length > 0) {
            const { data: dProfiles } = await supabase.from('profiles').select('id, name, role, is_active').in('district_id', districtIds)
            personnel = [...personnel, ...(dProfiles || [])]

            const { data: mIds } = await supabase.from('mandals').select('id').in('district_id', districtIds)
            const mandalIds = mIds?.map(m => m.id) || []
            if (mandalIds.length > 0) {
                const { data: mProfiles } = await supabase.from('profiles').select('id, name, role, is_active').in('mandal_id', mandalIds)
                personnel = [...personnel, ...(mProfiles || [])]

                const { data: aIds } = await supabase.from('awcs').select('id').in('mandal_id', mandalIds)
                const awcIds = aIds?.map(a => a.id) || []
                if (awcIds.length > 0) {
                    const { data: aProfiles } = await supabase.from('profiles').select('id, name, role, is_active').in('awc_id', awcIds)
                    personnel = [...personnel, ...(aProfiles || [])]
                }
            }
        }
    } else if (type === 'DISTRICT') {
        const { data: p1 } = await supabase.from('profiles').select('id, name, role, is_active').eq('district_id', id)
        personnel = p1 || []

        const { data: mIds } = await supabase.from('mandals').select('id').eq('district_id', id)
        const mandalIds = mIds?.map(m => m.id) || []
        if (mandalIds.length > 0) {
            const { data: p2 } = await supabase.from('profiles').select('id, name, role, is_active').in('mandal_id', mandalIds)
            personnel = [...personnel, ...(p2 || [])]

            const { data: aIds } = await supabase.from('awcs').select('id').in('mandal_id', mandalIds)
            const awcIds = aIds?.map(a => a.id) || []
            if (awcIds.length > 0) {
                const { data: p3 } = await supabase.from('profiles').select('id, name, role, is_active').in('awc_id', awcIds)
                personnel = [...personnel, ...(p3 || [])]
            }
        }
    } else if (type === 'MANDAL') {
        const { data: p1 } = await supabase.from('profiles').select('id, name, role, is_active').eq('mandal_id', id)
        personnel = p1 || []

        const { data: aIds } = await supabase.from('awcs').select('id').eq('mandal_id', id)
        const awcIds = aIds?.map(a => a.id) || []
        if (awcIds.length > 0) {
            const { data: p2 } = await supabase.from('profiles').select('id, name, role, is_active').in('awc_id', awcIds)
            personnel = [...personnel, ...(p2 || [])]
        }
    } else if (type === 'SECTOR' || type === 'PANCHAYAT') {
        const field = type === 'SECTOR' ? 'sector_id' : 'panchayat_id';
        const { data: awcs } = await supabase.from('awcs').select('id').eq(field, id);
        const awcIds = awcs?.map(a => a.id) || [];
        if (awcIds.length > 0) {
            const { data: p1 } = await supabase.from('profiles').select('id, name, role, is_active').in('awc_id', awcIds)
            personnel = p1 || []
        }
    } else if (type === 'AWC') {
        const { data: p1 } = await supabase.from('profiles').select('id, name, role, is_active').eq('awc_id', id)
        personnel = p1 || []
    }

    // Deduplicate profiles by ID
    const uniquePersonnel = Array.from(new Map(personnel.map(p => [p.id, p])).values());

    return { ...entity, personnel: uniquePersonnel }
}

export async function updateEntity(id: string, type: string, updates: any) {
    const supabase = getAdminClient()
    let table = ''

    switch (type) {
        case 'STATE': table = 'states'; break;
        case 'DISTRICT': table = 'districts'; break;
        case 'MANDAL': table = 'mandals'; break;
        case 'SECTOR': table = 'sectors'; break;
        case 'PANCHAYAT': table = 'panchayats'; break;
        case 'AWC': table = 'awcs'; break;
        default: throw new Error('Invalid type');
    }

    const { error } = await supabase.from(table).update(updates).eq('id', id)
    if (error) {
        console.error('Update error:', error);
        throw error;
    }

    revalidatePath('/admin/geography')
}

export async function unassignUser(userId: string, entityType: string) {
    const supabase = getAdminClient()

    // Logic: Clear the relevant geographic field AND all child levels to ensure they disappear from the branch
    const updates: any = {};

    switch (entityType) {
        case 'STATE':
            updates.state_id = null;
            updates.district_id = null;
            updates.mandal_id = null;
            updates.awc_id = null;
            break;
        case 'DISTRICT':
            updates.district_id = null;
            updates.mandal_id = null;
            updates.awc_id = null;
            break;
        case 'MANDAL':
            updates.mandal_id = null;
            updates.awc_id = null;
            break;
        case 'SECTOR':
        case 'PANCHAYAT':
        case 'AWC':
            updates.awc_id = null;
            break;
        default:
            throw new Error('Invalid unassign target');
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) throw error
    revalidatePath('/admin/geography')
}

export async function deleteEntity(id: string, type: string) {
    const supabase = getAdminClient()
    let table = ''

    switch (type) {
        case 'STATE': table = 'states'; break;
        case 'DISTRICT': table = 'districts'; break;
        case 'MANDAL': table = 'mandals'; break;
        case 'SECTOR': table = 'sectors'; break;
        case 'PANCHAYAT': table = 'panchayats'; break;
        case 'AWC': table = 'awcs'; break;
        default: throw new Error('Invalid type');
    }

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    revalidatePath('/admin/geography')
}

export async function createEntity(type: string, data: any) {
    const supabase = getAdminClient()
    let table = ''

    switch (type) {
        case 'STATE': table = 'states'; break;
        case 'DISTRICT': table = 'districts'; break;
        case 'MANDAL': table = 'mandals'; break;
        case 'SECTOR': table = 'sectors'; break;
        case 'PANCHAYAT': table = 'panchayats'; break;
        case 'AWC': table = 'awcs'; break;
        default: throw new Error('Invalid type');
    }

    const { error } = await supabase.from(table).insert([data])
    if (error) {
        console.error('Create error:', error);
        throw error;
    }

    revalidatePath('/admin/geography')
}

export async function getEntitiesByParent(parentType: string, parentId: string) {
    const supabase = getAdminClient()
    let table = ''
    let foreignKey = ''

    switch (parentType) {
        case 'STATE':
            table = 'districts';
            foreignKey = 'state_id';
            break;
        case 'DISTRICT':
            table = 'mandals';
            foreignKey = 'district_id';
            break;
        case 'MANDAL':
            table = 'sectors';
            foreignKey = 'mandal_id';
            break;
        case 'SECTOR':
            table = 'panchayats';
            foreignKey = 'sector_id';
            break;
        case 'PANCHAYAT':
            table = 'awcs';
            foreignKey = 'panchayat_id';
            break;
        default:
            return [];
    }

    const { data, error } = await supabase
        .from(table)
        .select('id, name')
        .eq(foreignKey, parentId)
        .order('name');

    if (error) {
        console.error(`Error fetching ${table}:`, error);
        return [];
    }

    return data || [];
}

export async function getAwcsBySector(sectorId: string) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('awcs')
        .select('id, name')
        .eq('sector_id', sectorId)
        .order('name');

    if (error) return [];
    return data || [];
}

