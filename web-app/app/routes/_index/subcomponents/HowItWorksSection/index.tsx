import UnderlineLink from '~/components/ui/underline-link';
import illustration from './assets/staking.svg';
import { Card } from '~/components/ui/card';

const REWARD_UNLOCK_DURATION = '1 second';
const REWARD_RATE = '500';
const REWARD_TOKEN_SYMBOL = 'FRT';
const STAKING_TOKEN_SYMBOL = 'FST';

export default function HowItWorksSection() {
  return (
    <section className="mx-8 mb-8">
      <Card className="p-4">
        <h2 className="font-bold text-xl sm:text-3xl mb-2">How it works</h2>
        <p>
          {`Every ${REWARD_UNLOCK_DURATION}, ${REWARD_RATE}`}
          <UnderlineLink href="www.etherscan.io">
            {`${REWARD_TOKEN_SYMBOL} tokens`}
          </UnderlineLink>
          are awarded. You earn a fraction of these, based on how much of
          the total staking pool (of
          <UnderlineLink href="www.etherscan.io">
            {`${STAKING_TOKEN_SYMBOL} tokens`}
          </UnderlineLink>
          you contribute. Read the
          <UnderlineLink href="github.com/sayandcode/finthetix">official white paper</UnderlineLink>
          to learn more.
        </p>
        <img src={illustration} alt="" title="" aria-hidden className="mx-auto w-96 h-96" />
        <UnderlineLink
          className="text-sm mx-auto text-center block"
          href="https://www.freepik.com/free-vector/investment-gold-web-template_7660910.htm#fromView=search&page=1&position=2&uuid=66abb94f-5127-4005-9127-aed6ab73705c"
        >
          Image by vectorpouch on Freepik
        </UnderlineLink>
      </Card>
    </section>
  );
}
