import DpoWorkforce from '@/components/dpo/DpoWorkforce';
import { getDpoWorkforceData } from '@/lib/dpo/actions';

export const dynamic = 'force-dynamic';

export default async function WorkforcePage() {
    const data = await getDpoWorkforceData().catch(err => {
        console.error('Failed to fetch workforce data:', err);
        return null;
    });

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Unable to load workforce data</p>
            </div>
        );
    }

    return <DpoWorkforce stats={data} />;
}