import React from "react";
import { MoreHorizontal } from "lucide-react";

export interface FolderCardProps {
  title: string;
  count: number | string;
  colorClass: string; 
  tabColorClass: string;
  onClick?: () => void;
}

export function FolderCard({ title, count, colorClass, tabColorClass, onClick }: FolderCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`relative w-full h-40 sm:h-48 rounded-[28px] p-5 flex flex-col justify-end cursor-pointer hover:scale-[1.02] transition-transform shadow-[0_20px_40px_rgba(0,0,0,0.08)] ${colorClass}`}
    >
      {/* The Tab at the top (simulated using absolute positioning) */}
      <div className={`absolute top-0 right-0 w-1/2 h-8 ${tabColorClass} rounded-tr-[28px] rounded-bl-3xl z-0 transform -translate-y-[90%]`}></div>
      
      {/* The "Papers" inside the folder */}
      <div className="absolute top-4 left-6 right-6 h-16 flex gap-2 z-10 opacity-90">
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-t-xl h-full translate-y-2 relative shadow-sm">
          <div className="absolute top-3 left-3 right-8 h-2 bg-slate-100 rounded-full"></div>
          <div className="absolute top-7 left-3 right-12 h-2 bg-slate-100 rounded-full"></div>
        </div>
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-t-xl h-full translate-y-4 relative shadow-sm">
           <div className="absolute top-3 left-3 right-6 h-2 bg-slate-100/50 rounded-full"></div>
        </div>
      </div>

      {/* The Front Cover of the folder */}
      <div className={`absolute inset-0 rounded-[28px] ${colorClass} z-20`}></div>

      {/* Content overlay */}
      <div className="relative z-30 flex justify-between items-end w-full">
        <div>
          <h3 className="text-white font-bold text-lg leading-tight mb-1">{title}</h3>
          <p className="text-white/80 text-xs font-medium">{count}</p>
        </div>
        <button className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
