// Verbo UI primitives — chunk #2 of the redesign.
// One file per primitive; this barrel re-exports everything as named exports
// so screen-level chunks can `import { Button, RatingPill, ... } from 'components/ui'`.

// Pills
export { RatingPill, RATING_DESCRIPTIONS } from './RatingPill';
export { VerifyingPill } from './VerifyingPill';
export { DuplicatePill } from './DuplicatePill';
export { EditedPill } from './EditedPill';
export { AiAssistedPill } from './AiAssistedPill';
export { MetaPill } from './MetaPill';
export { StanceTag } from './StanceTag';

// Form controls
export { Button } from './Button';
export { IconButton } from './IconButton';
export { TextInput } from './TextInput';
export { Textarea } from './Textarea';
export { Select } from './Select';
export { Checkbox } from './Checkbox';
export { Radio } from './Radio';
export { Toggle } from './Toggle';
export { SegmentedToggle } from './SegmentedToggle';
export { SearchInput } from './SearchInput';

// Shells
export { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
export { Sidebar, SidebarHeader, SidebarBody } from './Sidebar';
export { Card } from './Card';

// Navigation & status
export { Avatar } from './Avatar';
export { TopAppBar } from './TopAppBar';
export { MobileTabBar } from './MobileTabBar';
export { Tabs } from './Tabs';
export { Toast } from './Toast';
export { Badge } from './Badge';
export { Tooltip } from './Tooltip';

// Citations
export { SourceCitation } from './SourceCitation';

// Async notices
export { StanceMismatchNotice } from './StanceMismatchNotice';
