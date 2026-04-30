import React, { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  SearchInput,
  TopAppBar as TopAppBarShell,
} from './ui';
import {
  IconAdd,
  IconArrowLeft,
  IconBell,
  IconSearch,
} from './Icons';

interface TopAppBarProps {
  userInitials: string;
  userColorIndex: 1 | 2 | 3 | 4 | 5 | 6 | 'anon';
  userVerified: boolean;
  unreadCount: number;
  searchQuery: string;
  onSearchChange: (next: string) => void;
  onSearchFocus?: () => void;
  onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  searchDropdown?: React.ReactNode;
  onCreateDebate: () => void;
  onOpenNotifications: () => void;
  onOpenAccount: () => void;
  onLogoClick?: () => void;
}

const Wordmark: React.FC<{ size?: 'sm' | 'md'; onClick?: () => void }> = ({ size = 'md', onClick }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick?.();
    }}
    className={`font-serif font-semibold tracking-[-0.02em] text-ink no-underline ${
      size === 'sm' ? 'text-[20px]' : 'text-[22px]'
    }`}
  >
    Verbo<span className="text-oxford">.</span>
  </a>
);

const BellWithBadge: React.FC<{ unreadCount: number; onClick: () => void }> = ({
  unreadCount,
  onClick,
}) => (
  <span className="relative inline-flex">
    <IconButton variant="ghost" shape="circle" aria-label="Notifications" onClick={onClick}>
      <IconBell className="h-4 w-4" />
    </IconButton>
    {unreadCount > 0 && (
      <span className="absolute -right-0.5 -top-0.5 inline-flex">
        <Badge>{unreadCount}</Badge>
      </span>
    )}
  </span>
);

export const TopAppBar: React.FC<TopAppBarProps> = ({
  userInitials,
  userColorIndex,
  userVerified,
  unreadCount,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  onSearchKeyDown,
  searchInputRef,
  searchDropdown,
  onCreateDebate,
  onOpenNotifications,
  onOpenAccount,
  onLogoClick,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden md:block">
        <TopAppBarShell
          leftSlot={<Wordmark onClick={onLogoClick} />}
          centerSlot={
            <div className="relative w-full max-w-[480px]">
              <SearchInput
                aiTagged
                value={searchQuery}
                onChange={onSearchChange}
                onFocus={onSearchFocus}
                onKeyDown={onSearchKeyDown}
                inputRef={searchInputRef}
                placeholder="Search debates or topics — AI semantic match"
              />
              {searchDropdown}
            </div>
          }
          rightSlot={
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<IconAdd className="h-3.5 w-3.5" />}
                onClick={onCreateDebate}
              >
                Start a debate
              </Button>
              <BellWithBadge unreadCount={unreadCount} onClick={onOpenNotifications} />
              <button
                type="button"
                onClick={onOpenAccount}
                aria-label="Open account"
                className="cursor-pointer border-none bg-transparent p-0"
              >
                <Avatar size={32} colorIndex={userColorIndex} verified={userVerified}>
                  {userInitials}
                </Avatar>
              </button>
            </>
          }
        />
      </div>

      {/* Mobile */}
      <header className="flex items-center gap-2 border-b border-rule bg-cream px-4 py-3 md:hidden">
        {mobileSearchOpen ? (
          <>
            <IconButton
              variant="ghost"
              shape="circle"
              aria-label="Close search"
              onClick={() => setMobileSearchOpen(false)}
            >
              <IconArrowLeft className="h-4 w-4" />
            </IconButton>
            <div className="relative flex-1">
              <SearchInput
                aiTagged
                value={searchQuery}
                onChange={onSearchChange}
                onFocus={onSearchFocus}
                onKeyDown={onSearchKeyDown}
                inputRef={searchInputRef}
                placeholder="Search debates or topics"
              />
              {searchDropdown}
            </div>
          </>
        ) : (
          <>
            <Wordmark size="sm" onClick={onLogoClick} />
            <div className="ml-auto flex items-center gap-2">
              <IconButton
                variant="ghost"
                shape="circle"
                aria-label="Search"
                onClick={() => setMobileSearchOpen(true)}
              >
                <IconSearch className="h-4 w-4" />
              </IconButton>
              <BellWithBadge unreadCount={unreadCount} onClick={onOpenNotifications} />
              <button
                type="button"
                onClick={onOpenAccount}
                aria-label="Open account"
                className="cursor-pointer border-none bg-transparent p-0"
              >
                <Avatar size={28} colorIndex={userColorIndex} verified={userVerified}>
                  {userInitials}
                </Avatar>
              </button>
            </div>
          </>
        )}
      </header>
    </>
  );
};
