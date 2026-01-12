

import React, { useState, useRef, useEffect } from 'react';
import { Topic, Comment, Stance, FactRating, Attachment, AIAnalysis, DebateType, PrivacyStatus, TopicResearchData, ResearchItem, ReportData } from '../types';
import { IconFor, IconAgainst, IconNeutral, IconLink, IconDoc, IconImage, IconStar, IconReply, IconLike, IconFilter, IconCheck, IconPaperclip, IconTrash, IconSort, IconShare, IconAlert, IconMic, IconLayoutList, IconLayoutColumns, IconBan, IconClose, IconEdit, IconSparkles, IconChevronDown, IconChevronUp, IconLock, IconClock, IconShieldAlert, IconSettings, IconGlobe, IconFeedback, IconBook, IconPlus, IconFlag, IconExternal, IconBell, IconUser } from './Icons';
import { RatingPill, DuplicatePill, EditedPill, AiGeneratedPill } from './RatingPill';
import { verifyStatement, generateConsensusSummary, suggestSupportingSources, enhanceArgument, generateTopicResearch } from '../services/gemini';
import { VoiceInput } from './VoiceInput';
import { FeedbackModal } from './FeedbackModal';
import { ReportModal } from './ReportModal';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface DebateViewProps {
  topic: Topic;
  comments: Comment[];
  isStarred: boolean;
  onToggleStar: () => void;
  onAddComment: (comment: Comment) => void;
  onSelectComment: (comment: Comment) => void;
  onLikeComment: (commentId: string) => void;
  onBack: () => void;
  onManageDebate?: () => void; // New prop for creator management
  canParticipate?: boolean; // New prop for role check
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  onOpenProfile: () => void;
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

enum SortOption {
  RECENT = 'RECENT',
  OLDEST = 'OLDEST',
  LIKES_HIGH = 'LIKES_HIGH',
  LIKES_LOW = 'LIKES_LOW'
}

type ViewMode = 'TIMELINE' | 'COLUMNS';
type Tab = 'ARGUMENTS' | 'RESEARCH';

const SORT_LABELS = {
  [SortOption.RECENT]: 'Date (Most Recent)',
  [SortOption.OLDEST]: 'Date (Oldest)',
  [SortOption.LIKES_HIGH]: 'Likes (Most-Least)',
  [SortOption.LIKES_LOW]: 'Likes (Least-Most)'
};

export const DebateView: React.FC<DebateViewProps> = ({ 
    topic, 
    comments, 
    isStarred, 
    onToggleStar, 
    onAddComment, 
    onSelectComment, 
    onLikeComment, 
    onBack, 
    onManageDebate, 
    canParticipate = true,
    onOpenNotifications,
    unreadNotificationCount,
    onOpenProfile
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('ARGUMENTS');
  
  // Arguments Tab State
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentStance, setNewCommentStance] = useState<Stance>(Stance.NEUTRAL);
  const [newCommentLink, setNewCommentLink] = useState('');
  const [attachedLinks, setAttachedLinks] = useState<string[]>([]);
  const [suggestedSources, setSuggestedSources] = useState<{title: string, uri: string}[]>([]);
  const [isSuggestingSources, setIsSuggestingSources] = useState(false);
  const [noSourcesFound, setNoSourcesFound] = useState(false);
  const [newCommentFile, setNewCommentFile] = useState<{file: File, preview: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhancingEdit, setIsEnhancingEdit] = useState(false);
  const [hasUsedAiFeatures, setHasUsedAiFeatures] = useState(false);
  const [editHasUsedAi, setEditHasUsedAi] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>(SortOption.RECENT);
  const [viewMode, setViewMode] = useState<ViewMode>('TIMELINE');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editStance, setEditStance] = useState<Stance>(Stance.NEUTRAL);
  const [pendingSubmission, setPendingSubmission] = useState<{comment: Comment, analysis: AIAnalysis} | null>(null);
  const [isConsensusExpanded, setIsConsensusExpanded] = useState(false);
  const [consensusText, setConsensusText] = useState('');
  const [isGeneratingConsensus, setIsGeneratingConsensus] = useState(false);
  
  // Research Tab State
  const [researchData, setResearchData] = useState<TopicResearchData | null>(null);
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);
  const [isLoadingMoreResearch, setIsLoadingMoreResearch] = useState(false);

  // Shared State
  const [toast, setToast] = useState<{show: boolean, message: string, type?: 'error' | 'info'}>({show: false, message: '', type: 'error'});
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Reporting State
  const [reportTarget, setReportTarget] = useState<ReportData | null>(null);
  
  // Refs
  const lastScrollTopRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterTimeoutRef = useRef<any>(null);
  const sortTimeoutRef = useRef<any>(null);
  const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if Timed Debate is closed
  const isDebateClosed = topic.type === DebateType.TIMED && topic.closesAt && Date.now() > topic.closesAt;
  
  // Check if AI Tools are enabled
  const aiToolsEnabled = topic.areAiToolsEnabled ?? true;

  // Default filters
  const [activeFilters, setActiveFilters] = useState<(FactRating | string)[]>([
    FactRating.TRUE, 
    FactRating.SOMEWHAT_TRUE, 
    FactRating.NEUTRAL, 
    FactRating.MISLEADING, 
    FactRating.FALSE,
    'DUPLICATE'
  ]);

  useEffect(() => {
    // Scroll handling
    const handleScroll = () => {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        if (st > lastScrollTopRef.current && st > 100) {
            setIsFooterVisible(false);
        } else {
            setIsFooterVisible(true);
        }
        lastScrollTopRef.current = st <= 0 ? 0 : st;
        setIsScrolled(st > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Research Data when Tab switches
  useEffect(() => {
      if (activeTab === 'RESEARCH' && !researchData && !isLoadingResearch) {
          setIsLoadingResearch(true);
          generateTopicResearch(topic.title, topic.description)
            .then(data => {
                setResearchData(data);
                setIsLoadingResearch(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoadingResearch(false);
            });
      }
  }, [activeTab, researchData, topic.title, topic.description, isLoadingResearch]);

  const handleLoadMoreResearch = async () => {
      if (isLoadingMoreResearch || !researchData) return;
      setIsLoadingMoreResearch(true);
      
      const existingUrls = [
          ...(researchData.for?.map(i => i.uri) || []),
          ...(researchData.neutral?.map(i => i.uri) || []),
          ...(researchData.against?.map(i => i.uri) || [])
      ];

      try {
          const newData = await generateTopicResearch(topic.title, topic.description, existingUrls);
          setResearchData(prev => {
              if (!prev) return newData;
              return {
                  for: [...(prev.for || []), ...(newData.for || [])],
                  neutral: [...(prev.neutral || []), ...(newData.neutral || [])],
                  against: [...(prev.against || []), ...(newData.against || [])]
              };
          });
      } catch (err) {
          console.error("Error loading more research", err);
          setToast({ show: true, message: "Failed to load more sources. Please try again.", type: 'error' });
      } finally {
          setIsLoadingMoreResearch(false);
      }
  };

  // Timer for toast
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (toast.show) {
      timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000); 
    }
    return () => clearTimeout(timer);
  }, [toast.show]);

  // Clean up timers
  useEffect(() => {
    return () => {
        if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
        if (sortTimeoutRef.current) clearTimeout(sortTimeoutRef.current);
        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    };
  }, []);

  // AI Suggestion Logic (Arguments Tab)
  useEffect(() => {
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
      setNoSourcesFound(false);
      
      if (newCommentText.length > 20 && !isDebateClosed && canParticipate && activeTab === 'ARGUMENTS' && aiToolsEnabled) {
          setIsSuggestingSources(true);
          suggestionTimeoutRef.current = setTimeout(async () => {
              const suggestions = await suggestSupportingSources(newCommentText, topic.title, newCommentStance);
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
  }, [newCommentText, topic.title, isDebateClosed, canParticipate, newCommentStance, activeTab, aiToolsEnabled]);


  // ... (Existing Handlers) ...
  const handleFilterEnter = () => { if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current); };
  const handleFilterLeave = () => { filterTimeoutRef.current = setTimeout(() => { setIsFilterOpen(false); }, 3000); };
  const handleSortEnter = () => { if (sortTimeoutRef.current) clearTimeout(sortTimeoutRef.current); };
  const handleSortLeave = () => { sortTimeoutRef.current = setTimeout(() => { setIsSortOpen(false); }, 3000); };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => setNewCommentFile({ file, preview: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };
  const removeFile = () => { setNewCommentFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const normalizeUrl = (url: string) => { url = url.trim(); if (!url) return ''; if (/^https?:\/\//i.test(url)) return url; return `https://${url}`; };
  const addAttachedLink = () => { if (!newCommentLink.trim()) return; const url = normalizeUrl(newCommentLink); if (url && !attachedLinks.includes(url)) { setAttachedLinks([...attachedLinks, url]); setNewCommentLink(''); } };
  const removeAttachedLink = (link: string) => { setAttachedLinks(attachedLinks.filter(l => l !== link)); };
  const addSuggestedSource = (source: {title: string, uri: string}) => { if (!attachedLinks.includes(source.uri)) { setAttachedLinks([...attachedLinks, source.uri]); setSuggestedSources(suggestedSources.filter(s => s.uri !== source.uri)); setHasUsedAiFeatures(true); } };
  const handleEnhance = async () => { if (!newCommentText.trim()) return; setIsEnhancing(true); const enhanced = await enhanceArgument(newCommentText, topic.title, newCommentStance); setNewCommentText(enhanced); setIsEnhancing(false); setHasUsedAiFeatures(true); };
  const handleEnhanceEdit = async () => { if (!editText.trim()) return; setIsEnhancingEdit(true); const enhanced = await enhanceArgument(editText, topic.title, editStance); setEditText(enhanced); setIsEnhancingEdit(false); setEditHasUsedAi(true); };
  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setToast({ show: true, message: 'Link copied to clipboard!', type: 'info' }); };
  
  const handlePostComment = (comment: Comment, analysis: AIAnalysis) => {
    onAddComment({ ...comment, aiAnalysis: analysis, isLoadingAI: false });
    if (editingCommentId === comment.id) { setEditingCommentId(null); setEditText(''); setEditHasUsedAi(false); } 
    else { setNewCommentText(''); setNewCommentLink(''); setAttachedLinks([]); setSuggestedSources([]); setNoSourcesFound(false); setNewCommentFile(null); setHasUsedAiFeatures(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    if (analysis.rating === FactRating.UNRELATED) { setToast({ show: true, message: "Your argument has been flagged as 'Unrelated' and is hidden by default. Use the filters to view it.", type: 'error' }); }
  };

  const startEditing = (comment: Comment, e: React.MouseEvent) => { e.stopPropagation(); setEditingCommentId(comment.id); setEditText(comment.content); setEditStance(comment.stance); setEditHasUsedAi(comment.isAiGenerated || false); };
  const cancelEditing = () => { setEditingCommentId(null); setEditText(''); setEditStance(Stance.NEUTRAL); setEditHasUsedAi(false); };
  const handleSaveEdit = async () => {
      if (!editText.trim()) return;
      const original = comments.find(c => c.id === editingCommentId); if (!original) return;
      setIsSubmitting(true);
      const existingArguments = comments.filter(c => c.id !== editingCommentId).map(c => c.content);
      const analysis = await verifyStatement(editText, topic.title, existingArguments);
      const detectedStance = analysis.detectedStance as Stance;
      const validStances = ['FOR', 'AGAINST', 'NEUTRAL'];
      const isMismatch = detectedStance && validStances.includes(detectedStance) && detectedStance !== editStance;
      const updatedComment = { ...original, content: editText, stance: editStance, isLoadingAI: false, isEdited: true, isAiGenerated: editHasUsedAi };
      setIsSubmitting(false);
      if (isMismatch) { setPendingSubmission({ comment: updatedComment, analysis }); } else { handlePostComment(updatedComment, analysis); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isDebateClosed || !canParticipate) return;
    setIsSubmitting(true);
    const existingArguments = comments.map(c => c.content);
    const analysis = await verifyStatement(newCommentText, topic.title, existingArguments);
    const detectedStance = analysis.detectedStance as Stance;
    const userStance = newCommentStance;
    const validStances = ['FOR', 'AGAINST', 'NEUTRAL'];
    const isMismatch = detectedStance && validStances.includes(detectedStance) && detectedStance !== userStance;
    const tempId = generateId();
    const finalSources = [...attachedLinks];
    if (newCommentLink) { const url = normalizeUrl(newCommentLink); if (url && !finalSources.includes(url)) finalSources.push(url); }
    const attachments: Attachment[] = [];
    if (newCommentFile) { attachments.push({ id: generateId(), name: newCommentFile.file.name, type: newCommentFile.file.type.startsWith('image/') ? 'image' : 'file', url: newCommentFile.preview }); }
    const comment: Comment = { id: tempId, topicId: topic.id, author: 'You', content: newCommentText, stance: userStance, timestamp: Date.now(), userSources: finalSources, userAttachments: attachments, isLoadingAI: false, likes: 0, replies: [], isEdited: false, isAiGenerated: hasUsedAiFeatures };
    setIsSubmitting(false);
    if (isMismatch) { setPendingSubmission({ comment, analysis }); } else { handlePostComment(comment, analysis); }
  };

  const toggleFilter = (rating: FactRating | string) => { setActiveFilters(prev => prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]); };
  
  const getTopArguments = (stance: Stance) => { return comments.filter(c => c.stance === stance && c.aiAnalysis?.rating === FactRating.TRUE).sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3); };
  const topFor = getTopArguments(Stance.FOR);
  const topAgainst = getTopArguments(Stance.AGAINST);
  const topNeutral = getTopArguments(Stance.NEUTRAL);

  const handleExpandConsensus = async () => {
    setIsConsensusExpanded(!isConsensusExpanded);
    if (!isConsensusExpanded && !consensusText && !isGeneratingConsensus) {
        setIsGeneratingConsensus(true);
        const text = await generateConsensusSummary(topic.title, topic.description, topFor.map(c => c.content), topAgainst.map(c => c.content), topNeutral.map(c => c.content));
        setConsensusText(text);
        setIsGeneratingConsensus(false);
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
      switch (currentSort) {
        case SortOption.RECENT: return b.timestamp - a.timestamp;
        case SortOption.OLDEST: return a.timestamp - b.timestamp;
        case SortOption.LIKES_HIGH: return (b.likes || 0) - (a.likes || 0);
        case SortOption.LIKES_LOW: return (a.likes || 0) - (b.likes || 0);
        default: return 0;
      }
  });

  const filteredComments = sortedComments.filter(c => {
      if (c.isLoadingAI || !c.aiAnalysis) return true;
      if (c.aiAnalysis.isDuplicate) return activeFilters.includes('DUPLICATE');
      return activeFilters.includes(c.aiAnalysis.rating);
  });

  const columnComments = comments.filter(c => c.aiAnalysis?.rating !== FactRating.UNRELATED && c.aiAnalysis?.rating !== FactRating.NEUTRAL);
  const statsFor = columnComments.filter(c => c.stance === Stance.FOR).length;
  const statsAgainst = columnComments.filter(c => c.stance === Stance.AGAINST).length;
  const statsNeutral = columnComments.filter(c => c.stance === Stance.NEUTRAL).length;
  const barComments = comments.filter(c => c.aiAnalysis?.rating !== FactRating.UNRELATED && c.aiAnalysis?.rating !== FactRating.NEUTRAL);
  const barStatsFor = barComments.filter(c => c.stance === Stance.FOR).length;
  const barStatsAgainst = barComments.filter(c => c.stance === Stance.AGAINST).length;
  const barStatsNeutral = barComments.filter(c => c.stance === Stance.NEUTRAL).length;
  const totalBarValid = barStatsFor + barStatsAgainst + barStatsNeutral;

  const renderCard = (comment: Comment) => {
    // ... (Existing renderCard Logic) ...
    if (editingCommentId === comment.id) {
        return (
            <div key={comment.id} className="bg-white rounded-xl p-5 shadow-lg border-2 border-indigo-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 cursor-default" onClick={e => e.stopPropagation()}>
                {/* ... Edit UI ... */}
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-700">Edit Argument</h3>
                    <button onClick={cancelEditing} className="p-1 hover:bg-slate-100 rounded-full"><IconClose className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex bg-slate-100 rounded-lg p-1 self-start">
                        <button type="button" onClick={() => setEditStance(Stance.FOR)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editStance === Stance.FOR ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>For</button>
                        <button type="button" onClick={() => setEditStance(Stance.NEUTRAL)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editStance === Stance.NEUTRAL ? 'bg-white text-gray-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Neutral</button>
                        <button type="button" onClick={() => setEditStance(Stance.AGAINST)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editStance === Stance.AGAINST ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Against</button>
                    </div>
                    <div className="flex items-center gap-2">
                        {aiToolsEnabled && (
                            <button type="button" onClick={handleEnhanceEdit} disabled={!editText.trim() || isEnhancingEdit} className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isEnhancingEdit ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`} title="AI Enhance Text"><IconSparkles className={`w-5 h-5 ${isEnhancingEdit ? 'animate-pulse' : ''}`} /></button>
                        )}
                        <VoiceInput onTextReceived={(text) => setEditText(prev => prev + " " + text)} />
                    </div>
                </div>
                <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none resize-none" placeholder="Update your argument..." />
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={cancelEditing} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSaveEdit} disabled={!editText.trim() || isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">{isSubmitting ? 'Verifying...' : 'Save Update'}</button>
                </div>
            </div>
        );
    }

    const originalComment = comment.originalCommentId ? comments.find(c => c.id === comment.originalCommentId) : null;
    const isMyComment = comment.author === 'You';
    return (
     <div key={comment.id} onClick={() => onSelectComment(comment)} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col relative">
        <div className="flex justify-between items-start mb-3">
           <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 text-sm">{comment.author}</span>
              {comment.userTitle && <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full flex items-center gap-1">
                  {comment.userTitle}
                  {comment.isUserVerified && <IconCheck className="w-3 h-3 text-green-500" />}
              </span>}
              <span className="text-xs text-slate-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
           </div>
           <div className="flex items-center gap-2">
               {isMyComment && !isDebateClosed && canParticipate && (
                   <button onClick={(e) => startEditing(comment, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Edit Argument"><IconEdit className="w-3.5 h-3.5" /></button>
               )}
               
               {/* Report Button for Argument */}
               {!isMyComment && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setReportTarget({
                                targetId: comment.id,
                                targetType: 'ARGUMENT',
                                targetContent: comment.content
                            });
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Report Argument"
                    >
                        <IconFlag className="w-3.5 h-3.5" />
                    </button>
               )}

               {comment.isLoadingAI ? (<div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-full border border-slate-200"><div className="w-2.5 h-2.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></div></div>) 
               : comment.aiAnalysis ? (<div className="flex items-center gap-1 scale-90 origin-top-right">{comment.isEdited && <EditedPill />}{comment.isAiGenerated && <AiGeneratedPill />}{comment.aiAnalysis.isDuplicate && <DuplicatePill />}<RatingPill rating={comment.aiAnalysis.rating} label={comment.aiAnalysis.ratingLabel} /></div>) : null}
           </div>
        </div>
        {originalComment && (<div onClick={(e) => { e.stopPropagation(); onSelectComment(originalComment); }} className="mb-3 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded inline-flex items-center gap-1 cursor-pointer font-medium self-start transition-colors"><IconReply className="w-3 h-3" /><span>Rebuttal to argument by {originalComment.author}</span></div>)}
        <p className="text-slate-800 text-base leading-relaxed mb-4 flex-grow">{comment.content}</p>
        {(comment.userSources.length > 0 || (comment.userAttachments && comment.userAttachments.length > 0)) && (
           <div className="flex flex-wrap gap-2 mb-4">
              {comment.userSources.map((src, i) => (<div key={i} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs text-slate-500 max-w-[150px]"><IconLink className="w-3 h-3" /><span className="truncate">{src.replace(/^https?:\/\//, '')}</span></div>))}
              {comment.userAttachments?.map((att) => (<div key={att.id} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs text-slate-500 max-w-[150px]">{att.type === 'image' ? <IconImage className="w-3 h-3 text-purple-500" /> : <IconDoc className="w-3 h-3 text-blue-500" />}<span className="truncate">{att.name}</span></div>))}
           </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
           <div className="flex items-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); !isDebateClosed && canParticipate && onLikeComment(comment.id); }} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${comment.likedByMe ? 'text-indigo-600' : 'text-slate-400'} ${(!isDebateClosed && canParticipate) ? 'hover:text-slate-600' : 'cursor-default opacity-50'}`}><IconLike className={`w-4 h-4 ${comment.likedByMe ? 'fill-current' : ''}`} />{comment.likes || 0}</button>
              <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors cursor-default"><IconReply className="w-4 h-4" />{(comment.replies?.length || 0)}</button>
           </div>
           {comment.aiAnalysis && comment.aiAnalysis.rating !== FactRating.UNRELATED && (<div className="text-xs text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><IconAlert className="w-3 h-3" />Analysis</div>)}
        </div>
     </div>
    );
  };

  const renderResearchCard = (item: ResearchItem, index: number) => (
      <a 
        key={index} 
        href={item.uri} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 group cursor-pointer block text-left no-underline" 
        style={{animationDelay: `${index * 50}ms`}}
      >
          <div className="flex items-start justify-between mb-2 gap-2">
              <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
              <div className="text-slate-400 group-hover:text-indigo-600 flex-shrink-0 transition-colors">
                  <IconExternal className="w-4 h-4" />
              </div>
          </div>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed flex-grow group-hover:text-slate-700">{item.snippet}</p>
          <div className="pt-2 border-t border-slate-50 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium uppercase tracking-wide group-hover:border-indigo-50">
              <IconGlobe className="w-3 h-3" />
              <span className="truncate">{item.sourceName || 'Web Source'}</span>
          </div>
      </a>
  );

  return (
    <div className="max-w-[2400px] mx-auto min-h-screen flex flex-col bg-white shadow-2xl border-x border-slate-200 relative">
       
       {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
       
       {/* Report Modal */}
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
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* ... (Existing Mismatch Modal) ... */}
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
               <div className="flex items-center gap-3 mb-4 text-orange-600">
                  <div className="p-2 bg-orange-100 rounded-full"><IconAlert className="w-6 h-6" /></div>
                  <h3 className="text-lg font-bold text-slate-900">Stance Mismatch Detected</h3>
               </div>
               <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                  You selected <span className="font-bold uppercase text-slate-800 bg-slate-100 px-1 rounded">{pendingSubmission.comment.stance}</span>, 
                  but our AI analysis suggests this argument supports <span className="font-bold uppercase text-indigo-600 bg-indigo-50 px-1 rounded">{pendingSubmission.analysis.detectedStance}</span>.
               </p>
               <div className="flex flex-col gap-3">
                  <button onClick={() => { const updatedComment = { ...pendingSubmission.comment, stance: pendingSubmission.analysis.detectedStance as Stance }; handlePostComment(updatedComment, pendingSubmission.analysis); setPendingSubmission(null); }} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">Change to {pendingSubmission.analysis.detectedStance}<span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Recommended</span></button>
                  <button onClick={() => { handlePostComment(pendingSubmission.comment, pendingSubmission.analysis); setPendingSubmission(null); }} className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors">Keep as {pendingSubmission.comment.stance}</button>
                  <button onClick={() => setPendingSubmission(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wide py-2">Cancel Post</button>
               </div>
            </div>
         </div>
       )}

       {toast.show && (
         <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 max-w-lg">
            <div className={`p-2 rounded-lg ${toast.type === 'info' ? 'bg-indigo-600' : 'bg-slate-700'}`}>{toast.type === 'info' ? <IconCheck className="w-6 h-6 text-white" /> : <IconBan className="w-6 h-6 text-slate-300" />}</div>
            <div className="flex-1"><h4 className="font-bold text-sm mb-1">{toast.type === 'info' ? 'Success' : 'Content Hidden'}</h4><p className="text-xs text-slate-300 leading-relaxed">{toast.message}</p></div>
            <button onClick={() => setToast({ ...toast, show: false })} className="p-1 hover:bg-slate-700 rounded-lg transition-colors"><IconClose className="w-5 h-5 text-slate-400" /></button>
         </div>
       )}

       <header className={`sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
         <div className="p-6 pb-2 relative">
           <div className="flex items-center justify-between gap-4 mb-4">
              <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium transition-colors z-10 relative">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7"/></svg> Back to Topics
              </button>

              <div 
                onClick={onBack}
                className="absolute left-1/2 top-6 -translate-x-1/2 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                 <div className="bg-black text-white p-1.5 rounded-lg flex items-center justify-center shadow-sm">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                 </div>
                 <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:inline-block">Verbo</span>
              </div>

              <div className="flex items-center gap-2 z-10 relative">
                 {/* Author Pill */}
                 <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 text-xs text-slate-600 mr-2">
                    <span className="text-slate-400 font-medium">Host</span>
                    <span className="font-bold text-slate-800">{topic.author}</span>
                 </div>

                 {/* Manage */}
                 {topic.author === 'You' && onManageDebate && (<button onClick={onManageDebate} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-bold transition-colors mr-2"><IconSettings className="w-4 h-4" /> Manage</button>)}
                 
                 {/* Star */}
                 <button onClick={onToggleStar} className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${isStarred ? 'text-yellow-500' : 'text-slate-400'}`} title={isStarred ? "Unstar Debate" : "Star Debate"}><IconStar className={`w-5 h-5 ${isStarred ? 'fill-current' : ''}`} /></button>
                 
                 {/* Share */}
                 <button onClick={handleShare} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors" title="Share Debate"><IconShare className="w-5 h-5" /></button>
                 
                 <div className="h-4 w-px bg-slate-200 mx-1"></div>

                 {/* Bell */}
                 <button onClick={onOpenNotifications} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors relative" title="Notifications">
                    <IconBell className="w-5 h-5" />
                    {unreadNotificationCount && unreadNotificationCount > 0 ? (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    ) : null}
                 </button>

                 {/* Profile */}
                 <button 
                    onClick={onOpenProfile}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors" 
                    title="Profile"
                 >
                    <IconUser className="w-5 h-5" />
                 </button>

                 {/* Feedback */}
                 <button onClick={() => setShowFeedback(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors" title="Send Feedback"><IconFeedback className="w-5 h-5" /></button>
                 
                 {/* Report Topic Button */}
                 {topic.author !== 'You' && (
                    <button 
                        onClick={() => setReportTarget({
                            targetId: topic.id,
                            targetType: 'TOPIC',
                            targetContent: topic.title
                        })} 
                        className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" 
                        title="Report Debate Topic"
                    >
                        <IconFlag className="w-5 h-5" />
                    </button>
                 )}
              </div>
           </div>
           
           <h1 className="text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
             {topic.title}
             <span className="ml-2 text-sm font-normal text-slate-400 align-middle">#{topic.id}</span>
             {topic.isEdited && (<span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded align-middle">(Edited)</span>)}
           </h1>
           
           <div className="flex flex-wrap items-center gap-3 text-sm mb-6">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs uppercase tracking-wide border ${topic.type === DebateType.TIMED ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {topic.type === DebateType.TIMED ? <IconClock className="w-3.5 h-3.5" /> : <IconGlobe className="w-3.5 h-3.5" />}
                  {topic.type === DebateType.TIMED ? `Timed-Debate • Ends ${new Date(topic.closesAt!).toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short' })}` : 'Debate'}
              </span>
              {topic.privacy === PrivacyStatus.PRIVATE && (<span className="flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs uppercase tracking-wide border bg-slate-100 text-slate-600 border-slate-200"><IconLock className="w-3.5 h-3.5" /> Private</span>)}
              {topic.isAgeRestricted && (<span className="flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs uppercase tracking-wide border bg-red-50 text-red-600 border-red-200"><IconShieldAlert className="w-3.5 h-3.5" /> 18+ Only</span>)}
              {!aiToolsEnabled && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs uppercase tracking-wide border bg-purple-50 text-purple-700 border-purple-200">
                    <IconSparkles className="w-3.5 h-3.5" />
                    AI Tools Disabled
                </span>
              )}
              {topic.tags?.map(tag => (<span key={tag} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium text-xs border border-slate-200">{tag}</span>))}
           </div>
           
           <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">{topic.description}</p>
           
           <div className="mt-8 mb-4">
               <div className="bg-slate-100 rounded-full h-3 overflow-hidden flex">
                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${totalBarValid > 0 ? (barStatsFor / totalBarValid) * 100 : 0}%` }}></div>
                    <div className="bg-gray-300 h-full transition-all duration-500" style={{ width: `${totalBarValid > 0 ? (barStatsNeutral / totalBarValid) * 100 : 0}%` }}></div>
                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${totalBarValid > 0 ? (barStatsAgainst / totalBarValid) * 100 : 0}%` }}></div>
               </div>
               <div className="flex justify-between mt-2 text-xs font-bold uppercase tracking-wider">
                    <span className="text-blue-600 flex-1 text-left">{barStatsFor} FOR</span>
                    <span className="text-gray-500 flex-1 text-center">{barStatsNeutral} NEUTRAL</span>
                    <span className="text-red-600 flex-1 text-right">{barStatsAgainst} AGAINST</span>
               </div>
           </div>

           {/* Tab Navigation */}
           <div className="flex gap-6 border-b border-transparent">
               <button 
                 onClick={() => setActiveTab('ARGUMENTS')}
                 className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ARGUMENTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
               >
                   <IconLayoutList className="w-4 h-4" />
                   Arguments
               </button>
               <button 
                 onClick={() => setActiveTab('RESEARCH')}
                 className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'RESEARCH' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
               >
                   <IconBook className="w-4 h-4" />
                   Topic Research
                   {isLoadingResearch && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>}
               </button>
           </div>
         </div>
         
         {/* Filter/Sort Bar (Only for Arguments) */}
         {activeTab === 'ARGUMENTS' && (
         <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-4">
               <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Arguments ({filteredComments.length})</h3>
               <div className="relative" onMouseEnter={handleFilterEnter} onMouseLeave={handleFilterLeave}>
                  <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${activeFilters.length < 6 ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-200 text-slate-600'}`}>
                     <IconFilter className="w-4 h-4" /> Filter
                  </button>
                  {isFilterOpen && (
                     <>
                     <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)}></div>
                     <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 border-b border-slate-100 mb-1"><span className="text-xs font-bold text-slate-400 uppercase">Filter by Verification</span></div>
                        {FILTER_OPTIONS.map((option) => (
                           <button key={option.value} onClick={() => toggleFilter(option.value)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                           <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                           <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${activeFilters.includes(option.value) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>{activeFilters.includes(option.value) && <IconCheck className="w-3.5 h-3.5 text-white" />}</div>
                           </button>
                        ))}
                     </div>
                     </>
                  )}
               </div>
               <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button onClick={() => setViewMode('TIMELINE')} className={`p-1.5 rounded-md transition-all ${viewMode === 'TIMELINE' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Timeline View (Chronological)"><IconLayoutList className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('COLUMNS')} className={`p-1.5 rounded-md transition-all ${viewMode === 'COLUMNS' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Column View (Grouped by Stance)"><IconLayoutColumns className="w-4 h-4" /></button>
               </div>
            </div>
            <div className="relative" onMouseEnter={handleSortEnter} onMouseLeave={handleSortLeave}>
               <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><IconSort className="w-4 h-4" />{SORT_LABELS[currentSort]}</button>
               {isSortOpen && (
                  <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsSortOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-40 animate-in fade-in zoom-in-95 duration-200">
                     {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (<button key={option} onClick={() => { setCurrentSort(option); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentSort === option ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>{SORT_LABELS[option]}</button>))}
                  </div>
                  </>
               )}
            </div>
         </div>
         )}
       </header>

       <div className="flex-1 p-6 bg-slate-50/50 pb-32 overflow-x-hidden">
          {activeTab === 'ARGUMENTS' ? (
              <>
                {isDebateClosed && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-800">
                        <IconClock className="w-6 h-6" />
                        <div><h4 className="font-bold">Debate Closed</h4><p className="text-sm">This timed debate has ended. No new arguments or interactions are allowed.</p></div>
                    </div>
                )}

                <div className="mb-8 rounded-xl overflow-hidden bg-white shadow-sm border border-indigo-100 transition-all duration-300">
                    <button onClick={handleExpandConsensus} className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all text-left">
                        <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><IconSparkles className="w-5 h-5" /></div><div><h3 className="font-bold text-slate-800 text-lg">AI Consensus & Top Verified Arguments</h3>{!isConsensusExpanded && <p className="text-xs text-slate-500">Tap to view a summary of the most trusted arguments</p>}</div></div>
                        <div className="p-2 text-slate-400">{isConsensusExpanded ? <IconChevronUp className="w-5 h-5" /> : <IconChevronDown className="w-5 h-5" />}</div>
                    </button>
                    {isConsensusExpanded && (
                        <div className="p-6 border-t border-indigo-50 animate-in slide-in-from-top-2 duration-300">
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3">Consensus Summary</h4>
                                {isGeneratingConsensus ? (<div className="flex items-center gap-2 text-slate-500 p-4 bg-slate-50 rounded-lg"><IconSparkles className="w-4 h-4 animate-spin text-indigo-400" /><span className="text-sm font-medium">Analyzing verified arguments to generate consensus...</span></div>) 
                                : (<p className="text-slate-800 text-base leading-relaxed p-4 bg-indigo-50/50 rounded-lg border border-indigo-50">{consensusText}</p>)}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Top Verified Arguments (Highest Rated)</h4>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="space-y-3"><div className="flex items-center gap-2 text-blue-800 mb-1 border-b border-blue-100 pb-2"><IconFor className="w-4 h-4" /><span className="font-bold text-sm">Best For</span></div>{topFor.length > 0 ? topFor.map(c => (<div key={`top-${c.id}`}>{renderCard(c)}</div>)) : <div className="text-xs text-slate-400 italic py-2">No verified 'True' arguments yet.</div>}</div>
                                    <div className="space-y-3"><div className="flex items-center gap-2 text-slate-700 mb-1 border-b border-slate-200 pb-2"><IconNeutral className="w-4 h-4" /><span className="font-bold text-sm">Best Neutral</span></div>{topNeutral.length > 0 ? topNeutral.map(c => (<div key={`top-${c.id}`}>{renderCard(c)}</div>)) : <div className="text-xs text-slate-400 italic py-2">No verified 'True' arguments yet.</div>}</div>
                                    <div className="space-y-3"><div className="flex items-center gap-2 text-red-800 mb-1 border-b border-red-100 pb-2"><IconAgainst className="w-4 h-4" /><span className="font-bold text-sm">Best Against</span></div>{topAgainst.length > 0 ? topAgainst.map(c => (<div key={`top-${c.id}`}>{renderCard(c)}</div>)) : <div className="text-xs text-slate-400 italic py-2">No verified 'True' arguments yet.</div>}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden lg:grid grid-cols-3 gap-6 mb-6 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-blue-900"><IconFor className="w-5 h-5 text-blue-600" /><h3 className="text-lg font-bold">For</h3><span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{statsFor}</span></div>
                    <div className="flex items-center gap-2 text-slate-700"><IconNeutral className="w-5 h-5 text-slate-500" /><h3 className="text-lg font-bold">Neutral</h3><span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{statsNeutral}</span></div>
                    <div className="flex items-center gap-2 text-red-900"><IconAgainst className="w-5 h-5 text-red-600" /><h3 className="text-lg font-bold">Against</h3><span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{statsAgainst}</span></div>
                </div>

                <div className="flex flex-col gap-4">
                    {filteredComments.length === 0 && (<div className="text-center py-20 text-slate-400 italic">No arguments yet</div>)}
                    {viewMode === 'TIMELINE' ? (
                        filteredComments.map(comment => (
                            <div key={comment.id} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className={`${comment.stance === Stance.FOR ? 'lg:col-start-1' : ''} ${comment.stance === Stance.NEUTRAL ? 'lg:col-start-2' : ''} ${comment.stance === Stance.AGAINST ? 'lg:col-start-3' : ''}`}>{renderCard(comment)}</div>
                            </div>
                        ))
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-6">{filteredComments.filter(c => c.stance === Stance.FOR).map(c => (<div key={c.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">{renderCard(c)}</div>))}</div>
                            <div className="flex flex-col gap-6">{filteredComments.filter(c => c.stance === Stance.NEUTRAL).map(c => (<div key={c.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">{renderCard(c)}</div>))}</div>
                            <div className="flex flex-col gap-6">{filteredComments.filter(c => c.stance === Stance.AGAINST).map(c => (<div key={c.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">{renderCard(c)}</div>))}</div>
                        </div>
                    )}
                </div>
              </>
          ) : (
              /* RESEARCH TAB CONTENT */
              <div className="animate-in fade-in duration-300">
                  <div className="mb-6 bg-purple-50 p-6 rounded-xl border border-purple-100 flex items-start gap-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm text-purple-600"><IconBook className="w-6 h-6" /></div>
                      <div>
                          <h3 className="font-bold text-purple-900 text-lg mb-1">Topic Research Hub</h3>
                          <p className="text-sm text-purple-700 leading-relaxed">
                              Explore reliable, AI-curated sources to understand the consensus and key arguments surrounding this topic. 
                              This data reflects individual, community, national, and global perspectives found online.
                          </p>
                      </div>
                  </div>

                  {isLoadingResearch && !researchData ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4 text-center max-w-lg mx-auto">
                          <IconSparkles className="w-10 h-10 animate-spin text-purple-400" />
                          <h3 className="text-lg font-bold text-slate-700">Curating Research...</h3>
                          <p className="text-sm font-medium text-slate-500 leading-relaxed">
                              Verbo AI is searching for the most up-to-date sources to provide a balanced overview. 
                              This process may take a few minutes to ensure accuracy.
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                              Feel free to explore the arguments tab while we do our magic!
                          </p>
                      </div>
                  ) : researchData ? (
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2 text-blue-900"><IconFor className="w-5 h-5 text-blue-600" /><h3 className="text-lg font-bold">Supporting Perspectives</h3></div>
                            <div className="flex items-center gap-2 text-slate-700"><IconNeutral className="w-5 h-5 text-slate-500" /><h3 className="text-lg font-bold">Objective Overview</h3></div>
                            <div className="flex items-center gap-2 text-red-900"><IconAgainst className="w-5 h-5 text-red-600" /><h3 className="text-lg font-bold">Opposing Perspectives</h3></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-4">
                                {researchData.for?.length > 0 ? researchData.for.map((item, idx) => renderResearchCard(item, idx)) : <div className="text-center text-slate-400 text-xs italic py-10">No specific sources found.</div>}
                            </div>
                            <div className="flex flex-col gap-4">
                                {researchData.neutral?.length > 0 ? researchData.neutral.map((item, idx) => renderResearchCard(item, idx + 10)) : <div className="text-center text-slate-400 text-xs italic py-10">No specific sources found.</div>}
                            </div>
                            <div className="flex flex-col gap-4">
                                {researchData.against?.length > 0 ? researchData.against.map((item, idx) => renderResearchCard(item, idx + 20)) : <div className="text-center text-slate-400 text-xs italic py-10">No specific sources found.</div>}
                            </div>
                        </div>
                        
                        {/* Load More Button */}
                        <div className="flex justify-center mt-10 mb-6">
                            <button 
                                onClick={handleLoadMoreResearch} 
                                disabled={isLoadingMoreResearch}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingMoreResearch ? (
                                    <>
                                        <IconSparkles className="w-4 h-4 animate-spin" />
                                        Finding more sources...
                                    </>
                                ) : (
                                    <>
                                        <IconPlus className="w-4 h-4" />
                                        Find More Sources
                                    </>
                                )}
                            </button>
                        </div>
                      </>
                  ) : (
                      <div className="text-center py-20 text-slate-400">Unable to load research data. Please try again later.</div>
                  )}
              </div>
          )}
       </div>

       {/* Footer Input - Only show in Arguments Tab */}
       {activeTab === 'ARGUMENTS' && (
       <div className={`fixed bottom-0 w-full max-w-[2400px] bg-white border-t border-slate-200 p-4 transition-transform duration-300 z-30 ${isFooterVisible ? 'translate-y-0' : 'translate-y-full'}`}>
          {!canParticipate ? (
             <div className="text-center py-4 text-slate-500 bg-slate-50 rounded-lg">You are in Spectator mode and cannot post arguments.</div>
          ) : isDebateClosed ? (
             <div className="text-center py-4 text-orange-600 bg-orange-50 rounded-lg font-bold border border-orange-200"><IconClock className="w-5 h-5 inline-block mr-2" />Debate is closed for new arguments.</div>
          ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-4xl mx-auto">
             <div className="flex items-center gap-4">
                <div className="flex bg-slate-100 rounded-lg p-1">
                   <button type="button" onClick={() => setNewCommentStance(Stance.FOR)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${newCommentStance === Stance.FOR ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>For</button>
                   <button type="button" onClick={() => setNewCommentStance(Stance.NEUTRAL)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${newCommentStance === Stance.NEUTRAL ? 'bg-white text-gray-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Neutral</button>
                   <button type="button" onClick={() => setNewCommentStance(Stance.AGAINST)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${newCommentStance === Stance.AGAINST ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Against</button>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all"><IconLink className="w-3.5 h-3.5 text-slate-400" /><input type="text" value={newCommentLink} onChange={(e) => setNewCommentLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttachedLink(); } }} onBlur={addAttachedLink} placeholder="Add supporting URL..." className="bg-transparent border-none outline-none text-xs w-full text-slate-700 placeholder-slate-400" /></div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><IconPaperclip className="w-5 h-5" /></button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                
                {aiToolsEnabled && (
                    <button type="button" onClick={handleEnhance} disabled={!newCommentText.trim() || isEnhancing} className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isEnhancing ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`} title="AI Enhance Text"><IconSparkles className={`w-5 h-5 ${isEnhancing ? 'animate-pulse' : ''}`} /></button>
                )}
                
                <VoiceInput onTextReceived={(text) => setNewCommentText(prev => prev + " " + text)} />
             </div>
            {attachedLinks.length > 0 && (<div className="flex flex-wrap gap-2">{attachedLinks.map((link) => (<span key={link} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold border border-indigo-100 max-w-full"><IconLink className="w-3 h-3" /><span className="truncate max-w-[200px]">{link.replace(/^https?:\/\//, '')}</span><button type="button" onClick={() => removeAttachedLink(link)} className="hover:text-indigo-900"><IconClose className="w-3 h-3" /></button></span>))}</div>)}
             <div className="relative">
                <textarea value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="Share your argument... (AI will verify your claims)" className="w-full h-24 p-4 pr-32 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all shadow-inner" />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">{isSubmitting && <span className="text-xs text-slate-400 animate-pulse">Verifying...</span>}<button type="submit" disabled={!newCommentText.trim() || isSubmitting} className="bg-black text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/10">{isSubmitting ? 'Verifying...' : 'Post Argument'}</button></div>
             </div>
            {(suggestedSources.length > 0 || isSuggestingSources || noSourcesFound) && aiToolsEnabled && (<div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><IconSparkles className="w-3 h-3 text-indigo-400" /> AI Suggested Sources {isSuggestingSources && <span className="animate-pulse">...</span>}</div>{noSourcesFound && !isSuggestingSources ? (<div className="text-xs text-slate-400 italic px-1">No reliable sources found to support your stance.</div>) : (<div className="flex flex-wrap gap-2">{suggestedSources.map((source, idx) => (<div key={idx} className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:border-indigo-300 transition-colors max-w-full"><a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 border-r border-slate-100 truncate max-w-[220px]" title="Preview Source"><IconLink className="w-3 h-3 flex-shrink-0" /><span className="truncate">{source.title || source.uri}</span><IconExternal className="w-3 h-3 flex-shrink-0 opacity-50" /></a><button type="button" onClick={() => addSuggestedSource(source)} className="px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors flex-shrink-0" title="Add Source">+</button></div>))}</div>)}</div>)}
            <p className="text-[10px] text-slate-400 text-center mt-1">AI features may produce inaccurate results. Please proofread for factual accuracy.
            </p>
          </form>
          )}
       </div>
       )}
    </div>
  );
};