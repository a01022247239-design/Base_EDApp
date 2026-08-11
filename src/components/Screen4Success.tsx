import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AgentProfile } from '../types';
import { sounds } from '../utils/audio';
import { RotateCcw } from 'lucide-react';

interface Props {
  agent: AgentProfile;
  onReset: () => void;
}

const STORAGE_KEY_PHOTO = 'petal_eco_child_photo_v2';
const STORAGE_KEY_MISSIONS = 'petal_eco_selected_missions_v2';

export const Screen4Success: React.FC<Props> = ({ agent, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo state with localStorage persistence
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PHOTO);
    } catch {
      return null;
    }
  });

  // Missions state with localStorage persistence
  const [selectedMissions, setSelectedMissions] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MISSIONS);
      return saved ? JSON.parse(saved) : [1, 2, 3, 4];
    } catch {
      return [1, 2, 3, 4];
    }
  });

  const [isPromised, setIsPromised] = useState(false);

  useEffect(() => {
    // Play celebratory sound
    sounds.playSuccess();

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34d399', '#10b981', '#059669', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // Ignore confetti fallback
    }
  }, []);

  // Save selected missions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(selectedMissions));
    } catch {
      // ignore
    }
  }, [selectedMissions]);

  // Save photo
  useEffect(() => {
    try {
      if (photoUrl) {
        localStorage.setItem(STORAGE_KEY_PHOTO, photoUrl);
      } else {
        localStorage.removeItem(STORAGE_KEY_PHOTO);
      }
    } catch {
      // ignore
    }
  }, [photoUrl]);

  const toggleMission = (id: number) => {
    sounds.playClick();
    setSelectedMissions((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          sounds.playSuccess();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPromise = () => {
    sounds.playSuccess();
    setIsPromised(true);
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }
  };

  const handleResetClick = () => {
    sounds.playClick();
    onReset();
  };

  const handleSpeakGuide = () => {
    sounds.speak("훌륭해! 지구를 지키는 멋진 약속을 지켰구나!");
  };

  return (
    <div className="w-full h-full p-5 flex flex-col justify-between items-center text-center relative overflow-hidden select-none bg-gradient-to-b from-[#FFFDF0] to-[#FAFCF7]">
      {/* Hidden File Input for Child Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 1. 상단 뱃지 및 햇살 젤리박스 (따뜻한 햇빛 모티브) */}
      <div className="header-group w-full pt-2 flex flex-col items-center z-10">
        <div className="badge mb-1 bg-[#FEF3C7] text-[#D97706] text-xs px-3.5 py-1 rounded-full border border-[#FCD34D] font-extrabold shadow-sm">
          🎉 축하합니다!
        </div>
        <h1 id="app-title-screen4" className="app-title text-xl font-bold text-[#2D4A22] mb-2">
          지구 지킴이 배지 획득! 🌟
        </h1>
        {/* 빛나는 골드 젤리박스 */}
        <div className="guide-msg bg-[#FEF3C7] text-[#92400E] font-extrabold px-4 py-2.5 rounded-2xl border-2 border-[#FCD34D] shadow-[0_4px_0_#F59E0B] text-xs leading-relaxed flex items-center justify-center gap-1.5">
          <span>훌륭해! 지구를 지키는 멋진 약속을 지켰구나!</span>
          <button 
            onClick={handleSpeakGuide}
            className="bg-white/80 p-1 rounded-full text-sm shadow-sm active:scale-95 transition-transform"
            title="소리 들어보기"
          >
            🔊
          </button>
        </div>
      </div>

      {/* 2. 중앙 축하 비주얼 (싱그러운 생명의 민트/에메랄드 젤리 카드 적용) */}
      <div className="content-area z-10 my-auto">
        <div className="character-avatar flex flex-col justify-center items-center bg-gradient-to-b from-[#ECFDF5] to-white rounded-3xl p-5 shadow-xl border-2 border-[#A7F3D0] w-full max-w-[260px]">
          {/* 통통 튀는 배지 이모지 */}
          <div className="text-7xl mb-2 animate-bounce">🏅</div>
          <div className="text-base font-extrabold text-[#065F46] mb-1">
            빛나는 절전 마스터
          </div>
          {/* 포인트 보상 칩 (자연의 열매 톤) */}
          <div className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-3 py-1 rounded-full border border-[#FCD34D] mt-1 shadow-sm">
            ✨ +50 환경 포인트 획득!
          </div>
        </div>
      </div>

      {/* 3. 하단 싱그러운 열매 빛깔 젤리 버튼 */}
      <div className="btn-group w-full z-10">
        {!isPromised ? (
          <button 
            onClick={handleSubmitPromise}
            className="action-primary-btn w-full h-[70px] bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white border-[4px] border-[#A8D08D] rounded-[20px] text-[1.2rem] font-black shadow-[0_5px_0_#1B5E20,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_2px_0_#1B5E20,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
          >
            <span>✨ 약속해요!</span>
          </button>
        ) : (
          <button
            id="btn-return-screen1"
            onClick={handleResetClick}
            className="action-primary-btn w-full h-[70px] bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white border-[4px] border-[#A8D08D] rounded-[20px] text-[1.2rem] font-black shadow-[0_5px_0_#1B5E20,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_2px_0_#1B5E20,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
          >
            <RotateCcw className="w-5 h-5" />
            <span>처음으로 돌아가기</span>
          </button>
        )}
      </div>
    </div>
  );
};

