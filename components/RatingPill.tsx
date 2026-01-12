
import React, { useState, useEffect } from 'react';
import { FactRating } from '../types';
import { IconCheck, IconAlert, IconUnknown, IconShield, IconBan, IconCopy, IconEdit, IconSparkles } from './Icons';

interface RatingPillProps {
  rating: FactRating;
  label?: string;
  onClick?: () => void;
  className?: string;
}

const RATING_DESCRIPTIONS = {
  [FactRating.TRUE]: "This statement is supported by reliable sources.",
  [FactRating.SOMEWHAT_TRUE]: "Partially accurate but may lack important context.",
  [FactRating.NEUTRAL]: "This is an opinion or could not be verified by reliable sources.",
  [FactRating.MISLEADING]: "May use facts out of context to create a false impression.",
  [FactRating.FALSE]: "This statement has been proven false by reliable sources.",
  [FactRating.UNRELATED]: "This statement is not relevant to the debate topic."
};

export const RatingPill: React.FC<RatingPillProps> = ({ rating, label, onClick, className = '' }) => {
  const [showHelp, setShowHelp] = useState(false);
  let colorClass = '';
  let Icon = IconUnknown;
  let text = label;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showHelp) {
      timer = setTimeout(() => {
        setShowHelp(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showHelp]);

  switch (rating) {
    case FactRating.TRUE:
      colorClass = 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
      Icon = IconCheck;
      if (!text) text = "True";
      break;
    case FactRating.SOMEWHAT_TRUE:
      colorClass = 'bg-lime-100 text-lime-700 border-lime-200 hover:bg-lime-200';
      Icon = IconCheck;
      if (!text) text = "Somewhat True";
      break;
    case FactRating.NEUTRAL:
      colorClass = 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
      Icon = IconUnknown;
      if (!text) text = "Unverifiable / Opinion";
      break;
    case FactRating.MISLEADING:
      colorClass = 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200';
      Icon = IconAlert;
      if (!text) text = "Misleading";
      break;
    case FactRating.FALSE:
      colorClass = 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200';
      Icon = IconAlert;
      if (!text) text = "False";
      break;
    case FactRating.UNRELATED:
      colorClass = 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300';
      Icon = IconBan;
      if (!text) text = "Unrelated";
      break;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
        onClick();
    } else {
        setShowHelp(!showHelp);
    }
  };

  return (
    <div className="relative inline-block z-10">
      <button 
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${colorClass} ${className}`}
      >
        <Icon className="w-3 h-3" />
        <span>{text}</span>
      </button>

      {showHelp && (
        <>
           <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowHelp(false); }} />
           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-[11px] leading-tight rounded-lg shadow-xl z-50 text-center animate-in fade-in zoom-in-95 duration-200 font-medium">
             {RATING_DESCRIPTIONS[rating]}
             <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
           </div>
        </>
      )}
    </div>
  );
};

export const DuplicatePill: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [showHelp, setShowHelp] = useState(false);
  
    useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (showHelp) {
        timer = setTimeout(() => {
          setShowHelp(false);
        }, 3000);
      }
      return () => clearTimeout(timer);
    }, [showHelp]);

    return (
       <div className={`relative inline-block z-10 ${className}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }} 
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer"
          >
              <IconCopy className="w-3 h-3" />
              Duplicate
          </button>
  
          {showHelp && (
             <>
                 <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowHelp(false); }} />
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-[11px] leading-tight rounded-lg shadow-xl z-50 text-center animate-in fade-in zoom-in-95 duration-200 font-medium">
                    This argument is a semantic duplicate of a previously posted argument.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                </div>
             </>
          )}
       </div>
    );
}

export const EditedPill: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`relative inline-block z-10 ${className}`}>
             <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 select-none">
                 <IconEdit className="w-3 h-3" />
                 Edited
             </div>
        </div>
    );
}

export const AiGeneratedPill: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`relative inline-block z-10 ${className}`}>
             <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold border border-purple-200 select-none" title="Content enhanced or sources suggested by AI">
                 <IconSparkles className="w-3 h-3" />
                 AI Assisted
             </div>
        </div>
    );
}
