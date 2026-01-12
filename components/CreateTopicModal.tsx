
import React, { useState } from 'react';
import { Topic, DebateType, PrivacyStatus, DebateFormat } from '../types';
import { IconClose, IconSparkles, IconLock, IconGlobe, IconClock, IconShieldAlert, IconComment, IconMic } from './Icons';
import { suggestTags } from '../services/gemini';

interface CreateTopicModalProps {
  onClose: () => void;
  onCreate: (topic: Partial<Topic>) => void;
  isPremium?: boolean;
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({ onClose, onCreate, isPremium = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DebateType>(DebateType.OPEN);
  const [format, setFormat] = useState<DebateFormat>('CHAT');
  const [closesAtDate, setClosesAtDate] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyStatus>(PrivacyStatus.PUBLIC);
  const [password, setPassword] = useState('');
  const [isAgeRestricted, setIsAgeRestricted] = useState(false);
  const [disableAiTools, setDisableAiTools] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  // Calculate current date/time string for min attribute (YYYY-MM-DDTHH:mm)
  // Use local time offset to ensure correct comparison
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const handleGenerateTags = async () => {
    if (!title || !description) return;
    setIsGeneratingTags(true);
    const suggested = await suggestTags(title, description);
    // Limit to 5 if AI suggests more
    setTags(suggested.slice(0, 5));
    setIsGeneratingTags(false);
  };

  const handleAddTag = () => {
    if (tags.length >= 5) return;
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) return;
    if (privacy === PrivacyStatus.PRIVATE && !password) return;
    if (type === DebateType.TIMED && !closesAtDate) return;

    const closesAt = type === DebateType.TIMED 
      ? new Date(closesAtDate).getTime()
      : undefined;

    onCreate({
      title,
      description,
      type,
      format,
      closesAt,
      privacy,
      accessPassword: password,
      isAgeRestricted,
      areAiToolsEnabled: !disableAiTools,
      tags
    });
    onClose();
  };

  // Lock logic
  const isTimedLocked = !isPremium;
  const isPrivateLocked = !isPremium;
  const isAiToolsLocked = !isPremium;
  const isLiveLocked = true; // Always locked as "Coming Soon"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-900">Start a New Debate</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Main Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Debate Statement / Claim <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Universal Basic Income is necessary for the future economy"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Background Context <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide context, background info, or links to help users understand the debate..."
                className="w-full p-3 h-32 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all"
                required
              />
            </div>

            {/* Tags */}
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Tags <span className="text-slate-400 font-normal text-xs">(Max 5)</span></span>
                  <button 
                    type="button" 
                    onClick={handleGenerateTags}
                    disabled={!title || !description || isGeneratingTags || tags.length >= 5}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                     {isGeneratingTags ? <IconSparkles className="w-3 h-3 animate-spin" /> : <IconSparkles className="w-3 h-3" />}
                     AI Suggest
                  </button>
               </label>
               <div className="flex gap-2 mb-2">
                 <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder={tags.length >= 5 ? "Tag limit reached" : "Add a tag..."}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    disabled={tags.length >= 5}
                 />
                 <button 
                    type="button" 
                    onClick={handleAddTag} 
                    className="bg-slate-800 text-white px-3 rounded-lg text-sm font-bold disabled:opacity-50"
                    disabled={tags.length >= 5}
                 >
                    Add
                 </button>
               </div>
               <div className="flex flex-wrap gap-2">
                 {tags.map(tag => (
                   <span key={tag} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                     {tag}
                     <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}><IconClose className="w-3 h-3" /></button>
                   </span>
                 ))}
                 {tags.length === 5 && <span className="text-[10px] text-orange-500 self-center font-bold">Max tags reached</span>}
               </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-6">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Settings</h3>

