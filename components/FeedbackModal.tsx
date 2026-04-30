import React, { useState } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ui/Modal';
import { Button } from './ui/Button';
import { SegmentedToggle } from './ui/SegmentedToggle';
import { Textarea } from './ui/Textarea';
import { TextInput } from './ui/TextInput';
import { IconCheck } from './Icons';

interface FeedbackModalProps {
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'comment';

const FEEDBACK_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature request' },
  { value: 'comment', label: 'Comment' },
];

const PLACEHOLDER_BY_TYPE: Record<FeedbackType, string> = {
  bug: 'Tell us what happened…',
  feature: 'What would you like to see?',
  comment: 'Share your thoughts…',
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      console.log(`Feedback (${feedbackType}) from ${email || 'anonymous'}: ${message}`);
      setIsSending(false);
      setSent(true);
      setTimeout(onClose, 1600);
    }, 700);
  };

  if (sent) {
    return (
      <Modal open onClose={onClose} size="sm" className="md:max-w-[400px]">
        <ModalBody className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-evergreen/15 text-evergreen">
            <IconCheck className="h-6 w-6" />
          </div>
          <h3 className="m-0 mb-2 font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
            Feedback sent
          </h3>
          <p className="m-0 font-serif text-[14px] leading-[1.55] text-ink-3">
            Thank you for helping improve Verbo.
          </p>
        </ModalBody>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} size="sm" className="md:max-w-[480px]" bottomSheetOnMobile>
      <ModalHeader eyebrow="Feedback" title="Send feedback to Verbo" onClose={onClose} />

      <ModalBody>
        <div className="mb-4">
          <span className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-3">
            Feedback type
          </span>
          <SegmentedToggle<FeedbackType>
            options={FEEDBACK_OPTIONS}
            value={feedbackType}
            onChange={setFeedbackType}
            size="sm"
            fullWidth
          />
        </div>

        <div className="mb-4">
          <Textarea
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={PLACEHOLDER_BY_TYPE[feedbackType]}
            rows={4}
          />
        </div>

        <TextInput
          label="Email"
          helperText="Optional"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />

        <p className="mt-3 font-serif text-[12px] italic leading-[1.5] text-ink-3">
          We read every message.
        </p>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSending}
          disabled={!message.trim()}
        >
          Send feedback
        </Button>
      </ModalFooter>
    </Modal>
  );
};
