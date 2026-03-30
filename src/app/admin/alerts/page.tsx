import { getAlerts } from './actions'
import AlertsManager from '@/components/admin/AlertsManager'

export const metadata = {
    title: 'Alerts | Admin',
}

export default async function AlertsPage() {
    const alerts = await getAlerts()
    return <AlertsManager alerts={alerts} />
}
