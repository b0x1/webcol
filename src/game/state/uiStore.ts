import { create } from 'zustand';
import { eventBus } from './EventBus';

export interface UIState {
  isSettlementScreenOpen: boolean;
  isEuropeScreenOpen: boolean;
  isNativeTradeModalOpen: boolean;
  isSaveModalOpen: boolean;
  isMainMenuOpen: boolean;
  isGameSetupModalOpen: boolean;
  isHowToPlayModalOpen: boolean;
  isReportsModalOpen: boolean;
  isDebugMode: boolean;
  showEndTurnConfirm: boolean;
  activeSettlementId: string | null;

  setSettlementScreenOpen: (isOpen: boolean) => void;
  setEuropeScreenOpen: (isOpen: boolean) => void;
  setNativeTradeModalOpen: (isOpen: boolean, settlementId?: string | null) => void;
  setSaveModalOpen: (isOpen: boolean) => void;
  setReportsModalOpen: (isOpen: boolean) => void;
  setMainMenuOpen: (isOpen: boolean) => void;
  setGameSetupModalOpen: (isOpen: boolean) => void;
  setHowToPlayModalOpen: (isOpen: boolean) => void;
  toggleDebugMode: () => void;
  setShowEndTurnConfirm: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => {
  // Listen for game events to update UI state
  eventBus.on('gameStarted', () => {
    set({
      isMainMenuOpen: false,
      isGameSetupModalOpen: false,
      isSaveModalOpen: false,
    });
  });

  eventBus.on('returnToMainMenu', () => {
    set({
      isMainMenuOpen: true,
      isSettlementScreenOpen: false,
      isEuropeScreenOpen: false,
      isNativeTradeModalOpen: false,
      isSaveModalOpen: false,
      isReportsModalOpen: false,
    });
  });

  return {
  isSettlementScreenOpen: false,
  isEuropeScreenOpen: false,
  isNativeTradeModalOpen: false,
  isSaveModalOpen: false,
  isMainMenuOpen: true,
  isGameSetupModalOpen: false,
  isHowToPlayModalOpen: false,
  isReportsModalOpen: false,
  isDebugMode: false,
  showEndTurnConfirm: false,
  activeSettlementId: null,

  setSettlementScreenOpen: (isOpen) => { set({ isSettlementScreenOpen: isOpen }); },
  setEuropeScreenOpen: (isOpen) => { set({ isEuropeScreenOpen: isOpen }); },
  setNativeTradeModalOpen: (isOpen, settlementId = null) =>
    { set({ isNativeTradeModalOpen: isOpen, activeSettlementId: settlementId }); },
  setSaveModalOpen: (isOpen) => { set({ isSaveModalOpen: isOpen }); },
  setReportsModalOpen: (isOpen) => { set({ isReportsModalOpen: isOpen }); },
  setMainMenuOpen: (isOpen) => { set({ isMainMenuOpen: isOpen }); },
  setGameSetupModalOpen: (isOpen) => { set({ isGameSetupModalOpen: isOpen }); },
  setHowToPlayModalOpen: (isOpen) => { set({ isHowToPlayModalOpen: isOpen }); },
  toggleDebugMode: () => { set((state) => ({ isDebugMode: !state.isDebugMode })); },
  setShowEndTurnConfirm: (show) => { set({ showEndTurnConfirm: show }); },
  };
});

if (typeof window !== 'undefined') {
  (window as any).useUIStore = useUIStore;
}
