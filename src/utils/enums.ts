import { GimmickRegistry } from '@/utils/registry.ts';

import { keys } from 'remeda';

export const Enums = {

    activations: [
        'preexisting',
        'preemptive',
        'death',
        'interruption'
    ],

    classes: [
        'Fighter',
        'Slasher',
        'Striker',
        'Shooter',
        'Free Spirit',
        'Driven',
        'Cerebral',
        'Powerhouse'
    ],

    gimmickTypes: keys(GimmickRegistry),

    immunities: [
        'delay',
        'defenseDown',
        'poison',
        'death'
    ],

    interruptions: [
        'after1Turn',
        'attackUp',
        'burn',
        'burnRemoval',
        'chainUpAdditive',
        'chainUpMultiplicative',
        'damageReduction',
        'endOfTurnDamage',
        'defenseDown',
        'naoRemoval',
        'slotUp',
        'territory',
        'typeUp'
    ],

    intimidations: [
        'attackUp',
        'slotUp',
        'typeUp',
        'baseAttackUp'
    ],

    positions: [
        'bottomLeft',
        'bottomRight',
        'bottomRow',
        'crewmates',
        'leftColumn',
        'leftCrewmates',
        'rightColumn',
        'rightCrewmates',
        'middleLeft',
        'middleRight',
        'middleRow',
        'random',
        'randomCrewmate',
        'topLeft',
        'topRight',
        'topRow'
    ],

    removableEffects: [
        'eotDamage'
    ],

    slots: [
        'EMPTY',
        'STR',
        'DEX',
        'QCK',
        'PSY',
        'INT',
        'G',
        'RCV',
        'TND',
        'BOMB',
        'BLOCK',
        'PARALYSIS',
        'POISON',
        'RAINBOW',
        'SEMLA',
        'SUPERBLOCK',
        'SUPERBOMB',
        'WANO',
        'MATCHING',
        'UNFAVORABLE'
    ],

    tags: {

        crews: [
            'Straw Hat Pirates',
            'Rocks Pirates',
            'Alvida Pirates',
            'Big Mom Pirates',
            'Kuja Pirates',
            'Red Haired Pirates',
            'SWORD',
            'Germa 66',
            'Holy Knights',
            'Kami\'s Army',
            'CP0',
            'CP8',
            'CP9',
            'World Government',
            'Former / Navy',
            'Blackbeard Pirates',
            'Former / Roger Pirates',
            'Rumbar Pirates',
            'Buggy Pirates',
            'Former / Baroque Works',
            'Kamabakka Queendom',
            'Revolutionary Army',
            'Dressrosa Kingdom',
            'Kid Pirates',
            'Bonney Pirates',
            'Kozuki Clan',
            'Akazaya Nine',
            'New Giant Pirate Crew',
            'Giant Pirate Crew',
            'Neo Marines',
            'Buggy\'s Delivery',
            'Beautiful Pirates',
            'Rolling Pirates',
            'Spade Pirates',
            'Ryugu Kingdom',
            'Flying Pirates',
            'World Pirates',
            'Hawkins Pirates',
            'Drake Pirates',
            'On-Air Pirates',
            'Fallen Monk Pirates',
            'Bluejam Pirates',
            'Heart Pirates',
            'Caribou Pirates',
            'Tontatta Kingdom',
            'Happosui Army',
            'Golden Lion Pirates',
            'Arlong Pirates',
            'Krieg Pirates',
            'A.O. Pirates',
            'Momoko Dukedom',
            'Barto Club',
            'Animal Kigndom Pirates',
            'Baratie',
            'Drum Kingdom',
            'World Economic Journal',
            'Alabasta Kingdom',
            'Jaya',
            'Galley-La Company',
            'Ohara',
            'Impel Down',
            'Former / Whitebeard',
            'Firetank Pirates',
            'New Fish-Man Pirates',
            'Donquixote Pirates',
            'Evil Black Drum Kingdom',
            'Elegia Kingdom',
            'Gran Tesoro',
            'Thriller Bark Pirates',
            'Foxy Pirates',
            'Sun Pirates',
            'Kurozumi Clan',
            'Usopp Pirates',
            'Impostor Straw Hat Pirates',
            'Bandits',
            'Windmill Village'
        ].sort(),

        titles: [
            'Celestial Dragon',
            'Ancient Giant',
            'Five Elders',
            'Four Emperors',
            'Navy Fleet Admiral',
            'Navy Admiral',
            'Worst Generation',
            'Navy Vice Admiral',
            'Former / Seven Warlords of the Sea',
            'Supernova',
            'Cross Guild',
            'Lead Performer',
            'Tobi Roppo',
            'Vegapunk',
            'Seraphim',
            'Scientist',
            'Sweet 3 General',
            'Mink',
            'Homies',
            'Fish-Man',
            'Former / Royalty',
            'Tontatta',
            'Giant',
            'Merfolk',
            'Longarm Tribe',
            'Shandian Warrior',
            'Child'
        ].sort(),

        fruits: [
            'Mythical Zoan-type / Devil Fruit User',
            'Ancient Zoan-type / Devil Fruit User',
            'Logia-type / Devil Fruit User',
            'Paramythia-type / Devil Fruit User',
            'Zoan-type / Devil Fruit User'
        ].sort(),

        arcs: [
            'East Blue Arc',
            'Alabasta Arc',
            'Skypiea Arc',
            'Davy Back Fight Arc',
            'Water Seven Arc',
            'Enies Lobby Arc',
            'Thriller Bark Arc',
            'Sabaody Archipelago Arc',
            'Amazon Lily Arc',
            'Great Prison Impel Down Arc',
            'Marineford Paramount War Arc',
            'Fish-Man Island Arc',
            'Punk Hazard Arc',
            'Dressrosa Arc',
            'Zou Arc',
            'Whole Cake Island Arc',
            'Reverie Arc',
            'Land of Wano Arc',
            'Egghead Arc',
            'Elbaph Arc'
        ].sort()

    },

    timings: [
        'MISS',
        'GOOD',
        'GREAT',
        'PERFECT'
    ],

    types: [
        'STR',
        'DEX',
        'QCK',
        'PSY',
        'INT'
    ]

} as const;
