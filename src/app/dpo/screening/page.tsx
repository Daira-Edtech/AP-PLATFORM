import DpoScreening from '@/components/dpo/DpoScreening';
import { getDpoScreeningStats } from '@/lib/dpo/actions';

export default async function ScreeningPage() {
    const stats = await getDpoScreeningStats();
    return <DpoScreening stats={stats} />;
}