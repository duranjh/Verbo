
import React, { useState, useRef } from 'react';
import { IconClose, IconChevronDown, IconImage, IconTrash } from './Icons';

interface FeedbackModalProps {
    onClose: () => void;
}

const FEEDBACK_TYPES = [
    "General Feedback",
    "Feature Request",
    "Report a Bug"
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
    const [text, setText] = useState('');
    const [feedbackType, setFeedbackType] = useState(FEEDBACK_TYPES[0]); // Default to General
    const [screenshot, setScreenshot] = useState<{file: File, preview: string} | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Basic validation for image
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                setScreenshot({
                    file,
                    preview: event.target?.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = () => {
        setScreenshot(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        // Simulate API call
        setTimeout(() => {
            setIsSending(false);
            setSent(true);
            setTimeout(onClose, 2000);
        }, 1000);
    };

    if (sent) {
        return (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl p-8 shadow-2xl animate-in zoom-in-95 text-center max-w-sm w-full">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Feedback Sent!</h3>
                    <p className="text-slate-500">Thank you for helping us improve Verbo.</p>
                </div>
             </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><IconClose className="w-5 h-5" /></button>
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg">Send Feedback</h3>
                    <p className="text-xs text-slate-500">Found a bug or have a suggestion?</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
                    
                    {/* Feedback Type Dropdown */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Feedback Type</label>
                        <div className="relative">
                            <select 
                                value={feedbackType}
                                onChange={(e) => setFeedbackType(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-100 font-medium text-slate-700 cursor-pointer"
                            >
                                {FEEDBACK_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Text Area */}
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Details</label>
                        <textarea 
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder={feedbackType === 'Report a Bug' ? "Describe what happened..." : "Tell us what you think..."}
                            className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                            required
                        />
                    </div>

                    {/* Screenshot Upload (Only for Bug Report) */}
                    {feedbackType === 'Report a Bug' && (
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Attachment</label>
                             {screenshot ? (
                                 <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                     <div className="flex items-center gap-3 overflow-hidden">
                                         <div className="w-10 h-10 rounded bg-slate-200 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${screenshot.preview})` }}></div>
                                         <span className="text-xs text-slate-600 truncate font-medium">{screenshot.file.name}</span>
                                     </div>
                                     <button type="button" onClick={removeFile} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                         <IconTrash className="w-4 h-4" />
                                     </button>
                                 </div>
                             ) : (
                                 <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <IconImage className="w-4 h-4" />
                                    <span>Attach Screenshot</span>
                                </button>
                             )}
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileSelect} 
                             />
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                         <button 
                            type="submit" 
                            disabled={!text.trim() || isSending}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {isSending ? 'Sending...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
