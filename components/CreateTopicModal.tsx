import React, { useEffect, useRef, useState } from 'react';
import { Topic, DebateType, PrivacyStatus, DebateFormat } from '../types';
import { IconClose, IconSparkles, IconLock } from './Icons';
import { suggestTags } from '../services/gemini';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ui/Modal';
import { Button } from './ui/Button';
import { SegmentedToggle } from './ui/SegmentedToggle';
import { MetaPill } from './ui/MetaPill';
import { Avatar } from './ui/Avatar';

interface CreateTopicModalProps {
  onClose: () => void;
  onCreate: (topic: Partial<Topic>) => void;
  isPremium?: boolean;
}

type Step = 1 | 2 | 3;
type TimedPick = '24h' | '48h' | '7d' | 'CUSTOM';

const DRAFT_KEY = 'verbo:draft';
const TITLE_MAX = 120;
const DESC_MAX = 500;
const TAGS_MAX = 5;

const PICK_TO_HOURS: Record<Exclude<TimedPick, 'CUSTOM'>, number> = {
  '24h': 24,
  '48h': 48,
  '7d': 24 * 7,
};

interface DraftState {
  title: string;
  description: string;
  type: DebateType;
  format: DebateFormat;
  timedPick: TimedPick;
  customClosesAt: string;
  privacy: PrivacyStatus;
  password: string;
  isAgeRestricted: boolean;
  areAiToolsEnabled: boolean;
  tags: string[];
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
  onClose,
  onCreate,
  isPremium = false,
}) => {
  const [step, setStep] = useState<Step>(1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DebateType>(DebateType.OPEN);
  const [format] = useState<DebateFormat>('CHAT');
  const [timedPick, setTimedPick] = useState<TimedPick>('48h');
  const [customClosesAt, setCustomClosesAt] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyStatus>(PrivacyStatus.PUBLIC);
  const [password, setPassword] = useState('');
  const [isAgeRestricted, setIsAgeRestricted] = useState(false);
  const [areAiToolsEnabled, setAreAiToolsEnabled] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string>('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const isTimedLocked = !isPremium;
  const isPrivateLocked = !isPremium;
  const isAiToolsLocked = !isPremium;

  const draftRestored = useRef(false);
  useEffect(() => {
    if (draftRestored.current) return;
    draftRestored.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<DraftState>;
      if (typeof d.title === 'string') setTitle(d.title.slice(0, TITLE_MAX));
      if (typeof d.description === 'string') setDescription(d.description.slice(0, DESC_MAX));
      if (d.type === DebateType.OPEN || d.type === DebateType.TIMED) setType(d.type);
      if (d.timedPick === '24h' || d.timedPick === '48h' || d.timedPick === '7d' || d.timedPick === 'CUSTOM') {
        setTimedPick(d.timedPick);
      }
      if (typeof d.customClosesAt === 'string') setCustomClosesAt(d.customClosesAt);
      if (d.privacy === PrivacyStatus.PUBLIC || d.privacy === PrivacyStatus.PRIVATE) setPrivacy(d.privacy);
      if (typeof d.password === 'string') setPassword(d.password);
      if (typeof d.isAgeRestricted === 'boolean') setIsAgeRestricted(d.isAgeRestricted);
      if (typeof d.areAiToolsEnabled === 'boolean') setAreAiToolsEnabled(d.areAiToolsEnabled);
      if (Array.isArray(d.tags)) setTags(d.tags.filter((t): t is string => typeof t === 'string').slice(0, TAGS_MAX));
    } catch {
      /* corrupt draft — ignore */
    }
  }, []);

  const saveDraft = () => {
    const draft: DraftState = {
      title,
      description,
      type,
      format,
      timedPick,
      customClosesAt,
      privacy,
      password,
      isAgeRestricted,
      areAiToolsEnabled,
      tags,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(Date.now());
    } catch {
      /* localStorage may be unavailable in some browsers/private mode */
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* no-op */
    }
  };

  const trimmedTitle = title.trim();

  const handleGenerateTags = async () => {
    if (!trimmedTitle || isGeneratingTags) return;
    setIsGeneratingTags(true);
    setAiError('');
    const suggested = await suggestTags(trimmedTitle, description);
    if (suggested.length === 0) {
      setAiError("Couldn't generate suggestions. Try again.");
      setAiSuggestions([]);
    } else {
      const filtered = suggested
        .map((s) => s.trim())
        .filter((s) => s && !tags.includes(s))
        .slice(0, 5);
      setAiSuggestions(filtered);
    }
    setIsGeneratingTags(false);
  };

  const acceptSuggestion = (tag: string) => {
    if (tags.length >= TAGS_MAX) return;
    if (tags.includes(tag)) return;
    setTags([...tags, tag]);
    setAiSuggestions(aiSuggestions.filter((t) => t !== tag));
  };

  const dismissSuggestion = (tag: string) => {
    setAiSuggestions(aiSuggestions.filter((t) => t !== tag));
  };

  const addTagFromInput = () => {
    const next = tagInput.trim();
    if (!next) return;
    if (tags.length >= TAGS_MAX) return;
    if (tags.includes(next)) return;
    setTags([...tags, next]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const computeClosesAt = (): number | undefined => {
    if (type !== DebateType.TIMED) return undefined;
    if (timedPick === 'CUSTOM') {
      if (!customClosesAt) return undefined;
      const ms = new Date(customClosesAt).getTime();
      return Number.isFinite(ms) ? ms : undefined;
    }
    return Date.now() + PICK_TO_HOURS[timedPick] * 60 * 60 * 1000;
  };

  const submit = () => {
    if (!trimmedTitle) return;
    if (privacy === PrivacyStatus.PRIVATE && !password.trim()) {
      setStep(2);
      return;
    }
    onCreate({
      title: trimmedTitle,
      description: description.trim(),
      type,
      format,
      closesAt: computeClosesAt(),
      privacy,
      accessPassword: privacy === PrivacyStatus.PRIVATE ? password : undefined,
      isAgeRestricted,
      areAiToolsEnabled,
      tags,
    });
    clearDraft();
    onClose();
  };

  const titleHasContent = title.length > 0;
  const canContinueFromStep1 = trimmedTitle.length > 0;
  const canContinueFromStep2 =
    !(privacy === PrivacyStatus.PRIVATE && !password.trim()) &&
    !(type === DebateType.TIMED && timedPick === 'CUSTOM' && !customClosesAt);

  return (
    <Modal open onClose={onClose} size="md" bottomSheetOnMobile>
      <ModalHeader eyebrow="New debate" title="Create a debate" onClose={onClose} />

      <Stepper step={step} />

      <ModalBody className="font-sans">
        {step === 1 && (
          <Step1Topic
            title={title}
            setTitle={setTitle}
            titleHasContent={titleHasContent}
            description={description}
            setDescription={setDescription}
            tags={tags}
            tagInput={tagInput}
            setTagInput={setTagInput}
            addTagFromInput={addTagFromInput}
            removeTag={removeTag}
            aiSuggestions={aiSuggestions}
            aiError={aiError}
            isGeneratingTags={isGeneratingTags}
            handleGenerateTags={handleGenerateTags}
            acceptSuggestion={acceptSuggestion}
            dismissSuggestion={dismissSuggestion}
          />
        )}

        {step === 2 && (
          <Step2Settings
            type={type}
            setType={setType}
            timedPick={timedPick}
            setTimedPick={setTimedPick}
            customClosesAt={customClosesAt}
            setCustomClosesAt={setCustomClosesAt}
            privacy={privacy}
            setPrivacy={setPrivacy}
            password={password}
            setPassword={setPassword}
            isAgeRestricted={isAgeRestricted}
            setIsAgeRestricted={setIsAgeRestricted}
            areAiToolsEnabled={areAiToolsEnabled}
            setAreAiToolsEnabled={setAreAiToolsEnabled}
            isTimedLocked={isTimedLocked}
            isPrivateLocked={isPrivateLocked}
            isAiToolsLocked={isAiToolsLocked}
          />
        )}

        {step === 3 && (
          <Step3Review
            title={trimmedTitle || 'Untitled debate'}
            description={description}
            tags={tags}
            type={type}
            timedPick={timedPick}
            customClosesAt={customClosesAt}
            privacy={privacy}
            isAgeRestricted={isAgeRestricted}
            areAiToolsEnabled={areAiToolsEnabled}
          />
        )}
      </ModalBody>

      <ModalFooter className="flex-col gap-2 md:flex-row">
        {step === 1 && (
          <>
            <Button variant="ghost" onClick={onClose} className="w-full md:w-auto md:mr-auto">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(2)}
              disabled={!canContinueFromStep1}
              className="w-full md:w-auto"
            >
              Continue →
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Button variant="ghost" onClick={() => setStep(1)} className="w-full md:w-auto md:mr-auto">
              ← Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(3)}
              disabled={!canContinueFromStep2}
              className="w-full md:w-auto"
            >
              Continue →
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <Button variant="ghost" onClick={() => setStep(2)} className="w-full md:w-auto md:mr-auto">
              ← Back
            </Button>
            <Button variant="secondary" onClick={saveDraft} className="w-full md:w-auto">
              {draftSavedAt ? 'Draft saved ✓' : 'Save draft'}
            </Button>
            <Button variant="primary" onClick={submit} className="w-full md:w-auto">
              Create debate
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Stepper                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

const Stepper: React.FC<{ step: Step }> = ({ step }) => {
  const stepState = (n: 1 | 2 | 3): 'default' | 'active' | 'done' =>
    n < step ? 'done' : n === step ? 'active' : 'default';
  return (
    <div className="flex flex-none items-center px-6 pt-4 pb-2">
      <StepNode n={1} state={stepState(1)} />
      <StepRule done={stepState(1) === 'done' || stepState(2) === 'done'} />
      <StepNode n={2} state={stepState(2)} />
      <StepRule done={stepState(2) === 'done' || stepState(3) === 'done'} />
      <StepNode n={3} state={stepState(3)} />
    </div>
  );
};

const StepNode: React.FC<{ n: 1 | 2 | 3; state: 'default' | 'active' | 'done' }> = ({ n, state }) => {
  const numClass =
    state === 'done'
      ? 'bg-oxford border-oxford text-white [.theme-dark_&]:text-[#15110E]'
      : state === 'active'
        ? 'border-oxford text-oxford bg-oxford/10'
        : 'border-rule text-ink-3 bg-cream';
  return (
    <span
      aria-current={state === 'active' ? 'step' : undefined}
      className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border-[1.5px] font-mono text-[11px] font-semibold ${numClass}`}
    >
      {n}
    </span>
  );
};

const StepRule: React.FC<{ done: boolean }> = ({ done }) => (
  <span className={`mx-3 h-px min-w-[24px] flex-1 ${done ? 'bg-oxford' : 'bg-rule'}`} />
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Step 1 — Topic                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

interface Step1Props {
  title: string;
  setTitle: (v: string) => void;
  titleHasContent: boolean;
  description: string;
  setDescription: (v: string) => void;
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  addTagFromInput: () => void;
  removeTag: (t: string) => void;
  aiSuggestions: string[];
  aiError: string;
  isGeneratingTags: boolean;
  handleGenerateTags: () => void;
  acceptSuggestion: (t: string) => void;
  dismissSuggestion: (t: string) => void;
}

const Step1Topic: React.FC<Step1Props> = ({
  title,
  setTitle,
  titleHasContent,
  description,
  setDescription,
  tags,
  tagInput,
  setTagInput,
  addTagFromInput,
  removeTag,
  aiSuggestions,
  aiError,
  isGeneratingTags,
  handleGenerateTags,
  acceptSuggestion,
  dismissSuggestion,
}) => (
  <div className="flex flex-col gap-6">
    {/* Title */}
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label
          htmlFor="cd-title"
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3"
        >
          Debate title <span className="text-editorial-red">*</span>
        </label>
        <span className="font-mono text-[10px] tracking-[0.08em] text-ink-4">
          {title.length}/{TITLE_MAX}
        </span>
      </div>
      <input
        id="cd-title"
        type="text"
        value={title}
        maxLength={TITLE_MAX}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What should we debate?"
        className={`w-full border-0 border-b bg-transparent pt-1.5 pb-2.5 font-serif text-[26px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink outline-none placeholder:font-normal placeholder:italic placeholder:text-ink-4 ${
          titleHasContent ? 'border-b-oxford' : 'border-b-ink-3'
        }`}
      />
    </div>

    {/* Description */}
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label
          htmlFor="cd-desc"
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3"
        >
          Description
        </label>
        <span className="font-mono text-[10px] tracking-[0.08em] text-ink-4">
          {description.length}/{DESC_MAX}
        </span>
      </div>
      <textarea
        id="cd-desc"
        value={description}
        maxLength={DESC_MAX}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add context — links, background, what's at stake."
        className="min-h-[78px] w-full resize-none rounded-8 border border-rule bg-cream px-3.5 py-3 font-serif text-[14px] leading-[1.5] text-ink outline-none placeholder:italic placeholder:text-ink-4 focus:border-oxford focus:ring-2 focus:ring-oxford/20"
      />
    </div>

    {/* Tags */}
    <div>
      <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
        Tags
      </label>
      <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-8 border border-rule bg-cream px-2.5 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full border border-oxford bg-oxford px-2.5 py-1 font-sans text-[12px] font-semibold text-white [.theme-dark_&]:text-[#15110E]"
          >
            <span aria-hidden>✓</span>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="ml-0.5 inline-flex cursor-pointer text-white/70 hover:text-white [.theme-dark_&]:text-[#15110E]/60 [.theme-dark_&]:hover:text-[#15110E]"
            >
              <IconClose className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTagFromInput();
            }
          }}
          placeholder={tags.length >= TAGS_MAX ? 'Tag limit reached' : 'Add a tag…'}
          disabled={tags.length >= TAGS_MAX}
          className="min-w-[100px] flex-1 bg-transparent p-1 font-sans text-[13px] text-ink outline-none placeholder:text-ink-4"
        />
        <button
          type="button"
          onClick={handleGenerateTags}
          disabled={!title.trim() || isGeneratingTags || tags.length >= TAGS_MAX}
          className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border border-transparent bg-oxford/10 px-2.5 py-1 font-sans text-[10.5px] font-semibold text-oxford transition-colors hover:bg-oxford/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconSparkles className={`h-3 w-3 ${isGeneratingTags ? 'animate-spin' : ''}`} />
          {isGeneratingTags ? 'Suggesting…' : 'Suggest tags'}
        </button>
      </div>

      {/* AI suggestion panel */}
      {aiSuggestions.length > 0 && (
        <div className="mt-2.5 rounded-8 border border-dashed border-oxford/35 bg-oxford/10 p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-oxford">
            <IconSparkles className="h-3 w-3" />
            AI-suggested · click to accept
          </div>
          <div className="flex flex-wrap gap-1.5">
            {aiSuggestions.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-cream px-2.5 py-1 font-sans text-[12px] font-medium text-ink-2"
              >
                <button
                  type="button"
                  onClick={() => acceptSuggestion(s)}
                  className="cursor-pointer hover:text-oxford"
                >
                  {s}
                </button>
                <button
                  type="button"
                  onClick={() => dismissSuggestion(s)}
                  aria-label={`Dismiss ${s}`}
                  className="cursor-pointer text-ink-4 hover:text-ink-2"
                >
                  <IconClose className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {aiError && (
        <p className="mt-2 font-sans text-[11px] text-ink-3">{aiError}</p>
      )}
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Step 2 — Settings                                                        */
/* ──────────────────────────────────────────────────────────────────────── */

interface Step2Props {
  type: DebateType;
  setType: (t: DebateType) => void;
  timedPick: TimedPick;
  setTimedPick: (p: TimedPick) => void;
  customClosesAt: string;
  setCustomClosesAt: (v: string) => void;
  privacy: PrivacyStatus;
  setPrivacy: (p: PrivacyStatus) => void;
  password: string;
  setPassword: (v: string) => void;
  isAgeRestricted: boolean;
  setIsAgeRestricted: (v: boolean) => void;
  areAiToolsEnabled: boolean;
  setAreAiToolsEnabled: (v: boolean) => void;
  isTimedLocked: boolean;
  isPrivateLocked: boolean;
  isAiToolsLocked: boolean;
}

const Step2Settings: React.FC<Step2Props> = ({
  type,
  setType,
  timedPick,
  setTimedPick,
  customClosesAt,
  setCustomClosesAt,
  privacy,
  setPrivacy,
  password,
  setPassword,
  isAgeRestricted,
  setIsAgeRestricted,
  areAiToolsEnabled,
  setAreAiToolsEnabled,
  isTimedLocked,
  isPrivateLocked,
  isAiToolsLocked,
}) => {
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return (
    <div className="flex flex-col gap-6">
      {/* Debate type — radio cards */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          Debate type
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <RadioCard
            selected={type === DebateType.OPEN}
            onClick={() => setType(DebateType.OPEN)}
            title="Open"
            description="No time limit."
          />
          <RadioCard
            selected={type === DebateType.TIMED}
            onClick={() => !isTimedLocked && setType(DebateType.TIMED)}
            title="Timed"
            description="Closes after a set period."
            locked={isTimedLocked}
          >
            {type === DebateType.TIMED && !isTimedLocked && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(['24h', '48h', '7d', 'CUSTOM'] as TimedPick[]).map((pk) => (
                  <button
                    key={pk}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimedPick(pk);
                    }}
                    className={`cursor-pointer rounded-4 border px-2 py-0.5 font-mono text-[10.5px] font-medium transition-colors ${
                      timedPick === pk
                        ? 'border-ink bg-ink text-cream'
                        : 'border-rule bg-cream text-ink-3 hover:border-ink-4'
                    }`}
                  >
                    {pk === 'CUSTOM' ? 'Custom' : pk}
                  </button>
                ))}
              </div>
            )}
            {type === DebateType.TIMED && timedPick === 'CUSTOM' && !isTimedLocked && (
              <input
                type="datetime-local"
                min={minDateTime}
                value={customClosesAt}
                onChange={(e) => {
                  e.stopPropagation();
                  setCustomClosesAt(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 w-full rounded-4 border border-rule bg-cream px-2 py-1 font-mono text-[11px] text-ink outline-none focus:border-oxford"
              />
            )}
          </RadioCard>
        </div>
      </div>

      {/* Privacy */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          Privacy
        </label>
        <SegmentedToggle
          value={privacy}
          onChange={(v) => {
            if (v === PrivacyStatus.PRIVATE && isPrivateLocked) return;
            setPrivacy(v);
          }}
          options={[
            { value: PrivacyStatus.PUBLIC, label: 'Public' },
            { value: PrivacyStatus.PRIVATE, label: isPrivateLocked ? 'Private 🔒' : 'Private' },
          ]}
        />
        {privacy === PrivacyStatus.PRIVATE && (
          <div className="mt-2.5 flex items-center gap-2.5 rounded-8 border border-rule bg-cream-2 px-3 py-2.5">
            <IconLock className="h-3.5 w-3.5 flex-none text-ink-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set access password"
              className="w-full bg-transparent font-mono text-[12px] tracking-[0.2em] text-ink outline-none placeholder:tracking-normal placeholder:text-ink-4"
            />
          </div>
        )}
      </div>

      {/* Toggle rows */}
      <div className="border-t border-rule">
        <ToggleRow
          name="Age restriction (18+)"
          description="Require age verification."
          checked={isAgeRestricted}
          onChange={setIsAgeRestricted}
        />
        <ToggleRow
          name="AI tools for participants"
          description="Enhancer + Source Suggestions for contributors."
          checked={areAiToolsEnabled}
          onChange={(v) => !isAiToolsLocked && setAreAiToolsEnabled(v)}
          locked={isAiToolsLocked}
        />
      </div>
    </div>
  );
};

interface RadioCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  locked?: boolean;
  children?: React.ReactNode;
}

const RadioCard: React.FC<RadioCardProps> = ({ selected, onClick, title, description, locked, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={locked}
    className={`relative flex flex-col gap-1.5 rounded-12 border p-3.5 text-left transition-colors disabled:cursor-not-allowed ${
      selected ? 'border-oxford bg-oxford/10' : 'border-rule bg-cream hover:border-ink-4'
    } ${locked ? 'opacity-60' : ''}`}
  >
    <div className="flex items-center gap-2">
      <span
        className={`relative inline-block h-3.5 w-3.5 flex-none rounded-full border-[1.5px] ${
          selected ? 'border-oxford' : 'border-rule bg-cream'
        }`}
      >
        {selected && (
          <span className="absolute inset-[2.5px] rounded-full bg-oxford" aria-hidden />
        )}
      </span>
      <span className="font-sans text-[13.5px] font-semibold text-ink">{title}</span>
      {locked && (
        <span className="ml-auto inline-flex items-center gap-1 rounded-4 border border-oxford/20 bg-oxford/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-oxford">
          <IconLock className="h-2.5 w-2.5" />
          Verbo+
        </span>
      )}
    </div>
    <p className="font-sans text-[12px] leading-[1.4] text-ink-3">{description}</p>
    {children}
  </button>
);

interface ToggleRowProps {
  name: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ name, description, checked, onChange, locked }) => (
  <div className="flex items-start gap-3.5 border-t border-rule py-3.5 first:border-t-0 first:pt-1.5">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-sans text-[13px] font-semibold text-ink">{name}</span>
        {locked && (
          <span className="inline-flex items-center gap-1 rounded-4 border border-oxford/20 bg-oxford/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-oxford">
            <IconLock className="h-2.5 w-2.5" />
            Verbo+
          </span>
        )}
      </div>
      <p className="mt-0.5 font-sans text-[12px] leading-[1.4] text-ink-3">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={name}
      onClick={() => !locked && onChange(!checked)}
      disabled={locked}
      className={`relative mt-0.5 h-5 w-9 flex-none cursor-pointer rounded-full transition-colors duration-150 disabled:cursor-not-allowed ${
        checked ? 'bg-oxford' : 'bg-rule'
      } ${locked ? 'opacity-60' : ''}`}
    >
      <span
        aria-hidden
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] duration-150 ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Step 3 — Review                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

interface Step3Props {
  title: string;
  description: string;
  tags: string[];
  type: DebateType;
  timedPick: TimedPick;
  customClosesAt: string;
  privacy: PrivacyStatus;
  isAgeRestricted: boolean;
  areAiToolsEnabled: boolean;
}

const formatTimedLabel = (timedPick: TimedPick, customClosesAt: string): string => {
  if (timedPick === 'CUSTOM') {
    if (!customClosesAt) return 'Custom';
    const d = new Date(customClosesAt);
    return `Closes ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  return timedPick;
};

const Step3Review: React.FC<Step3Props> = ({
  title,
  description,
  tags,
  type,
  timedPick,
  customClosesAt,
  privacy,
  isAgeRestricted,
  areAiToolsEnabled,
}) => {
  const typeLabel =
    type === DebateType.TIMED ? `Timed · ${formatTimedLabel(timedPick, customClosesAt)}` : 'Open';
  const privacyLabel = privacy === PrivacyStatus.PUBLIC ? 'Public' : 'Private';
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-oxford" />
        Feed preview
      </div>

      {/* Preview card */}
      <div className="flex flex-col gap-2.5 rounded-12 border border-rule bg-cream p-4.5">
        <div className="flex items-center gap-2">
          <MetaPill kind={type === DebateType.TIMED ? 'timed' : 'default'}>{typeLabel}</MetaPill>
          <MetaPill kind="default">{privacyLabel}</MetaPill>
          {isAgeRestricted && <MetaPill kind="warn">18+</MetaPill>}
        </div>
        <h4 className="m-0 font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
          {title}
        </h4>
        {description && (
          <p className="m-0 font-sans text-[13px] leading-[1.5] text-ink-2">{description}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-4 bg-rule-soft px-2 py-0.5 font-sans text-[11px] font-medium text-ink-3"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 border-t border-rule-soft pt-2.5">
          <Avatar size={24} colorIndex={1}>YO</Avatar>
          <span className="font-sans text-[12px] text-ink-3">
            <span className="font-semibold text-ink-2">You</span> · just now
          </span>
        </div>
      </div>

      {/* Review summary */}
      <div className="grid grid-cols-2 gap-2 rounded-12 border border-rule bg-cream-2 p-3.5">
        <SummaryCell k="Type" v={typeLabel} />
        <SummaryCell k="Privacy" v={privacyLabel} />
        <SummaryCell k="18+" v={isAgeRestricted ? 'Required' : 'Off'} />
        <SummaryCell k="AI tools" v={areAiToolsEnabled ? 'Enabled' : 'Disabled'} oxford={areAiToolsEnabled} />
      </div>
    </div>
  );
};

const SummaryCell: React.FC<{ k: string; v: string; oxford?: boolean }> = ({ k, v, oxford }) => (
  <div>
    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">{k}</div>
    <div className={`mt-0.5 font-sans text-[13px] font-medium ${oxford ? 'text-oxford' : 'text-ink'}`}>
      {v}
    </div>
  </div>
);
