import { type MetaFunction } from '@remix-run/node';
import RippleHeroBg from './subcomponents/RippleHeroBg';
import HeroSection from './subcomponents/HeroSection';
import HowItWorksSection from './subcomponents/HowItWorksSection';

export const meta: MetaFunction = () => {
  return [
    { title: 'Finthetix' },
    { name: 'description', content: 'Earn rewards by staking with Finthetix' },
  ];
};

export default function Route() {
  return (
    <div>
      <RippleHeroBg />
      <HeroSection />
      <HowItWorksSection />
    </div>
  );
}
