export type ScreenId = 'screen1' | 'screen2' | 'screen4' | 'screen5';

export interface AgentProfile {
  name: string;
  className?: string;
  title: string;
  level: number;
  xp: number;
  maxXp: number;
  avatar: string;
  photoUrl?: string | null;
  qrCodeData?: string;
  badge: string;
  missionsCompleted: number;
  totalMissions: number;
  streakDays: number;
}

export interface EcoCard {
  id: string;
  agentName: string;
  agentTitle: string;
  avatar: string;
  level: number;
  code: string;
  missionName: string;
  color: string;
}
