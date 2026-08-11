import React from 'react';
import { motion } from 'motion/react';
import { AgentProfile } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  agent: AgentProfile;
  onNext: () => void;
  onChangeAgentName?: (name: string) => void;
}

export const Screen1Home: React.FC<Props> = ({ agent, onNext }) => {
  const handleStart = () => {
    sounds.playClick();
    onNext();
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-5 text-center bg-gradient-to-b from-emerald-50 via-green-50/50 to-emerald-100/40 relative overflow-hidden select-none gap-3.5">
      {/* Subtle background decorative shapes */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* Header & Guide Message */}
      <div className="header-group w-full max-w-[340px] flex flex-col items-center z-10 gap-1 mb-0">
        <div className="badge mb-1 bg-[#EBF5E6] text-[#386627] text-xs px-3 py-1 rounded-full border border-[#A8D08D] font-bold">
          🌸 꽃잎반 지구 지킴이 (Lv.{agent.level})
        </div>
        <h1 id="app-title-screen1" className="app-title text-xl font-bold text-[#2D4A22] mb-1">
          🌸 꽃잎반 출동! 지구를 부탁해 🌍
        </h1>
        <div className="guide-msg bg-[#EBF5E6] text-[#2D4A22] font-bold px-4 py-2 rounded-2xl border-2 border-[#A8D08D] shadow-[0_4px_0_#A8D08D] text-xs leading-relaxed flex items-center justify-center gap-1.5 w-full">
          <span>안녕, 꽃잎반 지구 지킴이!<br />오늘도 지구를 지키러 출동해 볼까?</span>
          <button 
            onClick={() => sounds.speak("안녕, 꽃잎반 지구 지킴이! 오늘도 지구를 지키러 출동해 볼까?")}
            className="bg-white/80 p-1 rounded-full text-sm shadow-sm active:scale-95 transition-transform cursor-pointer shrink-0"
            title="소리 들어보기"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Central Content Area - Hero Character Earth */}
      <div className="content-area z-10 h-auto my-0 py-0 flex items-center justify-center">
        <motion.div 
          className="relative flex flex-col items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className="clay-earth-container cursor-pointer"
            onClick={() => sounds.playScanBeep()}
            title="지구 캐릭터"
          >
            <div className="petal petal-1"></div>
            <div className="petal petal-2"></div>
            
            <div className="clay-earth">
              <div className="clay-land-1"></div>
              <div className="clay-land-2"></div>
              <div className="clay-eye left"><div className="eye-shine"></div></div>
              <div className="clay-eye right"><div className="eye-shine"></div></div>
              <div className="clay-blush left"></div>
              <div className="clay-blush right"></div>
              <div className="clay-smile"></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Button */}
      <div className="btn-group z-10 w-full max-w-[340px] mt-0">
        <button
          id="btn-deploy-screen1"
          onClick={handleStart}
          className="action-primary-btn w-full h-[70px] bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white border-[4px] border-[#A8D08D] rounded-[20px] text-[1.2rem] font-black shadow-[0_5px_0_#1B5E20,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_2px_0_#1B5E20,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
        >
          <span>🚀 출동하기</span>
        </button>
      </div>
    </div>
  );
};
