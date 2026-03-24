import CdpoDashboard from '@/components/cdpo/CdpoDashboard'
import { getCdpoDashboardData } from '@/lib/cdpo/actions'

export const dynamic = 'force-dynamic';

export default async function CDPODashboard() {
    const data = await getCdpoDashboardData().catch(err => {
        console.error('Failed to load dashboard data:', err)
        return null
    })

    return (
        <CdpoDashboard
            initialStats={data?.stats}
            initialRiskDistribution={data?.riskDistribution}
            projectInfo={data?.projectInfo}
            initialMandalCoverage={data?.mandalCoverage}
        />
    )
}
