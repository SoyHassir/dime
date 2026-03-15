/**
 * Pagina de onboarding (bienvenida).
 */

import { WelcomeCarousel } from '../features/Onboarding/WelcomeCarousel';

export function OnboardingPage({ onComplete }) {
  return <WelcomeCarousel onComplete={onComplete} />;
}
