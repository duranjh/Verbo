import React, { useRef, useState } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ui/Modal';
import { Button } from './ui/Button';
import { TextInput } from './ui/TextInput';
import { VerifyingPill } from './ui/VerifyingPill';
import { IconClose } from './Icons';

interface OccupationVerificationModalProps {
  onClose: () => void;
  onSubmit: (files: File[]) => void;
  isPending?: boolean;
  currentOccupation?: string;
  verificationDate?: number;
}

const formatUploadDate = (ts?: number): string => {
  const d = typeof ts === 'number' ? new Date(ts) : new Date(2026, 3, 28);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PendingFileCard: React.FC<{ filename: string; uploadedAt?: number }> = ({
  filename,
  uploadedAt,
}) => (
  <div className="flex items-center gap-3 rounded-[10px] border border-rule bg-cream-2 px-[18px] py-3.5">
    <div
      aria-hidden
      className="flex h-10 w-10 flex-none items-center justify-center rounded-8 bg-cream-3 font-mono text-[11px] font-semibold text-ink-3"
    >
      PDF
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate font-sans text-[13px] font-medium text-ink">{filename}</div>
      <div className="font-sans text-[11px] text-ink-3">
        Uploaded {formatUploadDate(uploadedAt)} · 2.4 MB
      </div>
    </div>
    <VerifyingPill label="Under review" />
  </div>
);

const UploadedFileCard: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => {
  const ext = (file.name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
  const sizeKb = file.size / 1024;
  const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`;
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-rule bg-cream-2 px-[18px] py-3.5">
      <div
        aria-hidden
        className="flex h-10 w-10 flex-none items-center justify-center rounded-8 bg-cream-3 font-mono text-[11px] font-semibold text-ink-3"
      >
        {ext}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[13px] font-medium text-ink">{file.name}</div>
        <div className="font-sans text-[11px] text-ink-3">{sizeLabel}</div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove file"
        className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-rule-soft hover:text-ink"
      >
        <IconClose className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const OccupationVerificationModal: React.FC<OccupationVerificationModalProps> = ({
  onClose,
  onSubmit,
  isPending = false,
  currentOccupation,
  verificationDate,
}) => {
  const [occupation, setOccupation] = useState(currentOccupation ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = () => {
    if (!file || !occupation.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit([file]);
      setIsSubmitting(false);
    }, 800);
  };

  const explainer = isPending
    ? 'Verified contributors are clearly marked with a badge. Your occupation is shown on every argument you post. Verification expires after 1 year.'
    : 'Verified contributors are clearly marked with a badge. Your occupation is shown on every argument you post. Verification expires after 1 year and must be renewed.';

  const submitDisabled = isPending || !file || !occupation.trim();

  return (
    <Modal open onClose={onClose} size="md" className="md:max-w-[520px]" bottomSheetOnMobile>
      <ModalHeader eyebrow="Verification" title="Verify your occupation" onClose={onClose} />

      <ModalBody>
        <p className="m-0 mb-[18px] font-serif text-[13.5px] leading-[1.55] text-ink-2">
          {explainer}
        </p>

        <div className="mb-4">
          <TextInput
            label="Occupation"
            placeholder="e.g. Economist, Cardiologist, Policy Analyst"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <span className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-3">
            Credential document
          </span>

          {isPending ? (
            <PendingFileCard filename="credential_brookings.pdf" uploadedAt={verificationDate} />
          ) : file ? (
            <UploadedFileCard file={file} onRemove={() => setFile(null)} />
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="block w-full rounded-[10px] border-[1.5px] border-dashed border-rule bg-cream-2 px-6 py-8 text-center transition-colors hover:bg-cream-3"
            >
              <span className="block font-serif text-[14px] font-medium leading-[1.4] text-ink-2">
                Drop a file here or click to upload
              </span>
              <span className="mt-1 block font-sans text-[12px] text-ink-3">
                PDF, JPG, or PNG · Max 10 MB
              </span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelected}
          />
        </div>

        {isPending && (
          <div className="mt-2 rounded-8 border-l-[3px] border-oxford bg-cream-2 px-3.5 py-2.5 font-serif text-[12.5px] italic leading-[1.55] text-ink-3">
            Your verification is being reviewed. This typically takes 1–3 business days. You'll
            receive a notification when it's complete.
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={submitDisabled}
          className={isPending ? 'pointer-events-none opacity-55' : undefined}
        >
          Submit for review
        </Button>
      </ModalFooter>
    </Modal>
  );
};
