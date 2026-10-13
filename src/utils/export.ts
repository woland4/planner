import { computed, createApp, nextTick } from 'vue';
import { EolStyle, Formatter, FracturedJsonOptions, NumberListAlignment, TableCommaPlacement } from 'fracturedjsonjs';
import { toCanvas } from 'html-to-image';

import BattleScreenshot from '@/components/viewer/BattleScreenshot.vue';

import { Units } from '@/utils/units.ts';
import { Battles } from '@/utils/battles.ts';
import { Numbers } from '@/utils/numbers.ts';

import type { Battle, Booster, Team, TeamUnit } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import { isNullish } from 'remeda';

/*-------------
  Configuration
  -------------*/

const PADDING = 15;
const GAP = 15;
const PIXEL_RATIO = 2;

const TEAM_MAIN_UNIT_SIZE = 112;
const TEAM_SUPPORT_UNIT_SIZE = 50;
const TEAM_SUPPORT_UNIT_OFFSET = 5; // Relative to the bottom right corner

const TEAM_CANVAS_WIDTH = (TEAM_MAIN_UNIT_SIZE * 2 + GAP + PADDING * 2);
const TEAM_CANVAS_MIN_HEIGHT = (TEAM_MAIN_UNIT_SIZE * 3 + GAP * 2 + PADDING * 2);

const BATTLE_SLICE_HEIGHT = 500;

const BOOSTER_UNIT_SIZE = 50;
const BOOSTER_UNITS_PER_ROW = 10;
const BOOSTER_UNIT_GAP = 5;
const BOOSTER_BOX_PADDING = 10;
const BOOSTER_BOX_MIN_WIDTH = 120; // To prevent text from overflowing
const BOOSTER_LABEL_HEIGHT = 16;

/*-------
  Exports
  -------*/

