import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to handle the 10-minute seat reservation countdown.
 * @param {string|Date} expiresAt - ISO timestamp or Date object when reservation expires
 * @param {function} onExpire - Callback triggered when timer hits 0
 */
export const useReservationTimer = (expiresAt, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const callbackRef = useRef(onExpire);

  // Keep callback updated in ref to avoid re-triggering effect
  useEffect(() => {
    callbackRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0);
      setIsExpired(false);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(expiresAt).getTime() - Date.now();
      const seconds = Math.max(0, Math.floor(difference / 1000));
      return seconds;
    };

    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime <= 0) {
      setIsExpired(true);
      if (callbackRef.current) callbackRef.current();
      return;
    }

    setIsExpired(false);

    const timer = setInterval(() => {
      const currentRemaining = calculateTimeLeft();
      setTimeLeft(currentRemaining);

      if (currentRemaining <= 0) {
        clearInterval(timer);
        setIsExpired(true);
        if (callbackRef.current) callbackRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    timeLeft,
    formattedTime,
    isExpired,
  };
};
