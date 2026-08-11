import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../utils/audio';
import { AgentProfile } from '../types';
import { subscribeToFirebase } from '../firebase';

interface BadgeSlotItem {
  id: number;
  icon: string;
  name: string;
  desc: string;
  speech?: string;
}

const DEFAULT_USER_BADGE_STATE: (BadgeSlotItem | null)[] = [
  { id: 1, icon: "🥛", name: "물컵 배지", desc: "양치할 때 물컵 사용하기!" },
  null,
  { id: 3, icon: "♻️", name: "분리수거 배지", desc: "바른 통에 맞춰 쓰레기 버리기!" },
  null,
  { id: 5, icon: "🧻", name: "타올 절약 배지", desc: "핸드타올 1장만 사용하기!" },
  null
];

const SPEECH_MAP: Record<number, string> = {
  1: "물컵 사용 미션을 성공했어!",
  2: "잔반 없이 먹기 미션을 성공했어!",
  3: "분리수거 미션을 성공했어!",
  4: "절수 미션을 성공했어!",
  5: "핸드타올 절약 미션을 성공했어!",
  6: "종이 아껴쓰기 미션을 성공했어!"
};

const STORAGE_KEY_USER_BADGES = 'petal_eco_user_badge_state_v1';
const STORAGE_KEY_CHILDREN = 'petal_eco_children_list_v2';

interface Props {
  agent?: AgentProfile;
  badgeCount?: number;
  onReset?: () => void;
  onGoToHero?: () => void;
  onGoToMission?: (badge?: BadgeSlotItem) => void;
}

