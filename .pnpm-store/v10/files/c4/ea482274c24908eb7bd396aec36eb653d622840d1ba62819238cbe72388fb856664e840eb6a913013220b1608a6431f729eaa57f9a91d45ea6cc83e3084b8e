/// <reference types="node" />
import { Logger, LoggerConfigItem, LoggerFormat } from '@verdaccio/types';
export type LogPlugin = {
    dest: string;
    options?: any[];
};
export declare function createLogger(options: LoggerConfigItem | undefined, destination: NodeJS.WritableStream | undefined, format: LoggerFormat | undefined, pino: any): any;
export type LoggerConfig = LoggerConfigItem;
export declare function prepareSetup(options: LoggerConfigItem | undefined, pino: any): Logger;
export declare let logger: Logger;
export declare function setup(options: LoggerConfigItem, pino: any): Logger;
