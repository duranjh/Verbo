import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Topic, Comment, Stance, ReportData, ResearchSynthesis, TopicResearchData } from '../types';
import { generateResearchSynthesis, generateTopicResearch } from '../services/gemini';
import { aggregateSources } from '../lib/aggregateSources';
import {
  IconBell,
  IconFeedback,
  IconFlag,
  IconLayoutList,
  IconUser,
} from './Icons';
import { Tabs, Toast } from './ui';
import { DebateHeader } from './debate/DebateHeader';
import { DebateArguments } from './debate/DebateArguments';
import { ResearchTab } from './debate/ResearchTab';
import { FeedbackModal } from './FeedbackModal';
import { ReportModal } from './ReportModal';

type Tab = 'ARGUMENTS' | 'RESEARCH' | 'PARTICIPANTS';

interface DebateViewProps {
  topic: Topic;
  comments: Comment[];
  isStarred: boolean;
  onToggleStar: () => void;
  onAddComment: (comment: Comment) => void;
  onSelectComment: (comment: Comment) => void;
  onLikeComment: (commentId: string) => void;
  onBack: () => void;
  onManageDebate?: () => void;
  canParticipate?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  onOpenProfile: () => void;
  consensusCache?: { text: string; generatedAt: number };
  onCacheConsensus: (topicId: string, text: string) => void;
  synthesisCache?: { synthesis: ResearchSynthesis; generatedAt: number };
  onCacheSynthesis: (topicId: string, synthesis: ResearchSynthesis) => void;
  onSwitchStance: (commentId: string, newStance: Stance) => void;
}

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
  onOpenProfile,
  consensusCache,
  onCacheConsensus,
  synthesisCache,
  onCacheSynthesis,
  onSwitchStance,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('ARGUMENTS');
  const [reportTarget, setReportTarget] = useState<ReportData | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'info' | 'error' }>(
    { show: false, message: '', type: 'info' }
  );

  // Research tab state — chunk #5
  const [researchData, setResearchData] = useState<TopicResearchData | null>(null);
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);
  const [isLoadingMoreResearch, setIsLoadingMoreResearch] = useState(false);
  const [isLoadingSynthesis, setIsLoadingSynthesis] = useState(false);
  const [readingListByTopic, setReadingListByTopic] = useState<Record<string, string[]>>({});

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setToast({ show: true, message: 'Link copied to clipboard', type: 'info' });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast.show) return;
    const timer = window.setTimeout(
      () => setToast((prev) => ({ ...prev, show: false })),
      4000
    );
    return () => window.clearTimeout(timer);
  }, [toast.show]);

  // Fetch research data + synthesize once the tab opens.
  // Research data is cached locally; synthesis is cached at App level keyed by topic.
  useEffect(() => {
    if (activeTab !== 'RESEARCH' || researchData || isLoadingResearch) return;
    setIsLoadingResearch(true);
    generateTopicResearch(topic.title, topic.description)
      .then((data) => setResearchData(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingResearch(false));
  }, [activeTab, researchData, topic.title, topic.description, isLoadingResearch]);

  // Once research data lands (and we have something to synthesize), generate the
  // AI Synthesis card unless already cached. Sources passed in are the union of
  // user-cited URLs and AI-surfaced research items, deduped through aggregateSources.
  useEffect(() => {
    if (activeTab !== 'RESEARCH') return;
    if (synthesisCache || isLoadingSynthesis) return;
    if (isLoadingResearch) return;
    const aggregated = aggregateSources(comments, researchData);
    if (aggregated.length === 0) return;

    setIsLoadingSynthesis(true);
    let cancelled = false;
    const inputs = aggregated.slice(0, 40).map((s) => ({
      hostname: s.hostname,
      category: s.category,
      title: s.title,
      excerpt: s.excerpt,
    }));
    generateResearchSynthesis(topic.title, topic.description, inputs)
      .then((synth) => {
        if (cancelled) return;
        if (synth.agree) onCacheSynthesis(topic.id, synth);
      })
      .catch((err) => console.error('Research synthesis failed', err))
      .finally(() => {
        if (!cancelled) setIsLoadingSynthesis(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    synthesisCache,
    isLoadingSynthesis,
    isLoadingResearch,
    comments,
    researchData,
    topic.id,
    topic.title,
    topic.description,
    onCacheSynthesis,
  ]);

  const handleLoadMoreResearch = async () => {
    if (isLoadingMoreResearch || !researchData) return;
    setIsLoadingMoreResearch(true);
    const existingUrls = [
      ...(researchData.for?.map((i) => i.uri) || []),
      ...(researchData.neutral?.map((i) => i.uri) || []),
      ...(researchData.against?.map((i) => i.uri) || []),
    ];
    try {
      const newData = await generateTopicResearch(
        topic.title,
        topic.description,
        existingUrls
      );
      setResearchData((prev) => {
        if (!prev) return newData;
        return {
          for: [...(prev.for || []), ...(newData.for || [])],
          neutral: [...(prev.neutral || []), ...(newData.neutral || [])],
          against: [...(prev.against || []), ...(newData.against || [])],
        };
      });
    } catch (err) {
      console.error('Error loading more research', err);
      setToast({
        show: true,
        message: 'Failed to load more sources. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoadingMoreResearch(false);
    }
  };

  const handleToggleReadingList = useCallback(
    (uri: string) => {
      setReadingListByTopic((prev) => {
        const list = prev[topic.id] ?? [];
        const exists = list.includes(uri);
        const next = exists ? list.filter((u) => u !== uri) : [uri, ...list];
        return { ...prev, [topic.id]: next };
      });
    },
    [topic.id]
  );

  const handleGenerateAll = useCallback(async () => {
    if (isLoadingResearch || isLoadingSynthesis) return;
    setIsLoadingResearch(true);
    try {
      const data = await generateTopicResearch(topic.title, topic.description);
      setResearchData(data);
      const aggregated = aggregateSources(comments, data);
      if (aggregated.length > 0) {
        setIsLoadingSynthesis(true);
        try {
          const synth = await generateResearchSynthesis(
            topic.title,
            topic.description,
            aggregated.slice(0, 40).map((s) => ({
              hostname: s.hostname,
              category: s.category,
              title: s.title,
              excerpt: s.excerpt,
            }))
          );
          if (synth.agree) onCacheSynthesis(topic.id, synth);
        } finally {
          setIsLoadingSynthesis(false);
        }
      }
    } catch (err) {
      console.error('Failed to generate research', err);
      setToast({ show: true, message: 'Could not generate research right now.', type: 'error' });
    } finally {
      setIsLoadingResearch(false);
    }
  }, [
    isLoadingResearch,
    isLoadingSynthesis,
    topic.id,
    topic.title,
    topic.description,
    comments,
    onCacheSynthesis,
  ]);

  const handleAddSourceStub = useCallback((_uri: string) => {
    setToast({
      show: true,
      message: 'URL ingestion coming soon — added URLs aren’t persisted yet.',
      type: 'info',
    });
  }, []);

  const tabCounts = useMemo(
    () => ({
      ARGUMENTS: comments.length,
      RESEARCH:
        (researchData?.for?.length ?? 0) +
        (researchData?.neutral?.length ?? 0) +
        (researchData?.against?.length ?? 0),
      PARTICIPANTS: topic.participants?.filter((p) => !p.isBlocked).length ?? 0,
    }),
    [comments.length, researchData, topic.participants]
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col bg-cream">
      {/* Page-local chrome (notifications + profile + feedback). Full TopAppBar is wired in chunk #9. */}
      <div className="sticky top-0 z-30 flex items-center justify-end gap-1 border-b border-rule bg-cream/95 px-4 py-2 backdrop-blur md:px-8">
        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative inline-flex items-center justify-center rounded-full p-2 text-ink-3 transition-colors hover:bg-cream-2 hover:text-ink"
          >
            <IconBell className="h-4 w-4" />
            {unreadNotificationCount && unreadNotificationCount > 0 ? (
              <span className="absolute right-1 top-1 inline-block h-1.5 w-1.5 rounded-full bg-editorial-red" />
            ) : null}
          </button>
        )}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label="Profile"
          className="inline-flex items-center justify-center rounded-full p-2 text-ink-3 transition-colors hover:bg-cream-2 hover:text-ink"
        >
          <IconUser className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowFeedback(true)}
          aria-label="Send feedback"
          className="inline-flex items-center justify-center rounded-full p-2 text-ink-3 transition-colors hover:bg-cream-2 hover:text-ink"
        >
          <IconFeedback className="h-4 w-4" />
        </button>
        {topic.author !== 'You' && (
          <button
            type="button"
            onClick={() =>
              setReportTarget({
                targetId: topic.id,
                targetType: 'TOPIC',
                targetContent: topic.title,
              })
            }
            aria-label="Report debate"
            className="inline-flex items-center justify-center rounded-full p-2 text-ink-3 transition-colors hover:bg-rating-fls-bg hover:text-rating-fls-fg"
          >
            <IconFlag className="h-4 w-4" />
          </button>
        )}
      </div>

      <DebateHeader
        topic={topic}
        isStarred={isStarred}
        onToggleStar={onToggleStar}
        onBack={onBack}
        onShare={handleShare}
        onManageDebate={onManageDebate}
      />

      {/* Tab strip */}
      <div className="overflow-x-auto px-4 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <Tabs<Tab>
            tabs={[
              { value: 'ARGUMENTS', label: 'Arguments', count: tabCounts.ARGUMENTS },
              { value: 'RESEARCH', label: 'Research', count: tabCounts.RESEARCH || undefined },
              { value: 'PARTICIPANTS', label: 'Participants', count: tabCounts.PARTICIPANTS },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
          {topic.author === 'You' && onManageDebate && (
            <button
              type="button"
              onClick={onManageDebate}
              className="hidden items-center gap-1.5 whitespace-nowrap pb-2 font-sans text-[12px] font-medium text-ink-3 transition-colors hover:text-ink md:inline-flex"
            >
              <IconLayoutList className="h-3.5 w-3.5" />
              Manage
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1">
        {activeTab === 'ARGUMENTS' ? (
          <DebateArguments
            topic={topic}
            comments={comments}
            canParticipate={canParticipate}
            consensusCache={consensusCache}
            onCacheConsensus={onCacheConsensus}
            onAddComment={onAddComment}
            onLikeComment={onLikeComment}
            onSelectComment={onSelectComment}
            onSwitchStance={onSwitchStance}
            onReport={(target) => setReportTarget(target)}
          />
        ) : activeTab === 'RESEARCH' ? (
          <ResearchTab
            topic={topic}
            comments={comments}
            researchData={researchData}
            isLoadingResearch={isLoadingResearch}
            isLoadingSynthesis={isLoadingSynthesis}
            isLoadingMoreResearch={isLoadingMoreResearch}
            synthesisCache={synthesisCache}
            readingListUris={readingListByTopic[topic.id] ?? []}
            onToggleReadingList={handleToggleReadingList}
            onLoadMoreResearch={handleLoadMoreResearch}
            onGenerateAll={handleGenerateAll}
            onAddSourceStub={handleAddSourceStub}
          />
        ) : (
          <ParticipantsPlaceholder participantCount={tabCounts.PARTICIPANTS} />
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          variant={toast.type === 'error' ? 'error' : 'info'}
          message={toast.message}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetContent={reportTarget.targetContent}
        />
      )}
    </div>
  );
};

const ParticipantsPlaceholder: React.FC<{ participantCount: number }> = ({ participantCount }) => (
  <div className="mx-auto max-w-md px-4 py-16 text-center md:px-8">
    <h3 className="mb-2 font-serif text-[20px] font-medium text-ink">{participantCount} participants</h3>
    <p className="font-sans text-[13px] italic text-ink-3">
      Participant management lives in the Manage modal for now. A full participants view ships in chunk #9.
    </p>
  </div>
);
