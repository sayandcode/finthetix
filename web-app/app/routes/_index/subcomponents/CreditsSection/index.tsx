import GithubIcon from '~/lib/assets/GithubIcon';
import XIcon from '~/lib/assets/XIcon';
import { DEVELOPER_PORTFOLIO_URL, DEVELOPER_SOCIAL_MEDIA_URL, FINTHETIX_GITHUB_URL } from '~/lib/constants';

export default function CreditsSection() {
  return (
    <div className="bg-primary w-full flex flex-col justify-center items-center p-8 gap-y-4">
      <span className="font-semibold">
        <a
          className="underline italic"
          href={DEVELOPER_PORTFOLIO_URL}
          aria-label="Link to developer's portfolio"
          target="_blank"
          rel="noreferrer"
        >
          sayandcode
        </a>
        {' © 2024'}
      </span>
      <div className="flex gap-x-2">
        <a
          target="_blank"
          rel="noreferrer"
          href={FINTHETIX_GITHUB_URL}
          aria-label="Link to project github"
        >
          <GithubIcon />
        </a>
        <a
          target="_blank"
          rel="noreferrer"
          href={DEVELOPER_SOCIAL_MEDIA_URL}
          aria-label="Link to developer social media"
        >
          <XIcon />
        </a>
      </div>
    </div>
  );
}
