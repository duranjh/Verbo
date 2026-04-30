import React, { useState } from 'react';
import { Stance } from '../../types';
import { Avatar, Textarea, Button } from '../ui';
import { IconLink, IconSparkles, IconClose, IconPaperclip } from '../Icons';

interface ArgumentComposeProps {
  topicTitle: string;
  topicAreAiToolsEnabled: boolean;
  isDebateClosed: boolean;
  canParticipate: boolean;
  onPost: (input: { text: string; stance: Stance; sources: string[]; usedAi: boolean }) => void;
  onEnhance: (text: string, stance: Stance) => Promise<string>;
  onFindSources: (
    text: string,
    stance: Stance
  ) => Promise<{ title: string; uri: string }[]>;
}

const STANCE_OPTIONS: { value: Stance; label: string }[] = [
  { value: Stance.FOR, label: 'For' },
  { value: Stance.NEUTRAL, label: 'Neutral' },
  { value: Stance.AGAINST, label: 'Against' },
];

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const ArgumentCompose: React.FC<ArgumentComposeProps> = ({
  topicTitle,
  topicAreAiToolsEnabled,
  isDebateClosed,
  canParticipate,
  onPost,
  onEnhance,
  onFindSources,
}) => {
  const [text, setText] = useState('');
  const [stance, setStance] = useState<Stance>(Stance.NEUTRAL);
  const [sources, setSources] = useState<string[]>([]);
  const [pendingSource, setPendingSource] = useState('');
  const [showAddSource, setShowAddSource] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [usedAi, setUsedAi] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const isReadOnly = isDebateClosed || !canParticipate;

  const handleAddSource = () => {
    const url = normalizeUrl(pendingSource);
    if (url && !sources.includes(url)) {
      setSources([...sources, url]);
      setPendingSource('');
      setShowAddSource(false);
    }
  };

  const handleRemoveSource = (url: string) => {
    setSources(sources.filter((s) => s !== url));
  };

  const handleEnhance = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    try {
      const next = await onEnhance(text, stance);
      setText(next);
      setUsedAi(true);
    } catch (err) {
      console.error('Enhance failed', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFindSources = async () => {
    if (!text.trim()) return;
    setIsFinding(true);
    try {
      const found = await onFindSources(text, stance);
      const uris = found.map((s) => s.uri);
      setSources((prev) => Array.from(new Set([...prev, ...uris])));
      setUsedAi(true);
    } catch (err) {
      console.error('Find sources failed', err);
    } finally {
      setIsFinding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isReadOnly) return;
    onPost({ text: text.trim(), stance, sources, usedAi });
    // Reset synchronously — Post button never spins
    setText('');
    setSources([]);
    setPendingSource('');
    setUsedAi(false);
    setStance(Stance.NEUTRAL);
    setMobileExpanded(false);
  };

  if (isReadOnly) {
    const message = isDebateClosed
      ? 'This debate is closed. New arguments are no longer accepted.'
      : 'You are in spectator mode and cannot post arguments.';
    return (
      <div className="rounded-12 border border-rule bg-cream-2/60 px-5 py-6 text-center font-serif italic text-ink-3">
        {message}
      </div>
    );
  }

  return (
    <>
      {/* Mobile collapsed */}
      {!mobileExpanded && (
        <button
          type="button"
          onClick={() => setMobileExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-12 border border-rule bg-cream px-3.5 py-3 text-left font-serif text-[14px] italic text-ink-3 md:hidden"
        >
          <Avatar size={28} colorIndex={1}>
            YO
          </Avatar>
          <span className="flex-1">Make your argument…</span>
          <IconSparkles className="h-4 w-4 flex-none text-oxford" />
        </button>
      )}

      <form
        onSubmit={handleSubmit}
        className={`rounded-12 border border-rule bg-cream px-5 py-[18px] ${
          mobileExpanded ? '' : 'hidden md:block'
        }`}
      >
        {/* Row 1: avatar + prompt + stance */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar size={28} colorIndex={1}>
              YO
            </Avatar>
            <span className="font-sans text-[12.5px] font-medium text-ink-3">
              Make your argument
            </span>
          </div>
          <div className="inline-flex gap-0.5 rounded-full border border-rule bg-cream-2 p-[3px]">
            {STANCE_OPTIONS.map((opt) => {
              const selected = opt.value === stance;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStance(opt.value)}
                  className={`inline-flex items-center justify-center rounded-full px-3.5 py-1.5 font-sans text-[11.5px] font-semibold uppercase tracking-[0.04em] transition-colors duration-150 ${
                    selected
                      ? 'bg-oxford text-white [.theme-dark_&]:text-cream'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: textarea */}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Make your argument. Verbo will fact-check it after you post — you don't have to wait."
        />

        {/* Row 3: sources */}
        {(sources.length > 0 || showAddSource) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {sources.map((src) => (
              <span
                key={src}
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-rule bg-cream-2 px-2.5 py-[5px] font-sans text-[11.5px] font-medium text-ink-2"
              >
                <IconLink className="h-3 w-3" />
                <span className="max-w-[180px] truncate">
                  {src.replace(/^https?:\/\//, '')}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSource(src)}
                  className="text-ink-3 hover:text-ink"
                  aria-label="Remove source"
                >
                  <IconClose className="h-3 w-3" />
                </button>
              </span>
            ))}
            {showAddSource && (
              <div className="inline-flex items-center gap-1.5 rounded-[6px] border border-rule bg-cream px-2.5 py-[5px]">
                <IconLink className="h-3 w-3 text-ink-3" />
                <input
                  type="text"
                  value={pendingSource}
                  onChange={(e) => setPendingSource(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSource();
                    }
                  }}
                  onBlur={handleAddSource}
                  autoFocus
                  placeholder="example.com/article"
                  className="bg-transparent font-sans text-[11.5px] outline-none"
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddSource(true)}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-dashed border-rule bg-transparent px-2.5 py-[5px] font-sans text-[11.5px] font-medium text-ink-3 hover:border-ink-4 hover:text-ink"
            >
              <IconPaperclip className="h-3 w-3" />+ Add source
            </button>
            {topicAreAiToolsEnabled && (
              <>
                <Button
                  type="button"
                  variant="ai"
                  size="sm"
                  onClick={handleFindSources}
                  loading={isFinding}
                  disabled={!text.trim()}
                  icon={<IconSparkles className="h-3.5 w-3.5" />}
                >
                  Find sources
                </Button>
                <Button
                  type="button"
                  variant="ai"
                  size="sm"
                  onClick={handleEnhance}
                  loading={isEnhancing}
                  disabled={!text.trim()}
                  icon={<IconSparkles className="h-3.5 w-3.5" />}
                >
                  Enhance
                </Button>
              </>
            )}
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
              Async fact-check on post
            </span>
          </div>
          <div className="flex items-center gap-2">
            {mobileExpanded && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileExpanded(false)}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary" size="md" disabled={!text.trim()}>
              Post argument
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};
