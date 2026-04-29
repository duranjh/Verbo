// Manual-verification surface for chunk #2 primitives.
// NOT exported from the barrel. Mount temporarily in App.tsx during dev,
// unmount before committing. Renders every primitive in every state.

import React, { useState } from 'react';
import { FactRating, Stance } from '../../../types';
import {
  IconAdd,
  IconBell,
  IconUser,
  IconComment,
  IconSearch,
  IconSparkles,
  IconStar,
} from '../../Icons';

const IconHome: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
import {
  RatingPill,
  VerifyingPill,
  DuplicatePill,
  EditedPill,
  AiAssistedPill,
  MetaPill,
  StanceTag,
  Button,
  IconButton,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Toggle,
  SegmentedToggle,
  SearchInput,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Sidebar,
  SidebarHeader,
  SidebarBody,
  Card,
  Avatar,
  TopAppBar,
  MobileTabBar,
  Tabs,
  Toast,
  Badge,
  Tooltip,
  SourceCitation,
  StanceMismatchNotice,
} from '../index';

const Section: React.FC<{ title: string; sub?: string; children: React.ReactNode }> = ({
  title,
  sub,
  children,
}) => (
  <section className="rounded-12 border border-rule bg-cream p-6">
    <header className="mb-4">
      <h2 className="m-0 font-serif text-[20px] font-semibold text-ink">{title}</h2>
      {sub && <p className="mt-1 font-sans text-[13px] text-ink-3">{sub}</p>}
    </header>
    <div className="flex flex-wrap items-start gap-4">{children}</div>
  </section>
);

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex min-w-[160px] flex-col gap-2">
    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">{label}</span>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

