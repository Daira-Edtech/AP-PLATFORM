export const dynamic = 'force-dynamic'

import DpoCdpoDetail from '@/components/dpo/DpoCdpoDetail'
import { getDpoCdpoDetail } from '@/lib/dpo/actions'
import { notFound } from 'next/navigation'

export default async function CdpoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getDpoCdpoDetail(id)

    if (!data) {
        notFound()
    }

    return <DpoCdpoDetail data={data} />
}
