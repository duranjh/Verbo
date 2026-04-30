import React from 'react';
import { ResearchSynthesis } from '../../types';
import { IconSparkles } from '../Icons';

interface ResearchSynthesisCardProps {
  synthesis?: ResearchSynthesis;
  isLoading?: boolean;
  totalSources: number;
  generatedAt?: number;
}

const formatRelativeMin = (timestamp: number) => {
  const mins = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const Takeaway: React.FC<{ num: string; lead: string; body: string }> = ({ num, lead, body }) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 inline-flex flex-none items-center justify-center rounded-[4px] bg-oxford/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-[1.4] text-oxford">
      {num}
    </span>
    <div className="font-serif text-[14.5px] leading-[1.55] text-ink-2">
      <b className="font-semibold text-ink">{lead}</b> {body}
    </div>
  </div>
);

export const ResearchSynthesisCard: React.FC<ResearchSynthesisCardProps> = ({
  synthesis,
  isLoading = false,
  totalSources,
  generatedAt,
}) => {
  // Fail-soft: hide entirely if there's nothing to show and we're not loading.
  if (!isLoading && (!synthesis || !synthesis.agree)) {
    return null;
  }

  const a = synthesis?.agreementPct ?? 0;
  const d = synthesis?.disagreementPct ?? 0;
  const u = synthesis?.underexploredPct ?? 0;

  const updatedLabel = generatedAt ? `updated ${formatRelativeMin(generatedAt)}` : 'updating…';
  const confidenceLabel = synthesis?.confidence ?? 'medium';

  return (
    <div className="relative rounded-12 bg-gradient-to-br from-oxford via-oxford to-[#5b21b6] p-px">
      <div className="rounded-[11px] bg-cream px-6 py-[22px]">
        <div className="mb-1 flex items-center gap-2">
          <IconSparkles className="h-[18px] w-[18px] text-oxford" />
          <h3 className="m-0 font-serif text-[17px] font-medium text-ink">What the sources say</h3>
        </div>
        <div className="mb-3.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
          AI synthesis · {totalSources} {totalSources === 1 ? 'source' : 'sources'} · {updatedLabel} · {confidenceLabel} confidence
        </div>

        {isLoading && !synthesis ? (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="h-5 w-7 animate-pulse-soft rounded-[4px] bg-rule-soft" />
                <span className="h-4 flex-1 animate-pulse-soft rounded-[4px] bg-rule-soft" />
              </div>
            ))}
          </div>
        ) : (
          synthesis && (
            <div className="flex flex-col gap-2.5">
              {synthesis.agree && (
                <Takeaway
                  num="01"
                  lead="Where they agree:"
                  body={
                    synthesis.agreeAcademicSupportPct
                      ? `${synthesis.agree} ${synthesis.agreeAcademicSupportPct}% of academic sources support this.`
                      : synthesis.agree
                  }
                />
              )}
              {synthesis.disagree && (
                <Takeaway num="02" lead="Where they disagree:" body={synthesis.disagree} />
              )}
              {synthesis.underexplored && (
                <Takeaway
                  num="03"
                  lead="What's underexplored:"
                  body={
                    synthesis.underexploredSourceCount
                      ? `${synthesis.underexplored} Only ${synthesis.underexploredSourceCount} sources discuss it directly.`
                      : synthesis.underexplored
                  }
                />
              )}
            </div>
          )
        )}

        {/* Agreement meter */}
        {synthesis && (a + d + u) > 0 && (
          <div className="mt-3.5 flex items-center gap-3 border-t border-rule pt-3.5 font-sans text-[11.5px] font-medium text-ink-3">
            <span>Agreement</span>
            <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-rule-soft">
              <span className="h-full bg-evergreen" style={{ width: `${a}%` }} />
              <span className="h-full bg-ink-3" style={{ width: `${d}%` }} />
              <span className="h-full bg-rating-mis-fg" style={{ width: `${u}%` }} />
            </div>
            <span className="font-mono text-[10px]">
              {a} / {d} / {u}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
