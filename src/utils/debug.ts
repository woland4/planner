import { isNullish, unique } from 'remeda';

/*-------
  Exports
  -------*/

export const IS_DEV = import.meta.env.MODE === 'development';

/*---------
  Utilities
  ---------*/

if (IS_DEV) {
    (async () => {

        const { Units } = await import('@/utils/units.ts');
        const { Bulletizer } = await import('@/utils/bulletizer.ts');
        const { Criteria } = await import('@/utils/criteria.ts');

        (window as any).Units = Units;
        (window as any).Bulletizer = Bulletizer;
        (window as any).Criteria = Criteria;

        (window as any).extract = function(f: (id: any) => any): any {
            const result = [ ];
            for (let i=1; i<10000; ++i) {
                const value = f(i);
                if (!isNullish(value)) result.push(value);
            }
            return unique(result.filter(r => !isNullish(r)));
        };

        (window as any).R = await import('remeda');

    })();
}
