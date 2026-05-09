import { useStore } from '@/stores/useStore';

export function Shockwave() {
  const isShockwave = useStore((s) => s.isShockwave);

  if (!isShockwave) return null;

  return <div className="shockwave" />;
}
