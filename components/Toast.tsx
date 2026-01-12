import React, { useEffect } from 'react';
import { IconCheck, IconBan, IconClose, IconAlert } from './Icons';

interface ToastProps {
    message: string;
    type?: 'info' | 'error' | 'success';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
         <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 max-w-lg cursor-pointer" onClick={onClose}>
            <div className={`p-2 rounded-lg ${type === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}>
                {type === 'error' ? <IconBan className="w-6 h-6 text-white" /> : <IconCheck className="w-6 h-6 text-white" />}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm mb-1">{type === 'error' ? 'Notice' : 'Notification'}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
            </div>
            <button className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
                <IconClose className="w-5 h-5 text-slate-400" />
            </button>
         </div>
    );
};