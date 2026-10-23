import { IS_DEV } from '@/utils/debug.ts';

/*---------
  Constants
  ---------*/

const SCRIPT_BASE = (IS_DEV ?
    'http://localhost/optc/common/data' :
    'https://2Shankz.github.io/optc-db.github.io/common/data');

const IMAGE_BASE = (IS_DEV ?
    'http://localhost/optc/api/images' :
    'https://2Shankz.github.io/optc-db.github.io/api/images');

const SCRIPTS = [
    'cooldowns.js',
    'details.js',
    'families.js',
    'tags.js',
    'units.js'
];

/*-------
  Exports
  -------*/

export const Database = {

    IMAGE_BASE,

    loadScripts(): Promise<boolean> {
        return Promise.all(SCRIPTS.map(s => loadScript(`${ SCRIPT_BASE }/${ s }`)))
            .then(() => true)
            .catch(() => false);
    }

};

/*---------
  Internals
  ---------*/

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener('error', e => reject(e), { once: true });
        document.head.appendChild(script);
    });
}
