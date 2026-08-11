import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { AgentProfile } from '../types';
import { sounds } from '../utils/audio';
import { syncWithFirebase, subscribeToFirebase } from '../firebase';

export interface MissionItem {
  id: number;
  icon: string;
  name: string;
  desc: string;
}

export const MISSION_DATA: MissionItem[] = [
  { id: 1, icon: "🥛", name: "물컵 배지", desc: "양치할 때 물컵 사용하기!" },
  { id: 2, icon: "🍱", name: "잔반제로 배지", desc: "남기지 않고 다 먹기!" },
  { id: 3, icon: "♻️", name: "분리수거 배지", desc: "바른 통에 맞춰 쓰레기 버리기!" },
  { id: 4, icon: "🧼", name: "절수 배지", desc: "비누칠할 때 수도 잠그기!" },
  { id: 5, icon: "🧻", name: "타올 절약 배지", desc: "핸드타올 1장만 사용하기!" },
  { id: 6, icon: "📄", name: "양면사용 배지", desc: "종이 앞·뒷면 알뜰하게 쓰기!" }
];

export const DEFAULT_USER_BADGE_STATE: (MissionItem | null)[] = [
  { id: 1, icon: "🥛", name: "물컵 배지", desc: "양치할 때 물컵 사용하기!" },
  null,
  { id: 3, icon: "♻️", name: "분리수거 배지", desc: "바른 통에 맞춰 쓰레기 버리기!" },
  null,
  { id: 5, icon: "🧻", name: "타올 절약 배지", desc: "핸드타올 1장만 사용하기!" },
  null
];

export interface ChildData {
  id: string;
  name: string;
  photo?: string | null;
  badgeCount: number;
  assignedBadges?: (MissionItem | null)[];
}

interface Props {
  agent: AgentProfile;
  onUpdateAgent: (updated: Partial<AgentProfile>) => void;
}

const STORAGE_KEY_CHILDREN = 'petal_eco_children_list_v2';
export const STORAGE_KEY_USER_BADGES = 'petal_eco_user_badge_state_v1';

const DEFAULT_CHILDREN: ChildData[] = [
  {
    id: "01",
    name: "김지구 어린이 (햇살반)",
    photo: null,
    badgeCount: 3,
    assignedBadges: [...DEFAULT_USER_BADGE_STATE]
  },
  {
    id: "02",
    name: "이초록 어린이 (열매반)",
    photo: null,
    badgeCount: 1,
    assignedBadges: [MISSION_DATA[0], null, null, null, null, null]
  },
  {
    id: "03",
    name: "박서아 어린이 (새싹반)",
    photo: null,
    badgeCount: 5,
    assignedBadges: [MISSION_DATA[0], MISSION_DATA[1], MISSION_DATA[2], MISSION_DATA[3], MISSION_DATA[4], null]
  },
  {
    id: "04",
    name: "최민준 어린이 (꽃잎반)",
    photo: null,
    badgeCount: 2,
    assignedBadges: [MISSION_DATA[0], MISSION_DATA[1], null, null, null, null]
  }
];

// Standard QR Code renderer using qrcode library for 100% scan accuracy
const StandardQRCode: React.FC<{ childId: string }> = ({ childId }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    const qrText = `KIDS_QR_ID_${childId}`;
    QRCode.toDataURL(qrText, {
      width: 256,
      margin: 1,
      color: {
        dark: '#1B5E20',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrUrl(url))
      .catch(err => console.error('QR generation error:', err));
  }, [childId]);

  if (!qrUrl) {
    return <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">생성중...</div>;
  }

  return (
    <img
      src={qrUrl}
      alt={`QR Code ${childId}`}
      className="w-full h-full object-contain rounded-md"
    />
  );
};

