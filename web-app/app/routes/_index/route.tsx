import { type MetaFunction } from '@remix-run/node';
import { useCallback, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { useNavigate } from '@remix-run/react';
import { useAppSelector } from '~/redux/hooks';
import { selectIsUserLoggedIn, selectIsUserLoading } from '~/redux/features/user/slice';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { useRequestMetamaskAddressMutation } from '~/redux/services/metamask';
import RippleHeroBg from './subcomponents/RippleHeroBg';

export const meta: MetaFunction = () => {
  return [
    { title: 'Finthetix' },
    { name: 'description', content: 'Earn rewards by staking with Finthetix' },
  ];
};

export default function Route() {
  const { chainInfo } = useRootLoaderData();
  const navigate = useNavigate();
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const [requestMetamaskAddress] = useRequestMetamaskAddressMutation();

  useEffect(() => {
    if (isUserLoggedIn) navigate('/dashboard');
  }, [isUserLoggedIn, navigate]);

  const handleClick = useCallback(() => {
    requestMetamaskAddress(chainInfo);
  }, [requestMetamaskAddress, chainInfo]);

  // if active address is available, a redirect is pending, so disable the btn
  const isBtnDisabled = isUserLoading || isUserLoggedIn;
  return (
    <div>
      <RippleHeroBg />
      <section className="flex flex-col gap-y-2 items-center justify-center h-screen text-center">
        <h1 className="text-5xl sm:text-6xl font-bold">Finthetix</h1>
        <p className="text-xl">Earn rewards by staking tokens</p>
        <Button onClick={handleClick} disabled={isBtnDisabled}>
          {isBtnDisabled
            ? <Loader2Icon className="animate-spin" />
            : 'Connect Wallet'}
        </Button>
      </section>
      <section className="mx-8">
        <h2 className="font-bold text-4xl mb-2">How it works</h2>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit.  Illo,
          ratione sapiente ut id recusandae totam nesciunt culpa dicta odit
          deleniti voluptas soluta vel ipsum commodi voluptatem distinctio
          provident necessitatibus earum magnam, nostrum eius natus, beatae
          perspiciatis. Suscipit fugit nam nisi quisquam voluptas blanditiis
          eligendi fuga odit quibusdam minus aspernatur quod voluptate rem odio
          est ipsa veniam aperiam vero explicabo, neque iure.  Debitis facilis
          autem tempora sapiente aliquam! Cum reprehenderit velit odit magni
          numquam, perferendis tempore. Odio ratione ex, error distinctio itaque
          minima consectetur, nam cupiditate, a debitis recusandae eligendi
          ducimus. Iste, repudiandae obcaecati dolor placeat sunt pariatur
          asperiores, magni magnam, id perspiciatis consequuntur ut. Amet
          perferendis accusamus repellat, vero dolore distinctio nemo saepe
          molestias nam delectus fuga rerum maxime mollitia explicabo fugiat
          maiores adipisci voluptatibus architecto earum corrupti hic officia
          aspernatur doloremque? Eum dolores quod est expedita non suscipit quas
          voluptate nostrum corporis, quos voluptatibus rem perferendis ullam
          autem, assumenda quisquam eveniet eaque, quae minima voluptates iusto
          praesentium quaerat! Iste ipsa officiis accusantium minus eius quam ex
          hic dolorum harum tempora, nobis veritatis rem?  Culpa, provident
          facere. Nisi porro molestias repellendus laudantium accusantium eaque
          repudiandae ut fuga eligendi. Asperiores enim sit quidem! Culpa magnam
          beatae possimus officiis voluptate saepe quasi.
        </p>
      </section>
    </div>
  );
}
