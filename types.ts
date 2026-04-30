


export enum Stance {
  FOR = 'FOR',
  AGAINST = 'AGAINST',
  NEUTRAL = 'NEUTRAL'
}

export enum FactRating {
  UNRELATED = 0,
  FALSE = 1,
  MISLEADING = 2,
  NEUTRAL = 3,
  SOMEWHAT_TRUE = 4,
  TRUE = 5
}

export enum DebateType {
  OPEN = 'OPEN',
  TIMED = 'TIMED'
}

export type DebateFormat = 'CHAT' | 'LIVE';

export enum PrivacyStatus {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export enum UserRole {
  CONTRIBUTOR = 'CONTRIBUTOR',
  SPECTATOR = 'SPECTATOR'
}

export interface Participant {
  id: string;
  name: string;
  role: UserRole;
  isBlocked: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatarUrl?: string;
  occupation?: string;
  isOccupationVisible?: boolean;
  isOccupationVerified?: boolean;
  isVerificationPending?: boolean;
  verificationDate?: number;
  dob?: string;
  dobLastUpdated?: number;
  isPremium: boolean;
}

export interface Source {
  title: string;
  uri: string;
}

export interface GroundingSource {
  title?: string;
  uri: string;
}

export interface AIAnalysis {
  rating: FactRating;
  ratingLabel: string;
  reasoning: string;
  groundingSources: GroundingSource[];
  detectedStance?: string;
  isDuplicate?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
}

export interface Comment {
  id: string;
  topicId: string;
  author: string;
  userTitle?: string; // e.g. "Economist", "Student"
  isUserVerified?: boolean;
  content: string;
  stance: Stance;
  timestamp: number;
  userSources: string[]; // URLs provided by the user
  userAttachments?: Attachment[]; // Files uploaded by the user
  aiAnalysis?: AIAnalysis;
  isLoadingAI?: boolean;
  replies?: Comment[];
  likes?: number;
  likedByMe?: boolean;
  originalCommentId?: string; // If this argument started as a rebuttal, this links to the original parent comment ID
  isEdited?: boolean;
  linkedContentId?: string; // ID used to sync content between a rebuttal and its main-argument copy
  isAiGenerated?: boolean; // Indicates if AI tools (Enhancer/Sources) were used
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: number;
  tags?: string[];
  stats: {
    for: number;
    against: number;
    neutral: number;
  };
  
  // New Fields
  type: DebateType;
  format?: DebateFormat;
  closesAt?: number; // timestamp for when Timed debate ends
  privacy: PrivacyStatus;
  accessPassword?: string; // Only for PRIVATE
  isAgeRestricted: boolean; // 18+ check
  areAiToolsEnabled?: boolean; // Controls availability of Enhancer/Suggestions for participants

  // Mocking participant management
  participants?: Participant[];
  isEdited?: boolean;
  trendingScore?: number; // Represents activity, clicks, and search volume in last 24h

  // Optional author profile fields surfaced on the magazine-grid lead card byline.
  // Soft client-side metadata; not authoritative — when a real backend lands, swap to live profile lookup.
  authorOccupation?: string;
  authorVerified?: boolean;
}

export interface ResearchItem {
  title: string;
  snippet: string;
  uri: string;
  sourceName?: string;
}

export interface TopicResearchData {
  for: ResearchItem[];
  neutral: ResearchItem[];
  against: ResearchItem[];
}

// Research tab — source categorization & aggregation (chunk #5).
// Categories are properties of the source itself (its publisher), NOT of an
// argument's stance. Sources are not partisan; arguments are.
export type SourceCategory = 'NEWS' | 'ACADEMIC' | 'GOVERNMENT' | 'THINK_TANK' | 'OP_ED';
export type CredibilityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AggregatedSource {
  uri: string;
  hostname: string;
  title?: string;
  excerpt?: string;
  author?: string;
  publishedAt?: number;
  category: SourceCategory;
  credibility: CredibilityLevel;
  citedByCount: number;
  citedBy: string[];           // comment IDs
  addedBy?: string;            // first commenter who added it (display name)
  addedByVerified?: boolean;
  firstCitedAt?: number;
  isFromAI: boolean;           // surfaced by AI synthesis grounding
  isFromCitation: boolean;     // referenced by at least one comment
}

export interface ResearchSynthesis {
  agree: string;
  disagree: string;
  underexplored: string;
  agreementPct: number;
  disagreementPct: number;
  underexploredPct: number;
  agreeAcademicSupportPct?: number;
  underexploredSourceCount?: number;
  confidence: 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';
}

// Reporting Types
export type ReportTargetType = 'TOPIC' | 'ARGUMENT' | 'REBUTTAL' | 'USER';

export interface ReportData {
    targetId: string;
    targetType: ReportTargetType;
    targetContent?: string; // Preview of what is being reported
}

// Notifications
export interface Notification {
    id: string;
    type: 'REPLY' | 'LIKE' | 'SYSTEM' | 'MENTION';
    message: string;
    timestamp: number;
    read: boolean;
    targetId?: string; // Link to topic or comment
}
