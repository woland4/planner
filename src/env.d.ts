declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

interface Window {

    // Exposed for debugging from the console
    Units: unknown;

    cooldowns: Record<string, number[]>;

    details: Record<string, {

        captain: string | {

            base?: string; // Single unit

            level1?: string; // Single unit, LB1
            level2?: string; // Single unit, LB2
            level3?: string; // Single unit, LB3
            level4?: string; // Single unit, LB4
            level5?: string; // Single unit, LB5
            level6?: string; // Single unit, LB6

            character1?: string; // Dual/VS variant 1
            character2?: string; // Dual/VS variant 2
            combined?: string; // Dual combined

        };

        lLimit?:
            | null
            | undefined
            | {

                    captain?: {

                        base?: string; // Single unit

                        level1?: string; // Single unit, LB1
                        level2?: string; // Single unit, LB2
                        level3?: string; // Single unit, LB3
                        level4?: string; // Single unit, LB4
                        level5?: string; // Single unit, LB5
                        level6?: string; // Single unit, LB6

                        character1?: string; // Dual/VS variant 1
                        character2?: string; // Dual/VS variant 2
                        combined?: string; // Dual combined

                    };

                    sailor?: {

                        level1?: string; // Single unit, LB1
                        level2?: string; // Single unit, LB2
                        level3?: string; // Single unit, LB3
                        level4?: string; // Single unit, LB4
                        level5?: string; // Single unit, LB5
                        level6?: string; // Single unit, LB6

                        character1?: string; // Dual/VS variant 1
                        character2?: string; // Dual/VS variant 2
                        combined?: string; // Dual combined

                    };

                    special?: {

                        base?: string | { cooldown: number[], description: string }[]; // Single unit

                        level1?: string | { cooldown: number[], description: string }[]; // Single unit, LB1
                        level2?: string | { cooldown: number[], description: string }[]; // Single unit, LB2
                        level3?: string | { cooldown: number[], description: string }[]; // Single unit, LB3
                        level4?: string | { cooldown: number[], description: string }[]; // Single unit, LB4
                        level5?: string | { cooldown: number[], description: string }[]; // Single unit, LB5
                        level6?: string | { cooldown: number[], description: string }[]; // Single unit, LB6

                        character1?: string | { cooldown: number[], description: string }[]; // Dual/VS variant 1
                        character2?: string | { cooldown: number[], description: string }[]; // Dual/VS variant 2
                        combined?: string | { cooldown: number[], description: string }[]; // Dual combined

                    }

              }[];

        potential?:
            | null
            | undefined
            | {
                  Name: string;
                  description: string[];
              }[];

        special?:
            | string
            | { cooldown: number[], description: string }[]
            | {

                    base?: string | { cooldown: number[], description: string }[]; // Single unit

                    level1?: string | { cooldown: number[], description: string }[]; // Single unit, LB1
                    level2?: string | { cooldown: number[], description: string }[]; // Single unit, LB2
                    level3?: string | { cooldown: number[], description: string }[]; // Single unit, LB3
                    level4?: string | { cooldown: number[], description: string }[]; // Single unit, LB4
                    level5?: string | { cooldown: number[], description: string }[]; // Single unit, LB5
                    level6?: string | { cooldown: number[], description: string }[]; // Single unit, LB6

                    character1?: string | { cooldown: number[], description: string }[]; // Dual/VS variant 1
                    character2?: string | { cooldown: number[], description: string }[]; // Dual/VS variant 2
                    combined?: string | { cooldown: number[], description: string }[]; // Dual combined

              };

        superSpecial?: Nullable<string>;
        superSpecialCriteria?: Nullable<string>;

        support?: {
            Characters: string;
            description: string[];
        }[];

        swap?: string | { base: string, super: string, superTurns: number };

        VSSpecial?: { character1: string, character2: string };
        VSCondition?: Nullable<string>;

    }>;

    families: Record<string, string[]>;

    tags: Record<string, string[] | string[][] | null | undefined>;

    units: Record<string, {
        class: string | [ string, string ] | null | undefined;
        cost: number;
        id: string;
        name: string;
        stars: string;
        tag: string[];
        type: string | null | undefined;
    }>;

}
