'use client'

import { use } from 'react'
import DistrictWorkforceView from '@/components/commissioner/DistrictWorkforceView'

export default function DistrictWorkforcePage({ params }: { params: Promise<{ districtId: string }> }) {
    const { districtId } = use(params)
    return <DistrictWorkforceView districtId={districtId} />
}
