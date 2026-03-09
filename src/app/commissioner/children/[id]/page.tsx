'use client'

import { use } from 'react'
import ChildDetailView from '@/components/commissioner/ChildDetailView'

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <ChildDetailView childId={id} />
}
