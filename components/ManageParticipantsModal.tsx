import React, { useMemo, useState } from 'react';
import { Participant, UserRole, Topic, DebateType } from '../types';
import { IconSearch, IconCheck, IconCopy, IconClock } from './Icons';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ui/Modal';
import { Button } from './ui/Button';
import { TextInput } from './ui/TextInput';
import { Textarea } from './ui/Textarea';
import { Avatar } from './ui/Avatar';

interface ManageParticipantsModalProps {
  topic: Topic;
  onClose: () => void;
  onUpdateParticipant: (id: string, role: UserRole) => void;
  onBlockUser: (id: string) => void;
  onUnblockUser: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  onUpdateTopic: (updates: Partial<Topic>) => void;
}

type View = 'ALL' | 'CONTRIBUTORS' | 'SPECTATORS' | 'BLOCKED' | 'SETTINGS';

export const ManageParticipantsModal: React.FC<ManageParticipantsModalProps> = ({
  topic,
  onClose,
  onUpdateParticipant,
  onBlockUser,
  onUnblockUser,
  onRemoveParticipant,
  onUpdateTopic,
}) => {
  const [view, setView] = useState<View>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Settings state
  const [editTitle, setEditTitle] = useState(topic.title);
  const [editDescription, setEditDescription] = useState(topic.description);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const all = topic.participants ?? [];
  const counts = useMemo(() => {
    const unblocked = all.filter((p) => !p.isBlocked);
    return {
      ALL: unblocked.length,
      CONTRIBUTORS: unblocked.filter((p) => p.role === UserRole.CONTRIBUTOR).length,
      SPECTATORS: unblocked.filter((p) => p.role === UserRole.SPECTATOR).length,
      BLOCKED: all.filter((p) => p.isBlocked).length,
    };
  }, [all]);

  const visibleParticipants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let pool: Participant[];
    switch (view) {
      case 'BLOCKED':
        pool = all.filter((p) => p.isBlocked);
        break;
      case 'CONTRIBUTORS':
        pool = all.filter((p) => !p.isBlocked && p.role === UserRole.CONTRIBUTOR);
        break;
      case 'SPECTATORS':
        pool = all.filter((p) => !p.isBlocked && p.role === UserRole.SPECTATOR);
        break;
      case 'ALL':
        pool = all.filter((p) => !p.isBlocked);
        break;
      default:
        pool = [];
    }
    return term ? pool.filter((p) => p.name.toLowerCase().includes(term)) : pool;
  }, [all, view, searchTerm]);

  const isClosed =
    topic.type === DebateType.TIMED && typeof topic.closesAt === 'number' && topic.closesAt < Date.now();

  const shareLink = `${window.location.origin}?topic=${topic.id}`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(shareLink);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdateTopic({ title: editTitle, description: editDescription, isEdited: true });
      setIsSaving(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    }, 400);
  };

  const handleEndDebate = () => {
    onUpdateTopic({ type: DebateType.TIMED, closesAt: Date.now() - 60_000 });
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="xl" bottomSheetOnMobile>
      <ModalHeader eyebrow="Creator tools" title="Manage participants" onClose={onClose} />

      <ModalBody className="font-sans">
        <TabStrip view={view} setView={setView} counts={counts} />

        {view === 'SETTINGS' ? (
          <SettingsPane
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            isSaving={isSaving}
            savedFlash={savedFlash}
            handleSaveSettings={handleSaveSettings}
            shareLink={shareLink}
            copyFeedback={copyFeedback}
            handleCopyLink={handleCopyLink}
            confirmClose={confirmClose}
            setConfirmClose={setConfirmClose}
            handleEndDebate={handleEndDebate}
            isClosed={!!isClosed}
          />
        ) : (
          <ParticipantsPane
            view={view}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            participants={visibleParticipants}
            onUpdateParticipant={onUpdateParticipant}
            onBlockUser={onBlockUser}
            onUnblockUser={onUnblockUser}
            onRemoveParticipant={onRemoveParticipant}
          />
        )}
      </ModalBody>

      <ModalFooter className="flex-col gap-2 md:flex-row">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3 md:mr-auto">
          {counts.ALL} participant{counts.ALL === 1 ? '' : 's'}
        </span>
        <Button variant="primary" onClick={onClose} className="w-full md:w-auto">
          Done
        </Button>
      </ModalFooter>
    </Modal>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Tab strip                                                                */
/* ──────────────────────────────────────────────────────────────────────── */

interface TabStripProps {
  view: View;
  setView: (v: View) => void;
  counts: Record<'ALL' | 'CONTRIBUTORS' | 'SPECTATORS' | 'BLOCKED', number>;
}

const TabStrip: React.FC<TabStripProps> = ({ view, setView, counts }) => {
  const TABS: Array<{ key: View; label: string; count?: number }> = [
    { key: 'ALL', label: 'All', count: counts.ALL },
    { key: 'CONTRIBUTORS', label: 'Contributors', count: counts.CONTRIBUTORS },
    { key: 'SPECTATORS', label: 'Spectators', count: counts.SPECTATORS },
    { key: 'BLOCKED', label: 'Blocked', count: counts.BLOCKED },
    { key: 'SETTINGS', label: 'Settings' },
  ];
  return (
    <div className="-mx-6 mb-3 flex gap-5 overflow-x-auto border-b border-rule px-6">
      {TABS.map((t) => {
        const active = view === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            className={`-mb-px inline-flex flex-none items-center gap-1.5 border-b-2 px-0 pb-3 pt-2.5 font-sans text-[12.5px] transition-colors ${
              active
                ? 'border-ink font-semibold text-ink'
                : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span
                className={`rounded-full px-1.5 py-px font-mono text-[10px] font-semibold ${
                  active ? 'bg-oxford/10 text-oxford' : 'bg-cream-2 text-ink-4'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Participants pane                                                        */
/* ──────────────────────────────────────────────────────────────────────── */

interface ParticipantsPaneProps {
  view: Exclude<View, 'SETTINGS'>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  participants: Participant[];
  onUpdateParticipant: (id: string, role: UserRole) => void;
  onBlockUser: (id: string) => void;
  onUnblockUser: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
}

const ParticipantsPane: React.FC<ParticipantsPaneProps> = ({
  view,
  searchTerm,
  setSearchTerm,
  participants,
  onUpdateParticipant,
  onBlockUser,
  onUnblockUser,
  onRemoveParticipant,
}) => (
  <div className="flex flex-col gap-3">
    {/* Search */}
    <div className="relative">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Find participants…"
        className="h-10 w-full rounded-8 border border-rule bg-cream pl-9 pr-3.5 font-sans text-[13px] text-ink outline-none placeholder:text-ink-4 focus:border-oxford focus:ring-2 focus:ring-oxford/20"
      />
    </div>

    {/* List or empty state */}
    {participants.length === 0 ? (
      <EmptyState view={view} />
    ) : (
      <div className="flex flex-col">
        {participants.map((p) => (
          <ParticipantRow
            key={p.id}
            participant={p}
            view={view}
            onUpdateParticipant={onUpdateParticipant}
            onBlockUser={onBlockUser}
            onUnblockUser={onUnblockUser}
            onRemoveParticipant={onRemoveParticipant}
          />
        ))}
      </div>
    )}
  </div>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Participant row                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

interface ParticipantRowProps {
  participant: Participant;
  view: Exclude<View, 'SETTINGS'>;
  onUpdateParticipant: (id: string, role: UserRole) => void;
  onBlockUser: (id: string) => void;
  onUnblockUser: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
}

const colorIndexFor = (id: string): 1 | 2 | 3 | 4 | 5 | 6 => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('') || '?';

const ParticipantRow: React.FC<ParticipantRowProps> = ({
  participant: p,
  view,
  onUpdateParticipant,
  onBlockUser,
  onUnblockUser,
  onRemoveParticipant,
}) => {
  const isSelf = p.id === 'You';
  const isContributor = p.role === UserRole.CONTRIBUTOR;
  const promote = () =>
    onUpdateParticipant(p.id, isContributor ? UserRole.SPECTATOR : UserRole.CONTRIBUTOR);

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 border-b border-rule-soft py-3 last:border-b-0 md:grid-cols-[auto_1fr_auto_auto]">
      <Avatar size={32} colorIndex={colorIndexFor(p.id)}>
        {initials(p.name)}
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-sans text-[13.5px] font-medium text-ink">
          {p.name}
          {isSelf && (
            <span className="ml-1.5 inline-block rounded-4 bg-cream-2 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.08em] text-ink-3">
              You
            </span>
          )}
        </span>
        <span className="truncate font-sans text-[11.5px] text-ink-3">ID: {p.id}</span>
      </div>
      <span
        className={`rounded-4 border px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] ${
          isContributor
            ? 'border-oxford/20 bg-oxford/10 text-oxford'
            : 'border-rule bg-cream-2 text-ink-2'
        } ${view === 'BLOCKED' ? 'opacity-60' : ''}`}
      >
        {view === 'BLOCKED' ? 'Blocked' : isContributor ? 'Contributor' : 'Spectator'}
      </span>
      {!isSelf && (
        <div className="col-span-3 flex flex-wrap gap-1.5 md:col-span-1 md:flex-nowrap">
          {view === 'BLOCKED' ? (
            <button
              type="button"
              onClick={() => onUnblockUser(p.id)}
              className="cursor-pointer rounded-6 border border-rule bg-cream px-2.5 py-1 font-sans text-[11.5px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
            >
              Unblock
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={promote}
                className="cursor-pointer rounded-6 border border-rule bg-cream px-2.5 py-1 font-sans text-[11.5px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
              >
                {isContributor ? 'Demote' : 'Promote'}
              </button>
              <button
                type="button"
                onClick={() => onRemoveParticipant(p.id)}
                className="cursor-pointer rounded-6 border border-rule bg-cream px-2.5 py-1 font-sans text-[11.5px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => onBlockUser(p.id)}
                className="cursor-pointer rounded-6 border border-editorial-red/30 bg-cream px-2.5 py-1 font-sans text-[11.5px] font-medium text-editorial-red transition-colors hover:bg-editorial-red/10"
              >
                Block
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Empty state                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

const EmptyState: React.FC<{ view: Exclude<View, 'SETTINGS'> }> = ({ view }) => {
  if (view === 'BLOCKED') {
    return (
      <div className="px-8 py-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-rule bg-cream-2 font-serif text-[28px] text-ink-4">
          ∅
        </div>
        <p className="mb-1 font-serif text-[16px] text-ink-2">No blocked participants.</p>
        <p className="font-sans text-[12.5px] text-ink-3">
          Blocked users cannot view or contribute to this debate.
        </p>
      </div>
    );
  }
  return (
    <div className="py-10 text-center font-sans text-[13px] text-ink-3">
      No participants found.
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Settings pane                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

interface SettingsPaneProps {
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  isSaving: boolean;
  savedFlash: boolean;
  handleSaveSettings: () => void;
  shareLink: string;
  copyFeedback: boolean;
  handleCopyLink: () => void;
  confirmClose: boolean;
  setConfirmClose: (v: boolean) => void;
  handleEndDebate: () => void;
  isClosed: boolean;
}

const SettingsPane: React.FC<SettingsPaneProps> = ({
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  isSaving,
  savedFlash,
  handleSaveSettings,
  shareLink,
  copyFeedback,
  handleCopyLink,
  confirmClose,
  setConfirmClose,
  handleEndDebate,
  isClosed,
}) => (
  <div className="flex flex-col gap-6">
    {/* Edit details */}
    <div className="flex flex-col gap-3.5">
      <TextInput
        label="Debate title"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
      />
      <Textarea
        label="Description"
        value={editDescription}
        rows={4}
        onChange={(e) => setEditDescription(e.target.value)}
      />
      <div>
        <Button variant="secondary" onClick={handleSaveSettings} loading={isSaving}>
          {savedFlash ? 'Saved ✓' : 'Update details'}
        </Button>
      </div>
    </div>

    {/* Share link */}
    <div className="border-t border-rule pt-4">
      <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
        Share link
      </label>
      <div className="flex items-center gap-2 rounded-8 border border-rule bg-cream-2 px-3 py-2">
        <span className="flex-1 truncate font-mono text-[12px] text-ink-2">{shareLink}</span>
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="Copy share link"
          className="inline-flex flex-none cursor-pointer items-center gap-1 rounded-6 border border-rule bg-cream px-2.5 py-1 font-sans text-[11.5px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
        >
          {copyFeedback ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
          {copyFeedback ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>

    {/* End debate */}
    <div className="border-t border-rule pt-4">
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-editorial-red">
        <IconClock className="h-3 w-3" />
        End debate
      </div>
      <p className="mb-3 font-sans text-[12px] leading-[1.5] text-ink-3">
        Closing the debate prevents new arguments and interactions. This cannot be undone.
      </p>
      {isClosed ? (
        <div className="rounded-8 border border-rule bg-cream-2 px-3 py-2.5 text-center font-sans text-[12.5px] text-ink-3">
          Debate is already closed
        </div>
      ) : confirmClose ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => setConfirmClose(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleEndDebate} className="flex-1">
            Confirm end
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmClose(true)}
          className="w-full cursor-pointer rounded-8 border border-editorial-red/30 bg-cream px-3 py-2.5 font-sans text-[12.5px] font-semibold text-editorial-red transition-colors hover:bg-editorial-red/10"
        >
          End debate now
        </button>
      )}
    </div>
  </div>
);
