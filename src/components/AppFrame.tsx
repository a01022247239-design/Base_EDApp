import React, { useState } from 'react';
import { ScreenId, AgentProfile } from '../types';
import { AdminModal } from './AdminModal';
import { sounds } from '../utils/audio';
import { Volume2, VolumeX, Maximize2, Minimize2, Wifi, Battery } from 'lucide-react';

interface Props {
  currentScreen: ScreenId;
  agent?: AgentProfile;
  onUpdateAgent?: (updated: Partial<AgentProfile>) => void;
  onNavigate: (screenId: ScreenId) => void;
  children: React.ReactNode;
}

export const AppFrame: React.FC<Props> = ({
  currentScreen,
  agent,
  onUpdateAgent,
  onNavigate,
  children,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playClick();
  };

  const screens: { id: ScreenId; label: string; num: string }[] = [
    { id: 'screen1', label: '첫 화면', num: '1' },
    { id: 'screen2', label: 'QR 스캔', num: '2' },
    { id: 'screen5', label: '배지 획득', num: '3' },
    { id: 'screen4', label: '미션 약속', num: '4' },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-200 flex flex-col items-center justify-center p-2 sm:p-4 font-['Gothic_A1',sans-serif]">
      {/* External Controls bar for app testing */}
      <div className="mb-3 flex items-center justify-between w-full max-w-[360px] px-1 text-slate-700 text-xs font-bold">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>🌸 {agent?.className || '꽃잎반'} 출동!</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-sm flex items-center justify-center cursor-pointer"
            title={soundEnabled ? '사운드 끄기' : '사운드 켜기'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-sm flex items-center justify-center cursor-pointer"
            title={isFullScreen ? '프레임 모드' : '전체 화면 모드'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Screen step fast switcher navigation tabs */}
      <div className="mb-3 flex items-center gap-1 w-full max-w-[360px] bg-white p-1 rounded-xl border border-slate-300 shadow-sm text-xs">
        {screens.map((s) => {
          const isActive = currentScreen === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                sounds.playClick();
                onNavigate(s.id);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex flex-col items-center justify-center text-[10px] cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{s.num}. {s.label}</span>
            </button>
          );
        })}
      </div>

      {/* The App Frame (.app-screen matching 375px x 680px spec) */}
      <div
        className={`app-screen transition-all duration-300 relative bg-[#FAFCF7] border-[8px] border-[#386627] rounded-[40px] shadow-[0_20px_40px_rgba(45,74,34,0.15)] overflow-hidden flex flex-col p-0 ${
          isFullScreen
            ? 'w-full max-w-md h-[720px]'
            : 'w-[375px] h-[680px]'
        }`}
      >
        {/* Mobile Status Bar Top */}
        <div className="w-full bg-slate-900 text-slate-300 px-4 py-1 flex items-center justify-between text-[11px] font-mono z-30 select-none">
          <span className="font-bold text-white">09:41</span>
          {/* Mobile Notch Camera Speaker Dot */}
          <div className="w-16 h-3.5 bg-slate-800 rounded-full flex items-center justify-center gap-1 border border-slate-700">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            <div className="w-2.5 h-1 bg-slate-900 rounded-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <Battery className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>

        {/* Child Lock Admin Gear Button & Modal overlay */}
        {agent && onUpdateAgent && (
          <AdminModal agent={agent} onUpdateAgent={onUpdateAgent} />
        )}

        {/* Screen Content Container */}
        <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
          {children}
        </div>
      </div>

      {/* Bottom hint text */}
      <p className="mt-3 text-xs text-slate-500 text-center font-medium">
        💡 우측 상단 ⚙️ 버튼을 3초간 누르면 관리자 모드가 열립니다.
      </p>
    </div>
  );
};
