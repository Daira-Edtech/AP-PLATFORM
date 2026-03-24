'use client'

import React, { useState } from 'react';
import { DISTRICT_MOCK_DATA } from '@/lib/commissioner/constants';
import { DistrictData } from '@/lib/commissioner/types';
import { AP_DISTRICT_PATHS, AP_VIEWBOX } from '@/data/apDistrictPaths';
import { useLanguage } from '@/lib/commissioner/LanguageContext';

interface StateMapProps {
  onDistrictSelect: (district: DistrictData) => void;
}

const StateMap: React.FC<StateMapProps> = ({ onDistrictSelect }) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictData | null>(null);
  const { t } = useLanguage();

  // Pastel fill colors for visual variety
  const DISTRICT_COLORS: Record<string, string> = {
    '1': '#F9F9C5', '2': '#F9D9B9', '3': '#D1E1F9', '4': '#F9D9B9',
    '5': '#F0D3F0', '6': '#D1E1F9', '7': '#F9F9C5', '8': '#D1E9D1',
    '9': '#F9F9C5', '10': '#F9D9B9', '11': '#D1E9D1', '12': '#F0D3F0',
    '13': '#D1E1F9',
  };

  const DISTRICT_STROKES: Record<string, string> = {
    '1': '#B5B58D', '2': '#B59A7A', '3': '#8D9DA8', '4': '#B59A7A',
    '5': '#A88DA8', '6': '#8D9DA8', '7': '#B5B58D', '8': '#8DA88D',
    '9': '#B5B58D', '10': '#B59A7A', '11': '#8DA88D', '12': '#A88DA8',
    '13': '#8D9DA8',
  };

  return (
    <div className="relative w-full h-[520px] bg-white border border-[#E5E5E5] rounded-lg p-6 flex flex-col shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[18px] font-bold text-black uppercase tracking-tight">{t('map.title')}</h3>
          <p className="text-[12px] text-[#888888]">{t('map.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#888]">0%</span>
            <div className="w-32 h-2 rounded-full bg-gradient-to-r from-white to-black border border-[#EEE]" />
            <span className="text-[10px] font-bold text-[#888]">100%</span>
          </div>
          <span className="text-[11px] text-[#555] font-medium">{t('map.stateAvg')}: <span className="font-bold">67%</span></span>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden rounded-lg bg-[#050A0F] border border-[#E5E5E5]">
        <svg viewBox={AP_VIEWBOX} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Satellite and districts in same SVG = always aligned */}
          <image
            href="/ap_satellite_new.png"
            x="0" y="0"
            width="580" height="480"
            preserveAspectRatio="none"
          />
          <rect x="0" y="0" width="580" height="480" fill="black" opacity="0.3" />
          {AP_DISTRICT_PATHS.map((district) => {
            const districtData = DISTRICT_MOCK_DATA.find(d => d.id === district.id);
            const isHovered = hoveredDistrict?.id === district.id;
            return (
              <g key={district.id}>
                <path
                  d={district.path}
                  fill={DISTRICT_COLORS[district.id] || '#D1E9D1'}
                  fillOpacity={isHovered ? 0.8 : 0.4}
                  stroke={isHovered ? 'rgba(255,255,255,0.9)' : (DISTRICT_STROKES[district.id] || '#8DA88D')}
                  strokeWidth={isHovered ? 2 : 1.2}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => { if (districtData) onDistrictSelect(districtData); }}
                  onMouseEnter={() => districtData && setHoveredDistrict(districtData)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x={district.labelX}
                  y={district.labelY}
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}
                >
                  {district.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl p-6 border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-[12px] text-white z-20 min-w-[180px]">
          <h4 className="border-b border-white/10 pb-3 mb-4 font-bold uppercase tracking-[0.2em] text-[10px] text-white/50">{t('map.districtIntelligence')}</h4>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center group/item cursor-pointer">
              <span className="flex items-center gap-2.5 text-white/80 group-hover/item:text-white transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                Guntur
              </span>
              <span className="font-black text-[14px] text-green-400">92%</span>
            </div>
            <div className="flex justify-between items-center group/item cursor-pointer">
              <span className="flex items-center gap-2.5 text-white/80 group-hover/item:text-white transition-colors">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                Kurnool
              </span>
              <span className="font-black text-[14px] text-red-400">38%</span>
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredDistrict && (
          <div className="absolute top-4 right-4 p-4 bg-black text-white rounded shadow-2xl w-56 z-50 border border-[#333] animate-in fade-in zoom-in duration-200">
            <h4 className="font-bold text-[15px] mb-3 border-b border-[#333] pb-2 uppercase tracking-wide">{hoveredDistrict.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-[#AAAAAA]">{t('map.screeningCoverage')}</span>
                <span className="font-bold">{hoveredDistrict.coverage}%</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#AAAAAA]">{t('map.riskChildren')}</span>
                <span className="font-bold">{(hoveredDistrict.children * 0.1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#AAAAAA]">{t('map.referralCompletion')}</span>
                <span className="font-bold">
                  {Math.round((hoveredDistrict.referralsDone / (hoveredDistrict.referralsActive + hoveredDistrict.referralsDone)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#AAAAAA]">{t('map.totalCapacity')}</span>
                <span className="font-bold">{hoveredDistrict.children.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#333] text-[10px] text-center text-[#888] font-bold tracking-widest uppercase">
              {t('map.clickToDrill')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateMap;
