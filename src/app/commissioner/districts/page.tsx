'use client'

import { useState } from 'react'
import DistrictComparison from '@/components/commissioner/DistrictComparison'
import DistrictDetail from '@/components/commissioner/DistrictDetail'
import { CDPODetail, MandalDetail, AWCDetail, ChildDetail } from '@/components/commissioner/HierarchyDrillDown'
import { DISTRICT_MOCK_DATA } from '@/lib/commissioner/constants'
import { DrillDownPath } from '@/lib/commissioner/types'

export default function DistrictsPage() {
    const [drillPath, setDrillPath] = useState<DrillDownPath>({})

    const updatePath = (update: Partial<DrillDownPath>) => {
        setDrillPath(prev => ({ ...prev, ...update }))
    }

    const goBack = () => {
        setDrillPath(prev => {
            if (prev.childId) return { ...prev, childId: undefined }
            if (prev.awcId) return { ...prev, awcId: undefined }
            if (prev.mandalId) return { ...prev, mandalId: undefined }
            if (prev.cdpoId) return { ...prev, cdpoId: undefined }
            if (prev.districtId) return { ...prev, districtId: undefined }
            return prev
        })
    }

    // Level 5: Child
    if (drillPath.childId && drillPath.awcId && drillPath.mandalId && drillPath.cdpoId && drillPath.districtId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId)
        const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId)
        const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId)
        const awc = mandal?.awcList?.find(a => a.id === drillPath.awcId)
        const child = awc?.childrenList?.find(ch => ch.id === drillPath.childId)
        if (child) return <ChildDetail child={child} onBack={goBack} />
    }

    // Level 4: AWC
    if (drillPath.awcId && drillPath.mandalId && drillPath.cdpoId && drillPath.districtId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId)
        const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId)
        const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId)
        const awc = mandal?.awcList?.find(a => a.id === drillPath.awcId)
        if (awc) return <AWCDetail awc={awc} onSelectChild={(id) => updatePath({ childId: id })} onBack={goBack} />
    }

    // Level 3: Mandal
    if (drillPath.mandalId && drillPath.cdpoId && drillPath.districtId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId)
        const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId)
        const mandal = cdpo?.mandalList?.find(m => m.id === drillPath.mandalId)
        if (mandal) return <MandalDetail mandal={mandal} onSelectAWC={(id) => updatePath({ awcId: id })} onBack={goBack} />
    }

    // Level 2: CDPO
    if (drillPath.cdpoId && drillPath.districtId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId)
        const cdpo = district?.cdpoList?.find(c => c.id === drillPath.cdpoId)
        if (district && cdpo) return <CDPODetail district={district} cdpo={cdpo} onSelectMandal={(id) => updatePath({ mandalId: id })} onBack={goBack} />
    }

    // Level 1: District Detail
    if (drillPath.districtId) {
        const district = DISTRICT_MOCK_DATA.find(d => d.id === drillPath.districtId)
        if (district) return <DistrictDetail district={district} onSelectCDPO={(id) => updatePath({ cdpoId: id })} onBack={goBack} />
    }

    // Level 0: District Comparison
    return <DistrictComparison onDistrictSelect={(id) => setDrillPath({ districtId: id })} />
}
