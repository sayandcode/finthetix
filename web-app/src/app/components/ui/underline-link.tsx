import { ExternalLinkIcon } from 'lucide-react';
import { ReactNode } from 'react';

export default function UnderlineLink(
  { children, href, className }:
  { children: ReactNode, href: string, className?: string },
) {
  return (
    <span className={className}>
      {' '}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline hover:no-underline"
      >
        {children}
        {' '}
        <ExternalLinkIcon className="inline w-3 h-3 align-baseline" />
      </a>
      {' '}
    </span>
  );
}
