

import React, { useState, useRef, useEffect } from 'react';
import { Comment, Stance, FactRating, Attachment, AIAnalysis, ReportData } from '../types';
import { IconClose, IconLink, IconShield, IconGlobe, IconFor, IconAgainst, IconNeutral, IconReply, IconCheck, IconPaperclip, IconDoc, IconImage, IconTrash, IconFilter, IconArrowUpDown, IconBan, IconAlert, IconEdit, IconLock, IconSparkles, IconChevronUp, IconChevronDown, IconExternal, IconFlag, IconClock, IconLike } from './Icons';
import { RatingPill, DuplicatePill, EditedPill, AiGeneratedPill } from './RatingPill';
import { verifyStatement, suggestSupportingSources, enhanceArgument } from '../services/gemini';
import { VoiceInput } from './VoiceInput';
import { ReportModal } from './ReportModal';

interface CommentDetailModalProps {
  comment: Comment | null;
  onClose: () => void;
  onReply: (parentId: string, reply: Comment) => void;
  onAddComment?: (comment: Comment) => void;
  onLikeComment: (commentId: string) => void;
  topicTitle: string;
  canParticipate?: boolean;
  isDebateClosed?: boolean;
  areAiToolsEnabled?: boolean;
}

const FILTER_OPTIONS = [
  { value: FactRating.TRUE, label: 'True', color: 'text-green-700' },
  { value: FactRating.SOMEWHAT_TRUE, label: 'Somewhat True', color: 'text-lime-700' },
  { value: FactRating.NEUTRAL, label: 'Unverifiable / Opinion', color: 'text-gray-700' },
  { value: FactRating.MISLEADING, label: 'Misleading', color: 'text-orange-700' },
  { value: FactRating.FALSE, label: 'False', color: 'text-red-700' },
  { value: FactRating.UNRELATED, label: 'Unrelated', color: 'text-slate-500' },
  { value: 'DUPLICATE', label: 'Duplicate', color: 'text-blue-600' },
];

