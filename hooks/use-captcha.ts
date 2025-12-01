'use client';

import { useState, useEffect, useCallback } from 'react';

interface CaptchaState {
  a: number;
  b: number;
  answer: string;
}

interface UseCaptchaReturn {
  captcha: CaptchaState;
  setAnswer: (answer: string) => void;
  reset: () => void;
  isValid: () => boolean;
  question: string;
  isClient: boolean;
}

function generateCaptcha(): Omit<CaptchaState, 'answer'> {
  return {
    a: Math.floor(Math.random() * 9) + 1,
    b: Math.floor(Math.random() * 9) + 1,
  };
}

export function useCaptcha(): UseCaptchaReturn {
  const [isClient, setIsClient] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaState>({
    a: 0,
    b: 0,
    answer: '',
  });

  useEffect(() => {
    setIsClient(true);
    setCaptcha((prev) => ({
      ...prev,
      ...generateCaptcha(),
    }));
  }, []);

  const setAnswer = useCallback((answer: string) => {
    setCaptcha((prev) => ({ ...prev, answer }));
  }, []);

  const reset = useCallback(() => {
    setCaptcha({
      ...generateCaptcha(),
      answer: '',
    });
  }, []);

  const isValid = useCallback(() => {
    return parseInt(captcha.answer) === captcha.a + captcha.b;
  }, [captcha.answer, captcha.a, captcha.b]);

  const question = isClient ? `¿Cuánto es ${captcha.a} + ${captcha.b}?` : 'Cargando verificación...';

  return {
    captcha,
    setAnswer,
    reset,
    isValid,
    question,
    isClient,
  };
}

