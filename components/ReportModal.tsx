import React, { useState } from 'react';
import { ReportTargetType } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { IconCheck } from './Icons';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetContent?: string;
}

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Misinformation outside fact-check scope',
  'Off-topic',
  'Other',
];

const truncate = (text: string, max = 120) =>
  text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetContent,
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      console.log(`Reported ${targetType} (${targetId}): ${reason} - ${details}`);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDetails('');
        setReason(REPORT_REASONS[0]);
        onClose();
      }, 1600);
    }, 700);
  };

  if (isSuccess) {
    return (
      <Modal open onClose={onClose} size="sm" className="md:max-w-[400px]">
        <ModalBody className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-evergreen/15 text-evergreen">
            <IconCheck className="h-6 w-6" />
          </div>
          <h3 className="m-0 mb-2 font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
            Report received
          </h3>
          <p className="m-0 font-serif text-[14px] leading-[1.55] text-ink-3">
            Thanks for helping keep Verbo trustworthy. Our team will review this shortly.
          </p>
        </ModalBody>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} size="sm" className="md:max-w-[480px]" bottomSheetOnMobile>
      <ModalHeader eyebrow="Report" title="Report this argument" onClose={onClose} />

      <ModalBody>
          {targetContent && (
            <blockquote className="mb-[18px] rounded-r-8 border-l-[3px] border-rule bg-cream-2 px-3.5 py-2.5 font-serif text-[13px] italic leading-[1.5] text-ink-3">
              “{truncate(targetContent)}”
            </blockquote>
          )}

          <div className="mb-4">
            <Select
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Details"
            helperText="Optional"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide additional context…"
            rows={3}
          />
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="button" onClick={handleSubmit} loading={isSubmitting}>
          Submit report
        </Button>
      </ModalFooter>
    </Modal>
  );
};
