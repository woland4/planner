import { EolStyle, Formatter, FracturedJsonOptions, NumberListAlignment, TableCommaPlacement } from 'fracturedjsonjs';

import { Units } from '@/utils/units.ts';
import { Battles } from '@/utils/battles.ts';

import type { Battle, Team, TeamUnit } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import { isNullish } from 'remeda';

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

        const height = (
            CANVAS_HEIGHT +
            (boost ?? 0 > 1 ? 30 + GAP : 0) +
            (title?.length ? 20 + GAP : 0)
        );

        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = height;

        const context = canvas.getContext('2d')!!;

        let y = PADDING;

        // Background
        drawBox({
            context,
            x: 0,
            y: 0,
            w: CANVAS_WIDTH,
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
                w: CANVAS_WIDTH - PADDING * 2,
                h: 20,
                color: '#ffffff',
                bold: true
            });

            y += 20 + PADDING;

        }

        // Team
        for (let i=0; i<6; ++i) {

            const unitX = (i > 2 ? PADDING : PADDING + MAIN_UNIT_SIZE + GAP);

            let unitY = y;
            if (i !== 0 && i !== 5) unitY += (MAIN_UNIT_SIZE + GAP);
            if (i === 2 || i === 3) unitY += (MAIN_UNIT_SIZE + GAP);

            await drawUnit(context, battle, team.units[i], unitX, unitY);

        }
        y += (GAP * 3 + MAIN_UNIT_SIZE * 3);

        // Boost
        if (boost ?? 0 > 1) {

            drawBox({
                context,
                x: PADDING,
                y,
                w: CANVAS_WIDTH - PADDING * 2,
                h: 30,
                fillColor: '#0d2c33',
                borderColor: '#0b5943',
                borderRadius: 5
            });

            drawText({
                context,
                text: `Boost: ${ boost!!.toFixed(2) }x`,
                x: PADDING,
                y: y,
                w: CANVAS_WIDTH - PADDING * 2,
                h: 32,
                color: '#05df72',
                bold: true
            })

        }

        return new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))

    }

}

/*-------------
  Configuration
  -------------*/

const PADDING = 15;

const GAP = 15;

const MAIN_UNIT_SIZE = 112;

const SUPPORT_UNIT_SIZE = 50;
const SUPPORT_UNIT_OFFSET = 5; // Relative to the bottom right corner

const CANVAS_WIDTH = (MAIN_UNIT_SIZE * 2 + GAP + PADDING * 2);
const CANVAS_HEIGHT = (MAIN_UNIT_SIZE * 3 + GAP * 2 + PADDING * 2);

/*-------
  Helpers
  -------*/

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
        w: MAIN_UNIT_SIZE,
        h: MAIN_UNIT_SIZE,
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
                w: MAIN_UNIT_SIZE,
                h: MAIN_UNIT_SIZE,
                fillColor: '#ffd12580',
                borderRadius: 5
            });

            drawText({
                context,
                text: `${ boost.toFixed(2) }x`,
                x: x + 5,
                y: y,
                w: MAIN_UNIT_SIZE,
                h: MAIN_UNIT_SIZE - 5,
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
            x: x + MAIN_UNIT_SIZE - SUPPORT_UNIT_SIZE + SUPPORT_UNIT_OFFSET,
            y: y + MAIN_UNIT_SIZE - SUPPORT_UNIT_SIZE + SUPPORT_UNIT_OFFSET,
            w: SUPPORT_UNIT_SIZE,
            h: SUPPORT_UNIT_SIZE,
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
