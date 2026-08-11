import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import jsQR from 'jsqr';
import { EcoCard } from '../types';
import { sounds } from '../utils/audio';
import { QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import { ChildData } from './AdminModal';

interface Props {
  onScanComplete: (card?: EcoCard, childData?: { name: string; photo?: string | null; badgeCount?: number }) => void;
  sampleCards: EcoCard[];
}

const STORAGE_KEY_CHILDREN = 'petal_eco_children_list_v2';

const DEFAULT_CHILDREN: ChildData[] = [
  { id: "01", name: "김지우", photo: null, badgeCount: 3 },
  { id: "02", name: "이준", photo: null, badgeCount: 1 },
  { id: "03", name: "박서아", photo: null, badgeCount: 5 },
  { id: "04", name: "최민준", photo: null, badgeCount: 2 }
];

export const Screen2QRScan: React.FC<Props> = ({ onScanComplete, sampleCards }) => {
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  // Load children list from storage
  const [childrenList] = useState<ChildData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHILDREN);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_CHILDREN;
  });

  const [selectedChildId, setSelectedChildId] = useState<string>(childrenList[0]?.id || "01");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);

  const processScanSuccess = (child: ChildData) => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    setScannedResult(`[${child.id}] ${child.name}`);
    sounds.playScanBeep();

    // [음성 안내 명세]: "(유아 이름) 지구 지킴이, 환영해!"
    const welcomeMsg = `${child.name} 지구 지킴이, 환영해!`;
    sounds.speakWelcome(welcomeMsg, () => {
      onScanComplete(sampleCards[0], child);
    });
  };

  // Real-time camera scan loop using jsQR
  const scanCanvas = () => {
    if (!isScanningRef.current && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // Parse QR code string (e.g., KIDS_QR_ID_01 or 01)
          let foundChild = childrenList.find(c => code.data.includes(c.id));
          if (!foundChild) {
            foundChild = childrenList[0] || DEFAULT_CHILDREN[0];
          }
          processScanSuccess(foundChild);
          return;
        }
      }
    }
    if (!isScanningRef.current) {
      animFrameRef.current = requestAnimationFrame(scanCanvas);
    }
  };

  useEffect(() => {
    if (useRealCamera) {
      navigator.mediaDevices?.getUserMedia?.({ video: { facingMode: 'environment' } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraError(null);
          animFrameRef.current = requestAnimationFrame(scanCanvas);
        })
        .catch((err) => {
          console.warn('Camera stream error:', err);
          setCameraError('카메라를 연결할 수 없어 시뮬레이션 모드로 작동합니다.');
          setUseRealCamera(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [useRealCamera]);

  const handleSimulatedScan = () => {
    const target = childrenList.find(c => c.id === selectedChildId) || childrenList[0] || DEFAULT_CHILDREN[0];
    processScanSuccess(target);
  };

  return (
    <div className="w-full h-full py-6 px-5 flex flex-col justify-between items-center text-center relative overflow-hidden select-none bg-[#FAFCF7]">
      {/* 1. 상단 헤더 & 안내 메시지 */}
      <div className="header-group w-full max-w-[340px] flex flex-col items-center z-10 gap-1 my-auto">
        <div className="badge mb-1 bg-[#EBF5E6] text-[#386627] text-xs px-3 py-1 rounded-full border border-[#A8D08D] font-bold">
          🔍 QR 스캔
        </div>
        <h1 id="app-title-screen2" className="app-title text-xl font-bold text-[#2D4A22] mb-1">
          📷 QR 코드를 대어주세요
        </h1>
      </div>

      {/* 2. QR 스캔 뷰파인더 영역 */}
      <div
        onClick={handleSimulatedScan}
        className="scanner-box w-full max-w-[320px] h-[180px] border-4 border-dashed border-[#388E3C] rounded-[24px] bg-[#E8F5E9] my-auto flex flex-col justify-center items-center overflow-hidden shadow-xl z-10 shrink-0 cursor-pointer active:scale-98 transition-transform relative"
      >
        {useRealCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#E8F5E9] p-4 relative">
            <div className="p-2 bg-white rounded-2xl border-2 border-dashed border-[#388E3C] mb-1 shadow-xs">
              <QrCode className="w-10 h-10 text-[#388E3C]" />
            </div>
            <span className="text-sm font-extrabold text-[#1B5E20]">📱 [QR 스캔 테스트하기]</span>
            <span className="text-xs text-slate-500 mt-0.5">터치하여 스캔 인식</span>
          </div>
        )}

        {/* 스캔 성공 오버레이 */}
        {scannedResult && (
          <div className="absolute inset-0 bg-[#388E3C]/95 text-white flex flex-col items-center justify-center p-3 z-30 animate-fadeIn">
            <CheckCircle className="w-12 h-12 text-white mb-2 animate-bounce" />
            <span className="text-base font-black">QR 인증 완료!</span>
            <span className="text-xs font-bold text-emerald-100 mt-1">{scannedResult}</span>
            <span className="text-xs text-amber-200 mt-2 font-bold animate-pulse">🔊 환영 음성 재생 중...</span>
          </div>
        )}

        {/* 스캔 레이저 애니메이션 라인 */}
        {!scannedResult && (
          <motion.div
            className="absolute left-0 right-0 h-1 bg-[#388E3C] shadow-[0_0_8px_#388E3C]"
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        )}

        {/* 뷰파인더 모서리 가이드 */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-4 border-l-4 border-[#388E3C] rounded-tl-md" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-4 border-r-4 border-[#388E3C] rounded-tr-md" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-4 border-l-4 border-[#388E3C] rounded-bl-md" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-4 border-r-4 border-[#388E3C] rounded-br-md" />

        {/* 카메라 전환 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sounds.playClick();
            setUseRealCamera(!useRealCamera);
          }}
          className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-[#1B5E20] px-2 py-1 rounded-lg text-[11px] font-bold shadow border border-[#A8D08D] flex items-center gap-1 z-20 cursor-pointer active:scale-95 transition-transform"
          title="카메라 모드 전환"
        >
          <span>📷 {useRealCamera ? '가상 스캔' : '카메라 연결'}</span>
        </button>
      </div>

      {/* Camera error notification if any */}
      {cameraError && (
        <div className="w-full max-w-[340px] bg-amber-50 text-amber-800 text-xs p-2 rounded-xl border border-amber-300 my-1 flex items-center justify-center gap-1 z-10">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* 3. 시뮬레이션 원아 선택 드롭다운 & 버튼 */}
      <div className="w-full max-w-[340px] z-10 my-auto flex flex-col gap-2">
        <div className="text-left">
          <label className="block text-xs font-bold text-slate-600 mb-1">시뮬레이션 선택:</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="child-sim-select w-full h-[40px] min-h-[40px] px-[12px] text-[1rem] font-black border-[3px] border-[#A8D08D] rounded-[14px] bg-white text-[#1B3B1A] outline-none cursor-pointer flex items-center justify-center"
          >
            {childrenList.map((child) => (
              <option key={child.id} value={child.id}>
                [{child.id}] {child.name}
              </option>
            ))}
          </select>
        </div>

        <button
          id="btn-scan-complete-screen2"
          onClick={handleSimulatedScan}
          className="mission-action-btn w-full h-[70px] bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white border-[4px] border-[#A8D08D] rounded-[20px] text-[1.2rem] font-black shadow-[0_5px_0_#1B5E20,0_8px_14px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-[0_2px_0_#1B5E20,0_4px_6px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 cursor-pointer transition-all select-none mt-1"
        >
          <span>QR 스캔 인증하기</span>
        </button>
      </div>
    </div>
  );
};
