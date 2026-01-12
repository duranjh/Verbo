
import React, { useState } from 'react';
import { IconClose, IconAlert, IconCheck, IconFlag } from './Icons';
import { ReportTargetType } from '../types';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: ReportTargetType;
    targetId: string;
    targetContent?: string;
}

const REPORT_REASONS = [
    "Harassment or Hate Speech",
    "Spam or Misleading Content",
    "Violence or Physical Harm",
    "Inappropriate or Obscene Content",
    "Poor Behavior / Unruly",
    "Off-Topic / Irrelevant",
    "Other"
];

export const ReportModal: React.FC<ReportModalProps> = ({ 
    isOpen, onClose, targetType, targetId, targetContent 
}) => {
    const [reason, setReason] = useState(REPORT_REASONS[0]);
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate API Call
        setTimeout(() => {
            console.log(`Reported ${targetType} (${targetId}): ${reason} - ${details}`);
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setDetails('');
                setReason(REPORT_REASONS[0]);
                onClose();
            }, 2000);
        }, 1000);
    };

    if (isSuccess) {
        return (
            <div 
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                 <div className="bg-white rounded-xl p-8 shadow-2xl animate-in zoom-in-95 text-center max-w-sm w-full">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Report Received</h3>
                    <p className="text-slate-500 text-sm">Thank you for helping keep Verbo safe. Our team will review this shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <IconClose className="w-5 h-5" />
                </button>
                
                <div className="p-6 border-b border-slate-100 bg-red-50/50 rounded-t-xl">
                    <div className="flex items-center gap-2 mb-1 text-red-600">
                        <IconFlag className="w-5 h-5" />
                        <h3 className="font-bold text-lg">Report Content</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                        Reporting {targetType.toLowerCase()}: <span className="font-mono text-slate-700">{targetId.slice(0, 8)}...</span>
                    </p>
                    {targetContent && (
                        <div className="mt-2 p-2 bg-white/60 border border-red-100 rounded text-xs text-slate-600 italic truncate">
                            "{targetContent.substring(0, 60)}..."
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason for reporting</label>
                        <div className="relative">
                            <select 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-100 font-medium text-slate-700 cursor-pointer"
                            >
                                {REPORT_REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Additional Details (Optional)</label>
                        <textarea 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Please provide any specific details or context..."
                            className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
