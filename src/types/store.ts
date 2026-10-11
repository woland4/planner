import type { Battle, Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';

export type Store = {

    tabs: Tab[];
    currentTabIndex: number;

    leftSidebarVisible: boolean;
    rightSidebarVisible: boolean;

}

export type Tab = {
    index: number;
    name?: string;
    battle: Nullable<Battle>;
    team: Team;
};
