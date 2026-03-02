'use client'

import React from 'react';
import { NAV_ITEMS, getIcon } from '@/lib/commissioner/constants';
import { AppView } from '@/lib/commissioner/types';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, collapsed }) => {
  return (
    <div 
      className={`fixed left-0 top-[56px] h-[calc(100vh-56px)] bg-white border-r border-[#E5E5E5] transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      <div className="flex flex-col py-2 overflow-y-auto h-full scrollbar-hide">
        {NAV_ITEMS.map((item, index) => (
          <React.Fragment key={item.id}>
            <button
              onClick={() => setActiveView(item.id)}
              className={`flex items-center w-full h-12 transition-all relative group overflow-hidden ${
                activeView === item.id 
                  ? 'bg-black text-white' 
                  : 'bg-white text-[#555555] hover:bg-[#F5F5F5]'
              }`}
            >
              {activeView === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white z-10" />
              )}
              
              <div className={`flex items-center justify-center shrink-0 ${collapsed ? 'w-16' : 'w-14'}`}>
                {getIcon(item.icon, 20)}
              </div>
              
              {!collapsed && (
                <span className="text-[13px] font-medium whitespace-nowrap">
                  {item.id}
                </span>
              )}

              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.id}
                </div>
              )}
            </button>
            
            {item.divider && (
              <div className="mx-4 my-2 border-t border-[#E5E5E5]" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
