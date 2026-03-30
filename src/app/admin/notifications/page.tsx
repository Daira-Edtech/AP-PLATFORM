import { getNotificationRules } from './actions'
import NotificationManager from '@/components/admin/Notifications'

export const metadata = {
    title: 'Notifications | Admin',
    description: 'Configure and manage system-wide notification rules',
}

export default async function NotificationsPage() {
    const rules = await getNotificationRules()
    return <NotificationManager initialRules={rules} />
}
