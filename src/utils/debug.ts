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

        (window as any).R = await import('remeda');

        (window as any).Units = Units;
        (window as any).Bulletizer = (await import('@/utils/bulletizer.ts')).Bulletizer;
        (window as any).Criteria = (await import('@/utils/criteria.ts')).Criteria;

        function extract(f: (id: any) => any): any {
            const result = [ ];
            for (let i=1; i<10000; ++i) {
                const value = f(i);
                if (!isNullish(value)) result.push(value);
            }
            return unique(result.filter(r => !isNullish(r)));
        }

        (window as any).extract = extract;

        (window as any).extractCaptains = function(regex: RegExp): any {
            return [
                ...extract(id => Units.getCaptain(id, 0, 5)),
                ...extract(id => Units.getCaptain(id, 1, 5)),
                ...extract(id => Units.getCaptain(id, 2, 5))
            ]
                .filter(x => regex.test(x))
                .filter((x,n,a) => a.indexOf(x) === n);
        };

        (window as any).extractSailors = function(regex: RegExp): any {
            return [
                ...extract(id => Units.getSailors(id, 0)).flat(),
                ...extract(id => Units.getSpecial(id, 1)).flat(),
                ...extract(id => Units.getSpecial(id, 2)).flat()
            ]
                .filter(x => regex.test(x))
                .filter((x,n,a) => a.indexOf(x) === n);
        };

        (window as any).extractSpecials = function(regex: RegExp): any {
            return [
                ...extract(id => Units.getSpecial(id, 0, 5)?.slice(-1)?.[0]?.description),
                ...extract(id => Units.getSpecial(id, 1, 5)?.slice(-1)?.[0]?.description),
                ...extract(id => Units.getSpecial(id, 2, 5)?.slice(-1)?.[0]?.description)
            ]
                .filter(x => regex.test(x))
                .filter((x,n,a) => a.indexOf(x) === n);
        };

        (window as any).extractSuperSpecials = function(regex: RegExp): any {
            return [
                ...extract(id => Units.getSuperSpecial(id, 0)?.description),
                ...extract(id => Units.getSuperSpecial(id, 1)?.description),
                ...extract(id => Units.getSuperSpecial(id, 2)?.description)
            ]
                .filter((x: string) => regex.test(x))
                .filter((x: string, n: number, a: string[]) => a.indexOf(x) === n);
        };

        (window as any).extractSupports = function(regex: RegExp): any {
            return extract(id => Units.getSupport(id)?.description)
                .filter((x: string) => regex.test(x))
                .filter((x: string, n: number, a: string[]) => a.indexOf(x) === n);
        };

        (window as any).extractSwaps = function(regex: RegExp): any {
            return extract(id => Units.getSwap(id)?.description)
                .filter((x: string) => regex.test(x))
                .filter((x: string, n: number, a: string[]) => a.indexOf(x) === n);
        };

    })();
}
