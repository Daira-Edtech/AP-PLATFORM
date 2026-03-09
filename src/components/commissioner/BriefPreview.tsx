import React, { forwardRef } from 'react';
import { ShieldAlert, CheckCircle2, Eye, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface BriefPreviewProps {
    data: any;
}

const BriefPreview = forwardRef<HTMLDivElement, BriefPreviewProps>(({ data }, ref) => {
    if (!data || !data.stats) return null;

    const { meta, stats } = data;

    return (
        <div ref={ref} className="bg-white p-10 max-w-[900px] mx-auto relative group overflow-hidden"
            style={{ width: '210mm', minHeight: '297mm', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>

            {/* WATERMARK */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-35deg] opacity-[0.03] pointer-events-none select-none">
                <span className="text-[120px] font-black tracking-tighter">CONFIDENTIAL</span>
            </div>

            <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-black rounded flex items-center justify-center text-white font-black text-[32px]">J</div>
                    <div>
                        <h4 className="text-[12px] font-black tracking-[0.3em] uppercase text-[#888] mb-1">Government of Andhra Pradesh</h4>
                        <h2 className="text-[26px] font-black uppercase tracking-tight leading-none text-black">Jiveesha ECD Programme</h2>
                        <p className="text-[11px] font-bold text-[#AAA] mt-1 tracking-widest uppercase">
                            {meta.type === 'monthly' ? 'Executive Summary' : 'Impact Report'} • {meta.period}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-lg print:shadow-none">Confidential</span>
                    <p className="text-[10px] font-bold text-[#888] mt-2">Ref: CS/ICDS/2024/03-A</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-10 mb-12">
                <div className="col-span-8">
                    <h5 className="text-[13px] font-black uppercase text-black mb-4 tracking-widest flex items-center gap-2">
                        <Eye size={16} /> Executive Summary ({meta.scope})
                    </h5>
                    <ul className="space-y-4 text-[15px] text-[#333] leading-relaxed list-disc pl-5 font-medium">
                        <li>Total enrolled children in {meta.scope} currently stands at <span className="font-black text-black">{stats.totalChildren.toLocaleString('en-IN')}</span> across tracked AWCs.</li>
                        <li>Overall High/Critical risk children count is currently <span className="font-black text-red-600">{stats.highRiskCount.toLocaleString('en-IN')}</span>, reflecting a priority cohort for immediate intervention.</li>
                        <li>Escalation resolution pipeline continues to be monitored through targeted CDPO-level administrative directives across the state.</li>
                        <li>Focus districts require urgent secondary specialist deployment to manage diagnostic wait times effectively.</li>
                    </ul>
                </div>
                <div className="col-span-4 bg-[#F9F9F9] p-6 rounded-lg border border-[#EEE] h-fit">
                    <h5 className="text-[11px] font-black uppercase text-[#888] mb-4 tracking-widest">Key Actions ({meta.scope})</h5>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <ShieldAlert size={18} className="text-red-600 shrink-0" />
                            <p className="text-[12px] font-bold text-[#555] leading-tight">Review SAM clusters in priority districts.</p>
                        </div>
                        <div className="flex gap-3">
                            <CheckCircle2 size={18} className="text-black shrink-0" />
                            <p className="text-[12px] font-bold text-[#555] leading-tight">Approve procurement for diagnostic kits.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-10">
                {stats.kpis.slice(0, 6).map((kpi: any) => (
                    <div key={kpi.id} className="p-4 bg-white border border-black/10 rounded flex flex-col justify-between break-inside-avoid">
                        <span className="text-[9px] font-black text-[#888] uppercase tracking-widest">{kpi.label}</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-[20px] font-black">{kpi.value}</span>
                            <span className="text-[10px] font-bold text-green-600">↑{kpi.delta}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-10">
                <div className="break-inside-avoid">
                    <h5 className="text-[11px] font-black uppercase text-[#888] mb-4 tracking-widest">Risk Trend (6 Months)</h5>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { m: 'Oct', v: 42 }, { m: 'Nov', v: 38 }, { m: 'Dec', v: 39 },
                                { m: 'Jan', v: 35 }, { m: 'Feb', v: 34 }, { m: 'Mar', v: 32 }
                            ]}>
                                <Area type="monotone" dataKey="v" stroke="#000" fill="#000" fillOpacity={0.05} strokeWidth={3} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="flex flex-col justify-end break-inside-avoid">
                    <div className="p-5 bg-black text-white rounded-lg flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black opacity-60 uppercase block mb-1">State Impact Score</span>
                            <span className="text-[32px] font-black tracking-tight">8.4<span className="text-[14px] opacity-60 ml-2">/ 10</span></span>
                        </div>
                        <TrendingUp size={32} className="opacity-30" />
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[#EEE] flex justify-between items-center text-[10px] font-bold text-[#AAA] uppercase tracking-widest absolute bottom-10 left-10 right-10">
                <span>Generated by State Command Portal • Daira EdTech</span>
                <span>Generated: {new Date(meta.generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
});

BriefPreview.displayName = 'BriefPreview';

export default BriefPreview;
