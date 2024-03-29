import { HeadersFunction, type MetaFunction } from '@remix-run/node';
import RippleHeroBg from './subcomponents/RippleHeroBg';
import HeroSection from './subcomponents/HeroSection';
import HowItWorksSection from './subcomponents/HowItWorksSection';
import CreditsSection from './subcomponents/CreditsSection';
import getCacheConfig from '~/lib/loaders/cacheConfig';

export const meta: MetaFunction = () => {
  return [
    { title: 'Finthetix' },
    { name: 'description', content: 'Earn rewards by staking with Finthetix' },
  ];
};

export const headers: HeadersFunction = () => {
  const { serverMaxAge, staleWhileRevalidate } = getCacheConfig();

  return {
    'Cache-Control': `s-maxage=${serverMaxAge}; stale-while-revalidate=${staleWhileRevalidate}`,
  };
};

export default function Route() {
  return (
    <div>
      <RippleHeroBg />
      <HeroSection />
      <HowItWorksSection />
      <CreditsSection />
    </div>
  );
}
