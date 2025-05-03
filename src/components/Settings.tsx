'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [forceEnglish, setForceEnglish] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const clearAllData = async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear IndexedDB
    const databases = await window.indexedDB.databases();
    databases.forEach(db => {
      if (db.name) {
        window.indexedDB.deleteDatabase(db.name);
      }
    });
  };

  const playSound = () => {
    const audio = new Audio('/sounds/alert.mp3');
    audio.play();
  };

  const ConfirmDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div ref={confirmRef} className="bg-white p-6 rounded-xl max-w-md w-full border border-gray-200 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
        <p className="text-gray-600 mb-6">Are you sure you want to erase all data? This action cannot be undone.</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(false);
              setIsOpen(false);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await clearAllData();
              window.location.reload(); // Force reload from server
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-10 w-10 h-10 flex items-center justify-center outline-none"
      >
        <Image
          src="/icons/static/gear.svg"
          alt="Settings"
          width={24}
          height={24}
          className="text-white hover:rotate-90 transition-transform duration-300"
        />
      </button>

      {showConfirm && <ConfirmDialog />}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-white p-6 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <Image
                  src="/icons/static/close.svg"
                  alt="Close"
                  width={38}
                  height={38}
                />
              </button>
            </div>
            <br />
            <div className="space-y-6 overflow-y-auto flex-1 pr-2">
              <div className="flex items-center justify-between">
                <label htmlFor="sound" className="text-lg font-semibold text-gray-700">
                  Sound
                </label>
                <button
                  id="sound"
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className={`relative inline-flex h-8 w-16 items-center rounded transition-colors duration-200 ease-in-out ${
                    isSoundEnabled ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <span className="absolute text-[10px] font-bold text-white left-2">
                    {isSoundEnabled ? 'ON' : ''}
                  </span>
                  <span className="absolute text-[10px] font-bold text-white right-2">
                    {!isSoundEnabled ? 'OFF' : ''}
                  </span>
                  <span
                    className={`inline-block h-6 w-6 transform rounded bg-white shadow transition-transform duration-200 ease-in-out ${
                      isSoundEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="force-english" className="text-lg font-semibold text-gray-700">
                    Force English Response
                  </label>
                  <button
                    id="force-english"
                    onClick={() => setForceEnglish(!forceEnglish)}
                    className={`relative inline-flex h-8 w-16 items-center rounded transition-colors duration-200 ease-in-out ${
                      forceEnglish ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    <span className="absolute text-[10px] font-bold text-white left-2">
                      {forceEnglish ? 'ON' : ''}
                    </span>
                    <span className="absolute text-[10px] font-bold text-white right-2">
                      {!forceEnglish ? 'OFF' : ''}
                    </span>
                    <span
                      className={`inline-block h-6 w-6 transform rounded bg-white shadow transition-transform duration-200 ease-in-out ${
                        forceEnglish ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enable this setting to force English responses regardless of the prompt language.
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Erase All Data</p>
                    <p className="text-xs text-gray-500 mt-1">
                      This will permanently delete all data.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      playSound();
                      setShowConfirm(true);
                    }}
                    disabled
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                  >
                    Erase
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
