import React, { useState } from 'react';
import { motion } from 'motion/react';
import { EcoCard } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  onVerifyComplete: () => void;
  selectedCard?: EcoCard;
}

interface MissionOption {
  id: number;
  category: string;
  title: string;
  description: string;
  icon: string;
  badgeBg: string;
}

const MISSION_OPTIONS: MissionOption[] = [
  {
    id: 1,
    category: '에너지 절약',
    title: '사용하지 않는 전등 끄기',
    description: '방을 나갈 땐 스위치를 톡! 불을 끄면 지구가 아프지 않아요.',
    icon: '💡',
    badgeBg: '#5B9E36',
  },
  {
    id: 2,
    category: '음식 사랑',
    title: '남김없이 깨끗하게 먹기',
    description: '맛있는 음식은 꼭꼭 씹어 깨끗하게 비워요.',
    icon: '🍱',
    badgeBg: '#3B82F6',
  },
  {
    id: 3,
    category: '자원 재활용',
    title: '분리수거 바르게 하기',
    description: '플라스틱과 종이는 착착 나누어 올바르게 버려요.',
    icon: '♻️',
    badgeBg: '#10B981',
  },
];

export const Screen3Verify: React.FC<Props> = ({ onVerifyComplete, selectedCard }) => {
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [selectedMission, setSelectedMission] = useState<MissionOption>(MISSION_OPTIONS[0]);

  const handleSelectMission = (mission: MissionOption) => {
    sounds.playSuccess();
    setSelectedMission(mission);
    setStep('confirm');
  };

  const handleConfirmSelection = () => {
    sounds.playSuccess();
    setStep('confirm');
  };

  const handleFinishMission = () => {
    sounds.playSuccess();
    onVerifyComplete();
  };

  if (step === 'select') {
    return (
      <div className="w-full h-full p-5 flex flex-col justify-between items-center text-center relative overflow-hidden select-none bg-[#FAFCF7]">
        {/* 1. Header & Guide Message */}
        <div className="header-group w-full pt-4 flex flex-col items-center z-10">
          <h1 id="app-title-screen3" className="app-title text-xl font-bold text-[#2D4A22] mb-2">
            오늘의 지구 미션 선택 🌿
          </h1>
          <div className="guide-msg bg-[#EBF5E6] text-[#2D4A22] font-bold px-4 py-2.5 rounded-2xl border-2 border-[#A8D08D] shadow-[0_4px_0_#A8D08D] text-xs leading-relaxed flex items-center justify-center gap-1.5">
            <span>오늘 어떤 일을 해볼까?<br />하고 싶은 미션을 터치해 줘!</span>
            <button 
              onClick={() => sounds.speak("오늘 어떤 일을 해볼까? 하고 싶은 미션을 터치해 줘!")}
              className="bg-white/80 p-1 rounded-full text-sm shadow-sm active:scale-95 transition-transform shrink-0"
              title="소리 들어보기"
            >
              🔊
            </button>
          </div>
        </div>

        {/* 2. Mission Selection Cards */}
        <div className="content-area z-10 my-auto w-full flex flex-col gap-3 max-w-[280px]">
          {MISSION_OPTIONS.map((mission) => {
            const isSelected = selectedMission.id === mission.id;
            return (
              <button
                key={mission.id}
                onClick={() => handleSelectMission(mission)}
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-white border-[#5B9E36] shadow-[0_4px_0_#A8D08D]'
                    : 'bg-white/90 border-slate-200 hover:border-[#A8D08D]'
                }`}
              >
                <span className={`text-4xl p-2 rounded-xl shrink-0 ${isSelected ? 'bg-[#EBF5E6]' : 'bg-slate-100'}`}>
                  {mission.icon}
                </span>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-[#5B9E36]' : 'text-slate-500'}`}>
                    {mission.category}
                  </div>
                  <div className={`text-sm ${isSelected ? 'font-extrabold text-[#2D4A22]' : 'font-bold text-slate-700'}`}>
                    {mission.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Bottom Button */}
        <div className="btn-group w-full z-10">
          <button
            onClick={handleConfirmSelection}
            className="jelly-btn w-full bg-[#5B9E36] text-white font-bold py-3.5 rounded-2xl border-none shadow-[0_5px_0_#386627] active:translate-y-1 active:shadow-[0_2px_0_#386627] text-base"
          >
            이 미션으로 선택할래! 🎯
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-5 flex flex-col justify-between items-center text-center relative overflow-hidden select-none bg-[#FAFCF7]">
      {/* 1. Header & Guide Message */}
      <div className="header-group w-full pt-2 flex flex-col items-center z-10">
        <div className="badge mb-1 bg-[#EBF5E6] text-[#386627] text-xs px-3 py-1 rounded-full border border-[#A8D08D] font-bold">
          ✨ 미션 진행 중
        </div>
        <h1 id="app-title-screen3" className="app-title text-xl font-bold text-[#2D4A22] mb-2">
          지구 지킴이 미션 확인 🎯
        </h1>
        <div className="guide-msg bg-[#EBF5E6] text-[#2D4A22] font-bold px-4 py-2.5 rounded-2xl border-2 border-[#A8D08D] shadow-[0_4px_0_#A8D08D] text-xs leading-relaxed flex items-center justify-center gap-1.5">
          <span>좋아, 아주 멋진 미션을 골랐네! {selectedMission.icon}<br />약속을 잘 지킬 수 있지?</span>
          <button 
            onClick={() => sounds.speak(`좋아, 아주 멋진 미션을 골랐네! 약속을 잘 지킬 수 있지?`)}
            className="bg-white/80 p-1 rounded-full text-sm shadow-sm active:scale-95 transition-transform shrink-0"
            title="소리 들어보기"
          >
            🔊
          </button>
        </div>
      </div>

      {/* 2. Mission Detail Card */}
      <div className="content-area z-10 my-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="character-avatar flex flex-col justify-center items-center bg-white rounded-3xl p-5 shadow-xl border-2 border-[#A8D08D] w-full max-w-[270px]"
        >
          <div className="text-6xl mb-2 animate-bounce">{selectedMission.icon}</div>
          <div className="text-xs font-bold text-[#386627] bg-[#EBF5E6] px-3 py-1 rounded-full mb-1.5">
            {selectedMission.category}
          </div>
          <div className="text-base font-bold text-[#2D4A22] mb-1.5">
            {selectedMission.title}
          </div>
          <p className="text-xs text-[#4A6B3B] leading-snug">
            {selectedMission.description}
          </p>
        </motion.div>
      </div>

      {/* 3. Action Button */}
      <div className="btn-group w-full z-10">
        <button
          id="btn-verify-complete-screen3"
          onClick={handleFinishMission}
          className="jelly-btn w-full bg-[#5B9E36] text-white font-bold py-3.5 rounded-2xl border-none shadow-[0_5px_0_#386627] active:translate-y-1 active:shadow-[0_2px_0_#386627] flex items-center justify-center gap-2 text-base"
        >
          <span>✅ 미션 실천 완료!</span>
        </button>
      </div>
    </div>
  );
};