export const Screen5Badge: React.FC<Props> = ({ agent, onGoToMission }) => {
  const [celebrationBadge, setCelebrationBadge] = useState<(BadgeSlotItem & { speech?: string }) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [badgeState, setBadgeState] = useState<(BadgeSlotItem | null)[]>(() => {
    try {
      const savedBadges = localStorage.getItem(STORAGE_KEY_USER_BADGES);
      if (savedBadges) {
        const parsed = JSON.parse(savedBadges);
        if (Array.isArray(parsed) && parsed.length === 6) {
          return parsed;
        }
      }

      // Check children list if matching active agent
      const savedChildren = localStorage.getItem(STORAGE_KEY_CHILDREN);
      if (savedChildren) {
        const parsedChildren = JSON.parse(savedChildren);
        if (Array.isArray(parsedChildren) && parsedChildren.length > 0) {
          const match = parsedChildren.find(
            (c: { id: string; name: string; assignedBadges?: (BadgeSlotItem | null)[] }) =>
              c.name.includes(agent?.name || '') || c.id === "01"
          );
          if (match && match.assignedBadges && match.assignedBadges.length === 6) {
            return match.assignedBadges;
          }
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER_BADGE_STATE;
  });

  useEffect(() => {
    const unsub = subscribeToFirebase('earth_keeper/children', (parsedChildren) => {
      if (Array.isArray(parsedChildren) && parsedChildren.length > 0) {
        const match = parsedChildren.find(
          (c: { id: string; name: string; assignedBadges?: (BadgeSlotItem | null)[] }) =>
            c.name.includes(agent?.name || '') || c.id === "01"
        );
        if (match && match.assignedBadges && match.assignedBadges.length === 6) {
          setBadgeState(match.assignedBadges);
        }
      }
    });

    const handleStorage = () => {
      try {
        const savedBadges = localStorage.getItem(STORAGE_KEY_USER_BADGES);
        if (savedBadges) {
          const parsed = JSON.parse(savedBadges);
          if (Array.isArray(parsed) && parsed.length === 6) {
            setBadgeState(parsed);
            return;
          }
        }

        const savedChildren = localStorage.getItem(STORAGE_KEY_CHILDREN);
        if (savedChildren) {
          const parsedChildren = JSON.parse(savedChildren);
          if (Array.isArray(parsedChildren) && parsedChildren.length > 0) {
            const match = parsedChildren.find(
              (c: { id: string; name: string; assignedBadges?: (BadgeSlotItem | null)[] }) =>
                c.name.includes(agent?.name || '') || c.id === "01"
            );
            if (match && match.assignedBadges && match.assignedBadges.length === 6) {
              setBadgeState(match.assignedBadges);
            }
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (unsub) unsub();
    };
  }, [agent?.name]);

  const playFanfareSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, High C
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.2);
      });
    } catch {
      // Audio context error ignore
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const celebrationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startConfetti = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !canvas.parentElement) return;

    canvas.width = canvas.parentElement.clientWidth || 300;
    canvas.height = canvas.parentElement.clientHeight || 300;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      gravity: number;
    }> = [];

    const colors = ['#4CAF50', '#FFEB3B', '#FF9800', '#2196F3', '#E91E63'];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.8) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        gravity: 0.2
      });
    }

    let frame = 0;
    function animate() {
      if (frame < 45) {
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        frame++;
        requestAnimationFrame(animate);
      } else {
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    animate();
  };

  const handleBadgeClick = (index: number) => {
    const item = badgeState[index];
    if (!item) return;

    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
    }

    const speech = SPEECH_MAP[item.id] || `${item.name} 미션을 성공했어!`;
    const fullItem = { ...item, speech };

    setCelebrationBadge(fullItem);

    // 1. ⚡ [최우선] TTS 음성 안내를 가장 먼저 실행하여 지연 최소화
    speakText(speech);

    // 2. 🎺 팡파레 효과음 재생
    playFanfareSound();

    // 3. 🎉 Confetti 애니메이션
    setTimeout(() => {
      startConfetti(canvasRef.current);
    }, 50);

    // 4. 3초간 유지 후 자동 종료 및 3페이지 유지
    celebrationTimerRef.current = setTimeout(() => {
      setCelebrationBadge(null);
    }, 3000);
  };

  const handleMainAction = () => {
    sounds.playClick();
    if (onGoToMission) {
      onGoToMission();
    }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col justify-between items-center text-center relative overflow-hidden select-none bg-[#F4F8F3]">
      {/* 1. [2. 메인 타이틀 명세] */}
      <h1 id="app-title-screen5" className="text-[1.6rem] font-black text-[#1B5E20] text-center mt-[4px] mb-[30px] shrink-0">
        🏅 내 지구 배지 진열장 🏅
      </h1>

      {/* 2. [3. 유아 사진 영역 명세]: 미션 버튼과 동일 너비 100% + 4:3 비율 */}
      <div className="w-full aspect-[4/3] bg-[#F4F8F3] border-[3px] border-[#A8D08D] rounded-[24px] shadow-[0_8px_16px_rgba(0,0,0,0.06)] overflow-hidden flex items-center justify-center mb-[30px] shrink-0 relative">
        {agent?.photoUrl ? (
          <img
            src={agent.photoUrl}
            alt={agent.name || '유아 사진'}
            className="w-full h-full object-cover bg-white"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 font-bold">
            <span className="text-[4rem] mb-1 leading-none">{agent?.avatar || '👧'}</span>
            <span className="text-xs text-[#2E7D32]">등록된 프로필 사진</span>
          </div>
        )}
      </div>

      {/* 3. [4. 지구 배지 진열 영역 명세]: 100px 슬림 고정 높이 (4:3 비율 제거) */}
      <div className="w-full h-[100px] shrink-0 grid grid-cols-3 grid-rows-2 gap-[8px] bg-[#F1F8E9] py-[8px] px-[12px] rounded-[20px] border-[3px] border-[#C8E6C9] mb-[30px]" id="badgeGrid">
        {badgeState.map((badge, idx) => {
          const isOn = Boolean(badge);

          return (
            <button
              key={idx}
              type="button"
              onClick={isOn ? () => handleBadgeClick(idx) : undefined}
              disabled={!isOn}
              className={`page3-badge-item badge-item w-full h-full rounded-[16px] bg-white border border-[#C8E6C9] flex items-center justify-center text-[1.5rem] shadow-[0_4px_8px_rgba(0,0,0,0.05)] transition-all duration-200 select-none ${
                isOn
                  ? 'on grayscale-0 opacity-100 cursor-pointer pointer-events-auto active:scale-95'
                  : 'off grayscale opacity-30 cursor-not-allowed pointer-events-none'
              }`}
              title={isOn ? `${badge?.name}` : '미획득 배지'}
            >
              <span className="transform transition-transform active:scale-110">
                🌍
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. [5. 오늘의 미션 버튼 명세]: 외형 높이 70px, 3D 입체 그라데이션 */}
      <button
        id="btn-mission-pledge-screen5"
        onClick={handleMainAction}
        className="w-full h-[70px] bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white border-[4px] border-[#A8D08D] rounded-[20px] text-[1.2rem] font-black shadow-[0_5px_0_#1B5E20,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_2px_0_#1B5E20,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 transition-all cursor-pointer select-none mt-auto mb-[10px] shrink-0"
      >
        <span>💚 오늘의 미션도 약속해볼까?</span>
      </button>

      {/* 5. 축하 보상 팝업 (Celebration Modal) */}
      {celebrationBadge && (
        <div id="celebrationModal" className="modal-overlay active absolute inset-0 bg-black/65 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="celebration-card bg-white p-6 rounded-[32px] w-[85%] max-w-[380px] text-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-[4px] border-[#A8D08D] relative overflow-hidden flex flex-col items-center gap-3">
            <canvas ref={canvasRef} id="confettiCanvas" className="absolute inset-0 w-full h-full pointer-events-none z-1" />

            <div className="celebration-title text-[1.5rem] font-black text-[#1B5E20]">
              🏅 지구 배지 획득!
            </div>

            <div className="celebration-badge-box relative w-[110px] h-[110px] flex items-center justify-center my-2">
              <span className="sparkle sparkle-1 absolute top-[-5px] left-[-5px] text-[1.8rem] animate-sparklePop">✨</span>
              <span className="sparkle sparkle-2 absolute top-[-5px] right-[-5px] text-[1.8rem] animate-sparklePop [animation-delay:0.2s]">🎉</span>
              <span className="sparkle sparkle-3 absolute bottom-[-5px] left-[-5px] text-[1.8rem] animate-sparklePop [animation-delay:0.4s]">⭐</span>
              <span className="sparkle sparkle-4 absolute bottom-[-5px] right-[-5px] text-[1.8rem] animate-sparklePop [animation-delay:0.1s]">🎊</span>
              <div className="celebration-icon text-[4.8rem] z-2 animate-badgeBounce" id="popBadgeIcon">
                {celebrationBadge.icon}
              </div>
            </div>

            <div className="celebration-badge-name text-[1.25rem] font-black text-[#1B5E20] -mt-1" id="popBadgeName">
              {celebrationBadge.name}
            </div>

            <div className="text-[1.05rem] font-bold text-[#2E7D32]" id="popSpeechText">
              "{celebrationBadge.speech}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
};




