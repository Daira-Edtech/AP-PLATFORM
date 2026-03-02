
import React from 'react';
import { Download, Share2, Printer } from 'lucide-react';

const BriefCard: React.FC = () => {
  return (
    <div className="bg-white border-2 border-black rounded-lg p-8 shadow-xl max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center font-bold text-white text-[18px]">J</div>
            <span className="text-black font-extrabold text-[20px] tracking-tight">JIVEESHA</span>
          </div>
          <h2 className="text-[24px] font-bold uppercase tracking-tight">Cabinet Executive Brief</h2>
          <p className="text-[#555] font-medium uppercase text-[12px] tracking-widest">State Policy & Impact Analysis • Q1 2024</p>
        </div>
        <div className="flex gap-3 no-print">
          <button className="p-2 hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded transition-colors">
            <Printer size={18} />
          </button>
          <button className="p-2 hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded transition-colors">
            <Share2 size={18} />
          </button>
          <button className="bg-black text-white px-4 py-2 rounded text-[13px] font-bold flex items-center gap-2 hover:bg-[#333]">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-12 mb-10">
        <div className="col-span-2">
          <h3 className="text-[14px] font-bold uppercase text-[#888] mb-4">Executive Summary</h3>
          <p className="text-[16px] leading-relaxed text-[#222]">
            Overall screening compliance has reached a record <strong>98.8%</strong> across the state. Guntur and Krishna districts show significant improvement in nutritional outcomes, while the Northern Circars region (Srikakulam, Vizianagaram) remains a <strong>High Priority Zone</strong> requiring urgent policy intervention.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#F9F9F9] border-l-4 border-black">
              <span className="text-[11px] font-bold text-[#888]">IMPACT SCORE</span>
              <div className="text-[32px] font-black text-black">8.4<span className="text-[14px] text-green-600 font-bold ml-2">↑ 0.6</span></div>
              <p className="text-[11px] text-[#555]">Statewide ECD benchmark vs National Avg</p>
            </div>
            <div className="p-4 bg-[#F9F9F9] border-l-4 border-red-600">
              <span className="text-[11px] font-bold text-[#888]">URGENT ESCALATIONS</span>
              <div className="text-[32px] font-black text-red-600">42</div>
              <p className="text-[11px] text-[#555]">Waitlisted SAM referrals exceeding 48hrs</p>
            </div>
          </div>
        </div>
        <div className="col-span-1 border-l border-[#E5E5E5] pl-12 flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold uppercase text-[#888] mb-4">Risk Profile</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium">Stunting</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div className="h-full bg-black w-[42%]" />
                  </div>
                  <span className="text-[12px] font-bold">42%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium">Wasting</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div className="h-full bg-black w-[28%]" />
                  </div>
                  <span className="text-[12px] font-bold">28%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium">Anemia</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div className="h-full bg-black w-[55%]" />
                  </div>
                  <span className="text-[12px] font-bold">55%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <div className="text-[11px] text-[#888] uppercase font-bold mb-2">Verified By</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EEE]" />
              <div>
                <div className="text-[13px] font-bold">Dr. V. Satyanarayana</div>
                <div className="text-[11px] text-[#555]">Principal Health Commissioner</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefCard;
