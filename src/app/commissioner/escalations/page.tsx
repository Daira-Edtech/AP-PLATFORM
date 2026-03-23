'use client'

import { useEffect, useState } from 'react'
import EscalationView from '@/components/commissioner/EscalationView'
import { getCommissionerEscalations } from '@/lib/commissioner/services/dashboardService'
import { Escalation } from '@/lib/commissioner/types'
import { Loader2 } from 'lucide-react'

export default function EscalationsPage() {
    const [escalations, setEscalations] = useState<Escalation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchEscalations() {
            try {
                const data = await getCommissionerEscalations()
                setEscalations(data)
            } catch (error) {
                console.error('Failed to fetch escalations:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchEscalations()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        )
    }

    return <EscalationView escalations={escalations} />
}
