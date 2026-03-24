import CdpoChildren from '@/components/cdpo/CdpoChildren';
import { getChildrenRegistry, getCdpoDashboardData } from '@/lib/cdpo/actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const [childrenData, dashboardData] = await Promise.all([
        getChildrenRegistry(1, 100),
        getCdpoDashboardData()
    ]).catch(err => {
        console.error('Failed to fetch children registry:', err)
        return [null, null]
    })

    return (
        <CdpoChildren
            initialChildren={childrenData?.children}
            totalCount={childrenData?.total}
            projectName={dashboardData?.projectInfo?.name}
        />
    );
}