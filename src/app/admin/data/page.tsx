import { getDataStats } from './actions'
import DataManagement from '@/components/admin/DataManagement'

export const metadata = {
    title: 'Data Management | Admin',
    description: 'System-wide data backup, export, and maintenance',
}

export default async function DataPage() {
    const stats = await getDataStats()
    return <DataManagement stats={stats} />
}