export const Export = {

    battleJSON(battle: Battle): string | undefined {

        const options = new FracturedJsonOptions();
        options.IndentSpaces = 4;
        options.JsonEolStyle = EolStyle.Lf;
        options.MaxInlineComplexity = 1;
        options.MaxTotalLineLength = 120;
        options.NestedBracketPadding = true;
        options.SimpleBracketPadding = true;
        options.NumberListAlignment = NumberListAlignment.Left;
        options.TableCommaPlacement = TableCommaPlacement.BeforePadding;


        const formatter = new Formatter();
        formatter.Options = options;

        return formatter.Serialize(battle);

    },

    async teamScreenshot(battle: Nullable<Battle>,
                         team: Team,
                         title?: Nullable<string>): Promise<Blob> {

        const boost = Battles.getOverallBoost(team.units, battle?.boosters);

        const hasBoost = !isNullish(boost);
        const isPureBoost = battle?.boosters?.some(b => Numbers.isPositive(b.pureMultiplier));

        const height = (
            TEAM_CANVAS_MIN_HEIGHT +
            (hasBoost ? 30 + GAP : 0) +
            (hasBoost && isPureBoost ? 15 : 0) +
            (title?.length ? 20 + GAP : 0)
        );

        const canvas = document.createElement('canvas');
        canvas.width = TEAM_CANVAS_WIDTH;
        canvas.height = height;

        const context = canvas.getContext('2d')!!;

        let y = PADDING;

        // Background
        drawBox({
            context,
            x: 0,
            y: 0,
            w: TEAM_CANVAS_WIDTH,
            h: height,
            fillColor: '#0f172b'
        });

        // Title
        if (title?.trim()?.length) {

            drawText({
                context,
                text: title,
                x: PADDING,
                y: y,
                w: TEAM_CANVAS_WIDTH - PADDING * 2,
                h: 20,
                color: '#ffffff',
                bold: true
            });

            y += 20 + PADDING;

        }

        // Team
        for (let i=0; i<6; ++i) {

            const unitX = (i > 2 ? PADDING : PADDING + TEAM_MAIN_UNIT_SIZE + GAP);

            let unitY = y;
            if (i !== 0 && i !== 5) unitY += (TEAM_MAIN_UNIT_SIZE + GAP);
            if (i === 2 || i === 3) unitY += (TEAM_MAIN_UNIT_SIZE + GAP);

            await drawUnit(context, battle, team.units[i], unitX, unitY);

        }
        y += (GAP * 3 + TEAM_MAIN_UNIT_SIZE * 3);

        // Boost
        if (hasBoost) {

            drawBox({
                context,
                x: PADDING,
                y,
                w: TEAM_CANVAS_WIDTH - PADDING * 2,
                h: 30 + (isPureBoost ? 15 : 0),
                fillColor: '#0d2c33',
                borderColor: '#0b5943',
                borderRadius: 5
            });

            drawText({
                context,
                text: `Boost: ${ boost!!.toFixed(2) }x`,
                x: PADDING,
                y: y,
                w: TEAM_CANVAS_WIDTH - PADDING * 2,
                h: 32,
                color: '#05df72',
                bold: true
            });

            drawText({
                context,
                text: `With friend: ${ (boost!! * 1.1).toFixed(2) }x`,
                x: PADDING,
                y: y + 10,
                w: TEAM_CANVAS_WIDTH - PADDING * 2,
                h: 42,
                color: '#05df72',
                bold: true,
                size: 11
            });

        }

        return new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))

    },

    async boostersScreenshot(boosters: Booster[]): Promise<Blob> {

        const groups = boosters.filter(b => b.ids?.length);
        const labels = groups.map(getBoosterLabel);

        const columnCount = Math.min(BOOSTER_UNITS_PER_ROW, Math.max(...groups.map(g => g.ids.length)));

        const boxWidth = Math.max(
            BOOSTER_BOX_MIN_WIDTH,
            BOOSTER_BOX_PADDING * 2 + columnCount * BOOSTER_UNIT_SIZE + (columnCount - 1) * BOOSTER_UNIT_GAP
        );

        const boxHeights = groups.map((g, n) => {
            const rowCount = Math.ceil(g.ids.length / BOOSTER_UNITS_PER_ROW);
            return (
                BOOSTER_BOX_PADDING * 2 +
                rowCount * BOOSTER_UNIT_SIZE + (rowCount - 1) * BOOSTER_UNIT_GAP +
                (labels[n] ? BOOSTER_LABEL_HEIGHT + BOOSTER_BOX_PADDING : 0)
            );
        });

        const canvasWidth = boxWidth + PADDING * 2;
        const canvasHeight = (
            boxHeights.reduce((p,n) => p + n, 0) +
            PADDING * 2 +
            GAP * (groups.length - 1)
        );

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth * PIXEL_RATIO;
        canvas.height = canvasHeight * PIXEL_RATIO;

        const context = canvas.getContext('2d')!!;
        context.scale(PIXEL_RATIO, PIXEL_RATIO);
        context.imageSmoothingQuality = 'high';

        // Background
        drawBox({
            context,
            x: 0,
            y: 0,
            w: canvasWidth,
            h: canvasHeight,
            fillColor: '#0f172b'
        });

        let y = PADDING;

        for (let i=0; i<groups.length; ++i) {

            // Group box
            drawBox({
                context,
                x: PADDING,
                y,
                w: boxWidth,
                h: boxHeights[i],
                fillColor: '#1d293d',
                borderColor: '#314158',
                borderRadius: 10
            });

            let contentY = y + BOOSTER_BOX_PADDING;

            if (labels[i]) {

                // Group label
                drawText({
                    context,
                    text: labels[i]!!,
                    x: PADDING + BOOSTER_BOX_PADDING,
                    y: contentY,
                    w: boxWidth - BOOSTER_BOX_PADDING * 2,
                    h: BOOSTER_LABEL_HEIGHT,
                    color: '#05df72',
                    bold: true,
                    horizontalAlign: 'left'
                });

                contentY += BOOSTER_LABEL_HEIGHT + BOOSTER_BOX_PADDING;

            }

            // Group units
            for (let n=0; n<groups[i].ids.length; ++n) {
                await drawImage({
                    context,
                    src: Units.getThumbnailURL(groups[i].ids[n]),
                    x: PADDING + BOOSTER_BOX_PADDING + (n % BOOSTER_UNITS_PER_ROW) * (BOOSTER_UNIT_SIZE + BOOSTER_UNIT_GAP),
                    y: contentY + Math.floor(n / BOOSTER_UNITS_PER_ROW) * (BOOSTER_UNIT_SIZE + BOOSTER_UNIT_GAP),
                    w: BOOSTER_UNIT_SIZE,
                    h: BOOSTER_UNIT_SIZE,
                    borderRadius: 5
                });
            }

            y += boxHeights[i] + GAP;

        }

        return new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))

    },

    async battleScreenshot(battle: Battle,
                           title?: Nullable<string>): Promise<Blob> {

        const host = document.createElement('div');
        host.style.position = 'fixed';
        host.style.top = '0';
        host.style.left = '-10000px';
        host.style.pointerEvents = 'none';
        document.body.appendChild(host);

        const app = createApp(BattleScreenshot, { battle, title });

        try {

            const view = app.mount(host).$el as HTMLElement;
            await nextTick();

            const width = view.clientWidth;
            const height = view.clientHeight;
            const backgroundColor = window.getComputedStyle(view).backgroundColor;

            const canvas = document.createElement('canvas');
            canvas.width = width * PIXEL_RATIO;
            canvas.height = height * PIXEL_RATIO;

            const context = canvas.getContext('2d')!!;

            for (let offset=0; offset<height; offset+=BATTLE_SLICE_HEIGHT) {

                const slice = await toCanvas(view, {
                    width,
                    height: Math.min(BATTLE_SLICE_HEIGHT, height - offset),
                    pixelRatio: PIXEL_RATIO,
                    backgroundColor,
                    skipFonts: true,
                    style: {
                        transform: `translateY(${ -offset }px)`,
                        transformOrigin: 'top left'
                    }
                });

                context.drawImage(slice, 0, offset * PIXEL_RATIO);

            }

            return new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))

        } finally {
            app.unmount();
            host.remove();
        }

    }

}

