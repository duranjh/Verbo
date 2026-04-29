import React from 'react';
import { FactRating } from '../../types';
import { Tooltip } from './Tooltip';

export const RATING_DESCRIPTIONS: Record<FactRating, string> = {
  [FactRating.TRUE]: 'This statement is supported by reliable sources.',
  [FactRating.SOMEWHAT_TRUE]: 'Partially accurate but may lack important context.',
  [FactRating.NEUTRAL]: 'This is an opinion or could not be verified by reliable sources.',
  [FactRating.MISLEADING]: 'May use facts out of context to create a false impression.',
  [FactRating.FALSE]: 'This statement has been proven false by reliable sources.',
  [FactRating.UNRELATED]: 'This statement is not relevant to the debate topic.',
};

const RATING_LABELS: Record<FactRating, string> = {
  [FactRating.TRUE]: 'True',
  [FactRating.SOMEWHAT_TRUE]: 'Somewhat true',
  [FactRating.NEUTRAL]: 'Unverifiable',
  [FactRating.MISLEADING]: 'Misleading',
  [FactRating.FALSE]: 'False',
  [FactRating.UNRELATED]: 'Unrelated',
};

const RATING_COLORS: Record<FactRating, string> = {
  [FactRating.TRUE]: 'bg-rating-true-bg text-rating-true-fg border-rating-true-bd',
  [FactRating.SOMEWHAT_TRUE]: 'bg-rating-stt-bg text-rating-stt-fg border-rating-stt-bd',
  [FactRating.NEUTRAL]: 'bg-rating-unv-bg text-rating-unv-fg border-rating-unv-bd',
  [FactRating.MISLEADING]: 'bg-rating-mis-bg text-rating-mis-fg border-rating-mis-bd',
  [FactRating.FALSE]: 'bg-rating-fls-bg text-rating-fls-fg border-rating-fls-bd',
  [FactRating.UNRELATED]: 'bg-rating-unr-bg text-rating-unr-fg border-rating-unr-bd',
};

const STATE_STYLES: Record<NonNullable<RatingPillProps['state']>, string> = {
  default: '',
  hover: 'brightness-95',
  active: 'brightness-90',
  'tooltip-open': '',
};

interface RatingPillProps {
  rating: FactRating;
  state?: 'default' | 'hover' | 'active' | 'tooltip-open';
  tooltipText?: string;
  onClick?: () => void;
  className?: string;
}

const PillBody: React.FC<{ rating: FactRating; state: NonNullable<RatingPillProps['state']>; onClick?: () => void; className?: string }> = ({
  rating,
  state,
  onClick,
  className = '',
}) => {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-sans text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.04em] transition ${
        RATING_COLORS[rating]
      } ${STATE_STYLES[state]} ${onClick ? 'cursor-pointer hover:brightness-95 active:brightness-90' : ''} ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 flex-none rounded-full bg-current" />
      <span>{RATING_LABELS[rating]}</span>
    </Tag>
  );
};

export const RatingPill: React.FC<RatingPillProps> = ({
  rating,
  state = 'default',
  tooltipText,
  onClick,
  className,
}) => {
  const description = tooltipText ?? RATING_DESCRIPTIONS[rating];
  const tooltipOpen = state === 'tooltip-open';

  return (
    <Tooltip
      content={
        <>
          <strong className="mb-1 block font-serif text-[12px] font-semibold">{RATING_LABELS[rating]}</strong>
          {description}
        </>
      }
      open={tooltipOpen ? true : undefined}
    >
      <PillBody rating={rating} state={state} onClick={onClick} className={className} />
    </Tooltip>
  );
};
