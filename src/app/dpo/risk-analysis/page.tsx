export const dynamic = 'force-dynamic'

import DpoRiskAnalysis from '@/components/dpo/DpoRiskAnalysis';
import { getDpoRiskAnalysisData } from '@/lib/dpo/actions';

export default async function RiskAnalysisPage() {
    const stats = await getDpoRiskAnalysisData()

    return (
        <div className='animate-in fade-in duration-700'>
            <DpoRiskAnalysis stats={stats} />
        </div>
    )
}