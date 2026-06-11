
import React, { useState, useEffect, useRef } from 'react';
import { TopicList } from './components/TopicList';
import { DebateView } from './components/DebateView';
import { ArgumentDetail } from './components/ArgumentDetail';
import { CreateTopicModal } from './components/CreateTopicModal';
import { ManageParticipantsModal } from './components/ManageParticipantsModal';
import { NotificationSidebar } from './components/NotificationSidebar';
import { AccountSidebar } from './components/AccountSidebar';
import { TopAppBar } from './components/TopAppBar';
import { DiscoverRail } from './components/home/DiscoverRail';
import { MagazineGrid } from './components/home/MagazineGrid';
import { MobileTabBar } from './components/ui';
import { Topic, Comment, Stance, FactRating, DebateType, PrivacyStatus, UserRole, Notification, UserProfile, ResearchSynthesis } from './types';
import { IconSearch, IconBell, IconUser, IconSparkles, IconChevronRight, IconClose, IconStar, IconArrowLeft, IconAdd, IconHome } from './components/Icons';
import { Toast } from './components/Toast';
import { searchDebates, checkProxyHealth } from './services/ai';

// Helper to calculate stats matching DebateView logic (Top-level only, filtered by rating)
const calculateTopicStats = (comments: Comment[]) => {
  const validComments = comments.filter(c => 
    c.aiAnalysis?.rating !== FactRating.UNRELATED && 
    c.aiAnalysis?.rating !== FactRating.NEUTRAL
  );

  return {
    for: validComments.filter(c => c.stance === Stance.FOR).length,
    against: validComments.filter(c => c.stance === Stance.AGAINST).length,
    neutral: validComments.filter(c => c.stance === Stance.NEUTRAL).length
  };
};

// Tag Descriptions and Categories
const TAG_INFO: Record<string, { description: string; category: string }> = {
    'Economics': { description: 'Discussions on production, consumption, wealth transfer, and market forces.', category: 'Social Science' },
    'Policy': { description: 'Debates regarding laws, regulations, and government actions.', category: 'Government' },
    'Future of Work': { description: 'Exploring automation, AI, gig economy, and the evolution of careers.', category: 'Society' },
    'Work': { description: 'Labor rights, workplace culture, and professional development.', category: 'Business' },
    'Rights': { description: 'Civil liberties, human rights, and legal entitlements.', category: 'Law' },
    'Lifestyle': { description: 'Choices regarding daily life, health, habits, and personal values.', category: 'Culture' },
    'Energy': { description: 'Sustainability, power generation, and resource management.', category: 'Technology' },
    'Climate': { description: 'Environmental impact, global warming, and ecological preservation.', category: 'Environment' },
    'Science': { description: 'Systematic study of the structure and behavior of the physical world.', category: 'Academia' },
};

// Mock Data
const MOCK_COMMENTS: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      topicId: '1',
      author: 'TechOptimist',
      userTitle: 'Future Economist',
      isUserVerified: true,
      content: 'Automation will displace millions of manufacturing and transport jobs within the next decade. UBI provides a safety net that retraining programs cannot match in speed.',
      stance: Stance.FOR,
      timestamp: Date.now() - 86400000,
      userSources: [],
      likes: 45,
      likedByMe: false,
      aiAnalysis: {
        rating: FactRating.TRUE,
        ratingLabel: 'True',
        detectedStance: 'FOR',
        reasoning: 'Economic studies and AI projections consistently indicate significant workforce disruption in manufacturing and transport sectors due to automation.',
        groundingSources: [{ title: 'McKinsey Report on Automation', uri: 'https://www.mckinsey.com/featured-insights/future-of-work/jobs-lost-jobs-gained-what-the-future-of-work-will-mean-for-jobs-skills-and-wages' }]
      },
      replies: [
        {
          id: 'r1',
          topicId: '1',
          author: 'SkepticDan',
          userTitle: 'Historian',
          isUserVerified: false,
          content: 'While automation is real, new jobs have historically been created to replace old ones. The transition might be painful, but total displacement is a strong claim.',
          stance: Stance.AGAINST,
          timestamp: Date.now() - 86000000,
          userSources: [],
          likes: 12,
          likedByMe: false,
          aiAnalysis: {
            rating: FactRating.SOMEWHAT_TRUE,
            ratingLabel: 'Somewhat True',
            detectedStance: 'AGAINST',
            reasoning: 'Historical industrial revolutions have created more jobs than they destroyed, though the AI revolution may have different dynamics due to cognitive automation.',
            groundingSources: [{ title: 'Technological unemployment', uri: 'https://en.wikipedia.org/wiki/Technological_unemployment' }]
          }
        }
      ]
    },
    {
      id: 'c2',
      topicId: '1',
      author: 'FiscalHawk',
      userTitle: 'Financial Analyst',
      isUserVerified: true,
      content: 'UBI would cause hyperinflation. If everyone has more money, prices just go up to match, leaving the poor in the same position but with devalued currency.',
      stance: Stance.AGAINST,
      timestamp: Date.now() - 80000000,
      userSources: [],
      likes: 89,
      likedByMe: false,
      aiAnalysis: {
        rating: FactRating.MISLEADING,
        ratingLabel: 'Misleading',
        detectedStance: 'AGAINST',
        reasoning: 'While inflation is a risk, hyperinflation typically results from massive supply shocks or currency debasement, not necessarily wealth redistribution. Moderate UBI experiments have not shown hyperinflation.',
        groundingSources: [{ title: 'Stanford Basic Income Lab', uri: 'https://basicincome.stanford.edu/' }]
      }
    },
    {
        id: 'c3',
        topicId: '1',
        author: 'CentristObserver',
        userTitle: 'Data Scientist',
        content: 'We need more data from long-term pilot programs before implementing this nationwide. Current experiments are too short-term.',
        stance: Stance.NEUTRAL,
        timestamp: Date.now() - 75000000,
        userSources: [],
        likes: 24,
        likedByMe: false,
        aiAnalysis: {
          rating: FactRating.SOMEWHAT_TRUE,
          ratingLabel: 'Somewhat True',
          detectedStance: 'NEUTRAL',
          reasoning: 'Most UBI pilots have been limited in duration (1-2 years) and sample size, making it difficult to predict long-term macroeconomic effects on a national scale.',
          groundingSources: [{ title: 'Overview of UBI Pilots', uri: 'https://www.investopedia.com/terms/b/basic-income.asp' }]
        }
    },
    {
      id: 'c4',
      topicId: '1',
      author: 'RandomUser123',
      content: 'Check out this cool video of a cat playing piano!',
      stance: Stance.NEUTRAL,
      timestamp: Date.now() - 60000000,
      userSources: [],
      likes: 2,
      likedByMe: false,
      aiAnalysis: {
        rating: FactRating.UNRELATED,
        ratingLabel: 'Unrelated',
        detectedStance: 'NEUTRAL',
        reasoning: 'This comment discusses a cat video, which is unrelated to the economic and social discussion of Universal Basic Income.',
        groundingSources: []
      }
    }
  ]
};

