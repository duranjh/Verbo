import React from 'react';
import { Comment } from '../../types';
import { IconCheck, IconAlert, IconClock } from '../Icons';
import {
  AuditEvent,
  EngagementMetrics,
  VerificationCheck,
  deriveAuditTrail,
  deriveEngagement,
  deriveStrengthScore,
  deriveVerificationChecks,
  formatTimeOnly,
} from './utils';

const CardShell: React.FC<{
  title: string;
  meta?: string;
  children: React.ReactNode;
}> = ({ title, meta, children }) => (
  <div className="rounded-12 border border-rule bg-cream p-3.5">
    <h5 className="mb-2.5 flex items-center justify-between gap-2 font-serif text-[12.5px] font-medium text-ink">
      <span>{title}</span>
      {meta && (
        <span className="font-mono text-[9px] font-normal uppercase tracking-[0.08em] text-ink-3">
          {meta}
        </span>
      )}
    </h5>
    {children}
  </div>
);

interface StrengthScoreCardProps {
  comment: Comment;
  sourcesCount: number;
}

export const StrengthScoreCard: React.FC<StrengthScoreCardProps> = ({
  comment,
  sourcesCount,
}) => {
  const { score, topPercent } = deriveStrengthScore(comment, sourcesCount);
  return (
    <CardShell title="Strength score" meta="Live">
      <div className="flex flex-col items-center gap-2">
        <div className="font-serif text-[36px] font-medium leading-none tracking-[-0.02em] text-ink">
          {score}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
          / 100 · top {topPercent}%
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule-soft">
          <div
            className="h-full rounded-full bg-evergreen"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <div className="mt-3 font-sans text-[11px] leading-[1.5] text-ink-3">
        Combines community votes, source credibility, and reasoning quality.
      </div>
    </CardShell>
  );
};

const VerifyRow: React.FC<{ check: VerificationCheck }> = ({ check }) => {
  const Icon =
    check.status === 'ok' ? IconCheck : check.status === 'warn' ? IconAlert : IconClock;
  const iconColor =
    check.status === 'ok'
      ? 'text-evergreen'
      : check.status === 'warn'
      ? 'text-rating-mis-fg'
      : 'text-ink-3';
  return (
    <div className="flex items-center gap-2 border-b border-rule py-2 last:border-b-0">
      <span className={`inline-flex h-4 w-4 flex-none items-center justify-center ${iconColor}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 font-sans text-[12px] font-medium text-ink-2">
        {check.label}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3">
        {check.value}
      </span>
    </div>
  );
};

interface VerificationAuditCardProps {
  comment: Comment;
  sourcesCount: number;
}

export const VerificationAuditCard: React.FC<VerificationAuditCardProps> = ({
  comment,
  sourcesCount,
}) => {
  const { checks, passedCount, pending } = deriveVerificationChecks(
    comment,
    sourcesCount
  );
  const meta = pending ? 'In progress' : `${passedCount}/${checks.length} checks passed`;
  return (
    <CardShell title="Verification audit" meta={meta}>
      <div>
        {checks.map((c) => (
          <VerifyRow key={c.label} check={c} />
        ))}
      </div>
    </CardShell>
  );
};

interface EngagementCardProps {
  comment: Comment;
}

const Row: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight = false,
}) => (
  <div className="flex justify-between font-sans text-[11.5px] font-medium text-ink-2">
    <span>{label}</span>
    <span
      className={`font-mono text-[11px] ${
        highlight ? 'text-evergreen' : 'text-ink-3'
      }`}
    >
      {value}
    </span>
  </div>
);

const formatViews = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

export const EngagementCard: React.FC<EngagementCardProps> = ({ comment }) => {
  const e: EngagementMetrics = deriveEngagement(comment);
  return (
    <CardShell title="Engagement" meta="Last 24h">
      <div className="flex flex-col gap-2">
        <Row label="Views" value={formatViews(e.views)} />
        <Row label="Avg read time" value={e.avgReadTime} />
        <Row label="Mind-changes" value={`+${e.mindChanges}`} highlight />
        <Row label="Citations" value={e.citations} />
      </div>
    </CardShell>
  );
};

const AuditRow: React.FC<{ event: AuditEvent }> = ({ event }) => {
  const live = event.status === 'live';
  const ok = event.status === 'ok';
  const dotClass = live
    ? 'border-oxford bg-oxford animate-pulse-soft'
    : ok
    ? 'border-evergreen bg-evergreen'
    : 'border-ink-3 bg-cream';
  return (
    <div className="relative flex gap-2.5 py-1.5">
      <div
        className={`relative z-10 mt-0.5 h-3 w-3 flex-none rounded-full border-2 ${dotClass}`}
      />
      <div className="flex-1 min-w-0">
        <div className="font-sans text-[12px] font-medium text-ink-2">{event.label}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3">
          {event.status === 'live' ? 'Now' : formatTimeOnly(event.timestamp)}
        </div>
      </div>
    </div>
  );
};

interface AuditTrailCardProps {
  comment: Comment;
}

export const AuditTrailCard: React.FC<AuditTrailCardProps> = ({ comment }) => {
  const events = deriveAuditTrail(comment);
  return (
    <CardShell title="Audit trail">
      <div className="relative">
        <span
          aria-hidden
          className="absolute bottom-1.5 left-[5px] top-1.5 w-px bg-rule"
        />
        {events.map((e, i) => (
          <AuditRow key={`${e.label}-${i}`} event={e} />
        ))}
      </div>
    </CardShell>
  );
};
