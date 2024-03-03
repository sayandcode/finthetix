import { ExternalLinkIcon } from 'lucide-react';
import { ReactNode } from 'react';
import cn from '~/lib/utils/shadcn';

export default function UnderlineLink(
  { children, href, className }:
  { children: ReactNode, href: string, className?: string },
) {
  return (
    <>
      {' '}
      <a
        href={href}
        className={cn('underline hover:no-underline', className)}
        target="_blank"
        rel="noreferrer"
      >
        {children}
        {' '}
        <ExternalLinkIcon className="inline w-3 h-3 align-baseline" />
      </a>
      {' '}
    </>
  );
}