/*-------
  Helpers
  -------*/

const numberFormatter = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

async function drawUnit(context: CanvasRenderingContext2D,
                        battle: Nullable<Battle>,
                        unit: Nullable<TeamUnit>,
                        x: number,
                        y: number) {

    // Thumbnail
    await drawImage({
        context,
        src: Units.getThumbnailURL(unit?.id, unit?.variant),
        x,
        y,
        w: TEAM_MAIN_UNIT_SIZE,
        h: TEAM_MAIN_UNIT_SIZE,
        borderRadius: 5
    });

    // Boost & boost overlay
    if (unit?.id) {
        const boost = Battles.getBoost(unit.id, battle?.boosters);
        if (!isNullish(boost)) {

            drawBox({
                context,
                x,
                y,
                w: TEAM_MAIN_UNIT_SIZE,
                h: TEAM_MAIN_UNIT_SIZE,
                fillColor: '#ffd12580',
                borderRadius: 5
            });

            drawText({
                context,
                text: `${ boost.toFixed(2) }x`,
                x: x + 5,
                y: y,
                w: TEAM_MAIN_UNIT_SIZE,
                h: TEAM_MAIN_UNIT_SIZE - 5,
                color: '#ffc400',
                bold: true,
                horizontalAlign: 'left',
                verticalAlign: 'bottom',
                size: 10,
                strokeColor: '#000000'
            });

        }
    }

    // Support
    if (unit?.support) {
        await drawImage({
            context,
            src: Units.getThumbnailURL(unit?.support),
            x: x + TEAM_MAIN_UNIT_SIZE - TEAM_SUPPORT_UNIT_SIZE + TEAM_SUPPORT_UNIT_OFFSET,
            y: y + TEAM_MAIN_UNIT_SIZE - TEAM_SUPPORT_UNIT_SIZE + TEAM_SUPPORT_UNIT_OFFSET,
            w: TEAM_SUPPORT_UNIT_SIZE,
            h: TEAM_SUPPORT_UNIT_SIZE,
            borderRadius: 5
        });
    }

}

