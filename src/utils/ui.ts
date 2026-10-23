import type { Slot } from '@/types/enums.ts';
import type { Nullable } from '@/types/utils.ts';

export const Ui = {

    askForUpload(accept: string): Promise<Nullable<File>> {

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;

        return new Promise(resolve => {
            input.addEventListener('change', () => resolve(input.files?.[0] ?? null), false);
            window.addEventListener('focus', () => setTimeout(() => resolve(null), 500), { once: true });
            input.click();
        });

    },

    getSlotIcon(slot: Slot): Nullable<string> {
        switch (slot) {
            case 'STR': return 'str';
            case 'DEX': return 'dex';
            case 'QCK': return 'qck';
            case 'PSY': return 'psy';
            case 'INT': return 'int';
            case 'BLOCK': return 'block';
            case 'BOMB': return 'bomb';
            case 'EMPTY': return 'emptySlot';
            case 'G': return 'g';
            case 'PARALYSIS': return 'paralysisSlot';
            case 'POISON': return 'poisonSlot';
            case 'RAINBOW': return 'rainbow';
            case 'RCV': return 'rcvSlot';
            case 'SEMLA': return 'semla';
            case 'SUPERBLOCK': return 'superBlock';
            case 'SUPERBOMB': return 'superBomb';
            case 'TND': return 'tndSlot';
            case 'WANO': return 'wano';

        }
    },

    getClassIcon(clazz: string): Nullable<string> {
        switch (clazz) {
            case 'Fighter': return 'fighter';
            case 'Slasher': return 'slasher';
            case 'Striker': return 'striker';
            case 'Shooter': return 'shooter';
            case 'Free Spirit': return 'freeSpirit';
            case 'Driven': return 'driven';
            case 'Cerebral': return 'cerebral';
            case 'Powerhouse': return 'powerhouse';
            default: return null;
        }
    }

};
