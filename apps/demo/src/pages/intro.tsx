/**
 * IntroPage — BikiniBottom landing page.
 *
 * COMPLETELY different from OpenSpawn:
 * - Sandy yellow primary (#F4C542), not cyan
 * - Ocean blue background (#062A45), not near-black #020817
 * - Baloo 2 + Nunito fonts, not Inter/system
 * - Character-driven, story-first, not feature-list
 * - Primary CTA: "Watch the Agents Live", not "Get Started"
 */

import { useNavigate } from '@tanstack/react-router';
import { HeroBikiniBottom } from '../components/bb';

export function IntroPage() {
  const navigate = useNavigate();

  const handleWatchLive = () => {
    navigate({ to: '/live' });
  };

  const handleGitHub = () => {
    window.open('https://github.com/openspawn/openspawn', '_blank', 'noopener,noreferrer');
  };

  return (
    <HeroBikiniBottom
      onWatchLive={handleWatchLive}
      onGitHub={handleGitHub}
      agentCount={22}
    />
  );
}