const MOCK_TOPICS: Topic[] = [
  {
    id: '1',
    title: 'Universal Basic Income (UBI) is necessary for the future economy',
    description: 'With the rise of automation and AI, traditional jobs are disappearing. UBI proposes a fixed income for every citizen regardless of status. Trials in Finland, Stockton CA, and Kenya show diverging outcomes.',
    author: 'future_economist',
    createdAt: Date.now() - 100000000,
    tags: ['Economics', 'Automation', 'Policy'],
    stats: calculateTopicStats(MOCK_COMMENTS['1'] || []),
    type: DebateType.OPEN,
    format: 'CHAT',
    privacy: PrivacyStatus.PUBLIC,
    isAgeRestricted: false,
    areAiToolsEnabled: true,
    trendingScore: 980,
    authorOccupation: 'Economist',
    authorVerified: false,
  },
  {
    id: '2',
    title: 'Remote work should be a legal right for office workers',
    description: 'After the pandemic, productivity in many sectors increased. Forcing return to office is unnecessary and harmful to work-life balance.',
    author: 'digital_nomad',
    createdAt: Date.now() - 50000000,
    tags: ['Work', 'Rights', 'Lifestyle'],
    stats: { for: 450, against: 32, neutral: 5 },
    type: DebateType.TIMED,
    format: 'CHAT',
    closesAt: Date.now() + 86400000 * 5,
    privacy: PrivacyStatus.PUBLIC,
    isAgeRestricted: true,
    areAiToolsEnabled: true,
    trendingScore: 920,
  },
  {
    id: '3',
    title: 'Nuclear energy is the only viable path to net-zero',
    description: 'Solar and wind are intermittent. To support the baseload power required by modern civilization without carbon, we need nuclear.',
    author: 'atom_eve',
    createdAt: Date.now() - 20000000,
    tags: ['Energy', 'Climate', 'Science'],
    stats: { for: 289, against: 312, neutral: 45 },
    type: DebateType.OPEN,
    format: 'CHAT',
    privacy: PrivacyStatus.PUBLIC,
    isAgeRestricted: false,
    areAiToolsEnabled: true,
    trendingScore: 420,
  },
  {
    id: '4',
    title: 'Should governments regulate frontier AI development?',
    description: 'A debate on whether the existential-risk framing justifies treating frontier AI labs as critical infrastructure subject to licensure, inspection, and capability disclosure. Includes economists, AI safety researchers, and policy scholars.',
    author: 'sarah_chen',
    createdAt: Date.now() - 86400000 * 1,
    tags: ['AI Policy', 'Regulation', 'Existential Risk'],
    stats: { for: 847, against: 412, neutral: 138 },
    type: DebateType.TIMED,
    format: 'CHAT',
    closesAt: Date.now() + 86400000 * 2 + 1000 * 60 * 60 * 4,
    privacy: PrivacyStatus.PUBLIC,
    isAgeRestricted: false,
    areAiToolsEnabled: true,
    trendingScore: 1480,
    authorOccupation: 'Economist',
    authorVerified: true,
  },
  {
    id: '5',
    title: 'Are private space companies a net-positive for public science?',
    description: 'Falcon-9 reuse cut launch costs 17×, but agency budgets and basic-research priorities have been quietly displaced.',
    author: 'orbital_dan',
    createdAt: Date.now() - 90000000,
    tags: ['Space', 'Science Policy', 'Industry'],
    stats: { for: 438, against: 356, neutral: 64 },
    type: DebateType.OPEN,
    format: 'CHAT',
    privacy: PrivacyStatus.PUBLIC,
    isAgeRestricted: true,
    areAiToolsEnabled: true,
    trendingScore: 720,
  },
  {
    id: '6',
    title: 'Should social media platforms be liable for misinformation they amplify?',
    description: 'Section 230 reform proposals have re-emerged with bipartisan support, but the carve-outs differ on algorithmic amplification.',
    author: 'mira_amari',
    createdAt: Date.now() - 110000000,
    tags: ['Tech Policy', 'Free Speech', 'Section 230'],
    stats: { for: 523, against: 478, neutral: 91 },
    type: DebateType.TIMED,
    format: 'CHAT',
    closesAt: Date.now() + 86400000 * 3,
    privacy: PrivacyStatus.PUBLIC,
    isAgeRestricted: false,
    areAiToolsEnabled: true,
    trendingScore: 645,
  },
  {
    id: '7',
    title: 'Has remote work permanently changed urban economies?',
    description: 'Office vacancy in San Francisco hit 36.5% in Q1 2026, while suburban municipalities report a 14% rise in retail receipts.',
    author: 'urban_planner',
    createdAt: Date.now() - 240000000,
    tags: ['Urban Policy', 'Labor', 'Real Estate'],
    stats: { for: 389, against: 271, neutral: 52 },
    type: DebateType.TIMED,
    format: 'CHAT',
    closesAt: Date.now() - 86400000 * 2,
    privacy: PrivacyStatus.PUBLIC,
    isAgeRestricted: false,
    areAiToolsEnabled: true,
    trendingScore: 540,
  },
];

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        type: 'REPLY',
        message: 'SkepticDan replied to your argument in "Universal Basic Income..."',
        timestamp: Date.now() - 120000, // 2 mins ago
        read: false,
        targetId: 'c1'
    },
    {
        id: 'n2',
        type: 'LIKE',
        message: '12 people liked your argument about Automation.',
        timestamp: Date.now() - 3600000, // 1 hour ago
        read: false,
        targetId: 'c1'
    },
    {
        id: 'n3',
        type: 'SYSTEM',
        message: 'The debate "Remote work should be a legal right..." is closing soon.',
        timestamp: Date.now() - 86400000, // 1 day ago
        read: true,
        targetId: '2'
    }
];

// Helper function to sync linked comments
const syncLinkedComments = (
  topicId: string, 
  sourceComment: Comment, 
  currentComments: Record<string, Comment[]>
): Record<string, Comment[]> => {
  if (!sourceComment.linkedContentId) return currentComments;

  const topicComments = [...(currentComments[topicId] || [])];
  
  const syncFields = (target: Comment, source: Comment): Comment => ({
      ...target,
      content: source.content,
      stance: source.stance,
      aiAnalysis: source.aiAnalysis,
      isEdited: source.isEdited,
      userSources: source.userSources,
      userAttachments: source.userAttachments
  });

  const newComments = topicComments.map(c => {
      let newC = c;
      
      // Check if this main comment is the linked one (but not the source itself)
      if (c.linkedContentId === sourceComment.linkedContentId && c.id !== sourceComment.id) {
          newC = syncFields(c, sourceComment);
      }
      
      // Check replies within this comment
      if (newC.replies) {
          const newReplies = newC.replies.map(r => {
              if (r.linkedContentId === sourceComment.linkedContentId && r.id !== sourceComment.id) {
                  return syncFields(r, sourceComment);
              }
              return r;
          });
          // Only update replies reference if changed (optimization optional but good practice)
          newC = { ...newC, replies: newReplies };
      }
      return newC;
  });

  return {
      ...currentComments,
      [topicId]: newComments
  };
};

