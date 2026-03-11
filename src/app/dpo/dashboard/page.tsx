export const dynamic = 'force-dynamic'

import DpoDashboard from '@/components/dpo/DpoDashboard'
import { getDpoDashboardStats } from '@/lib/dpo/actions'

export default async function DPODashboardPage() {
    const stats = await getDpoDashboardStats()
    return <DpoDashboard stats={stats} />
}
