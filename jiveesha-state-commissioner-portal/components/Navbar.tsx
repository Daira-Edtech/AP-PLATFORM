
import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { AppView } from '../types';

interface NavbarProps {
  currentView: AppView;
  userName: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, userName }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-[56px] bg-black flex items-center justify-between px-6 z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-bold text-black text-[14px]">J</div>
          <span className="text-white font-bold text-[14px] tracking-tight">JIVEESHA</span>
        </div>
        <div className="h-4 w-[1px] bg-[#333333]" />
        <span className="text-[#888888] text-[11px] font-bold tracking-widest uppercase">STATE COMMAND</span>
      </div>

      {/* Breadcrumb Section */}
      <div className="flex items-center text-[13px] gap-2 ml-auto mr-8">
        <span className="text-[#AAAAAA]">State</span>
        <span className="text-[#AAAAAA] opacity-50">/</span>
        <span className="text-white font-medium">{currentView}</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        <button className="relative text-white opacity-80 hover:opacity-100 transition-opacity">
          <Bell size={18} />
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-black" />
        </button>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-[#AAAAAA] text-[12px] leading-tight">Commissioner</span>
            <span className="text-white text-[13px] font-medium leading-tight">{userName}</span>
          </div>
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=333&color=fff`} 
            alt="Profile" 
            className="w-8 h-8 rounded-full border border-[#333]"
          />
          <ChevronDown size={14} className="text-[#AAAAAA] group-hover:text-white transition-colors" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
