import { getHealthStats } from './actions'
import SystemHealth from '@/components/admin/SystemHealth'

export const metadata = {
    title: 'System Health | Admin',
    description: 'Monitor system performance and service status',
}

export default async function HealthPage() {
    const stats = await getHealthStats()
    return <SystemHealth stats={stats} />
}
