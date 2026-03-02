'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAssignmentHierarchy() {
    const supabase = createAdminClient()

    // 1. Fetch all geographic data
    const [
        { data: states },
        { data: districts },
        { data: mandals },
        { data: sectors },
        { data: panchayats },
        { data: awcs },
        { data: profiles }
    ] = await Promise.all([
        supabase.from('states').select('id, name').order('name'),
        supabase.from('districts').select('id, name, state_id').order('name'),
        supabase.from('mandals').select('id, name, district_id').order('name'),
        supabase.from('sectors').select('id, name, mandal_id').order('name'),
        supabase.from('panchayats').select('id, name, sector_id').order('name'),
        supabase.from('awcs').select('id, name, panchayat_id, sector_id').order('name'),
        // Fetch ALL profiles to see inactive ones too
        supabase.from('profiles').select('id, name, role, state_id, district_id, mandal_id, sector_id, panchayat_id, awc_id, is_active')
    ])

    if (!states || !districts) return null

    const allProfiles = profiles || []

    const buildNode = (
        id: string,
        name: string,
        unitName: string,
        roleLabel: string,
        type: 'STATE' | 'DISTRICT' | 'MANDAL' | 'SECTOR' | 'PANCHAYAT' | 'AWC',
        children: any[] = []
    ) => {
        // Find user assigned to this specific unit with a matching role
        const assignedUser = allProfiles.find(p => {
            const profileRole = p.role?.toLowerCase();
            switch (type) {
                case 'STATE': return p.state_id === id && profileRole === 'commissioner';
                case 'DISTRICT': return p.district_id === id && profileRole === 'district_officer';
                case 'MANDAL': return p.mandal_id === id && (profileRole === 'cdpo' || profileRole === 'supervisor');
                case 'SECTOR': return p.sector_id === id && profileRole === 'supervisor';
                case 'AWC': return p.awc_id === id && profileRole === 'aww';
                default: return false;
            }
        });

        const status = assignedUser
            ? (assignedUser.is_active ? 'ASSIGNED' : 'INACTIVE')
            : 'VACANT';

        return {
            id: id || `vacant-${type}-${unitName}-${Math.random()}`,
            name: assignedUser?.name || (status === 'VACANT' ? 'VACANT' : 'NAME UNKNOWN'),
            title: unitName || 'Unknown Unit',
            role: roleLabel,
            type: type,
            status: status as 'ASSIGNED' | 'VACANT' | 'INACTIVE',
            childrenCount: children.length,
            children: children
        }
    }

    // Build from top down
    const stateNodes = states.map(s => {
        const sDistricts = districts.filter(d => d.state_id === s.id);

        return buildNode(s.id, '', s.name, 'COMMISSIONER', 'STATE',
            sDistricts.map(d => {
                const dMandals = (mandals || []).filter(m => m.district_id === d.id);
                return buildNode(d.id, '', d.name, 'DISTRICT OFFICER', 'DISTRICT',
                    dMandals.map(m => {
                        const mSectors = (sectors || []).filter(sec => sec.mandal_id === m.id);
                        return buildNode(m.id, '', m.name, 'CDPO', 'MANDAL',
                            mSectors.map(sec => {
                                const secPanchayats = (panchayats || []).filter(p => p.sector_id === sec.id);
                                return buildNode(sec.id, '', sec.name, 'SUPERVISOR', 'SECTOR',
                                    secPanchayats.map(p => {
                                        const pAwcs = (awcs || []).filter(a => a.panchayat_id === p.id);
                                        return buildNode(p.id, '', p.name, 'PANCHAYAT', 'PANCHAYAT',
                                            pAwcs.map(a => buildNode(a.id, '', a.name, 'AWW', 'AWC'))
                                        )
                                    })
                                )
                            })
                        )
                    })
                )
            })
        )
    });

    // Root is either the first state or a virtual root if multiple states
    const root = (stateNodes.length === 1 ? stateNodes[0] : {
        id: 'root',
        name: 'System Root',
        title: 'All States',
        role: 'ADMIN',
        type: 'STATE' as 'STATE',
        status: 'ASSIGNED' as 'ASSIGNED',
        childrenCount: stateNodes.length,
        children: stateNodes
    }) as any;

    // Stats
    const stats = {
        unassignedAWWs: allProfiles.filter(p => p.role === 'aww' && !p.awc_id).length,
        unassignedSupervisors: allProfiles.filter(p => p.role === 'supervisor' && !p.sector_id).length,
        vacantAWCs: (awcs || []).filter(a => !allProfiles.some(p => p.awc_id === a.id)).length,
        vacantSectors: (sectors || []).filter(s => !allProfiles.some(p => p.sector_id === s.id)).length
    }

    return { root, stats }
}
