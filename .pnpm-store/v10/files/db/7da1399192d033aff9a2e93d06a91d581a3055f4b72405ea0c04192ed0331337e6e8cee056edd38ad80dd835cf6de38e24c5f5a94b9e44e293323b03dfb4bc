/// <reference types="node" />
import { Transform } from 'node:stream';
import build from 'pino-abstract-transport';
import { fillInMsgTemplate } from './formatter';
import { PrettyOptionsExtended } from './types';
export { fillInMsgTemplate };
export declare function hasColors(colors: boolean | undefined): boolean;
export declare function buildPretty(opts: PrettyOptionsExtended): (chunk: any) => string;
export default function (opts: any): Promise<Transform & build.OnUnknown> & Transform & build.OnUnknown & Promise<Transform>;
