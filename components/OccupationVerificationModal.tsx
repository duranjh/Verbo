import React, { useState, useRef } from 'react';
import { IconClose, IconDoc, IconTrash, IconCheck, IconAlert, IconImage, IconShield } from './Icons';

interface OccupationVerificationModalProps {
  onClose: () => void;
  onSubmit: (files: File[]) => void;
}

export const OccupationVerificationModal: React.FC<OccupationVerificationModalProps> = ({ onClose, onSubmit }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Limit to 3 files total
      const combinedFiles = [...files, ...newFiles].slice(0, 3);
      setFiles(combinedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (files.length === 0) return;
    setIsSubmitting(true);
    // Simulate upload process
    setTimeout(() => {
        onSubmit(files);
        setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-bold text-xl text-slate-800">Verify Occupation</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <IconClose className="w-5 h-5"/>
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <div className="mb-6">
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    Please upload a document that validates your current employment or professional status. This helps build trust within the community.
                </p>
                
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Accepted Documents</h4>
                <ul className="text-sm text-slate-600 space-y-2 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-500" /> Recent Paystub (Redacted)</li>
                    <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-500" /> Employment Contract or Offer Letter</li>
                    <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-500" /> Business Card / Professional License</li>
                    <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-500" /> Screenshot of Company Directory Profile</li>
                </ul>

                <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl text-orange-800 text-xs">
                    <IconAlert className="w-5 h-5 shrink-0" />
                    <div>
                        <span className="font-bold block mb-1">Privacy Warning</span>
                        Please redact any sensitive personal information (Social Security Numbers, Bank Account details, Salary, etc.) before uploading. 
                        Your documents are used solely for verification and will be permanently deleted from our servers immediately after the review process is complete.
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 flex justify-between">
                    Upload Documents 
                    <span className="text-slate-400 font-normal text-xs">{files.length}/3</span>
                </label>
                
                {files.length < 3 && (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group"
                    >
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                            <IconDoc className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Click to upload documents</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG supported</p>
                    </div>
                )}
                
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={handleFileChange}
                />

                {files.length > 0 && (
                    <div className="space-y-2 mt-4">
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-white rounded border border-slate-100">
                                        {file.type.includes('image') ? <IconImage className="w-4 h-4 text-purple-500"/> : <IconDoc className="w-4 h-4 text-blue-500"/>}
                                    </div>
                                    <span className="text-sm text-slate-700 truncate">{file.name}</span>
                                </div>
                                <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                    <IconTrash className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sticky bottom-0">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
            <button 
                onClick={handleSubmit} 
                disabled={files.length === 0 || isSubmitting}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
                {isSubmitting ? 'Uploading...' : 'Submit for Review'}
                {!isSubmitting && <IconShield className="w-4 h-4" />}
            </button>
        </div>
      </div>
    </div>
  );
};