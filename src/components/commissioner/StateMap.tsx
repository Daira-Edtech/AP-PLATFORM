'use client'

import React, { useState } from 'react';
import { DISTRICT_MOCK_DATA } from '@/lib/commissioner/constants';
import { DistrictData } from '@/lib/commissioner/types';

interface StateMapProps {
  onDistrictSelect: (district: DistrictData) => void;
}

const StateMap: React.FC<StateMapProps> = ({ onDistrictSelect }) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictData | null>(null);

  // Simplified geometry mapping to shades
  const gridPositions = [
    { id: '10', name: 'Vizianagaram', x: 280, y: 50 },
    { id: '8', name: 'Srikakulam', x: 310, y: 30 },
    { id: '9', name: 'Visakhapatnam', x: 260, y: 90 },
    { id: '3', name: 'East Godavari', x: 235, y: 135 },
    { id: '11', name: 'West Godavari', x: 210, y: 165 },
    { id: '5', name: 'Krishna', x: 185, y: 195 },
    { id: '4', name: 'Guntur', x: 155, y: 225 },
    { id: '7', name: 'Prakasam', x: 125, y: 265 },
    { id: '13', name: 'Nellore', x: 115, y: 325 },
    { id: '12', name: 'Kadapa', x: 85, y: 285 },
    { id: '2', name: 'Chittoor', x: 75, y: 355 },
    { id: '1', name: 'Anantapur', x: 45, y: 295 },
    { id: '6', name: 'Kurnool', x: 65, y: 235 },
  ];

  // Helper to get color based on coverage (0% White -> 100% Black)
  const getFillColor = (coverage: number) => {
    const intensity = Math.round((1 - coverage / 100) * 255);
    return `rgb(${intensity}, ${intensity}, ${intensity})`;
  };

  return (
    <div className="relative w-full h-[520px] bg-white border border-[#E5E5E5] rounded-lg p-6 flex flex-col shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[18px] font-bold text-black uppercase tracking-tight">District Coverage Map</h3>
          <p className="text-[12px] text-[#888888]">Andhra Pradesh — Shaded by Screening Reach</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#888]">0%</span>
            <div className="w-32 h-2 rounded-full bg-gradient-to-r from-white to-black border border-[#EEE]" />
            <span className="text-[10px] font-bold text-[#888]">100%</span>
          </div>
          <span className="text-[11px] text-[#555] font-medium">State Avg: <span className="font-bold">67%</span></span>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden rounded-lg bg-[#050A0F] border border-[#E5E5E5] group"
        style={{
          backgroundImage: 'url("/ap_satellite.png")',
          backgroundSize: '160%',
          backgroundPosition: '55% 35%'
        }}
      >
        {/* Deep darkening overlay for premium satellite feel */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none group-hover:bg-black/20 transition-all duration-700" />

        <svg viewBox="0 0 600 500" className="w-[98%] h-[98%] drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-10 transition-transform duration-700">
          {/* AP DISTRICT PATHS - Expanded Scale and Contiguous Logic */}

          {/* 1. Srikakulam */}
          <path d="M500,40 L560,30 L590,80 L520,110 Z" fill="#D1E9D1" fillOpacity="0.4" stroke="#8DA88D" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '8'); if (d) onDistrictSelect(d); }} />
          <text x="545" y="70" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Srikakulam</text>

          {/* 2. Vizianagaram */}
          <path d="M440,80 L500,40 L520,110 L470,140 Z" fill="#F9D9B9" fillOpacity="0.4" stroke="#B59A7A" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '10'); if (d) onDistrictSelect(d); }} />
          <text x="485" y="100" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Vizianagaram</text>

          {/* 3. Visakhapatnam */}
          <path d="M380,120 L440,80 L470,140 L420,170 Z" fill="#F9F9C5" fillOpacity="0.4" stroke="#B5B58D" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '9'); if (d) onDistrictSelect(d); }} />
          <text x="425" y="140" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Visakha</text>

          {/* 4. East Godavari */}
          <path d="M320,160 L380,120 L420,170 L360,200 L320,200 Z" fill="#D1E1F9" fillOpacity="0.4" stroke="#8D9DA8" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '3'); if (d) onDistrictSelect(d); }} />
          <text x="365" y="175" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>E. Godavari</text>

          {/* 5. West Godavari */}
          <path d="M280,210 L320,160 L320,200 L360,200 L330,240 L280,240 Z" fill="#D1E9D1" fillOpacity="0.4" stroke="#8DA88D" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '11'); if (d) onDistrictSelect(d); }} />
          <text x="315" y="215" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>W. Godavari</text>

          {/* 6. Krishna */}
          <path d="M220,240 L280,210 L280,240 L330,240 L310,300 L240,280 Z" fill="#F0D3F0" fillOpacity="0.4" stroke="#A88DA8" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '5'); if (d) onDistrictSelect(d); }} />
          <text x="270" y="260" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Krishna</text>

          {/* 7. Guntur */}
          <path d="M160,280 L220,240 L240,280 L310,300 L240,350 L180,330 Z" fill="#F9D9B9" fillOpacity="0.4" stroke="#B59A7A" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '4'); if (d) onDistrictSelect(d); }} />
          <text x="220" y="300" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Guntur</text>

          {/* 8. Prakasam */}
          <path d="M100,340 L160,280 L180,330 L240,350 L200,420 L120,400 Z" fill="#F9F9C5" fillOpacity="0.4" stroke="#B5B58D" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '7'); if (d) onDistrictSelect(d); }} />
          <text x="160" y="370" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Prakasam</text>

          {/* 9. Nellore */}
          <path d="M120,400 L200,420 L180,480 L100,470 L90,420 Z" fill="#D1E1F9" fillOpacity="0.4" stroke="#8D9DA8" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '13'); if (d) onDistrictSelect(d); }} />
          <text x="145" y="440" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Nellore</text>

          {/* 10. Kadapa */}
          <path d="M30,340 L100,340 L120,400 L90,420 L100,470 L40,450 Z" fill="#F0D3F0" fillOpacity="0.4" stroke="#A88DA8" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '12'); if (d) onDistrictSelect(d); }} />
          <text x="70" y="400" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Kadapa</text>

          {/* 11. Chittoor */}
          <path d="M10,420 L40,450 L100,470 L80,495 L10,490 Z" fill="#F9D9B9" fillOpacity="0.4" stroke="#B59A7A" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '2'); if (d) onDistrictSelect(d); }} />
          <text x="45" y="475" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Chittoor</text>

          {/* 12. Anantapur */}
          <path d="M10,300 L30,340 L40,450 L10,420 L5,340 Z" fill="#F9F9C5" fillOpacity="0.4" stroke="#B5B58D" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '1'); if (d) onDistrictSelect(d); }} />
          <text x="20" y="375" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Anantapur</text>

          {/* 13. Kurnool */}
          <path d="M10,210 L160,280 L100,340 L30,340 L10,300 Z" fill="#D1E1F9" fillOpacity="0.4" stroke="#8D9DA8" strokeWidth="1.2" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => { const d = DISTRICT_MOCK_DATA.find(d => d.id === '6'); if (d) onDistrictSelect(d); }} />
          <text x="60" y="280" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Kurnool</text>

        </svg>

        {/* Legend Overlay - More premium glassmorphism */}
        <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl p-6 border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-[12px] text-white z-20 min-w-[180px]">
          <h4 className="border-b border-white/10 pb-3 mb-4 font-bold uppercase tracking-[0.2em] text-[10px] text-white/50">District Intelligence</h4>
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
                <span className="text-[#AAAAAA]">Screening Coverage:</span>
                <span className="font-bold">{hoveredDistrict.coverage}%</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#AAAAAA]">Risk Children:</span>
                {/* Fix: use 'children' instead of 'activeChildren' */}
                <span className="font-bold">{(hoveredDistrict.children * 0.1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#AAAAAA]">Referral Completion:</span>
                {/* Fix: calculate referral efficiency from referralsDone and referralsActive */}
                <span className="font-bold">
                  {Math.round((hoveredDistrict.referralsDone / (hoveredDistrict.referralsActive + hoveredDistrict.referralsDone)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#AAAAAA]">Total Capacity:</span>
                {/* Fix: use 'children' instead of 'activeChildren' */}
                <span className="font-bold">{hoveredDistrict.children.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#333] text-[10px] text-center text-[#888] font-bold tracking-widest uppercase">
              Click to drill down
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateMap;
