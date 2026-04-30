import React, { useEffect, useState } from 'react';
import { Comment, FactRating, Stance, Topic } from '../../types';
import { generateConsensusSummary } from '../../services/gemini';
import { IconSparkles } from '../Icons';

interface AIConsensusCardProps {
  topic: Topic;
  comments: Comment[];
  cached?: { text: string; generatedAt: number };
  onCache: (topicId: string, text: string) => void;
}

const formatRelativeMin = (timestamp: number) => {
  const mins = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const AIConsensusCard: React.FC<AIConsensusCardProps> = ({
  topic,
  comments,
  cached,
  onCache,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const text = cached?.text ?? '';

  useEffect(() => {
    if (cached || isGenerating) return;
    const topFor = comments
      .filter((c) => c.stance === Stance.FOR && c.aiAnalysis?.rating === FactRating.TRUE)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 3)
      .map((c) => c.content);
    const topAgainst = comments
      .filter((c) => c.stance === Stance.AGAINST && c.aiAnalysis?.rating === FactRating.TRUE)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 3)
      .map((c) => c.content);
    const topNeutral = comments
      .filter((c) => c.stance === Stance.NEUTRAL && c.aiAnalysis?.rating === FactRating.TRUE)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 3)
      .map((c) => c.content);

    if (topFor.length + topAgainst.length + topNeutral.length === 0) return;

    setIsGenerating(true);
    let cancelled = false;
    generateConsensusSummary(topic.title, topic.description, topFor, topAgainst, topNeutral)
      .then((result) => {
        if (cancelled) return;
        onCache(topic.id, result);
      })
      .catch((err) => {
        console.error('AI consensus failed', err);
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cached, isGenerating, topic.id, topic.title, topic.description, comments, onCache]);

  return (
    <div className="rounded-12 bg-gradient-to-br from-oxford via-oxford to-editorial-red p-px">
      <div className="relative overflow-hidden rounded-[11px] bg-cream px-5 py-[18px]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-oxford/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-[14px] font-medium text-ink">AI Consensus</h4>
              <span aria-hidden className="animate-pulse-soft inline-block h-1.5 w-1.5 flex-none rounded-full bg-oxford" />
            </div>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
              {cached ? `Updated ${formatRelativeMin(cached.generatedAt)}` : isGenerating ? 'Generating…' : 'Awaiting verified arguments'}
            </span>
          </div>

          <div
            className={`font-serif text-[13.5px] leading-[1.55] text-ink-2 ${
              expanded ? '' : 'line-clamp-6'
            }`}
          >
            {isGenerating && !text ? (
              <span className="inline-flex items-center gap-2 font-sans text-[12px] italic text-ink-3">
                <IconSparkles className="h-3.5 w-3.5 animate-spin text-oxford" />
                Synthesizing top-rated arguments…
              </span>
            ) : text ? (
              text
            ) : (
              <span className="font-sans text-[12px] italic text-ink-3">
                Consensus appears once verified arguments accumulate.
              </span>
            )}
          </div>

          {text && (
            <div className="mt-3 flex items-center justify-between border-t border-rule pt-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
              <span>{expanded ? 'Showing full synthesis' : 'Synopsis · top-rated arguments'}</span>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-oxford hover:brightness-110"
              >
                {expanded ? 'Collapse ←' : 'Read full →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