const App: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [topics, setTopics] = useState<Topic[]>(MOCK_TOPICS);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [consensusByTopic, setConsensusByTopic] = useState<Record<string, { text: string; generatedAt: number }>>({});
  const [researchSynthesisByTopic, setResearchSynthesisByTopic] = useState<Record<string, { synthesis: ResearchSynthesis; generatedAt: number }>>({});
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<{ exactMatch?: Topic, similarMatches: Topic[] }>({ similarMatches: [] });
  const [isAiSearching, setIsAiSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // View Filter State (string type to support sub-views)
  const [viewFilter, setViewFilter] = useState<string>('TRENDING');
  
  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: 'Alex',
    lastName: 'Johnson',
    username: 'alex_j',
    email: 'alex.johnson@example.com',
    isPremium: true,
    dob: '1995-05-15',
    occupation: 'Debate Enthusiast',
    isOccupationVisible: false,
    isOccupationVerified: false,
    isVerificationPending: false,
    // Initialize without a last update date so it's editable, or set it if mocking existing user state
    dobLastUpdated: undefined, 
  });

  // Initialize starredTopics with topics created by the user ('You')
  const [starredTopics, setStarredTopics] = useState<Set<string>>(() => {
    const initialStarred = new Set<string>();
    MOCK_TOPICS.forEach(topic => {
      if (topic.author === 'You') {
        initialStarred.add(topic.id);
      }
    });
    return initialStarred;
  });

  const [notification, setNotification] = useState<{message: string, type: 'info' | 'success'} | null>(null);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [isManagingDebate, setIsManagingDebate] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);

  // Account Sidebar State
  const [isAccountSidebarOpen, setIsAccountSidebarOpen] = useState(false);

  // Mock User Info
  // In a real app, this would come from Auth Context
  const [userAge, setUserAge] = useState<number>(25); // Default > 18
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(true);

  // AI backend availability — fact-checking, research, and search degrade
  // gracefully when the proxy is down, but first-run users should know why.
  const [isAiOffline, setIsAiOffline] = useState(false);
  const [isAiOfflineBannerDismissed, setIsAiOfflineBannerDismissed] = useState(false);

  useEffect(() => {
    checkProxyHealth().then((ok) => setIsAiOffline(!ok));
  }, []);

  // Calculate closure status for active topic
  const isDebateClosed = activeTopic?.type === DebateType.TIMED && activeTopic.closesAt && Date.now() > activeTopic.closesAt;

  // Cleanup old read notifications (Older than 60 days)
  useEffect(() => {
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    setNotifications(prev => prev.filter(n => {
        // Keep unread notifications indefinitely (or until policy changes)
        if (!n.read) return true;
        
        // Remove read notifications older than 60 days
        const age = now - n.timestamp;
        return age < SIXTY_DAYS_MS;
    }));
  }, []);

  // Check for expired verification on mount
  useEffect(() => {
      if (userProfile.isOccupationVerified && userProfile.verificationDate) {
          const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
          if (Date.now() - userProfile.verificationDate > ONE_YEAR_MS) {
              setUserProfile(prev => ({ 
                  ...prev, 
                  isOccupationVerified: false, 
                  verificationDate: undefined 
              }));
              setNotification({ message: 'Your occupation verification has expired. Please verify again.', type: 'info' });
          }
      }
  }, [userProfile.isOccupationVerified, userProfile.verificationDate]);

  // AI Search Debounce Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (searchQuery.trim().length > 2) {
            setIsAiSearching(true);
            setIsSearchDropdownOpen(true);
            try {
                const simplifiedTopics = topics.map(t => ({ id: t.id, title: t.title, description: t.description, tags: t.tags }));
                const { exactMatchId, similarMatchIds } = await searchDebates(searchQuery, simplifiedTopics);
                
                const exactMatch = topics.find(t => t.id === exactMatchId);
                const similarMatches = topics.filter(t => similarMatchIds.includes(t.id) && t.id !== exactMatchId);
                
                setAiSearchResults({ exactMatch, similarMatches });
            } catch (e) {
                console.error(e);
            } finally {
                setIsAiSearching(false);
            }
        } else {
            setIsSearchDropdownOpen(false);
            setAiSearchResults({ similarMatches: [] });
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, topics]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredTopics = topics.filter(topic => {
    // 1. Filter by View Mode
    if (viewFilter === 'MY_DEBATES') {
        if (topic.author !== 'You') return false;
    }
    if (viewFilter === 'SAVED') {
        if (!starredTopics.has(topic.id)) return false;
    }

    if (!appliedSearchQuery) return true;
    const query = appliedSearchQuery.toLowerCase();
    
    // Check Title
    if (topic.title.toLowerCase().includes(query)) return true;
    
    // Check ID
    if (topic.id.toLowerCase().includes(query)) return true;
    
    // Check Tags
    if (topic.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
    
    return false;
  }).sort((a, b) => {
      // 2. Sort by Trending Score if in Trending View
      if (viewFilter === 'TRENDING' || viewFilter === 'TRENDING_OPEN' || viewFilter === 'TRENDING_TIMED') {
          return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return 0; // Maintain default order or sort by date if needed
  });

  const handleTopicSelect = (topic: Topic) => {
    // Close search dropdown if open
    setIsSearchDropdownOpen(false);
    
    // Increment Click/View Analytics Simulation
    const updatedTopic = { ...topic, trendingScore: (topic.trendingScore || 0) + 1 };
    setTopics(prev => prev.map(t => t.id === topic.id ? updatedTopic : t));
    
    // Age Check
    if (topic.isAgeRestricted) {
        if (!isUserLoggedIn) {
            const ageInput = prompt("This debate is restricted to 18+. Please enter your age to verify:");
            if (!ageInput || parseInt(ageInput) < 18) {
                alert("You must be 18 or older to view this content.");
                return;
            }
            setUserAge(parseInt(ageInput));
            setIsUserLoggedIn(true);
        } else if (userAge < 18) {
            alert("You must be 18 or older to view this content.");
            return;
        }
    }

    // Private Access Check
    if (topic.privacy === PrivacyStatus.PRIVATE) {
        // Check if user is blocked (Mock)
        if (topic.participants?.find(p => p.id === 'You' && p.isBlocked)) {
             alert("You have been blocked from accessing this debate.");
             return;
        }
        
        // Check password (unless author)
        if (topic.author !== 'You') {
            const pwd = prompt(`Enter access password for "${topic.title}":`);
            if (pwd !== topic.accessPassword) {
                alert("Incorrect password.");
                return;
            }
        }
    }

    setActiveTopic(updatedTopic);
  };

  const handleCreateTopic = (newTopicData: Partial<Topic>) => {
      const newTopic: Topic = {
          id: Math.random().toString(36).substr(2, 9),
          title: newTopicData.title!,
          description: newTopicData.description!,
          author: 'You',
          createdAt: Date.now(),
          tags: newTopicData.tags || [],
          stats: { for: 0, against: 0, neutral: 0 },
          type: newTopicData.type || DebateType.OPEN,
          format: newTopicData.format || 'CHAT',
          closesAt: newTopicData.closesAt,
          privacy: newTopicData.privacy || PrivacyStatus.PUBLIC,
          accessPassword: newTopicData.accessPassword,
          isAgeRestricted: newTopicData.isAgeRestricted || false,
          areAiToolsEnabled: newTopicData.areAiToolsEnabled ?? true,
          participants: [
              { id: 'You', name: 'You', role: UserRole.CONTRIBUTOR, isBlocked: false },
              // Mock other participants for the Management UI to show something
              { id: 'user_123', name: 'MockUser', role: UserRole.SPECTATOR, isBlocked: false }
          ],
          trendingScore: 0
      };

      setTopics([newTopic, ...topics]);
      setActiveTopic(newTopic);
      
      // Auto-star user's own topics
      setStarredTopics(prev => new Set(prev).add(newTopic.id));
      
      setNotification({ message: "Debate created successfully!", type: 'success' });
  };

  const handleUpdateTopic = (updates: Partial<Topic>) => {
      if (!activeTopic) return;
      const updatedTopic = { ...activeTopic, ...updates };
      setActiveTopic(updatedTopic);
      setTopics(topics.map(t => t.id === activeTopic.id ? updatedTopic : t));
      setNotification({ message: "Debate updated successfully", type: 'success' });
  };

  // Participant Management (Mock implementation)
  const handleUpdateParticipant = (id: string, role: UserRole) => {
      if (!activeTopic) return;
      
      const updatedParticipants = activeTopic.participants?.map(p => 
          p.id === id ? { ...p, role } : p
      ) || [];
      
      const updatedTopic = { ...activeTopic, participants: updatedParticipants };
      
      setActiveTopic(updatedTopic);
      setTopics(topics.map(t => t.id === activeTopic.id ? updatedTopic : t));
  };

  const handleBlockUser = (id: string) => {
      if (!activeTopic) return;
      const updatedParticipants = activeTopic.participants?.map(p => 
        p.id === id ? { ...p, isBlocked: true } : p
      ) || [];
      
      const updatedTopic = { ...activeTopic, participants: updatedParticipants };
      setActiveTopic(updatedTopic);
      setTopics(topics.map(t => t.id === activeTopic.id ? updatedTopic : t));
  };

  const handleUnblockUser = (id: string) => {
      if (!activeTopic) return;
      const updatedParticipants = activeTopic.participants?.map(p => 
        p.id === id ? { ...p, isBlocked: false } : p
      ) || [];
      
      const updatedTopic = { ...activeTopic, participants: updatedParticipants };
      setActiveTopic(updatedTopic);
      setTopics(topics.map(t => t.id === activeTopic.id ? updatedTopic : t));
  };

  const handleRemoveParticipant = (id: string) => {
      if (!activeTopic) return;
      // Remove from participants list entirely (Kick)
      const updatedParticipants = activeTopic.participants?.filter(p => p.id !== id) || [];
      
      const updatedTopic = { ...activeTopic, participants: updatedParticipants };
      setActiveTopic(updatedTopic);
      setTopics(topics.map(t => t.id === activeTopic.id ? updatedTopic : t));
  };

  const handleBack = () => {
    setActiveTopic(null);
  };

  const toggleStar = (topicId: string) => {
    setStarredTopics(prev => {
        const newSet = new Set(prev);
        if (newSet.has(topicId)) {
            newSet.delete(topicId);
             setNotification({ message: "Notifications disabled for this debate.", type: 'info' });
        } else {
            newSet.add(topicId);
            setNotification({ message: "You are now following this debate and will be notified of new meaningful interactions.", type: 'success' });
        }
        return newSet;
    });
  };

  const isValidRating = (rating: FactRating | undefined): boolean =>
    rating !== undefined && rating !== FactRating.UNRELATED && rating !== FactRating.NEUTRAL;

  const handleAddComment = (comment: Comment) => {
    if (!activeTopic) return;

    const prevTopicComments = comments[activeTopic.id] || [];
    const prevComment = prevTopicComments.find(c => c.id === comment.id);
    const isFirstAdd = !prevComment;

    // Enrich a brand-new "You" comment with profile metadata
    if (isFirstAdd && comment.author === 'You') {
        comment.isUserVerified = userProfile.isOccupationVerified;
        if (userProfile.isOccupationVisible) {
            comment.userTitle = userProfile.occupation;
        }
    }

    setComments(prev => {
      const topicComments = prev[activeTopic.id] || [];
      const index = topicComments.findIndex(c => c.id === comment.id);

      let newTopicComments;
      if (index !== -1) {
        newTopicComments = [...topicComments];
        newTopicComments[index] = comment;
      } else {
        newTopicComments = [...topicComments, comment];
      }

      let newState = {
        ...prev,
        [activeTopic.id]: newTopicComments
      };

      if (index !== -1 && comment.linkedContentId) {
          newState = syncLinkedComments(activeTopic.id, comment, newState);
      }

      return newState;
    });

    // Three-phase stats delta
    const prevValid = isValidRating(prevComment?.aiAnalysis?.rating);
    const nextValid = isValidRating(comment.aiAnalysis?.rating);

    const bumpStance = (stats: Topic['stats'], stance: Stance, delta: number) => {
        if (stance === Stance.FOR) stats.for = Math.max(0, stats.for + delta);
        else if (stance === Stance.AGAINST) stats.against = Math.max(0, stats.against + delta);
        else stats.neutral = Math.max(0, stats.neutral + delta);
    };

    let statsChanged = false;
    let scoreBump = 0;

    if (!prevValid && nextValid) {
        statsChanged = true;
        scoreBump = 5;
    } else if (prevValid && !nextValid) {
        statsChanged = true;
    } else if (prevValid && nextValid && prevComment && prevComment.stance !== comment.stance) {
        statsChanged = true;
    }

    if (statsChanged) {
        setTopics(prevTopics => prevTopics.map(t => {
            if (t.id !== activeTopic.id) return t;
            const newStats = { ...t.stats };
            if (prevValid && prevComment) bumpStance(newStats, prevComment.stance, -1);
            if (nextValid) bumpStance(newStats, comment.stance, +1);
            return { ...t, stats: newStats, trendingScore: (t.trendingScore || 0) + scoreBump };
        }));
    }

    // Notify only when verification first resolves significantly on a starred topic
    if (!prevValid && nextValid && starredTopics.has(activeTopic.id)) {
        setTimeout(() => {
            setNotification({
                message: `New argument posted in: ${activeTopic.title}`,
                type: 'info'
            });
        }, 1500);
    }
  };

  const handleSetConsensus = (topicId: string, text: string) => {
    setConsensusByTopic(prev => ({
        ...prev,
        [topicId]: { text, generatedAt: Date.now() }
    }));
  };

  const handleSetResearchSynthesis = (topicId: string, synthesis: ResearchSynthesis) => {
    setResearchSynthesisByTopic(prev => ({
      ...prev,
      [topicId]: { synthesis, generatedAt: Date.now() }
    }));
  };

  const handleSwitchCommentStance = (commentId: string, newStance: Stance) => {
    if (!activeTopic) return;
    const topicComments = comments[activeTopic.id] || [];
    const target = topicComments.find(c => c.id === commentId);
    if (!target || target.stance === newStance) return;
    handleAddComment({ ...target, stance: newStance });
  };

  const handleLikeComment = (commentId: string) => {
    if (!activeTopic) return;
    
    setComments(prev => {
      const topicComments = prev[activeTopic.id] || [];
      return {
        ...prev,
        [activeTopic.id]: topicComments.map(c => {
          if (c.id === commentId) {
             const isLiked = c.likedByMe || false;
             // Toggle logic: If liked, remove like. If not liked, add like.
             return { 
                ...c, 
                likes: isLiked ? Math.max((c.likes || 0) - 1, 0) : (c.likes || 0) + 1,
                likedByMe: !isLiked
             };
          }
          return c;
        })
      };
    });
  };

  const handleReply = (parentId: string, reply: Comment) => {
     if (!activeTopic) return;

     // Get parent comment before update to check authorship
     const currentTopicComments = comments[activeTopic.id] || [];
     const parentComment = currentTopicComments.find(c => c.id === parentId);
     
     // Enhance reply with user profile verification status if authored by user
     if (reply.author === 'You') {
         reply.isUserVerified = userProfile.isOccupationVerified;
         if (userProfile.isOccupationVisible) {
             reply.userTitle = userProfile.occupation;
         }
     }

     setComments(prev => {
       const topicComments = prev[activeTopic.id] || [];
       let replyUpdated = false;

       const updatedComments = topicComments.map(c => {
         if (c.id === parentId) {
           const existingReplies = c.replies || [];
           const existingIndex = existingReplies.findIndex(r => r.id === reply.id);
           let newReplies;
           if (existingIndex >= 0) {
             newReplies = [...existingReplies];
             newReplies[existingIndex] = reply;
             replyUpdated = true;
           } else {
             newReplies = [...existingReplies, reply];
           }
           
           return {
             ...c,
             replies: newReplies
           };
         }
         return c;
       });

       let newState = {
         ...prev,
         [activeTopic.id]: updatedComments
       };

       // If it was an update and has a link, sync it
       if (replyUpdated && reply.linkedContentId) {
           newState = syncLinkedComments(activeTopic.id, reply, newState);
       }

       return newState;
     });

     // Notification Logic for Starred Topics on Reply (General Interest)
    if (starredTopics.has(activeTopic.id)) {
        // Filter out Unrelated and Opinion/Neutral arguments
        const rating = reply.aiAnalysis?.rating;
        const isSignificant = rating !== undefined && rating !== FactRating.UNRELATED && rating !== FactRating.NEUTRAL;

        if (isSignificant) {
            setTimeout(() => {
                setNotification({ 
                    message: `New reply posted in: ${activeTopic.title}`, 
                    type: 'info' 
                });
            }, 1500);
        }
    }

    // New Notification Logic: Notify user when someone replies to their argument
    if (parentComment && parentComment.author === 'You' && reply.author !== 'You') {
        const newNotification: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'REPLY',
            message: `${reply.author} replied to your argument: "${parentComment.content.length > 30 ? parentComment.content.substring(0, 30) + '...' : parentComment.content}"`,
            timestamp: Date.now(),
            read: false,
            targetId: parentComment.id
        };
        setNotifications(prev => [newNotification, ...prev]);
        
        // Immediate Toast for visibility
        setNotification({ 
            message: `New reply from ${reply.author}`, 
            type: 'info' 
        });
    }

     // Update selected comment view as well
     if (selectedComment && selectedComment.id === parentId) {
        setSelectedComment(prev => {
          if (!prev) return null;
          const existingReplies = prev.replies || [];
          const existingIndex = existingReplies.findIndex(r => r.id === reply.id);
          let newReplies;
          if (existingIndex >= 0) {
             newReplies = [...existingReplies];
             newReplies[existingIndex] = reply;
          } else {
             newReplies = [...existingReplies, reply];
          }
          return {
            ...prev,
            replies: newReplies
          };
        });
     }
  };

  // Determine current user role
  const currentUserRole = activeTopic?.participants?.find(p => p.id === 'You')?.role || UserRole.CONTRIBUTOR;
  const canParticipate = currentUserRole !== UserRole.SPECTATOR;

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    let finalProfile = { ...updatedProfile };
    
    // Check if occupation has changed (and isn't just an update from 'unverified' to 'verified')
    // We only reset verification if the occupation TEXT changed
    if (finalProfile.occupation !== userProfile.occupation) {
        finalProfile.isOccupationVerified = false;
        finalProfile.isVerificationPending = false;
        finalProfile.verificationDate = undefined;
    }

    // Check if DOB has changed to update last update timestamp
    if (finalProfile.dob !== userProfile.dob) {
        finalProfile.dobLastUpdated = Date.now();
    } else {
        // Keep previous timestamp if DOB hasn't changed
        finalProfile.dobLastUpdated = userProfile.dobLastUpdated;
    }

    setUserProfile(finalProfile);

    // Propagate profile changes to existing comments by 'You'
    // Specifically updating occupation title visibility
    const newTitle = finalProfile.isOccupationVisible ? finalProfile.occupation : undefined;
    
    setComments(prev => {
        const nextComments = { ...prev };
        Object.keys(nextComments).forEach(topicId => {
            nextComments[topicId] = nextComments[topicId].map(c => {
                let updatedC = c;
                
                // Update main comment if author is You
                if (c.author === 'You') {
                    updatedC = { 
                        ...c, 
                        userTitle: newTitle, 
                        isUserVerified: finalProfile.isOccupationVerified 
                    };
                }

                // Update replies if any
                if (updatedC.replies) {
                    const updatedReplies = updatedC.replies.map(r => {
                        if (r.author === 'You') {
                            return { 
                                ...r, 
                                userTitle: newTitle, 
                                isUserVerified: finalProfile.isOccupationVerified 
                            };
                        }
                        return r;
                    });
                    updatedC = { ...updatedC, replies: updatedReplies };
                }
                
                return updatedC;
            });
        });
        return nextComments;
    });

    setNotification({ message: 'Profile updated successfully!', type: 'success' });
  };

  const handleLogout = () => {
    setIsUserLoggedIn(false);
    setIsAccountSidebarOpen(false);
    setActiveTopic(null); // Return to home
    setNotification({ message: 'Logged out successfully.', type: 'info' });
  };

  const handleUpgradeToPlus = () => {
    setUserProfile(prev => ({ ...prev, isPremium: true }));
    setNotification({ message: 'Welcome to Verbo+!', type: 'success' });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          setAppliedSearchQuery(searchQuery);
          setIsSearchDropdownOpen(false);
      }
  };

  const handleSeeAllResults = () => {
      setAppliedSearchQuery(searchQuery);
      setIsSearchDropdownOpen(false);
  };

  const handleSwitchView = (newView: string) => {
      setViewFilter(newView);
      window.scrollTo(0, 0);
  };

  // Logic to get unique tags for Explore view
  const allTags: string[] = Array.from(new Set(topics.flatMap(t => t.tags || [])));
  
  // Logic to calculate trending tags with specific criteria
  const getTrendingTagsWithScore = () => {
    const scores: Record<string, { score: number; count: number }> = {};
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    topics.forEach(t => {
      t.tags?.forEach(tag => {
        if (!scores[tag]) scores[tag] = { score: 0, count: 0 };
        
        // Base score from topic trending score (simulates activity)
        scores[tag].score += (t.trendingScore || 0);
        scores[tag].count += 1;

        // Bonus for "New" topics (last 24 hours)
        // Score boost is significant to reflect the "used in New debates" requirement
        if (now - t.createdAt < ONE_DAY) {
             scores[tag].score += 500; 
        }
      });
    });

    // Mock "search/click" data by adding some random variance if score exists
    // In a real app, this would come from an analytics backend
    Object.keys(scores).forEach(tag => {
        scores[tag].score += Math.floor(Math.random() * 50); 
    });

    // Sort by score and return array
    return Object.entries(scores)
      .map(([tag, data]) => ({ tag, ...data }))
      .sort((a, b) => b.score - a.score);
  };
  
  const trendingTagsList = getTrendingTagsWithScore();

  // Logic to get topics for trending views
  const sortedTopics = [...topics].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
  const trendingOpenTopics = sortedTopics.filter(t => t.type === DebateType.OPEN);
  const trendingTimedTopics = sortedTopics.filter(t => t.type === DebateType.TIMED);

  // Magazine-grid lead/standard split for the redesigned home feed.
  const magazineFeaturedTopic = sortedTopics[0];
  const magazineStandardTopics = sortedTopics.slice(1);

  // Check if Explore tab is active (including sub-views)
  const isExploreActive = ['EXPLORE', 'EXPLORE_TAGS', 'EXPLORE_OPEN', 'EXPLORE_TIMED'].includes(viewFilter);
  // Check if Trending tab is active (including sub-views)
  const isTrendingActive = ['TRENDING', 'TRENDING_TAGS', 'TRENDING_OPEN', 'TRENDING_TIMED'].includes(viewFilter);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 relative">
      {isAiOffline && !isAiOfflineBannerDismissed && (
          <div className="flex items-center justify-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800" role="status">
            <span>
              AI features are offline — start the backend server to enable fact-checking and research (see README).
            </span>
            <button
              onClick={() => setIsAiOfflineBannerDismissed(true)}
              className="p-1 rounded-full hover:bg-amber-100 text-amber-600"
              aria-label="Dismiss AI offline notice"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>
      )}

      {/* Global Notifications */}
      {notification && (
          <Toast 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
      )}

      {isCreatingTopic && (
          <CreateTopicModal 
            onClose={() => setIsCreatingTopic(false)} 
            onCreate={handleCreateTopic}
            isPremium={userProfile.isPremium}
          />
      )}

      {isManagingDebate && activeTopic && (
          <ManageParticipantsModal
             topic={activeTopic}
             onClose={() => setIsManagingDebate(false)}
             onUpdateParticipant={handleUpdateParticipant}
             onBlockUser={handleBlockUser}
             onUnblockUser={handleUnblockUser}
             onRemoveParticipant={handleRemoveParticipant}
             onUpdateTopic={handleUpdateTopic}
          />
      )}

      <NotificationSidebar 
        isOpen={isNotificationSidebarOpen}
        onClose={() => setIsNotificationSidebarOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      <AccountSidebar
        isOpen={isAccountSidebarOpen}
        onClose={() => setIsAccountSidebarOpen(false)}
        user={userProfile}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
        onUpgradeToPlus={handleUpgradeToPlus}
        onManageSubscription={() => alert("Subscription Management Portal coming soon!")}
      />

      {activeTopic ? (
        <DebateView
          topic={activeTopic}
          comments={comments[activeTopic.id] || []}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
          onSelectComment={setSelectedComment}
          onBack={handleBack}
          isStarred={starredTopics.has(activeTopic.id)}
          onToggleStar={() => toggleStar(activeTopic.id)}
          onManageDebate={() => setIsManagingDebate(true)}
          canParticipate={canParticipate}
          onOpenNotifications={() => setIsNotificationSidebarOpen(true)}
          unreadNotificationCount={unreadCount}
          onOpenProfile={() => setIsAccountSidebarOpen(true)}
          consensusCache={consensusByTopic[activeTopic.id]}
          onCacheConsensus={handleSetConsensus}
          synthesisCache={researchSynthesisByTopic[activeTopic.id]}
          onCacheSynthesis={handleSetResearchSynthesis}
          onSwitchStance={handleSwitchCommentStance}
        />
      ) : (
        <div className="max-w-[2400px] mx-auto min-h-screen flex flex-col bg-cream shadow-2xl border-x border-rule">
          <TopAppBar
            userInitials={`${userProfile.firstName[0] ?? ''}${userProfile.lastName[0] ?? ''}`.toUpperCase() || '??'}
            userColorIndex={1}
            userVerified={!!userProfile.isOccupationVerified}
            unreadCount={unreadCount}
            searchQuery={searchQuery}
            onSearchChange={(next) => {
              setSearchQuery(next);
              if (next.length === 0) {
                setAppliedSearchQuery('');
                setIsSearchDropdownOpen(false);
              }
            }}
            onSearchFocus={() => {
              if (searchQuery.length > 2) setIsSearchDropdownOpen(true);
            }}
            onSearchKeyDown={handleSearchKeyDown}
            searchInputRef={searchInputRef}
            searchDropdown={isSearchDropdownOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSearchDropdownOpen(false)}></div>
                <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl border border-slate-200 mt-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {isAiSearching ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-slate-500 text-sm">
                      <IconSparkles className="w-4 h-4 animate-spin text-indigo-500" />
                      Finding relevant debates...
                    </div>
                  ) : (
                    <div className="py-2">
                      {aiSearchResults.exactMatch && (
                        <div className="mb-2">
                          <div className="px-4 py-1 text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                            <IconSparkles className="w-3 h-3" /> Best Match
                          </div>
                          <div
                            onClick={() => handleTopicSelect(aiSearchResults.exactMatch!)}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                          >
                            <h4 className="font-bold text-slate-800 text-sm mb-0.5">{aiSearchResults.exactMatch.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{aiSearchResults.exactMatch.description}</p>
                          </div>
                        </div>
                      )}
                      {aiSearchResults.similarMatches.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1 pt-2">
                            Similar Debates
                          </div>
                          {aiSearchResults.similarMatches.map(topic => (
                            <div
                              key={topic.id}
                              onClick={() => handleTopicSelect(topic)}
                              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <h4 className="font-bold text-slate-700 text-sm mb-0.5">{topic.title}</h4>
                              <div className="flex gap-2">
                                {topic.tags?.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{tag}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {!aiSearchResults.exactMatch && aiSearchResults.similarMatches.length === 0 && searchQuery.length > 2 && (
                        <div className="px-4 py-3 text-sm text-slate-500 italic text-center">
                          No debates found matching "{searchQuery}"
                        </div>
                      )}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleSeeAllResults}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-slate-50 flex items-center justify-between group"
                        >
                          See all results for "{searchQuery}"
                          <IconChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
            onCreateDebate={() => setIsCreatingTopic(true)}
            onOpenNotifications={() => setIsNotificationSidebarOpen(true)}
            onOpenAccount={() => setIsAccountSidebarOpen(true)}
          />

          <main className="flex-1 bg-cream pb-20 md:pb-0">
            {!appliedSearchQuery && viewFilter === 'TRENDING' ? (
              <>
                <DiscoverRail topics={topics} onSelectTopic={handleTopicSelect} />
                <MagazineGrid
                  topics={magazineStandardTopics}
                  featured={magazineFeaturedTopic}
                  onSelectTopic={handleTopicSelect}
                />
              </>
            ) : (
            <div className="p-6">
               <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                   {viewFilter !== 'EXPLORE' && isExploreActive && (
                        <button onClick={() => handleSwitchView('EXPLORE')} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <IconArrowLeft className="w-5 h-5" />
                        </button>
                   )}
                   {viewFilter !== 'TRENDING' && isTrendingActive && (
                        <button onClick={() => handleSwitchView('TRENDING')} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <IconArrowLeft className="w-5 h-5" />
                        </button>
                   )}
                   {appliedSearchQuery ? `Results for "${appliedSearchQuery}"` : 
                    viewFilter === 'MY_DEBATES' ? 'My Debates' :
                    viewFilter === 'SAVED' ? 'Saved Debates' :
                    viewFilter === 'EXPLORE' ? 'Explore Debates' :
                    viewFilter === 'EXPLORE_TAGS' ? 'All Tags' :
                    viewFilter === 'EXPLORE_OPEN' ? 'Open Debates' :
                    viewFilter === 'EXPLORE_TIMED' ? 'Timed-Debates' :
                    viewFilter === 'TRENDING_TAGS' ? 'Trending Tags' :
                    viewFilter === 'TRENDING_OPEN' ? 'Trending Open Debates' :
                    viewFilter === 'TRENDING_TIMED' ? 'Trending Timed-Debates' :
                    'Trending Debates'}
                   {appliedSearchQuery && (
                       <button onClick={() => { setAppliedSearchQuery(''); setSearchQuery(''); }} className="ml-2 text-slate-400 hover:text-slate-600">
                           <IconClose className="w-4 h-4 inline" />
                       </button>
                   )}
               </h2>
               
               {appliedSearchQuery ? (
                   <TopicList topics={filteredTopics} onSelectTopic={handleTopicSelect} />
               ) : (
                   <>
                   {/* EXPLORE VIEWS */}
                   {isExploreActive && (
                       <>
                       {viewFilter === 'EXPLORE_TAGS' && (
                           <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                               <p className="text-slate-500 mb-6 max-w-3xl">
                                   Browse debates by topic tags. Select a tag to see all related debates, arguments, and research.
                               </p>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   {allTags.map(tag => {
                                       const info = TAG_INFO[tag] || { description: 'Debates and discussions related to ' + tag, category: 'General' };
                                       const count = topics.filter(t => t.tags?.includes(tag)).length;
                                       
                                       return (
                                           <button 
                                             key={tag}
                                             onClick={() => {
                                                 setSearchQuery(tag);
                                                 setAppliedSearchQuery(tag);
                                             }}
                                             className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group flex flex-col h-full"
                                           >
                                             <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{info.category}</span>
                                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">{count} Debates</span>
                                             </div>
                                             <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">#{tag}</h3>
                                             <p className="text-sm text-slate-600 mb-4 flex-grow">{info.description}</p>
                                             
                                             <div className="pt-4 border-t border-slate-50 w-full">
                                                <span className="text-xs text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    View Debates <IconChevronRight className="w-3 h-3" />
                                                </span>
                                             </div>
                                           </button>
                                       );
                                   })}
                               </div>
                           </div>
                       )}

                       {viewFilter === 'EXPLORE_OPEN' && (
                           <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                               <TopicList topics={topics.filter(t => t.type === DebateType.OPEN)} onSelectTopic={handleTopicSelect} />
                           </div>
                       )}

                       {viewFilter === 'EXPLORE_TIMED' && (
                           <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                               <TopicList topics={topics.filter(t => t.type === DebateType.TIMED)} onSelectTopic={handleTopicSelect} />
                           </div>
                       )}

                       {viewFilter === 'EXPLORE' && (
                       <div className="space-y-2 animate-in fade-in duration-300">
                           <div className="px-6 pb-6 pt-2 border-b border-slate-200">
                               <div 
                                    onClick={() => handleSwitchView('EXPLORE_TAGS')}
                                    className="flex items-center gap-2 mb-4 group cursor-pointer w-fit"
                               >
                                    <h3 className="text-lg font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Explore Tags</h3>
                                    <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                               </div>
                               <div className="flex flex-wrap gap-2 items-center">
                                   {allTags.slice(0, 8).map(tag => (
                                       <button 
                                         key={tag}
                                         onClick={() => {
                                             setSearchQuery(tag);
                                             setAppliedSearchQuery(tag);
                                         }}
                                         className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                       >
                                         #{tag}
                                       </button>
                                   ))}
                                   <button 
                                        onClick={() => handleSwitchView('EXPLORE_TAGS')}
                                        className="ml-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100"
                                   >
                                       See more
                                   </button>
                               </div>
                           </div>

                           <div className="pb-6 border-b border-slate-200">
                               <div 
                                    onClick={() => handleSwitchView('EXPLORE_OPEN')}
                                    className="flex items-center gap-2 px-6 pt-4 mb-4 group cursor-pointer w-fit"
                               >
                                    <h3 className="text-lg font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Explore Open Debates</h3>
                                    <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                               </div>
                               <TopicList topics={topics.filter(t => t.type === DebateType.OPEN).slice(0, 3)} onSelectTopic={handleTopicSelect} />
                               <div className="px-6 mt-4">
                                    <button 
                                        onClick={() => handleSwitchView('EXPLORE_OPEN')}
                                        className="w-full py-3 bg-white border border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                                    >
                                        View More Open Debates
                                    </button>
                               </div>
                           </div>
                           
                           <div className="pb-4 border-slate-200">
                               <div 
                                    onClick={() => handleSwitchView('EXPLORE_TIMED')}
                                    className="flex items-center gap-2 px-6 pt-4 mb-4 group cursor-pointer w-fit"
                               >
                                    <h3 className="text-lg font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Explore Timed-Debates</h3>
                                    <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                               </div>
                               <TopicList topics={topics.filter(t => t.type === DebateType.TIMED).slice(0, 3)} onSelectTopic={handleTopicSelect} />
                               <div className="px-6 mt-4">
                                    <button 
                                        onClick={() => handleSwitchView('EXPLORE_TIMED')}
                                        className="w-full py-3 bg-white border border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                                    >
                                        View More Timed-Debates
                                    </button>
                               </div>
                           </div>
                       </div>
                       )}
                       </>
                   )}

                   {/* TRENDING VIEWS */}
                   {isTrendingActive && (
                       <>
                        {viewFilter === 'TRENDING' && (
                            <div className="space-y-2 animate-in fade-in duration-300">
                                {/* Trending Tags Section */}
                                <div className="px-6 pb-6 pt-2 border-b border-slate-200">
                                    <div 
                                        onClick={() => handleSwitchView('TRENDING_TAGS')}
                                        className="flex items-center gap-2 mb-4 group cursor-pointer w-fit"
                                    >
                                        <h3 className="text-lg font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Trending Tags</h3>
                                        <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {trendingTagsList.slice(0, 6).map(({ tag }) => (
                                            <button 
                                                key={tag}
                                                onClick={() => {
                                                    setSearchQuery(tag);
                                                    setAppliedSearchQuery(tag);
                                                }}
                                                className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Trending Open Debates */}
                                <div className="pb-6 border-b border-slate-200">
                                    <div 
                                        onClick={() => handleSwitchView('TRENDING_OPEN')}
                                        className="flex items-center gap-2 px-6 pt-4 mb-4 group cursor-pointer w-fit"
                                    >
                                        <h3 className="text-lg font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Trending Open Debates</h3>
                                        <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <TopicList topics={trendingOpenTopics.slice(0, 3)} onSelectTopic={handleTopicSelect} />
                                </div>

                                {/* Trending Timed Debates */}
                                <div className="pb-4">
                                    <div 
                                        onClick={() => handleSwitchView('TRENDING_TIMED')}
                                        className="flex items-center gap-2 px-6 pt-4 mb-4 group cursor-pointer w-fit"
                                    >
                                        <h3 className="text-lg font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Trending Timed-Debates</h3>
                                        <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <TopicList topics={trendingTimedTopics.slice(0, 3)} onSelectTopic={handleTopicSelect} />
                                </div>
                            </div>
                        )}

                        {viewFilter === 'TRENDING_TAGS' && (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pt-4 pb-8">
                                   {trendingTagsList.slice(0, 100).map(({ tag, score, count }) => {
                                       const info = TAG_INFO[tag] || { description: 'Debates and discussions related to ' + tag, category: 'General' };
                                       
                                       return (
                                           <button 
                                             key={tag}
                                             onClick={() => {
                                                 setSearchQuery(tag);
                                                 setAppliedSearchQuery(tag);
                                             }}
                                             className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group flex flex-col h-full relative overflow-hidden"
                                           >
                                             {/* Score Indicator Visual */}
                                             <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                 <span className="text-[10px] font-mono text-slate-300">{score}</span>
                                             </div>

                                             <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{info.category}</span>
                                                <div className="flex gap-1">
                                                    {score > 500 && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><IconSparkles className="w-3 h-3" /> HOT</span>}
                                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">{count} Topics</span>
                                                </div>
                                             </div>
                                             <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">#{tag}</h3>
                                             <p className="text-sm text-slate-600 mb-4 flex-grow">{info.description}</p>
                                             
                                             <div className="pt-4 border-t border-slate-50 w-full">
                                                <span className="text-xs text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    View Debates <IconChevronRight className="w-3 h-3" />
                                                </span>
                                             </div>
                                           </button>
                                       );
                                   })}
                               </div>
                               <div className="px-6 pb-12 flex justify-center">
                                    <button 
                                        onClick={() => handleSwitchView('EXPLORE_TAGS')}
                                        className="w-auto px-12 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm flex items-center justify-center gap-2 group"
                                    >
                                        See all Tags
                                        <IconChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                               </div>
                            </div>
                        )}

                        {viewFilter === 'TRENDING_OPEN' && (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                                <TopicList topics={trendingOpenTopics} onSelectTopic={handleTopicSelect} />
                                <div className="px-6 py-8 flex justify-center">
                                    <button 
                                        onClick={() => handleSwitchView('EXPLORE_OPEN')}
                                        className="w-auto px-12 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm flex items-center justify-center gap-2 group"
                                    >
                                        See all Open Debates
                                        <IconChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                               </div>
                            </div>
                        )}

                        {viewFilter === 'TRENDING_TIMED' && (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                                <TopicList topics={trendingTimedTopics} onSelectTopic={handleTopicSelect} />
                                <div className="px-6 py-8 flex justify-center">
                                    <button 
                                        onClick={() => handleSwitchView('EXPLORE_TIMED')}
                                        className="w-auto px-12 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm flex items-center justify-center gap-2 group"
                                    >
                                        See all Timed-Debates
                                        <IconChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                               </div>
                            </div>
                        )}
                       </>
                   )}

                   {(viewFilter === 'MY_DEBATES' || viewFilter === 'SAVED') && (
                       <TopicList topics={filteredTopics} onSelectTopic={handleTopicSelect} />
                   )}
                   </>
               )}
            </div>
            )}
          </main>

          <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
            <MobileTabBar
              items={[
                { key: 'home', icon: <IconHome className="h-5 w-5" />, label: 'Home', active: true },
                { key: 'search', icon: <IconSearch className="h-5 w-5" />, label: 'Search', onClick: () => searchInputRef.current?.focus() },
                { key: 'alerts', icon: <IconBell className="h-5 w-5" />, label: 'Alerts', onClick: () => setIsNotificationSidebarOpen(true) },
                { key: 'account', icon: <IconUser className="h-5 w-5" />, label: 'Account', onClick: () => setIsAccountSidebarOpen(true) },
              ]}
              fab={{ icon: <IconAdd className="h-5 w-5" />, onClick: () => setIsCreatingTopic(true), ariaLabel: 'Compose new debate' }}
            />
          </div>
        </div>
      )}

      <ArgumentDetail
        comment={selectedComment}
        topicComments={comments[activeTopic?.id ?? ''] ?? []}
        topicTitle={activeTopic?.title || ''}
        topicTag={activeTopic?.tags?.[0]}
        currentUserInitials={`${userProfile.firstName[0] ?? ''}${userProfile.lastName[0] ?? ''}`.toUpperCase() || 'YO'}
        onClose={() => setSelectedComment(null)}
        onReply={handleReply}
        onLikeComment={handleLikeComment}
        onSelectComment={setSelectedComment}
        canParticipate={canParticipate}
        isDebateClosed={!!isDebateClosed}
        areAiToolsEnabled={activeTopic?.areAiToolsEnabled ?? true}
      />
    </div>
  );
};

export default App;