function drawBox(o: DrawBoxOptions) {

    o.context.beginPath();
    o.context.roundRect(o.x, o.y, o.w, o.h, o.borderRadius ?? 0);

    if (o.fillColor) {
        o.context.fillStyle = o.fillColor;
        o.context.fill();
    }

    if (o.borderColor) {
        o.context.lineWidth = 1;
        o.context.strokeStyle = o.borderColor;
        o.context.stroke();
    }

}

function drawText(o: DrawTextOptions) {

    const fontBold = o.bold ? 'bold' : '';
    const fontSize = o.size ?? 14;
    o.context.font = `${ fontBold } ${ fontSize }px sans-serif`;

    // Attempt to scale the font size down to make it fit
    // If we hit the minimum font size and the text still doesn't fit, we revert
    // back to the original font size and let fillText's minimumWidth handle it
    const textWidth = o.context.measureText(o.text).width;
    if (textWidth > o.w) {

        const newSize = Math.max(9, Math.floor(fontSize * o.w / textWidth));
        o.context.font = `${ fontBold } ${ newSize }px sans-serif`;

        if (o.context.measureText(o.text).width > o.w)
            o.context.font = `${ fontBold } ${ fontSize }px sans-serif`;

    }

    const horizontalAlignment = o.horizontalAlign ?? 'center';
    const verticalAlignment = o.verticalAlign ?? 'middle';
    o.context.textAlign = horizontalAlignment;
    o.context.textBaseline = verticalAlignment;

    const x = o.x + (horizontalAlignment === 'center' ? o.w / 2 : (horizontalAlignment === 'right' ? o.w : 0));
    const y = o.y + (verticalAlignment === 'middle' ? o.h / 2 : (verticalAlignment === 'bottom' ? o.h : 0));

    o.context.fillStyle = o.color ?? '#ffffff';

    if (o.strokeColor) {
        o.context.strokeStyle = o.strokeColor;
        o.context.lineWidth = (o.strokeWidth ?? 2) * 2;
        o.context.lineJoin = 'round';
        o.context.strokeText(o.text, x, y, o.w);
    }

    o.context.fillText(o.text, x, y, o.w);

}

async function drawImage(o: DrawImageOptions) {

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = o.src;
    await image.decode();

    o.context.save();
    o.context.beginPath();
    o.context.roundRect(o.x, o.y, o.w, o.h, o.borderRadius ?? 0);
    o.context.clip();
    o.context.drawImage(image, o.x, o.y, o.w, o.h);
    o.context.restore();
}

function getBoosterLabel(booster: Booster): Nullable<string> {
    if (Numbers.isPositive(booster.pureMultiplier))
        return `${ numberFormatter.format(booster.pureMultiplier!!) }x boost`;
    if (Numbers.isPositive(booster.additiveMultiplier))
        return `${ numberFormatter.format(booster.additiveMultiplier!!) }x boost`;
    return null;
}

/*-----
  Types
  -----*/

interface BaseDrawOptions {
    context: CanvasRenderingContext2D;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface DrawBoxOptions extends BaseDrawOptions {
    fillColor?: Nullable<string>;
    borderColor?: Nullable<string>;
    borderRadius?: Nullable<number>;
}

interface DrawImageOptions extends BaseDrawOptions {
    src: string;
    borderRadius?: Nullable<number>;
}

interface DrawTextOptions extends BaseDrawOptions {
    text: string;
    size?: Nullable<number>;
    color?: Nullable<string>;
    bold?: Nullable<boolean>;
    strokeColor?: Nullable<string>;
    strokeWidth?: Nullable<number>;
    horizontalAlign?: Nullable<CanvasTextAlign>;
    verticalAlign?: Nullable<CanvasTextBaseline>;
}
