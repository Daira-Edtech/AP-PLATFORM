export const dynamic = 'force-dynamic'

import DpoCdpos from '@/components/dpo/DpoCdpos'
import { getDpoCdposPerformance } from '@/lib/dpo/actions'

export default async function DpoCdposPage() {
    const data = await getDpoCdposPerformance()
    return <DpoCdpos initialData={data} />
}