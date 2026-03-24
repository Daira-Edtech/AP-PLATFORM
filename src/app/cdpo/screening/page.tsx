import CdpoScreening from '@/components/cdpo/CdpoScreening';
import { getScreeningMatrixData, getCdpoDashboardData } from '@/lib/cdpo/actions';

export const dynamic = 'force-dynamic';

export default async function CdpoScreeningPage() {
    const [screeningData, dashboardData] = await Promise.all([
        getScreeningMatrixData(),
        getCdpoDashboardData()
    ]).catch(err => {
        console.error('Failed to fetch screening data:', err)
        return [null, null]
    })

    return (
        <CdpoScreening
            initialData={screeningData ? {
                ...screeningData,
                projectName: dashboardData?.projectInfo?.name
            } : undefined}
        />
    )
}