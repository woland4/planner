import { Units } from '@/utils/units.ts';
import { Bulletizer } from '@/utils/bulletizer.ts';

if (import.meta.env.MODE === 'development') {
    (window as any).Units = Units;
    (window as any).Bulletizer = Bulletizer;
}
