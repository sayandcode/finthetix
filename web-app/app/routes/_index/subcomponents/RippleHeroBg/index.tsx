import customstyles from './index.module.css';

export default function RippleHeroBg() {
  const styles = `
  -z-10 h-[120dvh] w-full absolute top-0 left-0 ${customstyles.ripple}
  `;

  return (
    <div className={styles} />
  );
}
