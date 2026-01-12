import React from 'react';
import { IconClose, IconSparkles, IconCheck } from './Icons';

interface VerboPlusModalProps {
  onClose: () => void;
  onSubscribe: () => void;
}

export const VerboPlusModal: React.FC<VerboPlusModalProps> = ({ onClose, onSubscribe }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in zoom-in-95">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
        >
            <IconClose className="w-5 h-5" />
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <IconSparkles className="w-8 h-8 text-yellow-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upgrade to Verbo+</h2>
            <p className="text-indigo-100 text-sm">Unlock the full power of AI-assisted debating.</p>
        </div>

        {/* Benefits */}
        <div className="p-8">
            <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                    <div className="p-1 bg-green-100 rounded-full text-green-600 mt-0.5"><IconCheck className="w-4 h-4" /></div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">Create Private & Timed Debates</h4>
                        <p className="text-xs text-slate-500">Host exclusive discussions and time-limited challenges.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="p-1 bg-green-100 rounded-full text-green-600 mt-0.5"><IconCheck className="w-4 h-4" /></div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">Advanced AI Tools</h4>
                        <p className="text-xs text-slate-500">Unlimited argument enhancement and source suggestions.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="p-1 bg-green-100 rounded-full text-green-600 mt-0.5"><IconCheck className="w-4 h-4" /></div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">Profile Badge</h4>
                        <p className="text-xs text-slate-500">Stand out with the exclusive Verbo+ badge.</p>
                    </div>
                </div>
            </div>

            <button 
                onClick={onSubscribe}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
            >
                Start Free Trial
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4">
                $4.99/month after 7-day trial. Cancel anytime.
            </p>
        </div>
      </div>
    </div>
  );
};