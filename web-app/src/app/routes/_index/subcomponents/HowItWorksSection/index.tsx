import UnderlineLink from '~/components/ui/underline-link';
import illustration from './assets/staking.svg';
import { Card } from '~/components/ui/card';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { FINTHETIX_GITHUB_URL } from '~/lib/constants';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';
import { useMemo } from 'react';

export default function HowItWorksSection() {
  const {
    dappInfo: { rewardTokenAddr, stakingContractAddr, stakingTokenAddr },
    finthetixMetadata: { stakingToken, rewardToken, totalRewardsPerSec },
    blockExplorerInfo,
  } = useRootLoaderData();

  const readableRewardRate
    = useMemo(() =>
      getReadableERC20TokenCount(
        {
          value: totalRewardsPerSec.toString(),
          decimals: stakingToken.decimals,
        },
        4,
      ), [totalRewardsPerSec, stakingToken.decimals]);

  return (
    <section className="mx-8 mb-8 mt-2">
      <Card className="p-4">
        <h2 className="font-bold text-xl sm:text-3xl mb-2">How it works</h2>
        <p>
          {`Every second, ${readableRewardRate}`}
          <UnderlineLink
            href={`${blockExplorerInfo.addressUrl}${rewardTokenAddr}`}
          >
            {`${rewardToken.symbol} tokens`}
          </UnderlineLink>
          are awarded. You earn a fraction of these, based on how much of
          the
          <UnderlineLink
            href={`${blockExplorerInfo.addressUrl}${stakingContractAddr}`}
          >
            total staking pool
          </UnderlineLink>
          (of
          <UnderlineLink
            href={`${blockExplorerInfo.addressUrl}${stakingTokenAddr}`}
          >
            {`${stakingToken.symbol} tokens`}
          </UnderlineLink>
          ) you contribute. Read the
          <UnderlineLink href={FINTHETIX_GITHUB_URL}>
            official white paper
          </UnderlineLink>
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
