import { useState, useEffect } from 'react';
import { ScreenId, AgentProfile, EcoCard } from './types';
import { sounds } from './utils/audio';
import { AppFrame } from './components/AppFrame';
import { Screen1Home } from './components/Screen1Home';
import { Screen2QRScan } from './components/Screen2QRScan';
import { Screen4MissionPledge } from './components/Screen4MissionPledge';
import { Screen5Badge } from './components/Screen5Badge';

const sampleCards: EcoCard[] = [
  {
    id: 'card1',
    agentName: '김지우',
    agentTitle: '지구 지킴이',
    avatar: '👦',
    level: 1,
    code: 'ECO-2026-001',
    missionName: '플라스틱 Zero 수호',
    color: 'emerald',
  },
  {
    id: 'card2',
    agentName: '박민준',
    agentTitle: '지구 지킴이',
    avatar: '👧',
    level: 2,
    code: 'ECO-2026-002',
    missionName: '푸른 숲 탐험대',
    color: 'amber',
  },
  {
    id: 'card3',
    agentName: '이서연',
    agentTitle: '지구 지킴이',
    avatar: '🧑',
    level: 3,
    code: 'ECO-2026-003',
    missionName: '맑은 바다 보호',
    color: 'teal',
  },
];

const STORAGE_KEY_AGENT = 'petal_eco_agent_v4';
const STORAGE_KEY_CARD = 'petal_eco_card_v4';
const STORAGE_KEY_SCREEN = 'petal_eco_screen_v4';
const STORAGE_KEY_BADGES = 'petal_eco_badges_v4';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCREEN);
      if (
        saved === 'screen1' ||
        saved === 'screen2' ||
        saved === 'screen4' ||
        saved === 'screen5'
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'screen1';
  });

  const [badgeCount, setBadgeCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BADGES);
      if (saved) return parseInt(saved, 10);
    } catch {
      // ignore
    }
    return 2; // Default 2 badges collected
  });

  const [selectedCard, setSelectedCard] = useState<EcoCard>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARD);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return sampleCards[0];
  });

  const [agent, setAgent] = useState<AgentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AGENT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      name: '김지우',
      className: '꽃잎반',
      title: '지구 지킴이',
      level: 1,
      xp: 50,
      maxXp: 100,
      avatar: '👦',
      photoUrl: null,
      qrCodeData: 'FLOWER-KIMJIWOO-2026',
      badge: '🌸 지구 지킴이',
      missionsCompleted: 12,
      totalMissions: 20,
      streakDays: 3,
    };
  });

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCREEN, currentScreen);
    } catch {
      // ignore
    }
  }, [currentScreen]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BADGES, badgeCount.toString());
    } catch {
      // ignore
    }
  }, [badgeCount]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CARD, JSON.stringify(selectedCard));
    } catch {
      // ignore
    }
  }, [selectedCard]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AGENT, JSON.stringify(agent));
    } catch {
      // ignore
    }
  }, [agent]);

  const [activeBadge, setActiveBadge] = useState<{ icon: string; name: string; desc?: string } | null>(null);

  const handleNavigateToMission = (badge?: { icon: string; name: string; desc?: string }) => {
    setActiveBadge(badge || null);
    setCurrentScreen('screen4');
  };

  const handleScanComplete = (
    card?: EcoCard,
    childData?: { name: string; photo?: string | null; badgeCount?: number }
  ) => {
    if (childData) {
      setAgent((prev) => ({
        ...prev,
        name: childData.name,
        photoUrl: childData.photo !== undefined ? childData.photo : prev.photoUrl,
      }));
      if (childData.badgeCount !== undefined) {
        setBadgeCount(childData.badgeCount);
      }
    } else if (card) {
      setSelectedCard(card);
      setAgent((prev) => ({
        ...prev,
        name: card.agentName,
        title: card.agentTitle,
        avatar: card.avatar,
        level: card.level,
        badge: `🌸 ${card.agentTitle}`,
      }));
    }

    setCurrentScreen('screen5');
  };

  const handlePledgeComplete = () => {
    // Increment badge count up to 6
    const newCount = Math.min(6, badgeCount + 1);
    setBadgeCount(newCount);
    setCurrentScreen('screen5');
  };

  const handleReset = () => {
    setCurrentScreen('screen1');
  };

  const handleChangeAgentName = (newName: string) => {
    setAgent((prev) => ({
      ...prev,
      name: newName,
    }));
  };

  const handleUpdateAgentProfile = (updated: Partial<AgentProfile>) => {
    setAgent((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleNavigate = (screenId: ScreenId) => {
    if (screenId !== 'screen4') {
      setActiveBadge(null);
    }
    setCurrentScreen(screenId);
  };

  return (
    <AppFrame
      currentScreen={currentScreen}
      agent={agent}
      onUpdateAgent={handleUpdateAgentProfile}
      onNavigate={handleNavigate}
    >
      {currentScreen === 'screen1' && (
        <Screen1Home
          agent={agent}
          onNext={() => handleNavigate('screen2')}
          onChangeAgentName={handleChangeAgentName}
        />
      )}

      {currentScreen === 'screen2' && (
        <Screen2QRScan
          sampleCards={sampleCards}
          onScanComplete={handleScanComplete}
        />
      )}

      {currentScreen === 'screen5' && (
        <Screen5Badge
          agent={agent}
          badgeCount={badgeCount}
          onReset={handleReset}
          onGoToMission={handleNavigateToMission}
        />
      )}

      {currentScreen === 'screen4' && (
        <Screen4MissionPledge
          activeBadge={activeBadge}
          onNext={handlePledgeComplete}
          onGoHome={handleReset}
        />
      )}
    </AppFrame>
  );
}
