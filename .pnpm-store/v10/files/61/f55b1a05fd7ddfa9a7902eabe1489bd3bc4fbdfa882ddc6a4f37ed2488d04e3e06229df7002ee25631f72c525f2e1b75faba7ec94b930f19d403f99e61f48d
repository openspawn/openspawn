import { LevelCode } from './levels';
import { PrettyOptionsExtended } from './types';
export interface ObjectTemplate {
    level: LevelCode;
    msg: string;
    sub?: string;
    [key: string]: string | number | object | null | void;
}
export declare function fillInMsgTemplate(msg: string, templateOptions: ObjectTemplate, colors: boolean): string;
export declare function printMessage(templateObjects: ObjectTemplate, options: Pick<PrettyOptionsExtended, 'prettyStamp'>, hasColors: boolean): string;
