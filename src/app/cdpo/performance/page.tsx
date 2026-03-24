import CdpoPerformance from '@/components/cdpo/CdpoPerformance';
import { getAwwPerformanceData, getCdpoDashboardData } from '@/lib/cdpo/actions';

export const dynamic = 'force-dynamic';

export default async function CdpoPerformancePage() {
    const [performanceData, dashboardData] = await Promise.all([
        getAwwPerformanceData(),
        getCdpoDashboardData()
    ]).catch(err => {
        console.error('Failed to fetch performance data:', err)
        return [null, null]
    })

    return (
        <CdpoPerformance
            initialPerformances={performanceData?.performances}
            initialHighlights={performanceData?.highlights}
            projectName={dashboardData?.projectInfo?.name}
        />
    )
}