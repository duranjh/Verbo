import React, { useEffect, useMemo, useState } from 'react';
import { Topic, Comment, Stance, ResearchItem, ReportData, TopicResearchData } from '../types';
import { generateTopicResearch } from '../services/gemini';
import {
  IconBell,
  IconBook,
  IconExternal,
  IconFeedback,
  IconFlag,
  IconGlobe,
  IconLayoutList,
  IconPlus,
  IconSparkles,
  IconUser,
} from './Icons';
import { Tabs, Toast } from './ui';
import { DebateHeader } from './debate/DebateHeader';
import { DebateArguments } from './debate/DebateArguments';
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
  onSwitchStance,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('ARGUMENTS');
  const [reportTarget, setReportTarget] = useState<ReportData | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'info' | 'error' }>(
    { show: false, message: '', type: 'info' }
  );

  // Research tab state — preserved from original DebateView (chunk #5 will rebuild this)
  const [researchData, setResearchData] = useState<TopicResearchData | null>(null);
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);
  const [isLoadingMoreResearch, setIsLoadingMoreResearch] = useState(false);

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

  // Fetch research data when tab opens
  useEffect(() => {
    if (activeTab !== 'RESEARCH' || researchData || isLoadingResearch) return;
    setIsLoadingResearch(true);
    generateTopicResearch(topic.title, topic.description)
      .then((data) => setResearchData(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingResearch(false));
  }, [activeTab, researchData, topic.title, topic.description, isLoadingResearch]);

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
            researchData={researchData}
            isLoadingResearch={isLoadingResearch}
            isLoadingMoreResearch={isLoadingMoreResearch}
            onLoadMore={handleLoadMoreResearch}
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

interface ResearchTabProps {
  researchData: TopicResearchData | null;
  isLoadingResearch: boolean;
  isLoadingMoreResearch: boolean;
  onLoadMore: () => void;
}

const renderResearchCard = (item: ResearchItem, index: number) => (
  <a
    key={index}
    href={item.uri}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex h-full cursor-pointer flex-col rounded-12 border border-rule bg-cream p-4 no-underline shadow-sm transition-all hover:border-oxford/30 hover:shadow-md"
  >
    <div className="mb-2 flex items-start justify-between gap-2">
      <h4 className="line-clamp-2 font-serif text-[15px] font-medium leading-tight text-ink transition-colors group-hover:text-oxford">
        {item.title}
      </h4>
      <IconExternal className="h-4 w-4 flex-shrink-0 text-ink-3 transition-colors group-hover:text-oxford" />
    </div>
    <p className="mb-3 flex-grow font-sans text-[12.5px] leading-[1.55] text-ink-2">
      {item.snippet}
    </p>
    <div className="flex items-center gap-1.5 border-t border-rule pt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
      <IconGlobe className="h-3 w-3" />
      <span className="truncate">{item.sourceName || 'Web Source'}</span>
    </div>
  </a>
);

const ResearchTab: React.FC<ResearchTabProps> = ({
  researchData,
  isLoadingResearch,
  isLoadingMoreResearch,
  onLoadMore,
}) => {
  return (
    <div className="px-4 pb-12 pt-6 md:px-8">
      <div className="mb-6 flex items-start gap-3 rounded-12 border border-oxford/20 bg-oxford/5 p-5">
        <div className="rounded-8 bg-cream p-2 text-oxford shadow-sm">
          <IconBook className="h-5 w-5" />
        </div>
        <div>
          <h3 className="mb-1 font-serif text-[16px] font-medium text-ink">Topic Research Hub</h3>
          <p className="font-sans text-[13px] leading-[1.55] text-ink-2">
            Explore reliable, AI-curated sources covering every side of this debate.
          </p>
        </div>
      </div>

      {isLoadingResearch && !researchData ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
          <IconSparkles className="h-10 w-10 animate-spin text-oxford" />
          <h3 className="font-serif text-[16px] font-medium text-ink">Curating research…</h3>
          <p className="font-sans text-[13px] text-ink-3">
            Verbo AI is searching for the most up-to-date sources.
          </p>
        </div>
      ) : researchData ? (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 border-b border-rule pb-3 lg:grid-cols-3">
            <h3 className="font-serif text-[14px] font-medium text-oxford">Supporting Perspectives</h3>
            <h3 className="font-serif text-[14px] font-medium text-ink-2">Objective Overview</h3>
            <h3 className="font-serif text-[14px] font-medium text-stance-against">Opposing Perspectives</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-3">
              {(researchData.for?.length ?? 0) > 0 ? (
                researchData.for!.map((item, idx) => renderResearchCard(item, idx))
              ) : (
                <div className="rounded-12 border border-dashed border-rule px-4 py-8 text-center font-sans text-[12px] italic text-ink-3">
                  No specific sources found.
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {(researchData.neutral?.length ?? 0) > 0 ? (
                researchData.neutral!.map((item, idx) => renderResearchCard(item, idx + 100))
              ) : (
                <div className="rounded-12 border border-dashed border-rule px-4 py-8 text-center font-sans text-[12px] italic text-ink-3">
                  No specific sources found.
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {(researchData.against?.length ?? 0) > 0 ? (
                researchData.against!.map((item, idx) => renderResearchCard(item, idx + 200))
              ) : (
                <div className="rounded-12 border border-dashed border-rule px-4 py-8 text-center font-sans text-[12px] italic text-ink-3">
                  No specific sources found.
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMoreResearch}
              className="inline-flex items-center gap-2 rounded-full border border-rule bg-cream px-5 py-2.5 font-sans text-[12.5px] font-semibold text-ink-2 shadow-sm transition-all hover:border-oxford/30 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoadingMoreResearch ? (
                <>
                  <IconSparkles className="h-3.5 w-3.5 animate-spin" />
                  Finding more sources…
                </>
              ) : (
                <>
                  <IconPlus className="h-3.5 w-3.5" />
                  Find more sources
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="py-16 text-center font-sans text-[13px] italic text-ink-3">
          Unable to load research data. Please try again later.
        </div>
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
