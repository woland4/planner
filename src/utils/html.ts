import { Units } from '@/utils/units.ts';

import type { Type } from '@/types/enums.ts';
import type { Nullable } from '@/types/utils.ts';

// TODO Markdown instead of something homebrew?
export const Html = {

    addClass(text: string,
             clazz: string): string {
        return `((${ clazz }))[[${ text }]]`;
    },

    addTypeColoring(text: string,
                    type: Nullable<Type>): string {
        if (!type) return text;
        switch (type) {
            case 'STR': return Html.addClass(text, 'font-bold text-red-500');
            case 'DEX': return Html.addClass(text, 'font-bold text-green-500');
            case 'QCK': return Html.addClass(text, 'font-bold text-blue-500');
            case 'PSY': return Html.addClass(text, 'font-bold text-yellow-500');
            case 'INT': return Html.addClass(text, 'font-bold text-purple-500');
        }
    },

    decorateUnit(unitID: number,
                 variant?: Nullable<number>): string {
        const unitName = Units.getName(unitID, variant)?.replace(/^(.+) - .+$/, '$1') ?? '';
        const unitType = Units.getTypes(unitID, variant)?.[0];
        return Html.addTypeColoring(unitName, unitType);
    },

    textToHTML(text: string): string {
        return text.replace(/\(\((.+?)\)\)\[\[(.+?)\]\]/g,
            (_, clazz, text) => `<span class='${ clazz }'>${ text }</span>`);
    }

}
