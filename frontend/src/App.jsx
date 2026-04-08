import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Preloader } from './components/ui/Preloader';
import { UserCapturePage } from './pages/UserCapturePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { obtenerLugaresConCache } from './services/lugaresService';
import { hasUserSession } from './services/userService';
import { startSession, endSession, initSessionTracking } from './services/analyticsService';
import { PRELOADER_MIN_MS } from './constants/uiTiming';

initSessionTracking();

function App() {
  const [userReady, setUserReady] = useState(hasUserSession());
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lugares, setLugares] = useState([]);

  useEffect(() => {
    if (!userReady) return;
    const cargarDatos = async () => {
      const inicioTiempo = Date.now();
      const tiempoMinimoPreloader = PRELOADER_MIN_MS;
      try {
        setLoading(true);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        const lugaresData = await Promise.race([obtenerLugaresConCache(), timeoutPromise]);
        setLugares(lugaresData && lugaresData.length > 0 ? lugaresData : []);
      } catch {
        setLugares([]);
      } finally {
        const tiempoRestante = Math.max(0, tiempoMinimoPreloader - (Date.now() - inicioTiempo));
        if (tiempoRestante > 0) await new Promise((r) => setTimeout(r, tiempoRestante));
        setLoading(false);
        if (!localStorage.getItem('dime-onboarding-completed')) setShowOnboarding(true);
      }
    };
    cargarDatos();
  }, [userReady]);

  useEffect(() => {
    if (userReady && !loading && !showOnboarding) startSession();
    return () => endSession();
  }, [userReady, loading, showOnboarding]);

  const handleUserCaptureComplete = () => setUserReady(true);
  const handleOnboardingComplete = () => {
    localStorage.setItem('dime-onboarding-completed', 'true');
    setShowOnboarding(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!userReady ? (
        <UserCapturePage key="capture" onComplete={handleUserCaptureComplete} />
      ) : loading ? (
        <Preloader key="loader" />
      ) : showOnboarding ? (
        <OnboardingPage key="onboarding" onComplete={handleOnboardingComplete} />
      ) : (
        <HomePage key="home" lugares={lugares} />
      )}
    </AnimatePresence>
  );
}

export default App;
