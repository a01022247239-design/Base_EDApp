import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface Props {
  onNext: () => void;
  onGoHome?: () => void;
  activeBadge?: { icon: string; name: string; desc?: string } | null;
}

interface Mission {
  id: number;
  icon: string;
  text: string;
  speech: string;
}

const MISSIONS: Mission[] = [
  { id: 1, icon: '🥛', text: '양치할 때\n물컵 사용하기', speech: '양치할 때 물컵을 사용하자!' },
  { id: 2, icon: '🍱', text: '잔반 없이\n식사하기', speech: '잔반 없이 모두 먹어보자!' },
  { id: 3, icon: '♻️', text: '분리수거\n잘하기', speech: '분리수거를 바르게 해보자!' },
  { id: 4, icon: '🧼', text: '비누칠 할 때\n물 끄기', speech: '비누칠할 때 물을 잠그자!' },
  { id: 5, icon: '🧻', text: '핸드타올\n1개씩 사용하기', speech: '핸드타올은 한 장만 사용하자!' },
  { id: 6, icon: '📄', text: '종이 앞뒤로\n사용하기', speech: '종이를 앞뒤로 사용해보자!' }
];

export const Screen4MissionPledge: React.FC<Props> = ({ onNext, onGoHome, activeBadge }) => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(() => {
    if (activeBadge) {
      const matched = MISSIONS.find(m => m.icon === activeBadge.icon) || {
        id: 99,
        icon: activeBadge.icon,
        text: activeBadge.name,
        speech: activeBadge.desc || `${activeBadge.name} 미션을 실천하자!`
      };
      return matched;
    }
    return null;
  });

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    } else {
      sounds.speak(text);
    }
  };

  const handleSelectMission = (m: Mission) => {
    sounds.playLevelUp();
    speakText(m.speech);
    setSelectedMission(m);
  };

  const handleCloseModal = () => {
    sounds.playClick();
    setSelectedMission(null);
  };

  const handleGoHomeClick = () => {
    sounds.playClick();
    if (onGoHome) {
      onGoHome();
    } else {
      onNext();
    }
  };

  return (
    <div className="w-full h-full p-6 flex flex-col justify-between items-center text-center relative overflow-hidden select-none bg-[#FAFCF7]">
      {/* Header */}
      <div className="header-group w-full pt-1 flex flex-col items-center z-10 shrink-0">
        <h1 id="app-title-screen4" className="page-title text-[1.6rem] font-black text-[#1B5E20] mb-1">
          🎯 오늘의 지구 미션
        </h1>
        <p className="sub-title text-[0.95rem] text-[#555] font-semibold mb-4">
          실천할 지구 약속 미션을 선택해 보세요!
        </p>
      </div>

      {/* Mission Cards Grid (2 cols x 3 rows) */}
      <div className="mission-grid grid grid-cols-2 grid-rows-3 gap-3 w-full flex-1 mb-4 z-10">
        {MISSIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleSelectMission(m)}
            className="mission-card bg-[#F1F8E9] border-[2.5px] border-[#A8D08D] rounded-[20px] p-3 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all active:scale-95 active:bg-[#A8D08D]"
          >
            <div className="mission-icon text-[2.5rem] leading-none">{m.icon}</div>
            <div className="mission-action-text text-[0.95rem] font-black text-[#1B5E20] leading-[1.25] whitespace-pre-line">
              {m.text}
            </div>
          </button>
        ))}
      </div>

      {/* Footer Go Home Button */}
      <div className="btn-group w-full z-10 pt-1 shrink-0">
        <button
          id="btn-pledge-mission-screen4"
          onClick={handleGoHomeClick}
          className="action-primary-btn w-full h-[70px] bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white border-[4px] border-[#A8D08D] rounded-[20px] text-[1.2rem] font-black shadow-[0_5px_0_#1B5E20,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_2px_0_#1B5E20,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
        >
          <span>🏠 처음 화면으로 돌아가기</span>
        </button>
      </div>

      {/* Pledge Modal Popup */}
      {selectedMission && (
        <div id="pledgeModal" className="modal-overlay active absolute inset-0 bg-black/65 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="pledge-card bg-white p-7 rounded-[32px] w-[85%] max-w-[380px] text-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-[4px] border-[#A8D08D] flex flex-col items-center gap-4">
            <div className="pledge-title text-[1.5rem] font-black text-[#1B5E20]">
              ✨ 지구 약속 다짐!
            </div>

            <div className="pledge-icon-box text-[5rem] leading-none my-1" id="mIcon">
              {selectedMission.icon}
            </div>

            <div className="pledge-action-text text-[1.3rem] font-black text-[#1B5E20] leading-[1.35] whitespace-pre-line" id="mActionText">
              {selectedMission.text}
            </div>

            <button
              onClick={handleCloseModal}
              className="action-primary-btn w-full h-[60px] bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white border-[4px] border-[#A8D08D] rounded-[20px] text-[1.1rem] font-black shadow-[0_5px_0_#1B5E20,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_2px_0_#1B5E20,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 transition-all cursor-pointer select-none mt-2"
            >
              <span>🤙 약속 실천하기!</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



