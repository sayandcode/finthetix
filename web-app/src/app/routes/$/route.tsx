import UnderlineLink from '~/components/ui/underline-link';
import img404 from './assets/404-robot.svg';
import { MetaFunction, useLocation } from '@remix-run/react';

export const meta: MetaFunction = ({ location }) => [
  { title: 'Page not found | Finthetix' },
  {
    name: 'description',
    content: `'${location.pathname}' is not a valid page`,
  },
];

export default function SplatRoute() {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-col justify-center items-center h-[80dvh] gap-4 px-2">
      <img src={img404} alt="" className="max-w-xs w-2/3 md:w-full" />
      <UnderlineLink
        className="text-sm mx-auto text-center block"
        href="https://www.freepik.com/free-vector/oops-404-error-with-broken-robot-concept-illustration_13315300.htm"
      >
        Image by storyset on Freepik
      </UnderlineLink>
      <h1 className="text-2xl md:text-3xl">
        &apos;
        {pathname}
        &apos; route not found
      </h1>
    </div>
  );
}
