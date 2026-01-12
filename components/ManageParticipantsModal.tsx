
import React, { useState } from 'react';
import { Participant, UserRole, Topic, DebateType, ReportData } from '../types';
import { IconClose, IconUserX, IconShield, IconCheck, IconSearch, IconUsers, IconCopy, IconTrash, IconSettings, IconClock, IconAlert, IconFlag } from './Icons';
import { ReportModal } from './ReportModal';

interface ManageParticipantsModalProps {
  topic: Topic;
  onClose: () => void;
  onUpdateParticipant: (id: string, role: UserRole) => void;
  onBlockUser: (id: string) => void;
  onUnblockUser: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  onUpdateTopic: (updates: Partial<Topic>) => void;
}

export const ManageParticipantsModal: React.FC<ManageParticipantsModalProps> = ({ 
    topic, onClose, onUpdateParticipant, onBlockUser, onUnblockUser, onRemoveParticipant, onUpdateTopic
}) => {
    const [view, setView] = useState<'SETTINGS' | 'PARTICIPANTS' | 'BLOCKED'>('SETTINGS');
    const [searchTerm, setSearchTerm] = useState('');
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);

    // Edit State
    const [editTitle, setEditTitle] = useState(topic.title);
    const [editDescription, setEditDescription] = useState(topic.description);
    const [isSaving, setIsSaving] = useState(false);

    // Reporting
    const [reportTarget, setReportTarget] = useState<ReportData | null>(null);

    const participants = topic.participants?.filter(p => !p.isBlocked) || [];
    const blockedUsers = topic.participants?.filter(p => p.isBlocked).map(p => p.id) || [];

    const generateLink = () => `${window.location.origin}?topic=${topic.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generateLink());
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const handleSaveSettings = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            onUpdateTopic({ 
                title: editTitle, 
                description: editDescription,
                isEdited: true 
            });
            setIsSaving(false);
        }, 500);
    };

    const handleCloseDebate = () => {
        // Logic to close: Switch to Timed and set time to past (1 minute ago) to ensure immediate closure.
        onUpdateTopic({ 
            type: DebateType.TIMED, 
            closesAt: Date.now() - 60000 
        });
        onClose();
    };

    const filteredParticipants = participants.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Check if debate is already closed
    const isClosed = topic.type === DebateType.TIMED && topic.closesAt && Date.now() > topic.closesAt;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
             
            {reportTarget && (
                <ReportModal 
                        isOpen={!!reportTarget} 
                        onClose={() => setReportTarget(null)} 
                        targetType={reportTarget.targetType}
                        targetId={reportTarget.targetId}
                        targetContent={reportTarget.targetContent}
                />
            )}

            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Manage Debate</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[300px]">{topic.title}</p>
                    </div>
                    <button onClick={onClose}><IconClose className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                </div>

                {/* Share Link Section */}
                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                    <div className="flex-1 bg-white border border-indigo-200 rounded px-3 py-2 text-xs text-slate-600 truncate font-mono">
                        {generateLink()}
                    </div>
                    <button onClick={handleCopyLink} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center gap-2" title="Copy Link">
                        {copyFeedback ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setView('SETTINGS')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${view === 'SETTINGS' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Settings
                    </button>
                    <button 
                        onClick={() => setView('PARTICIPANTS')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${view === 'PARTICIPANTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Participants ({participants.length})
                    </button>
                    <button 
                        onClick={() => setView('BLOCKED')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${view === 'BLOCKED' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Blocked ({blockedUsers.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {view === 'SETTINGS' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Debate Title</label>
                                    <input 
                                        type="text" 
                                        value={editTitle} 
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                    <textarea 
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full p-2 h-32 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-100 outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Update Details'}
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <IconClock className="w-4 h-4 text-orange-600" />
                                    Close Debate
                                </h4>
                                <p className="text-xs text-slate-500 mb-4">
                                    Manually closing the debate will prevent any new arguments or interactions. This action cannot be undone.
                                </p>
                                {isClosed ? (
                                    <div className="w-full py-2 bg-slate-100 text-slate-500 rounded-lg font-bold text-sm text-center border border-slate-200">
                                        Debate is already closed
                                    </div>
                                ) : confirmClose ? (
                                    <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                                        <button 
                                            onClick={() => setConfirmClose(false)}
                                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleCloseDebate}
                                            className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
                                        >
                                            Confirm End
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setConfirmClose(true)}
                                        className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                                    >
                                        End Debate Now
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {view === 'PARTICIPANTS' && (
                        <div className="space-y-4">
                             <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-lg text-sm outline-none border border-transparent focus:border-indigo-200"
                                />
                             </div>
                             
                             {filteredParticipants.length === 0 ? (
                                 <div className="text-center py-8 text-slate-400 text-sm">No active participants found.</div>
                             ) : (
                                 filteredParticipants.map(p => (
                                     <div key={p.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                 {p.name.substring(0, 2).toUpperCase()}
                                             </div>
                                             <div>
                                                 <div className="font-bold text-sm text-slate-800">
                                                     {p.name}
                                                     {p.id === 'You' && <span className="ml-2 text-[10px] bg-slate-100 px-1 rounded text-slate-500">You</span>}
                                                 </div>
                                                 <div className="text-[10px] text-slate-400 font-mono">ID: {p.id}</div>
                                             </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-2">
                                             {/* Role Toggle */}
                                             <div className="flex bg-slate-100 rounded p-0.5">
                                                 <button 
                                                    onClick={() => onUpdateParticipant(p.id, UserRole.CONTRIBUTOR)}
                                                    className={`px-2 py-1 text-[10px] font-bold rounded ${p.role === UserRole.CONTRIBUTOR ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                                                 >
                                                     Contributor
                                                 </button>
                                                 <button 
                                                    onClick={() => onUpdateParticipant(p.id, UserRole.SPECTATOR)}
                                                    className={`px-2 py-1 text-[10px] font-bold rounded ${p.role === UserRole.SPECTATOR ? 'bg-white shadow text-slate-700' : 'text-slate-400'}`}
                                                 >
                                                     Spectator
                                                 </button>
                                             </div>
                                             
                                             {/* Only show block/remove for OTHER users */}
                                             {p.id !== 'You' && (
                                                <>
                                                    <div className="h-4 w-px bg-slate-200 mx-1"></div>

                                                    <button 
                                                        onClick={() => onBlockUser(p.id)}
                                                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                                                        title="Block User (Prevent re-entry)"
                                                    >
                                                        <IconUserX className="w-4 h-4" />
                                                    </button>
                                                    
                                                    {/* Report User Button */}
                                                    <button 
                                                        onClick={() => setReportTarget({
                                                            targetId: p.id,
                                                            targetType: 'USER',
                                                            targetContent: `Report user: ${p.name}`
                                                        })}
                                                        className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded transition-colors"
                                                        title="Report User"
                                                    >
                                                        <IconFlag className="w-4 h-4" />
                                                    </button>

                                                    <button 
                                                        onClick={() => onRemoveParticipant(p.id)}
                                                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                                        title="Remove User (Kick)"
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                </>
                                             )}
                                         </div>
                                     </div>
                                 ))
                             )}
                        </div>
                    )}

                    {view === 'BLOCKED' && (
                        <div className="space-y-2">
                            {blockedUsers.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">No blocked users.</div>
                            ) : (
                                blockedUsers.map(uid => (
                                    <div key={uid} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-lg">
                                        <span className="text-sm font-medium text-slate-700">User ID: {uid}</span>
                                        <button 
                                            onClick={() => onUnblockUser(uid)}
                                            className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline"
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