             {/* Debate Format (Chat vs Live) */}
             <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setFormat('CHAT')}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${format === 'CHAT' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}
                >
                   <div className="flex items-center gap-2 font-bold text-slate-800">
                      <IconComment className="w-5 h-5" /> Chat Debate
                   </div>
                   <p className="text-xs text-slate-500">Standard text-based argumentation.</p>
                </button>
                
                <button 
                  type="button"
                  disabled={isLiveLocked}
                  onClick={() => !isLiveLocked && setFormat('LIVE')}
                  className={`relative group p-4 rounded-xl border text-left flex flex-col gap-2 transition-all 
                    ${format === 'LIVE' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200'}
                    ${isLiveLocked ? 'opacity-80 cursor-not-allowed bg-slate-100 border-slate-300 text-slate-400' : 'hover:border-slate-300'}
                  `}
                >
                   {isLiveLocked && (
                       <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                           <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl flex flex-col items-center gap-1 border border-slate-700 min-w-[120px] text-center">
                               <div className="flex items-center gap-1.5 text-yellow-400">
                                   <IconSparkles className="w-3 h-3" />
                                   <span>Premium Feature</span>
                               </div>
                               <span className="text-slate-300 font-medium">Coming Soon</span>
                           </div>
                       </div>
                   )}
                   {isLiveLocked && (
                       <div className="absolute top-2 right-2 text-slate-400">
                           <IconLock className="w-4 h-4" />
                       </div>
                   )}
                   <div className="flex items-center gap-2 font-bold text-slate-800">
                      <IconMic className="w-5 h-5" /> Live Debate
                   </div>
                   <p className="text-xs text-slate-500">Real-time voice debate with stage controls.</p>
                </button>
             </div>

             {/* Debate Type */}
             <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setType(DebateType.OPEN)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${type === DebateType.OPEN ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}
                >
                   <div className="flex items-center gap-2 font-bold text-slate-800">
                      <IconGlobe className="w-5 h-5" /> Open Debate
                   </div>
                   <p className="text-xs text-slate-500">Debate remains open indefinitely for new arguments.</p>
                </button>
                
                <button 
                  type="button"
                  disabled={isTimedLocked}
                  onClick={() => !isTimedLocked && setType(DebateType.TIMED)}
                  className={`relative group p-4 rounded-xl border text-left flex flex-col gap-2 transition-all 
                    ${type === DebateType.TIMED ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200'}
                    ${isTimedLocked ? 'opacity-60 cursor-not-allowed bg-slate-50 hover:border-slate-200' : 'hover:border-slate-300'}
                  `}
                >
                   {isTimedLocked && (
                       <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                           <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700">
                               <IconSparkles className="w-3 h-3 text-yellow-400" />
                               Subscribe to Verbo+ to unlock
                           </div>
                       </div>
                   )}
                   {isTimedLocked && (
                       <div className="absolute top-2 right-2 text-slate-400">
                           <IconLock className="w-4 h-4" />
                       </div>
                   )}
                   <div className="flex items-center gap-2 font-bold text-slate-800">
                      <IconClock className="w-5 h-5" /> Timed Debate
                   </div>
                   <p className="text-xs text-slate-500">Closes after a set time. Read-only afterwards.</p>
                </button>
             </div>

             {/* End Date Input (Only if Timed) */}
             {type === DebateType.TIMED && (
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Debate Ends At</label>
                  <input 
                    type="datetime-local" 
                    min={minDateTime}
                    value={closesAtDate}
                    onChange={(e) => setClosesAtDate(e.target.value)}
                    className="w-full p-2 bg-white border border-indigo-200 rounded-lg outline-none"
                    required
                  />
               </div>
             )}

             {/* Privacy */}
             <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setPrivacy(PrivacyStatus.PUBLIC)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${privacy === PrivacyStatus.PUBLIC ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-slate-200 hover:border-slate-300'}`}
                >
                   <div className="flex items-center gap-2 font-bold text-slate-800">
                      <IconGlobe className="w-5 h-5" /> Public
                   </div>
                   <p className="text-xs text-slate-500">Visible to everyone in search and feed.</p>
                </button>
                
                <button 
                  type="button"
                  disabled={isPrivateLocked}
                  onClick={() => !isPrivateLocked && setPrivacy(PrivacyStatus.PRIVATE)}
                  className={`relative group p-4 rounded-xl border text-left flex flex-col gap-2 transition-all 
                    ${privacy === PrivacyStatus.PRIVATE ? 'border-slate-800 bg-slate-100 ring-1 ring-slate-800' : 'border-slate-200'}
                    ${isPrivateLocked ? 'opacity-60 cursor-not-allowed bg-slate-50 hover:border-slate-200' : 'hover:border-slate-300'}
                  `}
                >
                   {isPrivateLocked && (
                       <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                           <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700">
                               <IconSparkles className="w-3 h-3 text-yellow-400" />
                               Subscribe to Verbo+ to unlock
                           </div>
                       </div>
                   )}
                   {isPrivateLocked && (
                       <div className="absolute top-2 right-2 text-slate-400">
                           <IconLock className="w-4 h-4" />
                       </div>
                   )}
                   <div className="flex items-center gap-2 font-bold text-slate-800">
                      <IconLock className="w-5 h-5" /> Private
                   </div>
                   <p className="text-xs text-slate-500">Password protected. Invite only.</p>
                </button>
             </div>

             {/* Password Input (Only if Private) */}
             {privacy === PrivacyStatus.PRIVATE && (
               <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Set Access Password <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none font-mono"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">You can manage participants and roles after creation.</p>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age Restriction */}
                <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <input 
                    type="checkbox" 
                    id="ageCheck" 
                    checked={isAgeRestricted}
                    onChange={(e) => setIsAgeRestricted(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="ageCheck" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        <IconShieldAlert className="w-5 h-5 text-red-500" />
                        Sensitive Content (18+)
                    </div>
                    <p className="text-xs text-slate-500">Restricts access to users verified as 18 years or older.</p>
                    </label>
                </div>

                {/* Disable AI Tools - LOCKED */}
                <div className={`relative group flex items-center gap-3 p-4 border border-slate-200 rounded-xl transition-colors ${isAiToolsLocked ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
                    {isAiToolsLocked && (
                       <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                           <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700">
                               <IconSparkles className="w-3 h-3 text-yellow-400" />
                               Subscribe to Verbo+ to unlock
                           </div>
                       </div>
                    )}
                    {isAiToolsLocked && (
                       <div className="absolute top-2 right-2 text-slate-400">
                           <IconLock className="w-4 h-4" />
                       </div>
                    )}
                    <input 
                    type="checkbox" 
                    id="aiToolCheck" 
                    checked={disableAiTools}
                    onChange={(e) => !isAiToolsLocked && setDisableAiTools(e.target.checked)}
                    disabled={isAiToolsLocked}
                    className={`w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 ${isAiToolsLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                    <label htmlFor="aiToolCheck" className={`flex-1 ${isAiToolsLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        <IconSparkles className="w-5 h-5 text-purple-500" />
                        Disable AI Tools
                    </div>
                    <p className="text-xs text-slate-500">Disable Argument Enhancer & Source Suggestion for participants.</p>
                    </label>
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-white pb-6 border-t border-slate-100">
             <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Create Debate</button>
          </div>

        </form>
      </div>
    </div>
  );
};
