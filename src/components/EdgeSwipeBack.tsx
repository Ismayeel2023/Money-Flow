import React, { useEffect, useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { App as CapApp } from '@capacitor/app';

export const EdgeSwipeBack: React.FC = () => {
  const { goBack, canGoBack } = useFinance();

  const [swipeProgress, setSwipeProgress] = useState<number>(0);
  const [touchY, setTouchY] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    isEdge: boolean;
    isLockedHorizontal: boolean;
  }>({
    startX: 0,
    startY: 0,
    isEdge: false,
    isLockedHorizontal: false,
  });

  // 1. Android Capacitor Hardware Back Button Support
  useEffect(() => {
    let handler: any = null;

    try {
      CapApp.addListener('backButton', ({ canGoBack: capCanGoBack }) => {
        const handled = goBack();
        if (!handled) {
          // If we are at root dashboard and no modals open, let Capacitor minimize/exit
          if (capCanGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        }
      }).then((h) => {
        handler = h;
      });
    } catch {
      // Not running in Capacitor or listener failed
    }

    return () => {
      if (handler && typeof handler.remove === 'function') {
        handler.remove();
      }
    };
  }, [goBack]);

  // 2. Global Edge-Swipe Right Gesture Tracking
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // Strictly trigger ONLY if touch starts within 30px of the left screen edge
      // This prevents interfering with scrollable containers or horizontal UI elements
      if (touch.clientX <= 30 && canGoBack) {
        touchStateRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          isEdge: true,
          isLockedHorizontal: false,
        };
        setTouchY(touch.clientY);
      } else {
        touchStateRef.current.isEdge = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStateRef.current.isEdge || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStateRef.current.startX;
      const deltaY = touch.clientY - touchStateRef.current.startY;

      // Lock gesture: if vertical delta exceeds horizontal delta early, cancel swipe
      if (!touchStateRef.current.isLockedHorizontal) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
          touchStateRef.current.isEdge = false;
          setIsSwiping(false);
          setSwipeProgress(0);
          return;
        }
        if (deltaX > 10 && deltaX > Math.abs(deltaY) * 1.5) {
          touchStateRef.current.isLockedHorizontal = true;
          setIsSwiping(true);
        }
      }

      if (touchStateRef.current.isLockedHorizontal && deltaX > 0) {
        // Calculate progress from 0 to 1 based on 70px threshold
        const progress = Math.min(1, Math.max(0, deltaX / 70));
        setSwipeProgress(progress);
        setTouchY(touch.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStateRef.current.isEdge && touchStateRef.current.isLockedHorizontal) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStateRef.current.startX;

        // If swiped past threshold (> 60px), trigger goBack
        if (deltaX >= 60) {
          goBack();
        }
      }

      touchStateRef.current.isEdge = false;
      touchStateRef.current.isLockedHorizontal = false;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    const handleTouchCancel = () => {
      touchStateRef.current.isEdge = false;
      touchStateRef.current.isLockedHorizontal = false;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [canGoBack, goBack]);

  if (!isSwiping || swipeProgress <= 0.05) return null;

  return (
    <div
      className="fixed left-0 top-0 bottom-0 pointer-events-none z-50 transition-opacity duration-150"
      style={{ opacity: Math.min(1, swipeProgress * 1.5) }}
    >
      {/* Left Edge Pill indicator */}
      <div
        className="absolute left-0 flex items-center justify-center transition-transform"
        style={{
          top: `${Math.max(80, Math.min(window.innerHeight - 120, touchY - 24))}px`,
          transform: `translateX(${swipeProgress * 28}px)`,
        }}
      >
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all ${
            swipeProgress >= 0.85
              ? 'bg-[#D4AF37] text-[#0F0F0F] scale-110 shadow-[0_0_16px_rgba(212,175,55,0.6)]'
              : 'bg-[#262626]/90 text-[#E0E0E0] border border-[#383838]'
          }`}
        >
          <span className="material-symbols-outlined text-[24px] font-bold">
            arrow_back
          </span>
        </div>
      </div>
    </div>
  );
};
