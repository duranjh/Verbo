import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { IconClose, IconCheck } from './Icons';

interface VerboPlusModalProps {
  onClose: () => void;
  onSubscribe: () => void;
}

interface PlusFeature {
  title: string;
  description: string;
}

// Lead with Live (per chunk #8 plan): Live is the most distinctive Verbo+ feature
// and the highest perceived value, so it sits in row one.
const FEATURES: PlusFeature[] = [
  {
    title: 'Host Live debates',
    description: 'Real-time, voice-or-text, with synchronous fact-check announcements.',
  },
  {
    title: 'Create Private & Timed debates',
    description: 'Host exclusive discussions and time-limited challenges.',
  },
  {
    title: 'Verified contributor toolkit',
    description:
      'Unlimited AI Enhancer, source suggestions, and the exclusive Verbo+ profile badge.',
  },
];

const HERO_GRADIENT = 'linear-gradient(135deg, var(--oxford), #5B21B6)';
const FOOTER_GRADIENT =
  'linear-gradient(135deg, color-mix(in oklch, var(--oxford) 15%, var(--cream-2)), var(--cream-2))';

export const VerboPlusModal: React.FC<VerboPlusModalProps> = ({ onClose, onSubscribe }) => {
  return (
    <Modal open onClose={onClose} size="md" className="md:max-w-[560px]" bottomSheetOnMobile>
      {/* Hero header replaces the standard ModalHeader */}
      <div
        className="relative px-8 py-7 text-center text-white"
        style={{ background: HERO_GRADIENT }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        >
          <IconClose className="h-4 w-4" />
        </button>
        <h2 className="m-0 font-serif text-[36px] font-medium leading-[1.1] tracking-[-0.02em]">
          Verbo<span className="font-light">+</span>
        </h2>
        <p className="mt-2 font-serif text-[15px] leading-[1.4] opacity-90">
          Sharpen your arguments. Cite anything.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-5 pt-6 font-sans text-[14px] text-ink-2">
        <ul className="m-0 mb-6 flex list-none flex-col gap-4 p-0">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex items-start gap-3">
              <span
                aria-hidden
                className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-oxford/10 text-oxford"
              >
                <IconCheck className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <div className="font-sans text-[14px] font-semibold text-ink">{feature.title}</div>
                <div className="mt-0.5 font-serif text-[12.5px] leading-[1.5] text-ink-3">
                  {feature.description}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-[10px] border border-rule bg-cream-2 p-[18px] text-center">
          <div className="font-serif text-[28px] font-medium leading-[1.1] tracking-[-0.02em] text-ink">
            $12
            <span className="ml-0.5 font-sans text-[16px] font-normal text-ink-3">/mo</span>
          </div>
          <div className="mt-1 font-sans text-[12px] text-ink-3">
            Cancel anytime · Billed monthly · 7-day free trial
          </div>
        </div>
      </div>

      {/* Custom gradient footer (overrides standard ModalFooter) */}
      <div
        className="flex items-center justify-end gap-2 border-t border-rule px-6 py-3.5"
        style={{ background: FOOTER_GRADIENT }}
      >
        <Button variant="ghost" onClick={onClose}>
          Maybe later
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onSubscribe}
          style={{ background: HERO_GRADIENT, borderColor: 'transparent' }}
        >
          Start Free Trial
        </Button>
      </div>
    </Modal>
  );
};
