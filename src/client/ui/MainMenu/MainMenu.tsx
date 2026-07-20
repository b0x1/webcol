import React from 'react';
import { useUIStore } from '@client/game/state/uiStore';

const GITHUB_REPO_URL = 'https://github.com/b0x1/webcol';
const GITHUB_PAGES_PRIVACY_URL =
  'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement';

const GitHubMarkIcon: React.FC = () => (
  <svg
    aria-hidden
    className="h-5 w-5"
    fill="currentColor"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.2-.66-.4-.69-1.17-1.2-2.13-1.2-.86 0-1.11.43-1.11.94 0 .67.75 1.23 1.05 1.5.2.17.42.26.54.85.09.35.39 1.54 1.06 1.84 1.02.47 2.97.22 2.97.13 0 .19.01.37.01.57 0 .29-.01 1.04-.01 2.04 0 .21.15.46.55.38A8.012 8.012 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
);

export const MainMenu: React.FC = () => {
  const {
    isMainMenuOpen,
    setGameSetupModalOpen,
    setHowToPlayModalOpen,
    setSaveModalOpen
  } = useUIStore();

  if (!isMainMenuOpen) return null;

  const buttonClass = "w-64 py-4 px-6 mb-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-xl uppercase tracking-widest border-2 border-slate-100/20 rounded shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto backdrop-blur-sm";
  const footerLinkClass =
    'inline-flex items-center gap-2 text-slate-300/90 hover:text-white text-sm font-semibold uppercase tracking-wider underline-offset-4 hover:underline transition-colors pointer-events-auto';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-[1000] bg-black/20">
      <div className="flex flex-col items-center mt-24 animate-in fade-in zoom-in duration-500">
        <h1 className="text-8xl font-black text-white mb-16 drop-shadow-2xl uppercase tracking-tighter italic">
          WEB<span className="text-blue-500">COL</span>
        </h1>
        <button className={buttonClass} onClick={() => { setGameSetupModalOpen(true); }}>
          New Game
        </button>
        <button className={buttonClass} onClick={() => { setSaveModalOpen(true); }}>
          Load Game
        </button>
        <button className={buttonClass} onClick={() => { setHowToPlayModalOpen(true); }}>
          How to Play
        </button>
      </div>
      <footer className="absolute bottom-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 text-center pointer-events-none">
        <a
          className={footerLinkClass}
          href={GITHUB_REPO_URL}
          rel="noopener noreferrer"
          target="_blank"
          title="View on GitHub"
        >
          <GitHubMarkIcon />
          <span className="sr-only">View source on GitHub</span>
        </a>
        <a
          className={footerLinkClass}
          href={GITHUB_PAGES_PRIVACY_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          Privacy Statement
        </a>
      </footer>
    </div>
  );
};