export const Showcase: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [stance, setStance] = useState<Stance>(Stance.FOR);
  const [tab, setTab] = useState<'arguments' | 'research' | 'consensus'>('arguments');
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [radio, setRadio] = useState<'public' | 'private'>('public');
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);
  const [search, setSearch] = useState('ai regulation');
  const [searchAi, setSearchAi] = useState('');
  const [smModalOpen, setSmModalOpen] = useState(false);
  const [mdModalOpen, setMdModalOpen] = useState(false);
  const [lgModalOpen, setLgModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showToast, setShowToast] = useState<null | 'success' | 'info' | 'warning' | 'error'>(null);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('theme-dark');
    else root.classList.remove('theme-dark');
  }, [theme]);

  const ratings: FactRating[] = [
    FactRating.TRUE,
    FactRating.SOMEWHAT_TRUE,
    FactRating.NEUTRAL,
    FactRating.MISLEADING,
    FactRating.FALSE,
    FactRating.UNRELATED,
  ];

  return (
    <div className="min-h-screen bg-cream-2 px-8 py-10 text-ink">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="m-0 font-serif text-[28px] font-semibold text-ink">
            Verbo · components/ui showcase
          </h1>
          <p className="mt-1 font-sans text-[13px] text-ink-3">
            Manual verification surface for chunk #2. Mount temporarily, unmount before committing.
          </p>
        </div>
        <SegmentedToggle
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={theme}
          onChange={(v) => setTheme(v as 'light' | 'dark')}
        />
      </header>

      <div className="flex flex-col gap-6">
        {/* PILLS */}
        <Section title="Rating pills" sub="Six FactRating values, all states. UNVERIFIABLE reads as honest information.">
          <Cell label="Default">
            {ratings.map((r) => (
              <RatingPill key={r} rating={r} />
            ))}
          </Cell>
          <Cell label="Hover (visual)">
            {ratings.map((r) => (
              <RatingPill key={r} rating={r} state="hover" />
            ))}
          </Cell>
          <Cell label="Active (visual)">
            {ratings.map((r) => (
              <RatingPill key={r} rating={r} state="active" />
            ))}
          </Cell>
          <Cell label="Tooltip-open">
            <RatingPill rating={FactRating.MISLEADING} state="tooltip-open" />
          </Cell>
          <Cell label="Clickable">
            <RatingPill rating={FactRating.TRUE} onClick={() => undefined} />
          </Cell>
        </Section>

        <Section title="Verifying pill" sub="Slow shimmer (2.4s), calm 3-dot pulse (1.4s). Computing carefully, not broken.">
          <Cell label="Default">
            <VerifyingPill />
          </Cell>
          <Cell label="Elapsed time">
            <VerifyingPill variant="elapsed-time" elapsedSeconds={14} />
          </Cell>
          <Cell label="Sources count">
            <VerifyingPill variant="sources-count" sourcesCount={4} />
          </Cell>
          <Cell label="Lifecycle">
            <VerifyingPill />
            <span className="font-mono text-[10px] text-ink-3">→ 32s →</span>
            <RatingPill rating={FactRating.TRUE} />
          </Cell>
        </Section>

        <Section title="Auxiliary pills">
          <Cell label="Duplicate / Edited / AI">
            <DuplicatePill />
            <EditedPill />
            <AiAssistedPill />
          </Cell>
        </Section>

        <Section title="Meta pills" sub="Topic-card and argument-metadata row.">
          <Cell label="All kinds">
            <MetaPill kind="default">Public</MetaPill>
            <MetaPill kind="live">Live · 142 in</MetaPill>
            <MetaPill kind="timed">Timed · 2d 4h</MetaPill>
            <MetaPill kind="warn">18+</MetaPill>
            <MetaPill kind="closed">Closed</MetaPill>
            <MetaPill kind="verified-count">32 verified</MetaPill>
          </Cell>
        </Section>

        <Section title="Stance tags">
          <Cell label="Three stances">
            <StanceTag stance={Stance.FOR} />
            <StanceTag stance={Stance.NEUTRAL} />
            <StanceTag stance={Stance.AGAINST} />
          </Cell>
        </Section>

        {/* BUTTONS */}
        <Section title="Buttons" sub="Five variants × five states + sizes + icon-only.">
          <Cell label="Primary">
            <Button variant="primary">Post argument</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" loading>
              Posting…
            </Button>
          </Cell>
          <Cell label="Secondary">
            <Button variant="secondary">Cancel</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
            <Button variant="secondary" loading>
              Loading
            </Button>
          </Cell>
          <Cell label="Ghost">
            <Button variant="ghost">Skip</Button>
            <Button variant="ghost" disabled>
              Disabled
            </Button>
          </Cell>
          <Cell label="Destructive">
            <Button variant="destructive">Delete</Button>
            <Button variant="destructive" loading>
              Deleting…
            </Button>
          </Cell>
          <Cell label="AI (Find sources / Enhance)">
            <Button variant="ai" icon={<IconSparkles className="h-3.5 w-3.5" />}>
              Find sources
            </Button>
            <Button variant="ai" icon={<IconSparkles className="h-3.5 w-3.5" />}>
              Enhance
            </Button>
          </Cell>
          <Cell label="Sizes (primary)">
            <Button variant="primary" size="sm">
              Post
            </Button>
            <Button variant="primary" size="md">
              Post argument
            </Button>
            <Button variant="primary" size="lg">
              Post argument
            </Button>
          </Cell>
          <Cell label="Icon buttons">
            <IconButton variant="primary" shape="circle" aria-label="Add">
              <IconAdd className="h-4 w-4" />
            </IconButton>
            <IconButton variant="secondary" shape="circle" aria-label="Bell">
              <IconBell className="h-4 w-4" />
            </IconButton>
            <IconButton variant="secondary" shape="square" aria-label="Comment">
              <IconComment className="h-4 w-4" />
            </IconButton>
            <IconButton variant="ghost" shape="circle" aria-label="More">
              <IconStar className="h-4 w-4" />
            </IconButton>
          </Cell>
        </Section>

        {/* FORMS */}
        <Section title="Form controls">
          <Cell label="Text input — default">
            <TextInput label="Default" placeholder="Search debates" helperText="Type to filter." />
          </Cell>
          <Cell label="Text input — error">
            <TextInput label="Email" defaultValue="not-an-email" errorText="Enter a valid email address." />
          </Cell>
          <Cell label="Text input — disabled">
            <TextInput label="Username" defaultValue="@sarah_chen" disabled />
          </Cell>
          <Cell label="Textarea (serif)">
            <Textarea
              label="Argument"
              defaultValue="Carbon pricing transfers cost from polluter to consumer asymmetrically…"
              helperText="Cite at least one source."
            />
          </Cell>
          <Cell label="Select">
            <Select label="Sort">
              <option>Most rated</option>
              <option>Recent</option>
            </Select>
          </Cell>
          <Cell label="Checkboxes">
            <Checkbox
              label="Notify me on replies"
              checked={check1}
              onChange={(e) => setCheck1(e.target.checked)}
            />
            <Checkbox
              label="Make this argument anonymous"
              checked={check2}
              onChange={(e) => setCheck2(e.target.checked)}
            />
            <Checkbox label="Pin to top (Verbo+ only)" disabled />
          </Cell>
          <Cell label="Radios">
            <Radio
              name="privacy"
              label="Public — anyone can join"
              checked={radio === 'public'}
              onChange={() => setRadio('public')}
            />
            <Radio
              name="privacy"
              label="Private — password required"
              checked={radio === 'private'}
              onChange={() => setRadio('private')}
            />
          </Cell>
          <Cell label="Toggles">
            <Toggle label="Enable AI tools for participants" checked={toggle1} onChange={setToggle1} />
            <Toggle label="Allow age-restricted content" checked={toggle2} onChange={setToggle2} />
          </Cell>
          <Cell label="Segmented (stance)">
            <SegmentedToggle
              options={[
                { value: Stance.FOR, label: 'For' },
                { value: Stance.NEUTRAL, label: 'Neutral' },
                { value: Stance.AGAINST, label: 'Against' },
              ]}
              value={stance}
              onChange={(v) => setStance(v as Stance)}
            />
          </Cell>
          <Cell label="Search input">
            <div className="w-[280px]">
              <SearchInput value={search} onChange={setSearch} placeholder="Search debates" />
            </div>
          </Cell>
          <Cell label="Search input · AI tagged">
            <div className="w-[280px]">
              <SearchInput
                value={searchAi}
                onChange={setSearchAi}
                aiTagged
                placeholder="Search debates — AI semantic match"
              />
            </div>
          </Cell>
        </Section>

        {/* SHELLS */}
        <Section title="Shells" sub="Modal sizes + Sidebar + Card variants.">
          <Cell label="Modal sizes">
            <Button variant="secondary" size="sm" onClick={() => setSmModalOpen(true)}>
              Open sm
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setMdModalOpen(true)}>
              Open md
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setLgModalOpen(true)}>
              Open lg
            </Button>
          </Cell>
          <Cell label="Sidebar (right)">
            <Button variant="secondary" size="sm" onClick={() => setSidebarOpen(true)}>
              Open sidebar
            </Button>
          </Cell>
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <Card variant="generic">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Generic</span>
              <p className="m-0 font-serif text-[14px] text-ink-2">Generic card body.</p>
            </Card>
            <Card variant="topic" hover>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Topic · hover</span>
              <p className="m-0 font-serif text-[14px] text-ink-2">Topic-shaped shell, hover-lift active.</p>
            </Card>
            <Card variant="argument" justPosted>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Argument · just posted</span>
              <p className="m-0 font-serif text-[14px] text-ink-2">
                Carbon pricing in British Columbia reduced emissions by 5–15%…
              </p>
            </Card>
          </div>
        </Section>

        {/* NAV & STATUS */}
        <Section title="Avatars">
          <Cell label="Sizes">
            <Avatar size={24} colorIndex={1}>SC</Avatar>
            <Avatar size={28} colorIndex={2}>DP</Avatar>
            <Avatar size={32} colorIndex={3}>JK</Avatar>
            <Avatar size={36} colorIndex={4}>AM</Avatar>
            <Avatar size={40} colorIndex={5}>RZ</Avatar>
            <Avatar size={64} colorIndex={6}>SC</Avatar>
          </Cell>
          <Cell label="Verified + anon">
            <Avatar size={40} colorIndex={1} verified>SC</Avatar>
            <Avatar size={64} colorIndex={1} verified>SC</Avatar>
            <Avatar size={32} colorIndex="anon">?</Avatar>
          </Cell>
        </Section>

        <Section title="Top app bar (desktop chrome shell)">
          <div className="w-full">
            <TopAppBar
              leftSlot={
                <a className="font-serif text-[22px] font-semibold tracking-tight text-ink no-underline" href="#">
                  Verbo<span className="text-oxford">.</span>
                </a>
              }
              centerSlot={
                <div className="w-full max-w-[420px]">
                  <SearchInput value={search} onChange={setSearch} aiTagged placeholder="Search debates, topics, contributors…" />
                </div>
              }
              rightSlot={
                <>
                  <Button variant="primary" size="sm" icon={<IconAdd className="h-3.5 w-3.5" />}>
                    Start a debate
                  </Button>
                  <span className="relative inline-flex">
                    <IconButton variant="ghost" shape="circle" aria-label="Notifications">
                      <IconBell className="h-4 w-4" />
                    </IconButton>
                    <span className="absolute right-0.5 top-0.5">
                      <Badge>3</Badge>
                    </span>
                  </span>
                  <Avatar size={32} colorIndex={4} verified>JK</Avatar>
                </>
              }
            />
          </div>
        </Section>

        <Section title="Mobile tab bar">
          <div className="w-[375px] overflow-hidden rounded-12 border border-rule">
            <MobileTabBar
              items={[
                { key: 'home', icon: <IconHome className="h-5 w-5" />, label: 'Home', active: true },
                { key: 'search', icon: <IconSearch className="h-5 w-5" />, label: 'Search' },
                { key: 'alerts', icon: <IconBell className="h-5 w-5" />, label: 'Alerts' },
                { key: 'account', icon: <IconUser className="h-5 w-5" />, label: 'Account' },
              ]}
              fab={{
                icon: <IconAdd className="h-5 w-5" />,
                ariaLabel: 'Compose argument',
              }}
            />
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs
            tabs={[
              { label: 'Arguments', value: 'arguments', count: 1300 },
              { label: 'Research', value: 'research', count: 142 },
              { label: 'AI Consensus', value: 'consensus' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </Section>

        <Section title="Toasts (top-center)">
          <Cell label="Variants">
            <Button variant="secondary" size="sm" onClick={() => setShowToast('success')}>
              Success
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowToast('info')}>
              Info
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowToast('warning')}>
              Warning
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowToast('error')}>
              Error
            </Button>
          </Cell>
        </Section>

        <Section title="Badges & Tooltips">
          <Cell label="Count badges">
            <Badge>3</Badge>
            <Badge>12</Badge>
            <Badge>99+</Badge>
          </Cell>
          <Cell label="Tooltip">
            <Tooltip content="Tooltip body — Ink bg + Cream text.">
              <button className="rounded-8 border border-rule bg-cream px-3 py-1.5 font-sans text-[12px] text-ink">
                Hover me
              </button>
            </Tooltip>
            <Tooltip content="Always-open tooltip example." open>
              <span className="rounded-8 border border-rule bg-cream px-3 py-1.5 font-sans text-[12px] text-ink">
                Pinned
              </span>
            </Tooltip>
          </Cell>
        </Section>

        {/* CITATIONS */}
        <Section title="Source citations" sub="Brand value-prop primitive — journalistic, not search-result spammy.">
          <div className="flex w-full flex-col gap-2.5">
            <SourceCitation
              domain="nytimes.com"
              url="#"
              favicon="N"
              faviconColor="bg-[#1B1714]"
              title="A decade of carbon pricing in British Columbia: lessons learned"
            />
            <SourceCitation
              domain="economist.com"
              url="#"
              favicon="E"
              faviconColor="bg-[#B91C1C]"
              title="Carbon taxes that actually work — and the ones that don't"
            />
            <SourceCitation
              domain="federalreserve.gov"
              url="#"
              favicon="F"
              faviconColor="bg-[#15803D]"
              title="FEDS Notes: distributional effects of carbon pricing in the United States"
            />
            <SourceCitation
              domain="ipcc.ch"
              url="#"
              favicon="I"
              faviconColor="bg-[#1E3A8A]"
              title="AR6 Synthesis Report — policy instruments for mitigation"
            />
          </div>
        </Section>

        {/* ASYNC NOTICE */}
        <Section title="Stance mismatch notice">
          <div className="w-full">
            <StanceMismatchNotice
              detectedStance={Stance.AGAINST}
              postedStance={Stance.FOR}
              onSwitch={() => undefined}
              onKeep={() => undefined}
            />
          </div>
        </Section>
      </div>

      {/* MODALS */}
      <Modal size="sm" open={smModalOpen} onClose={() => setSmModalOpen(false)}>
        <ModalHeader title="Delete argument?" onClose={() => setSmModalOpen(false)} />
        <ModalBody>This will remove the argument and its 34 replies. Cannot be undone.</ModalBody>
        <ModalFooter
          secondaryAction={
            <Button variant="ghost" onClick={() => setSmModalOpen(false)}>
              Cancel
            </Button>
          }
          primaryAction={
            <Button variant="destructive" onClick={() => setSmModalOpen(false)}>
              Delete
            </Button>
          }
        />
      </Modal>
      <Modal size="md" open={mdModalOpen} onClose={() => setMdModalOpen(false)}>
        <ModalHeader title="Report argument" onClose={() => setMdModalOpen(false)} />
        <ModalBody>
          <div className="flex flex-col gap-2">
            <Radio name="report" label="Spam or irrelevant" defaultChecked />
            <Radio name="report" label="Harassment" />
            <Radio name="report" label="Other" />
          </div>
        </ModalBody>
        <ModalFooter
          secondaryAction={
            <Button variant="ghost" onClick={() => setMdModalOpen(false)}>
              Cancel
            </Button>
          }
          primaryAction={
            <Button variant="primary" onClick={() => setMdModalOpen(false)}>
              Submit report
            </Button>
          }
        />
      </Modal>
      <Modal size="lg" open={lgModalOpen} onClose={() => setLgModalOpen(false)}>
        <ModalHeader title="Start a new debate" onClose={() => setLgModalOpen(false)} />
        <ModalBody>
          <div className="flex flex-col gap-3.5">
            <TextInput label="Topic question" placeholder="e.g. Should governments regulate frontier AI?" />
            <Textarea label="Description" placeholder="Frame the debate. What's at stake?" />
          </div>
        </ModalBody>
        <ModalFooter
          secondaryAction={
            <Button variant="ghost" onClick={() => setLgModalOpen(false)}>
              Cancel
            </Button>
          }
        >
          <Button variant="secondary">Save draft</Button>
          <Button variant="primary" onClick={() => setLgModalOpen(false)}>
            Continue
          </Button>
        </ModalFooter>
      </Modal>

      {/* SIDEBAR */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <SidebarHeader
          title="Notifications"
          onClose={() => setSidebarOpen(false)}
          rightSlot={
            <Button variant="ghost" size="sm">
              Mark all read
            </Button>
          }
        />
        <SidebarBody>
          <div className="flex flex-col gap-3">
            <p className="m-0 font-sans text-[13px] text-ink-2">
              <strong>@daniel_park</strong> replied to your argument on carbon pricing.
            </p>
            <p className="m-0 font-sans text-[13px] text-ink-2">
              Your argument was rated <strong className="text-rating-true-fg">True</strong> by Verbo's fact-checker.
            </p>
            <p className="m-0 font-sans text-[13px] text-ink-3">3 mentions in <em>Should governments regulate AI?</em></p>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* TOAST */}
      {showToast && (
        <Toast
          variant={showToast}
          message={
            showToast === 'success'
              ? 'Argument posted — fact-checking now'
              : showToast === 'info'
              ? 'This argument duplicates an earlier post by @daniel_park'
              : showToast === 'warning'
              ? 'Your verification documents are out of date'
              : "Couldn't post — check your connection"
          }
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
};