export const CommentDetailModal: React.FC<CommentDetailModalProps> = ({ 
    comment, onClose, onReply, onAddComment, onLikeComment, topicTitle, canParticipate = true, isDebateClosed = false, areAiToolsEnabled = true
}) => {
  const [replyText, setReplyText] = useState('');
  const [replyStance, setReplyStance] = useState<Stance>(Stance.NEUTRAL);
  
  // Sources
  const [replyLink, setReplyLink] = useState('');
  const [attachedLinks, setAttachedLinks] = useState<string[]>([]);
  const [suggestedSources, setSuggestedSources] = useState<{title: string, uri: string}[]>([]);
  const [isSuggestingSources, setIsSuggestingSources] = useState(false);
  const [noSourcesFound, setNoSourcesFound] = useState(false);
  
  const [replyFile, setReplyFile] = useState<{file: File, preview: string} | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplyId, setExpandedReplyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Enhancement state
  const [isEnhancingReply, setIsEnhancingReply] = useState(false);
  const [isEnhancingEditMain, setIsEnhancingEditMain] = useState(false);
  const [isEnhancingEditReply, setIsEnhancingEditReply] = useState(false);
  
  // AI Tracking state
  const [replyHasUsedAi, setReplyHasUsedAi] = useState(false);
  const [mainEditHasUsedAi, setMainEditHasUsedAi] = useState(false);
  const [replyEditHasUsedAi, setReplyEditHasUsedAi] = useState(false);

  // Suggestion Debounce
  const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit State for Main Comment
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [editMainText, setEditMainText] = useState('');
  const [editMainStance, setEditMainStance] = useState<Stance>(Stance.NEUTRAL);

  // Edit State for Replies
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [editReplyStance, setEditReplyStance] = useState<Stance>(Stance.NEUTRAL);

  // Stance Confirmation State
  const [pendingSubmission, setPendingSubmission] = useState<{comment: Comment, analysis: AIAnalysis, isReply: boolean, isMainEdit?: boolean} | null>(null);
  
  // Toast state for unrelated content in modal
  const [unrelatedToast, setUnrelatedToast] = useState<{show: boolean, message: string}>({show: false, message: ''});

  // Reporting
  const [reportTarget, setReportTarget] = useState<ReportData | null>(null);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<(FactRating | string)[]>([
    FactRating.TRUE, 
    FactRating.SOMEWHAT_TRUE, 
    FactRating.NEUTRAL, 
    FactRating.MISLEADING, 
    FactRating.FALSE,
    'DUPLICATE'
  ]);

  // Dropdown timer
  const filterTimeoutRef = useRef<any>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (unrelatedToast.show) {
      timer = setTimeout(() => {
        setUnrelatedToast(prev => ({ ...prev, show: false }));
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [unrelatedToast.show]);

  useEffect(() => {
    return () => {
        if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    }
  }, []);

  // AI Suggestion Logic for Reply
  useEffect(() => {
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
      setNoSourcesFound(false);
      
      if (replyText.length > 20 && canParticipate && !isDebateClosed && areAiToolsEnabled) {
          setIsSuggestingSources(true);
          suggestionTimeoutRef.current = setTimeout(async () => {
              const suggestions = await suggestSupportingSources(replyText, topicTitle, replyStance);
              setSuggestedSources(suggestions);
              if (suggestions.length === 0) {
                  setNoSourcesFound(true);
              }
              setIsSuggestingSources(false);
          }, 1500);
      } else {
          setSuggestedSources([]);
          setIsSuggestingSources(false);
      }
  }, [replyText, topicTitle, canParticipate, replyStance, isDebateClosed, areAiToolsEnabled]);

  // Dropdown Handlers
  const handleFilterEnter = () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
  };
  const handleFilterLeave = () => {
      filterTimeoutRef.current = setTimeout(() => {
          setIsFilterOpen(false);
      }, 3000);
  };

  if (!comment) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setReplyFile({
          file,
          preview: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setReplyFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const normalizeUrl = (url: string) => {
    url = url.trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  const addAttachedLink = () => {
      if (!replyLink.trim()) return;
      const url = normalizeUrl(replyLink);
      if (url && !attachedLinks.includes(url)) {
          setAttachedLinks([...attachedLinks, url]);
          setReplyLink('');
      }
  };

  const removeAttachedLink = (link: string) => {
      setAttachedLinks(attachedLinks.filter(l => l !== link));
  };

  const addSuggestedSource = (source: {title: string, uri: string}) => {
      if (!attachedLinks.includes(source.uri)) {
          setAttachedLinks([...attachedLinks, source.uri]);
          setSuggestedSources(suggestedSources.filter(s => s.uri !== source.uri));
          setReplyHasUsedAi(true); // MARK AI USAGE FOR REPLY
      }
  };

  const handleEnhanceReply = async () => {
    if (!replyText.trim()) return;
    setIsEnhancingReply(true);
    const enhanced = await enhanceArgument(replyText, topicTitle, replyStance);
    setReplyText(enhanced);
    setIsEnhancingReply(false);
    setReplyHasUsedAi(true); // MARK AI USAGE FOR REPLY
  };

  const handleEnhanceEditMain = async () => {
    if (!editMainText.trim()) return;
    setIsEnhancingEditMain(true);
    const enhanced = await enhanceArgument(editMainText, topicTitle, editMainStance);
    setEditMainText(enhanced);
    setIsEnhancingEditMain(false);
    setMainEditHasUsedAi(true); // MARK AI USAGE FOR MAIN EDIT
  };

  const handleEnhanceEditReply = async () => {
    if (!editReplyText.trim()) return;
    setIsEnhancingEditReply(true);
    const enhanced = await enhanceArgument(editReplyText, topicTitle, editReplyStance);
    setEditReplyText(enhanced);
    setIsEnhancingEditReply(false);
    setReplyEditHasUsedAi(true); // MARK AI USAGE FOR REPLY EDIT
  };

  const handlePostReply = (newReply: Comment, analysis: AIAnalysis) => {
    const isEditing = editingReplyId === newReply.id;
    
    // Add reply to current thread with analysis
    // Preserve existing linkedContentId if editing
    const updatedReply = { 
        ...newReply, 
        aiAnalysis: analysis, 
        isLoadingAI: false,
        linkedContentId: newReply.linkedContentId
    };
    
    onReply(comment.id, updatedReply);

    if (isEditing) {
        // Was an edit
        setEditingReplyId(null);
        setEditReplyText('');
        setReplyEditHasUsedAi(false); // Reset edit tracker
    } else {
        // Was a new reply
        setReplyText('');
        setReplyLink('');
        setAttachedLinks([]);
        setSuggestedSources([]);
        setNoSourcesFound(false);
        setReplyFile(null);
        setReplyHasUsedAi(false); // Reset reply tracker
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // Check unrelated
    if (analysis.rating === FactRating.UNRELATED) {
        setUnrelatedToast({
            show: true,
            message: "Your reply has been flagged as 'Unrelated' and is hidden by default."
        });
    }
  };

  const startEditingMain = () => {
      setIsEditingMain(true);
      setEditMainText(comment.content);
      setEditMainStance(comment.stance);
      setMainEditHasUsedAi(comment.isAiGenerated || false); // Inherit state
  };

  const cancelEditingMain = () => {
      setIsEditingMain(false);
      setMainEditHasUsedAi(false);
  };

  const handleSaveMainEdit = async () => {
      if (!editMainText.trim()) return;

      setIsSubmittingReply(true); 

      // Note: We don't have access to all other main comments here to check duplicates against them.
      // We proceed without duplicate checking for main edit in modal context.
      const analysis = await verifyStatement(editMainText, topicTitle);
      const detectedStance = analysis.detectedStance as Stance;
      const validStances = ['FOR', 'AGAINST', 'NEUTRAL'];
      const isMismatch = detectedStance && validStances.includes(detectedStance) && detectedStance !== editMainStance;

      const updatedComment: Comment = {
          ...comment,
          content: editMainText,
          stance: editMainStance,
          isLoadingAI: false,
          isEdited: true,
          isAiGenerated: mainEditHasUsedAi // Update AI Usage
      };

      setIsSubmittingReply(false);

      if (isMismatch) {
          setPendingSubmission({ comment: updatedComment, analysis, isReply: false, isMainEdit: true });
      } else {
          // Update main comment
          if (onAddComment) onAddComment({ ...updatedComment, aiAnalysis: analysis });
          setIsEditingMain(false);
      }
  };

  const startEditingReply = (reply: Comment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReplyId(reply.id);
    setEditReplyText(reply.content);
    setEditReplyStance(reply.stance);
    // Expand to show editor properly
    setExpandedReplyId(reply.id); 
    setReplyEditHasUsedAi(reply.isAiGenerated || false); // Inherit state
  };

  const cancelEditingReply = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingReplyId(null);
    setEditReplyText('');
    setEditReplyStance(Stance.NEUTRAL);
    setReplyEditHasUsedAi(false);
  };

  const handleSaveReplyEdit = async () => {
    if (!editReplyText.trim()) return;

    const original = comment.replies?.find(r => r.id === editingReplyId);
    if (!original) return;

    setIsSubmittingReply(true);

    const existingReplies = comment.replies?.filter(r => r.id !== editingReplyId).map(r => r.content) || [];
    const analysis = await verifyStatement(editReplyText, topicTitle, existingReplies);
    const detectedStance = analysis.detectedStance as Stance;
    const validStances = ['FOR', 'AGAINST', 'NEUTRAL'];
    const isMismatch = detectedStance && validStances.includes(detectedStance) && detectedStance !== editReplyStance;

    const updatedReply = {
        ...original,
        content: editReplyText,
        stance: editReplyStance,
        isLoadingAI: false,
        isEdited: true,
        isAiGenerated: replyEditHasUsedAi // Update AI Usage
    };

    setIsSubmittingReply(false);

    if (isMismatch) {
        setPendingSubmission({ comment: updatedReply, analysis, isReply: true });
    } else {
        handlePostReply(updatedReply, analysis);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    
    // Verify first
    const existingReplies = comment.replies?.map(r => r.content) || [];
    const analysis = await verifyStatement(replyText, topicTitle, existingReplies);
    
    // Check for stance mismatch
    const detectedStance = analysis.detectedStance as Stance;
    const userStance = replyStance;
    const validStances = ['FOR', 'AGAINST', 'NEUTRAL'];
    
    const isMismatch = detectedStance && 
                       validStances.includes(detectedStance) && 
                       detectedStance !== userStance;

    const tempId = Math.random().toString(36).substr(2, 9);
    // Combine links
    const finalSources = [...attachedLinks];
    if (replyLink) {
        const url = normalizeUrl(replyLink);
        if (url && !finalSources.includes(url)) finalSources.push(url);
    }
    
    const attachments: Attachment[] = [];
    if (replyFile) {
        attachments.push({
            id: Math.random().toString(36).substr(2, 9),
            name: replyFile.file.name,
            type: replyFile.file.type.startsWith('image/') ? 'image' : 'file',
            url: replyFile.preview
        });
    }
    
    const newReply: Comment = {
      id: tempId,
      topicId: comment.topicId,
      author: 'You',
      content: replyText,
      stance: userStance,
      timestamp: Date.now(),
      userSources: finalSources,
      userAttachments: attachments,
      isLoadingAI: false, // Verified
      isAiGenerated: replyHasUsedAi // Capture AI Usage
    };

    setIsSubmittingReply(false);

    if (isMismatch) {
        setPendingSubmission({ comment: newReply, analysis, isReply: true });
    } else {
        handlePostReply(newReply, analysis);
    }
  };

  const toggleFilter = (rating: FactRating | string) => {
    setActiveFilters(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating) 
        : [...prev, rating]
    );
  };

  // Filter Logic
  const allReplies = comment.replies || [];
  const filteredReplies = allReplies.filter(reply => {
    // Always show comments that are loading or haven't been analyzed yet
    if (reply.isLoadingAI || !reply.aiAnalysis) return true;
    
    // Check Duplicate
    if (reply.aiAnalysis.isDuplicate) {
        return activeFilters.includes('DUPLICATE');
    }

    return activeFilters.includes(reply.aiAnalysis.rating);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
       
       {reportTarget && (
           <ReportModal 
                isOpen={!!reportTarget} 
                onClose={() => setReportTarget(null)} 
                targetType={reportTarget.targetType}
                targetId={reportTarget.targetId}
                targetContent={reportTarget.targetContent}
           />
       )}

       {pendingSubmission && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
            {/* ... pendingSubmission modal ... */}
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
               <div className="flex items-center gap-3 mb-4 text-orange-600">
                  <div className="p-2 bg-orange-100 rounded-full">
                     <IconAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Stance Mismatch Detected</h3>
               </div>
               <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                  You selected <span className="font-bold uppercase text-slate-800 bg-slate-100 px-1 rounded">{pendingSubmission.comment.stance}</span>, 
                  but our AI analysis suggests this argument supports <span className="font-bold uppercase text-indigo-600 bg-indigo-50 px-1 rounded">{pendingSubmission.analysis.detectedStance}</span>.
               </p>
               
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                       const updatedComment = { ...pendingSubmission.comment, stance: pendingSubmission.analysis.detectedStance as Stance };
                       if (pendingSubmission.isReply) {
                           handlePostReply(updatedComment, pendingSubmission.analysis);
                       } else if (pendingSubmission.isMainEdit && onAddComment) {
                           onAddComment({...updatedComment, aiAnalysis: pendingSubmission.analysis});
                           setIsEditingMain(false);
                       }
                       setPendingSubmission(null);
                    }}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                     Change to {pendingSubmission.analysis.detectedStance}
                     <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Recommended</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                       if (pendingSubmission.isReply) {
                           handlePostReply(pendingSubmission.comment, pendingSubmission.analysis);
                       } else if (pendingSubmission.isMainEdit && onAddComment) {
                           onAddComment({...pendingSubmission.comment, aiAnalysis: pendingSubmission.analysis});
                           setIsEditingMain(false);
                       }
                       setPendingSubmission(null);
                    }}
                    className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                  >
                     Keep as {pendingSubmission.comment.stance}
                  </button>

                  <button 
                    onClick={() => setPendingSubmission(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wide py-2"
                  >
                     Cancel Post
                  </button>
               </div>
            </div>
         </div>
       )}

      <div 
        className="bg-white rounded-2xl w-full max-w-[1400px] max-h-[95vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 relative" 
        onClick={e => e.stopPropagation()}
      >
        {/* Unrelated Toast in Modal */}
        {unrelatedToast.show && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-md">
                <IconBan className="w-5 h-5 text-slate-300" />
                <div className="flex-1 text-sm">{unrelatedToast.message}</div>
                <button onClick={() => setUnrelatedToast({...unrelatedToast, show: false})}>
                    <IconClose className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
            </div>
        )}

        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
           {/* ... header content ... */}
           <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg 
                ${comment.stance === Stance.FOR ? 'bg-blue-100 text-blue-600' : 
                  comment.stance === Stance.AGAINST ? 'bg-red-100 text-red-600' : 
                  'bg-gray-100 text-gray-600'}`}>
                {comment.stance === Stance.FOR && <IconFor className="w-6 h-6" />}
                {comment.stance === Stance.AGAINST && <IconAgainst className="w-6 h-6" />}
                {comment.stance === Stance.NEUTRAL && <IconNeutral className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <h3 className="text-xl font-bold text-slate-900">Argument Details</h3>
                   {comment.author === 'You' && !isEditingMain && canParticipate && !isDebateClosed && (
                       <button onClick={startEditingMain} className="p-1 text-slate-400 hover:text-indigo-600 rounded">
                           <IconEdit className="w-4 h-4" />
                       </button>
                   )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                   <span className="font-semibold text-slate-700">Posted by {comment.author}</span>
                   {comment.userTitle && (
                     <>
                       <span>•</span>
                       <span className="flex items-center gap-1">
                           {comment.userTitle}
                           {comment.isUserVerified && <IconCheck className="w-3 h-3 text-green-500" />}
                       </span>
                     </>
                   )}
                   <span>•</span>
                   <span>{new Date(comment.timestamp).toLocaleString()}</span>
                   <span>•</span>
                   <span className="font-mono text-xs text-slate-400" title="Argument ID">#{comment.id}</span>
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
               {/* Like Button */}
               {canParticipate && !isDebateClosed && (
                   <button 
                       onClick={() => onLikeComment(comment.id)}
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors ${comment.likedByMe ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                   >
                       <IconLike className={`w-4 h-4 ${comment.likedByMe ? 'fill-current' : ''}`} />
                       {comment.likes || 0}
                   </button>
               )}
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                 <IconClose className="w-8 h-8" />
               </button>
           </div>
        </div>

        <div className="p-8 lg:p-10 space-y-10">
          
          {/* Main Statement (View or Edit) */}
          {isEditingMain ? (
              <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-indigo-100">
                  <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-slate-700">Edit Claim</h3>
                        <button onClick={cancelEditingMain} className="p-1 hover:bg-slate-200 rounded-full">
                            <IconClose className="w-4 h-4 text-slate-500" />
                        </button>
                  </div>
                  <div className="flex items-center gap-4">
                        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm self-start">
                            <button 
                                type="button" 
                                onClick={() => setEditMainStance(Stance.FOR)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editMainStance === Stance.FOR ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                For
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setEditMainStance(Stance.NEUTRAL)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editMainStance === Stance.NEUTRAL ? 'bg-gray-100 text-gray-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Neutral
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setEditMainStance(Stance.AGAINST)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editMainStance === Stance.AGAINST ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Against
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            {areAiToolsEnabled && (
                                <button 
                                    type="button" 
                                    onClick={handleEnhanceEditMain}
                                    disabled={!editMainText.trim() || isEnhancingEditMain}
                                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isEnhancingEditMain ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                    title="AI Enhance Text"
                                >
                                    <IconSparkles className={`w-5 h-5 ${isEnhancingEditMain ? 'animate-pulse' : ''}`} />
                                </button>
                            )}
                            <VoiceInput onTextReceived={(text) => setEditMainText(prev => prev + " " + text)} />
                        </div>
                  </div>
                  <textarea 
                        value={editMainText}
                        onChange={e => setEditMainText(e.target.value)}
                        className="w-full h-32 p-3 bg-white border border-slate-200 rounded-lg text-lg focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                    />
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={cancelEditingMain} 
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveMainEdit} 
                            disabled={!editMainText.trim() || isSubmittingReply}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {isSubmittingReply ? 'Verifying...' : 'Save Update'}
                        </button>
                    </div>
              </div>
          ) : (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">The Claim</label>
                    {/* Report Main Comment Action */}
                    {comment.author !== 'You' && (
                        <button 
                            onClick={() => setReportTarget({
                                targetId: comment.id,
                                targetType: 'ARGUMENT',
                                targetContent: comment.content
                            })}
                            className="text-xs text-slate-300 hover:text-red-500 flex items-center gap-1 font-bold transition-colors"
                        >
                            <IconFlag className="w-3 h-3" /> Report
                        </button>
                    )}
                </div>
                <div className="flex items-start gap-2">
                    <p className="text-2xl lg:text-3xl leading-relaxed text-slate-900 font-medium">
                    "{comment.content}"
                    </p>
                    {comment.isEdited && <EditedPill className="mt-2" />}
                    {comment.isAiGenerated && <AiGeneratedPill className="mt-2" />}
                </div>
            </div>
          )}

          {/* ... User Sources & Attachments ... */}
          {(comment.userSources.length > 0 || (comment.userAttachments && comment.userAttachments.length > 0)) && (
               <div className="flex flex-wrap gap-2">
                  {comment.userSources.map((src, i) => (
                     <a key={i} href={src} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-indigo-600 hover:underline hover:border-indigo-200 transition-colors">
                        <IconLink className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{src.replace(/^https?:\/\//, '')}</span>
                     </a>
                  ))}
                  {comment.userAttachments?.map((att) => (
                     <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors">
                        {att.type === 'image' ? <IconImage className="w-3.5 h-3.5 text-purple-500" /> : <IconDoc className="w-3.5 h-3.5 text-blue-500" />}
                        <span className="truncate max-w-[200px]">{att.name}</span>
                     </a>
                  ))}
               </div>
          )}

          {/* ... AI Analysis Section ... */}
          {comment.aiAnalysis && comment.aiAnalysis.rating !== FactRating.UNRELATED && (
              <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4">
                      <IconSparkles className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">AI Fact Check</h4>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                      {comment.aiAnalysis.isDuplicate && <DuplicatePill />}
                      <RatingPill rating={comment.aiAnalysis.rating} label={comment.aiAnalysis.ratingLabel} />
                  </div>
                  
                  <p className="text-slate-700 leading-relaxed mb-4 text-sm">
                      {comment.aiAnalysis.reasoning}
                  </p>
                  
                  {comment.aiAnalysis.groundingSources && comment.aiAnalysis.groundingSources.length > 0 && (
                      <div className="border-t border-indigo-100 pt-3 mt-2">
                           <h5 className="text-xs font-bold text-indigo-400 uppercase mb-2">Sources</h5>
                           <div className="space-y-2">
                              {comment.aiAnalysis.groundingSources.map((source, idx) => (
                                  <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline text-sm truncate">
                                      <IconLink className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{source.title || source.uri}</span>
                                  </a>
                              ))}
                           </div>
                      </div>
                  )}
              </div>
          )}

          {/* ... Rebuttals Section ... */}
          <div className="space-y-6 pt-8 border-t border-slate-200">
             <div className="flex items-center justify-between">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Rebuttals ({filteredReplies.length})</h3>
                 
                 {/* Filter Dropdown for Replies */}
                 <div 
                     className="relative"
                     onMouseEnter={handleFilterEnter}
                     onMouseLeave={handleFilterLeave}
                 >
                     <button 
                         onClick={() => setIsFilterOpen(!isFilterOpen)}
                         className={`p-1.5 rounded-lg transition-colors ${activeFilters.length < 6 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}
                     >
                         <IconFilter className="w-4 h-4" />
                     </button>
                     {isFilterOpen && (
                         <>
                         <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)}></div>
                         <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in zoom-in-95 duration-200">
                             {FILTER_OPTIONS.map((option) => (
                                <button
                                key={option.value}
                                onClick={() => toggleFilter(option.value)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                                >
                                <span className={`text-xs font-bold ${option.color}`}>{option.label}</span>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${activeFilters.includes(option.value) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                    {activeFilters.includes(option.value) && <IconCheck className="w-3 h-3 text-white" />}
                                </div>
                                </button>
                             ))}
                         </div>
                         </>
                     )}
                 </div>
             </div>

             <div className="space-y-4">
                {filteredReplies.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    No rebuttals yet. Be the first to reply!
                  </div>
                ) : (
                  filteredReplies.map((reply) => (
                    <div key={reply.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-indigo-200 transition-colors group relative">
                       {/* Editing Mode for Reply */}
                       {editingReplyId === reply.id ? (
                           <div className="flex flex-col gap-3">
                                {/* ... Edit UI ... */}
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Edit Reply</h4>
                                    <button onClick={cancelEditingReply} className="p-1 hover:bg-slate-200 rounded-full">
                                        <IconClose className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                     <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                         {/* Simple Stance Toggle for Reply Edit */}
                                        <button onClick={() => setEditReplyStance(Stance.FOR)} className={`p-1.5 rounded ${editReplyStance === Stance.FOR ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}><IconFor className="w-4 h-4"/></button>
                                        <button onClick={() => setEditReplyStance(Stance.NEUTRAL)} className={`p-1.5 rounded ${editReplyStance === Stance.NEUTRAL ? 'bg-gray-100 text-gray-600' : 'text-slate-400'}`}><IconNeutral className="w-4 h-4"/></button>
                                        <button onClick={() => setEditReplyStance(Stance.AGAINST)} className={`p-1.5 rounded ${editReplyStance === Stance.AGAINST ? 'bg-red-100 text-red-600' : 'text-slate-400'}`}><IconAgainst className="w-4 h-4"/></button>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        {areAiToolsEnabled && (
                                            <button 
                                                type="button" 
                                                onClick={handleEnhanceEditReply}
                                                disabled={!editReplyText.trim() || isEnhancingEditReply}
                                                className={`p-1.5 rounded transition-colors ${isEnhancingEditReply ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                                title="AI Enhance Text"
                                            >
                                                <IconSparkles className={`w-4 h-4 ${isEnhancingEditReply ? 'animate-pulse' : ''}`} />
                                            </button>
                                        )}
                                        <VoiceInput onTextReceived={(text) => setEditReplyText(prev => prev + " " + text)} />
                                     </div>
                                </div>
                                <textarea 
                                    value={editReplyText}
                                    onChange={e => setEditReplyText(e.target.value)}
                                    className="w-full h-24 p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={cancelEditingReply} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">Cancel</button>
                                    <button 
                                        onClick={handleSaveReplyEdit} 
                                        disabled={!editReplyText.trim() || isSubmittingReply}
                                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isSubmittingReply ? 'Verifying...' : 'Save'}
                                    </button>
                                </div>
                           </div>
                       ) : (
                           <>
                           <div className="flex justify-between items-start mb-2">
                            {/* ... Reply Header ... */}
                            <div className="flex items-center gap-2">
                                <span className={`p-1 rounded text-xs font-bold ${
                                    reply.stance === Stance.FOR ? 'bg-blue-100 text-blue-600' : 
                                    reply.stance === Stance.AGAINST ? 'bg-red-100 text-red-600' : 
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {reply.stance}
                                </span>
                                <span className="font-bold text-slate-700 text-sm">{reply.author}</span>
                                <span className="text-xs text-slate-400">{new Date(reply.timestamp).toLocaleString()}</span>
                                {reply.isEdited && <EditedPill />}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {reply.author === 'You' && canParticipate && !isDebateClosed && (
                                    <button 
                                        onClick={(e) => startEditingReply(reply, e)}
                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <IconEdit className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                
                                {/* Report Button for Rebuttal */}
                                {reply.author !== 'You' && (
                                    <button 
                                        onClick={() => setReportTarget({
                                            targetId: reply.id,
                                            targetType: 'REBUTTAL',
                                            targetContent: reply.content
                                        })}
                                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="Report Rebuttal"
                                    >
                                        <IconFlag className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {reply.aiAnalysis && (
                                    <div className="flex items-center gap-1">
                                        {reply.aiAnalysis.isDuplicate && <DuplicatePill />}
                                        {reply.isAiGenerated && <AiGeneratedPill />}
                                        <RatingPill rating={reply.aiAnalysis.rating} label={reply.aiAnalysis.ratingLabel} />
                                    </div>
                                )}
                            </div>
                           </div>
                           
                           {/* Reply Content */}
                           <div className="text-slate-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                               {expandedReplyId === reply.id || reply.content.length < 300 ? (
                                   reply.content
                               ) : (
                                   <>
                                   {reply.content.substring(0, 300)}...
                                   <button onClick={() => setExpandedReplyId(reply.id)} className="text-indigo-600 hover:underline ml-1 text-xs font-bold">Read More</button>
                                   </>
                               )}
                           </div>
                           
                           {/* Toggle Analysis Button (Visible if analysis exists, regardless of length) */}
                           {reply.aiAnalysis && reply.aiAnalysis.rating !== FactRating.UNRELATED && expandedReplyId !== reply.id && (
                                <button 
                                    onClick={() => setExpandedReplyId(reply.id)} 
                                    className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 mt-2 transition-colors"
                                >
                                    <IconSparkles className="w-3 h-3" />
                                    {reply.content.length >= 300 ? 'Show Analysis & Full Text' : 'Show Analysis'}
                                </button>
                           )}

                           {/* Reasoning / Sources */}
                           {reply.aiAnalysis && expandedReplyId === reply.id && (
                               <div className="bg-white rounded-lg p-3 border border-slate-100 text-xs mt-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                                   <div className="flex justify-between items-start mb-2">
                                       <span className="font-bold text-indigo-900 uppercase tracking-wide text-[10px]">AI Analysis</span>
                                       <button onClick={() => setExpandedReplyId(null)} className="text-slate-400 hover:text-slate-600">
                                           <IconChevronUp className="w-3 h-3" />
                                       </button>
                                   </div>
                                   <p className="text-slate-600 mb-2 font-medium leading-relaxed">{reply.aiAnalysis.reasoning}</p>
                                   {reply.aiAnalysis.groundingSources?.length > 0 && (
                                       <div className="space-y-1 pt-2 border-t border-slate-50">
                                           {reply.aiAnalysis.groundingSources.map((s, i) => (
                                               <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="block text-indigo-500 hover:underline truncate">
                                                   {s.title || s.uri}
                                               </a>
                                           ))}
                                       </div>
                                   )}
                                   <button 
                                      onClick={() => setExpandedReplyId(null)} 
                                      className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 mt-2 pt-1 border-t border-slate-50"
                                   >
                                       Hide Analysis
                                   </button>
                               </div>
                           )}

                           {!expandedReplyId && !reply.aiAnalysis && reply.content.length >= 300 && (
                                <button onClick={() => setExpandedReplyId(reply.id)} className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 mt-2">
                                    Read More
                                </button>
                           )}
                           </>
                       )}
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Footer Reply Form */}
        <div className="border-t border-slate-200 p-6 lg:p-8 bg-slate-50 sticky bottom-0 z-10 rounded-b-2xl">
          {!canParticipate ? (
             <div className="text-center py-4 text-slate-500 bg-white border border-slate-200 rounded-xl border-dashed">
                You are in Spectator mode and cannot post rebuttals.
             </div>
          ) : isDebateClosed ? (
              <div className="text-center py-4 text-orange-600 bg-white border border-orange-200 rounded-xl border-dashed font-bold flex items-center justify-center gap-2">
                 <IconClock className="w-5 h-5" />
                 Debate is closed. No new rebuttals or edits allowed.
              </div>
          ) : (
          <form onSubmit={handleSubmitReply} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative">
             <div className="flex items-center gap-4 mb-4">
               <span className="text-xs font-bold text-slate-400 uppercase">Your Stance:</span>
               <div className="flex bg-slate-100 rounded-lg p-1">
                   <button 
                     type="button" 
                     onClick={() => setReplyStance(Stance.FOR)}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${replyStance === Stance.FOR ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      For
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setReplyStance(Stance.NEUTRAL)}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${replyStance === Stance.NEUTRAL ? 'bg-white text-gray-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      Neutral
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setReplyStance(Stance.AGAINST)}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${replyStance === Stance.AGAINST ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      Against
                   </button>
               </div>
               
               {/* ... Input for links & voice ... */}
               <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                   <IconLink className="w-3.5 h-3.5 text-slate-400" />
                   <input 
                     type="text" 
                     value={replyLink}
                     onChange={(e) => setReplyLink(e.target.value)}
                     onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                             e.preventDefault();
                             addAttachedLink();
                         }
                     }}
                     onBlur={addAttachedLink}
                     placeholder="Add a supporting link..."
                     className="bg-transparent border-none outline-none text-xs w-full text-slate-700 placeholder-slate-400"
                   />
                </div>
                
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                   <IconPaperclip className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                {/* AI Enhance Button */}
                {areAiToolsEnabled && (
                    <button 
                    type="button" 
                    onClick={handleEnhanceReply}
                    disabled={!replyText.trim() || isEnhancingReply}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isEnhancingReply ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                    title="AI Enhance Text"
                    >
                    <IconSparkles className={`w-5 h-5 ${isEnhancingReply ? 'animate-pulse' : ''}`} />
                    </button>
                )}
                
                <VoiceInput onTextReceived={(text) => setReplyText(prev => prev + " " + text)} />
             </div>

             {/* Attached Sources List */}
            {attachedLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {attachedLinks.map((link) => (
                        <span key={link} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold border border-indigo-100 max-w-full">
                            <IconLink className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{link.replace(/^https?:\/\//, '')}</span>
                            <button type="button" onClick={() => removeAttachedLink(link)} className="hover:text-indigo-900"><IconClose className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            )}

             <textarea 
               value={replyText}
               onChange={(e) => setReplyText(e.target.value)}
               placeholder="Write your rebuttal..."
               className="w-full h-24 p-0 bg-transparent border-none outline-none text-sm resize-none"
             />

             {/* Suggested Sources */}
            {(suggestedSources.length > 0 || isSuggestingSources || noSourcesFound) && areAiToolsEnabled && (
                <div className="flex flex-col gap-2 mt-2 border-t border-slate-100 pt-3 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <IconSparkles className="w-3 h-3 text-indigo-400" />
                        AI Suggested Sources
                        {isSuggestingSources && <span className="animate-pulse">...</span>}
                    </div>
                    {noSourcesFound && !isSuggestingSources ? (
                        <div className="text-xs text-slate-400 italic px-1">
                            No reliable sources found to support your stance.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {suggestedSources.map((source, idx) => (
                                <div key={idx} className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:border-indigo-300 transition-colors max-w-full">
                                    <a 
                                        href={source.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 border-r border-slate-100 truncate max-w-[220px]"
                                        title="Preview Source"
                                    >
                                        <IconLink className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{source.title || source.uri}</span>
                                        <IconExternal className="w-3 h-3 flex-shrink-0 opacity-50" />
                                    </a>
                                    <button 
                                        type="button"
                                        onClick={() => addSuggestedSource(source)}
                                        className="px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors flex-shrink-0"
                                        title="Add Source"
                                    >
                                        +
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

             {/* Footer Actions */}
             <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-2">
                   {/* Option to also post as main argument - Removed per request */}
                </div>
                <div className="flex items-center gap-3">
                   {isSubmittingReply && <span className="text-xs text-slate-400 animate-pulse">Verifying...</span>}
                   <button 
                     type="submit" 
                     disabled={!replyText.trim() || isSubmittingReply}
                     className="bg-slate-800 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition-all shadow-lg shadow-slate-200"
                   >
                     {isSubmittingReply ? 'Verifying...' : 'Post Rebuttal'}
                   </button>
                </div>
             </div>
             
             <p className="text-[10px] text-slate-400 text-center mt-2">
                AI features may produce inaccurate results. Please proofread for factual accuracy.
             </p>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};