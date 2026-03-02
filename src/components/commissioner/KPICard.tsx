'use client'

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { KPI } from '@/lib/commissioner/types';

const KPICard: React.FC<KPI> = ({ label, value, delta, trend, accent, comparisonLabel, comparisonValue }) => {
  const isPositive = delta >= 0;

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-5 w-[200px] shadow-sm relative overflow-hidden flex flex-col justify-between h-[154px] shrink-0">
      <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: accent }} />
      
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-1">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-bold text-black leading-tight">{value}</span>
        </div>
      </div>

      <div className="mt-1">
        <div className={`flex items-center gap-0.5 text-[12px] font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {delta !== 0 && (
            <>
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(delta)}%
            </>
          )}
        </div>
        
        {comparisonLabel && (
          <div className="text-[10px] text-[#888] mt-0.5 font-medium leading-tight">
            {comparisonLabel}: <span className="text-black font-bold">{comparisonValue}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2">
        {/* Fixed 50px SVG Sparkline */}
        <div className="w-[50px] h-[24px]">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 50 24">
            <polyline
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={trend.map((val, i) => {
                const max = Math.max(...trend);
                const min = Math.min(...trend);
                const range = max - min || 1;
                const x = (i / (trend.length - 1)) * 50;
                const y = 24 - ((val - min) / range) * 20 - 2;
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default KPICard;