export const AdminModal: React.FC<Props> = ({ agent, onUpdateAgent }) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);

  // Admin Tab: 'badge' (지구 배지 관리) or 'children' (원아 목록 관리)
  const [adminTab, setAdminTab] = useState<'badge' | 'children'>('badge');

  // Children List State
  const [childrenData, setChildrenData] = useState<ChildData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHILDREN);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_CHILDREN;
  });

  // Currently Selected Child ID for Earth Badge Management
  const [selectedChildId, setSelectedChildId] = useState<string>("01");

  // Mission Selection Modal State for Earth Badge Edit
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Edit Modal Popup State for Child Profile Management
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editBadgeCount, setEditBadgeCount] = useState<number>(0);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = subscribeToFirebase('earth_keeper/children', (data) => {
      if (data && Array.isArray(data)) {
        setChildrenData(data);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(childrenData));
      const activeChild = childrenData.find(c => c.id === selectedChildId) || childrenData[0];
      if (activeChild) {
        const badges = activeChild.assignedBadges && activeChild.assignedBadges.length === 6
          ? activeChild.assignedBadges
          : getChildBadges(activeChild);
        localStorage.setItem(STORAGE_KEY_USER_BADGES, JSON.stringify(badges));
      }
      window.dispatchEvent(new Event('storage'));
      syncWithFirebase('earth_keeper/children', childrenData);
    } catch {
      // ignore
    }
  }, [childrenData, selectedChildId]);

  // Helper to get 6 badge slots for a child
  const getChildBadges = (child: ChildData): (MissionItem | null)[] => {
    if (child.assignedBadges && child.assignedBadges.length === 6) {
      return child.assignedBadges;
    }
    const badges: (MissionItem | null)[] = [null, null, null, null, null, null];
    for (let i = 0; i < Math.min(6, child.badgeCount || 0); i++) {
      badges[i] = MISSION_DATA[i % MISSION_DATA.length];
    }
    return badges;
  };

  // Currently active child object for Earth Badge Management
  const currentSelectedChild = childrenData.find(c => c.id === selectedChildId) || childrenData[0];
  const currentChildBadges = currentSelectedChild ? getChildBadges(currentSelectedChild) : [];

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1500);
  };

  // Press handlers for Gear button (2-second long press)
  const startPress = () => {
    resetPress();
    setPressProgress(0);

    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    pressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setPressProgress(progress);

      if (progress >= 100) {
        if (pressIntervalRef.current) clearInterval(pressIntervalRef.current);
      }
    }, 40);

    longPressTimerRef.current = setTimeout(() => {
      openAdminScreen();
      resetPress();
    }, 2000);
  };

  const resetPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (pressIntervalRef.current) {
      clearInterval(pressIntervalRef.current);
      pressIntervalRef.current = null;
    }
    setPressProgress(0);
  };

  const openAdminScreen = () => {
    sounds.playLevelUp();
    setIsAdminOpen(true);
  };

  const handleGearClick = () => {
    sounds.playClick();
    openAdminScreen();
  };

  // Add Child
  const handleAddNewChild = () => {
    sounds.playClick();
    if (childrenData.length >= 24) {
      alert("최대 24명(4열 6행)까지 등록할 수 있습니다.");
      return;
    }

    const nextNum = (childrenData.length + 1).toString().padStart(2, '0');
    const newChild: ChildData = {
      id: nextNum,
      name: `원아 ${nextNum}`,
      photo: null,
      badgeCount: 0,
      assignedBadges: [null, null, null, null, null, null]
    };

    setChildrenData(prev => [...prev, newChild]);
    openEditModal(newChild);
  };

  // Edit Child Profile Modal
  const openEditModal = (child: ChildData) => {
    sounds.playClick();
    setEditingChildId(child.id);
    setEditName(child.name);
    setEditPhoto(child.photo || null);
    setEditBadgeCount(child.badgeCount || 0);
  };

  const closeEditModal = () => {
    sounds.playClick();
    setEditingChildId(null);
  };

  const handleSetBadges = (count: number) => {
    sounds.playClick();
    if (editBadgeCount === count) {
      setEditBadgeCount(count - 1);
    } else {
      setEditBadgeCount(count);
    }
  };

  const handleSaveChildInfo = () => {
    if (!editingChildId) return;

    sounds.playSuccess();
    const updatedList = childrenData.map(c => {
      if (c.id === editingChildId) {
        const currentBadges = getChildBadges(c);
        const updatedBadges = [...currentBadges];
        return {
          ...c,
          name: editName.trim() || c.name,
          photo: editPhoto,
          badgeCount: editBadgeCount,
          assignedBadges: updatedBadges
        };
      }
      return c;
    });

    setChildrenData(updatedList);

    if (editingChildId === "01" || editName === agent.name) {
      onUpdateAgent({
        name: editName.trim() || agent.name,
        photoUrl: editPhoto,
        qrCodeData: `KIDS_QR_ID_${editingChildId}`,
      });
    }

    setEditingChildId(null);
  };

  // Handle Earth Badge slot selection & mission update
  const handleOpenBadgeSlot = (slotIndex: number) => {
    sounds.playClick();
    setActiveSlotIndex(slotIndex);
  };

  const handleCloseMissionModal = () => {
    sounds.playClick();
    setActiveSlotIndex(null);
  };

  const handleSelectMissionForSlot = (mission: MissionItem) => {
    if (activeSlotIndex === null || !currentSelectedChild) return;

    sounds.playSuccess();
    const currentBadges = getChildBadges(currentSelectedChild);
    const updatedBadges = [...currentBadges];
    updatedBadges[activeSlotIndex] = mission;

    const newBadgeCount = updatedBadges.filter(Boolean).length;

    const updatedList = childrenData.map(c => {
      if (c.id === currentSelectedChild.id) {
        return {
          ...c,
          badgeCount: newBadgeCount,
          assignedBadges: updatedBadges
        };
      }
      return c;
    });

    setChildrenData(updatedList);

    if (currentSelectedChild.id === "01" || currentSelectedChild.name === agent.name) {
      onUpdateAgent({
        name: currentSelectedChild.name,
      });
    }

    setActiveSlotIndex(null);
    showToast(`✅ ${mission.name}가 등록되었습니다.`);
  };

  const handleResetCurrentBadge = () => {
    if (activeSlotIndex === null || !currentSelectedChild) return;

    const currentBadges = getChildBadges(currentSelectedChild);
    const oldMission = currentBadges[activeSlotIndex];
    const oldName = oldMission ? oldMission.name : '배지';

    sounds.playClick();
    const updatedBadges = [...currentBadges];
    updatedBadges[activeSlotIndex] = null;

    const newBadgeCount = updatedBadges.filter(Boolean).length;

    const updatedList = childrenData.map(c => {
      if (c.id === currentSelectedChild.id) {
        return {
          ...c,
          badgeCount: newBadgeCount,
          assignedBadges: updatedBadges
        };
      }
      return c;
    });

    setChildrenData(updatedList);
    setActiveSlotIndex(null);
    showToast(`🗑️ ${oldName}가 초기화되었습니다.`);
  };

  const handleSaveAllConfig = () => {
    sounds.playSuccess();
    try {
      localStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(childrenData));
      const activeChild = childrenData.find(c => c.id === selectedChildId) || childrenData[0];
      if (activeChild) {
        const badges = activeChild.assignedBadges && activeChild.assignedBadges.length === 6
          ? activeChild.assignedBadges
          : getChildBadges(activeChild);
        localStorage.setItem(STORAGE_KEY_USER_BADGES, JSON.stringify(badges));
      }
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
    showToast('💾 설정 사항이 성공적으로 저장되었습니다!');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditPhoto(event.target.result as string);
          sounds.playClick();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const defaultAvatarSvg = (
    <svg className="w-10 h-10 text-[#A8D08D]" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z" />
    </svg>
  );

  return (
    <>
      {/* Gear Button Top Right */}
      <div className="absolute top-3 right-3 z-40 select-none">
        <button
          id="gearBtn"
          onClick={handleGearClick}
          onMouseDown={startPress}
          onMouseUp={resetPress}
          onMouseLeave={resetPress}
          onTouchStart={startPress}
          onTouchEnd={resetPress}
          onTouchCancel={resetPress}
          className="relative w-10 h-10 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center shadow-md border-2 border-[#A8D08D] active:scale-95 transition-transform cursor-pointer"
          title="2초간 길게 누르면 관리자 모드 진입"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
            <path
              className="text-transparent"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-[#388E3C] transition-[stroke-dashoffset] duration-75 linear"
              strokeDasharray="100, 100"
              strokeDashoffset={100 - pressProgress}
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="text-xl">⚙️</span>
        </button>
      </div>

      {/* Admin Screen Full Layer */}
      {isAdminOpen && (
        <div id="adminScreen" className="app-container absolute inset-0 bg-white z-50 flex flex-col justify-between overflow-hidden text-[#1B3B1A] select-none">
          {/* 1. 공통 헤더 */}
          <header className="app-header h-[60px] px-4 flex justify-between items-center bg-[#F1F8E9] border-b-2 border-[#E0E0E0] shrink-0">
            <div className="app-title text-[1.1rem] font-extrabold text-[#1B5E20] flex items-center gap-1.5">
              <span>⚙️</span>
              <span>지구 배지 수정 모드</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="admin-badge bg-[#FFEBEE] text-[#C62828] border-2 border-[#FFCDD2] px-2.5 py-0.5 rounded-[12px] text-[0.8rem] font-extrabold">
                관리자 전용
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAdminOpen(false);
                }}
                className="bg-[#E0E0E0] hover:bg-slate-300 text-[#333333] px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer active:scale-95 transition-transform"
              >
                닫기
              </button>
            </div>
          </header>

          {/* Sub Navigation Tabs */}
          <div className="flex bg-[#E8F5E9] px-4 py-1.5 gap-2 border-b border-[#C8E6C9] shrink-0">
            <button
              onClick={() => { sounds.playClick(); setAdminTab('badge'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                adminTab === 'badge' ? 'bg-[#1B5E20] text-white shadow-xs' : 'bg-white text-[#1B5E20]'
              }`}
            >
              🏅 지구 배지 관리
            </button>
            <button
              onClick={() => { sounds.playClick(); setAdminTab('children'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                adminTab === 'children' ? 'bg-[#1B5E20] text-white shadow-xs' : 'bg-white text-[#1B5E20]'
              }`}
            >
              👤 원아 목록 관리
            </button>
          </div>

          {/* Admin Tab Content */}
          <div className="screen flex-1 flex flex-col p-5 justify-between overflow-y-auto">
            {adminTab === 'badge' ? (
              /* TAB 1: 지구 배지 수정 모드 */
              <div className="flex flex-col justify-between flex-1 h-full">
                <div>
                  <h1 className="page-title text-[1.4rem] font-black text-[#1B5E20] text-center mb-1">
                    지구 배지 관리
                  </h1>
                  <p className="sub-title text-[0.95rem] text-slate-600 text-center -mt-1 mb-4">
                    유아가 실천한 환경 미션 배지를 등록/수정합니다.
                  </p>

                  {/* 1. 유아 선택 드롭다운 (높이 40px 슬림) */}
                  <select
                    className="child-select-banner child-sim-select w-full h-[40px] min-h-[40px] px-4 text-[1rem] font-extrabold border-[3px] border-[#A8D08D] rounded-[12px] bg-white text-[#1B5E20] outline-none mb-4 cursor-pointer flex items-center justify-center"
                    value={selectedChildId}
                    onChange={(e) => {
                      sounds.playClick();
                      setSelectedChildId(e.target.value);
                    }}
                  >
                    {childrenData.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>

                  {/* 2. 지구 배지 수정 현황 그리드 (3열 x 2행) */}
                  <div className="badge-grid-container w-full bg-[#F1F8E9] p-4 rounded-[28px] border-[3px] border-[#C8E6C9] flex flex-col gap-3">
                    <div className="badge-grid grid grid-cols-3 grid-rows-2 gap-3.5 w-full aspect-[3/2]" id="badgeGrid">
                      {[0, 1, 2, 3, 4, 5].map((index) => {
                        const badge = currentChildBadges[index];
                        const isAcquired = Boolean(badge);

                        return (
                          <div
                            key={index}
                            onClick={() => handleOpenBadgeSlot(index)}
                            className={`badge-card ${
                              isAcquired
                                ? 'on bg-white border-2 border-[#A8D08D] rounded-[20px] shadow-[0_6px_12px_rgba(76,175,80,0.15)]'
                                : 'off bg-[#FAFAFA] border-2 border-[#EEEEEE] rounded-[20px]'
                            } flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 relative p-1.5 select-none`}
                          >
                            <div className={`badge-icon text-[2.5rem] leading-none ${!isAcquired ? 'filter grayscale opacity-35' : ''}`}>
                              {isAcquired ? badge?.icon : '🌍'}
                            </div>
                            <div className={`badge-label text-[0.8rem] font-extrabold text-center ${isAcquired ? 'text-[#1B5E20]' : 'text-slate-400'}`}>
                              {isAcquired ? badge?.name : '미획득'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 하단 가이드 팁 */}
                <div className="admin-tip text-[0.8rem] text-slate-500 text-center leading-relaxed bg-[#FAFAFA] p-2.5 rounded-[12px] mt-3 border border-slate-200">
                  💡 <b>TIP</b>: 미획득 배지(🌍)를 터치하면 새로운 미션을 등록할 수 있으며,<br />
                  획득한 배지를 터치하면 다른 미션으로 변경하거나 삭제(초기화)할 수 있습니다.
                </div>
              </div>
            ) : (
              /* TAB 2: 원아 목록 관리 */
              <div className="flex flex-col justify-between flex-1 h-full">
                <div>
                  <h1 className="text-xl font-black text-[#1B5E20] mb-2">원아 추가 / 프로필 수정</h1>
                  <div id="childGrid" className="grid grid-cols-4 gap-2 max-h-[460px] overflow-y-auto pr-0.5">
                    {childrenData.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => openEditModal(child)}
                        className="child-card bg-[#F1F8E9] border-2 border-[#A8D08D] hover:border-[#388E3C] rounded-2xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all active:scale-95 shadow-2xs overflow-hidden"
                      >
                        <div className="w-11 h-11 rounded-xl bg-white border border-[#A8D08D] flex items-center justify-center overflow-hidden mb-1">
                          {child.photo ? (
                            <img src={child.photo} alt={child.name} className="child-card-img w-full h-full object-cover" />
                          ) : (
                            defaultAvatarSvg
                          )}
                        </div>
                        <div className="child-name text-xs font-black text-[#1B5E20] text-center truncate w-full px-0.5 leading-tight">
                          {child.name}
                        </div>
                        <div className="child-id-tag text-[10px] font-bold text-[#4CAF50]">#{child.id}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddNewChild}
                  className="add-child-btn w-full h-[60px] bg-[#388E3C] hover:bg-[#2E7D32] text-white border-[3px] border-[#A8D08D] rounded-[18px] text-[1.1rem] font-black shadow-[0_4px_0_#1B5E20,0_6px_10px_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all mt-3 shrink-0 select-none"
                >
                  <span>➕ 원아 추가</span>
                </button>
              </div>
            )}
          </div>

          {/* PRD 하단 고정 저장 버튼 영역 */}
          <div className="admin-save-footer p-3 px-4 bg-white border-t-2 border-[#E0E0E0] shrink-0">
            <button
              onClick={handleSaveAllConfig}
              className="btn-save-primary w-full h-[52px] bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#43A047] hover:to-[#1B5E20] text-white border-none rounded-[16px] text-[1.1rem] font-black shadow-[0_4px_10px_rgba(27,94,32,0.2)] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
            >
              💾 설정 사항 저장하기
            </button>
          </div>

          {/* 3 & 4: 2열 * 3행 미션 선택 모달 팝업 (#missionModal) */}
          {activeSlotIndex !== null && (
            <div id="missionModal" className="modal-overlay active absolute inset-0 bg-black/55 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 animate-fadeIn">
              <div className="modal-content w-full max-w-[440px] bg-white rounded-[28px] p-5 shadow-2xl flex flex-col gap-4 border-2 border-[#C8E6C9] text-center">
                <div className="modal-header">
                  <div className="modal-title text-[1.2rem] font-black text-[#1B5E20]">
                    🌱 어떤 약속을 실천했나요?
                  </div>
                </div>

                {/* 추천사항: 2열 * 3행 미션 선택 카드 그리드 */}
                <div className="mission-picker-grid grid grid-cols-2 grid-rows-3 gap-3" id="missionPickerGrid">
                  {MISSION_DATA.map((mission) => (
                    <div
                      key={mission.id}
                      onClick={() => handleSelectMissionForSlot(mission)}
                      className="mission-picker-card bg-[#F1F8E9] border-2 border-[#C8E6C9] hover:border-[#8BC34A] rounded-[16px] p-2.5 flex flex-col items-center justify-center gap-1 cursor-pointer text-center transition-all active:bg-[#A8D08D] active:scale-95"
                    >
                      <div className="picker-icon text-[2.2rem] leading-none">{mission.icon}</div>
                      <div className="picker-name text-[0.95rem] font-black text-[#1B5E20]">{mission.name}</div>
                      <div className="picker-desc text-[0.75rem] text-slate-600 leading-tight font-semibold">{mission.desc}</div>
                    </div>
                  ))}
                </div>

                {/* 모달 버튼 영역 */}
                <div className="modal-actions flex gap-2.5 pt-1">
                  {currentChildBadges[activeSlotIndex] !== null && (
                    <button
                      id="btnDeleteBadge"
                      onClick={handleResetCurrentBadge}
                      className="btn-modal-delete flex-1 h-[48px] bg-[#FFEBEE] border-2 border-[#FFCDD2] rounded-[14px] text-[0.95rem] font-black text-[#E53935] cursor-pointer active:scale-95 transition-transform"
                    >
                      🗑️ 배지 초기화
                    </button>
                  )}
                  <button
                    onClick={handleCloseMissionModal}
                    className="btn-modal-close flex-1 h-[48px] bg-[#E0E0E0] border-none rounded-[14px] text-[1rem] font-black text-[#424242] cursor-pointer active:scale-95 transition-transform"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 7. Toast 완료 피드백 메시지 (#toast) */}
          {toastMessage && (
            <div id="toast" className="toast-message show absolute bottom-[40px] left-1/2 -translate-x-1/2 bg-[#1B5E20]/95 text-white px-6 py-3 rounded-full text-[0.95rem] font-black shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-all duration-300 z-[2000] whitespace-nowrap animate-bounce">
              {toastMessage}
            </div>
          )}
        </div>
      )}

      {/* 90% Size Edit Modal Popup for Child Profile Management */}
      {editingChildId && (
        <div id="editModal" className="modal-overlay active absolute inset-0 bg-black/60 backdrop-blur-xs z-[1050] flex items-center justify-center p-3 animate-fadeIn">
          <div className="modal-content-90 w-[90%] h-[90%] bg-white rounded-3xl p-4 shadow-2xl flex flex-col justify-between overflow-y-auto border-2 border-[#A8D08D] text-left">
            <div>
              {/* Popup Header */}
              <div className="popup-header flex justify-between items-center mb-3 pb-2 border-b-2 border-slate-200">
                <span className="popup-title text-xl font-black text-[#1B5E20]">원아 정보 수정</span>
                <button
                  onClick={closeEditModal}
                  className="close-popup-btn bg-[#EEEEEE] hover:bg-slate-300 text-slate-700 w-9 h-9 rounded-full font-bold flex items-center justify-center cursor-pointer text-base"
                >
                  ✕
                </button>
              </div>

              {/* 1. 원아 이름 */}
              <div className="edit-section mb-3">
                <label className="edit-label text-sm font-black text-[#2E7D32] mb-1 block">1. 원아 이름</label>
                <input
                  type="text"
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="이름 입력"
                  className="edit-input w-full p-3 border-2 border-[#A8D08D] rounded-xl font-black text-base outline-none focus:border-[#388E3C]"
                />
              </div>

              {/* 2. 프로필 사진 */}
              <div className="edit-section mb-3">
                <label className="edit-label text-sm font-black text-[#2E7D32] mb-1 block">2. 프로필 사진</label>
                <div className="photo-area-container w-full h-44 border-3 border-dashed border-[#A8D08D] rounded-2xl bg-[#F9FBF8] flex items-center justify-center overflow-hidden mb-2 relative">
                  {editPhoto ? (
                    <img id="photoPreviewImg" src={editPhoto} alt="프로필 미리보기" className="large-photo-preview w-full h-full object-cover" />
                  ) : (
                    <div id="photoPlaceholder" className="photo-placeholder text-center font-bold text-slate-400 text-sm leading-snug">
                      📷 등록된 사진이 없습니다<br />(클릭하여 사진 등록)
                    </div>
                  )}
                </div>

                <label htmlFor="fileUploadInput" className="file-upload-btn block w-full py-2.5 px-3 bg-[#E8F5E9] hover:bg-[#dcedda] border-2 border-[#81C784] rounded-xl text-center text-sm font-black text-[#2E7D32] cursor-pointer active:scale-95 transition-transform">
                  📷 사진 파일 선택 / 촬영
                </label>
                <input
                  type="file"
                  id="fileUploadInput"
                  accept="image/*"
                  className="file-upload-input hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* 3. 지구 배지 개수 선택 */}
              <div className="edit-section mb-3">
                <label className="edit-label text-sm font-black text-[#2E7D32] mb-1 block">3. 지구 배지 (획득 개수 터치)</label>
                <div id="badgeContainer" className="badge-row-container flex justify-between items-center bg-[#F1F8E9] p-3 rounded-2xl border-2 border-[#C8E6C9]">
                  {[1, 2, 3, 4, 5, 6].map((idx) => {
                    const isOn = idx <= editBadgeCount;
                    return (
                      <span
                        key={idx}
                        onClick={() => handleSetBadges(idx)}
                        className={`earth-badge-icon text-3xl cursor-pointer select-none transition-all ${
                          isOn ? 'on grayscale-0 opacity-100 scale-110' : 'off grayscale opacity-35'
                        }`}
                        title={`${idx}개 배지`}
                      >
                        🌏
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 4. 고유 QR 코드 명세 */}
              <div className="edit-section mb-2">
                <label className="edit-label text-sm font-black text-[#2E7D32] mb-1 block">4. 고유 QR 코드 (스캔 인식용)</label>
                <div className="qr-section-box bg-[#FAFAFA] border-2 border-[#E0E0E0] rounded-2xl p-3 flex items-center justify-around gap-3">
                  <div id="qrCodeCanvas" className="w-24 h-24 bg-white p-1 border border-slate-300 rounded-lg shadow-xs shrink-0 flex items-center justify-center">
                    <StandardQRCode childId={editingChildId} />
                  </div>
                  <div className="qr-info-text flex flex-col gap-0.5 text-left">
                    <div id="qrIdDisplay" className="qr-id-large text-xl font-black text-[#D32F2F]">식별 번호: {editingChildId}</div>
                    <div className="qr-desc text-xs font-bold text-slate-500 leading-tight">
                      스캐너에서 {editingChildId} 번호로<br />단독 식별 가능합니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveChildInfo}
              className="save-btn w-full h-[60px] bg-[#388E3C] hover:bg-[#2E7D32] text-white border-[3px] border-[#A8D08D] rounded-[18px] text-[1.1rem] font-black shadow-[0_4px_0_#1B5E20,0_6px_10px_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 mt-3 select-none"
            >
              저장 완료
            </button>
          </div>
        </div>
      )}
    </>
  );
};
