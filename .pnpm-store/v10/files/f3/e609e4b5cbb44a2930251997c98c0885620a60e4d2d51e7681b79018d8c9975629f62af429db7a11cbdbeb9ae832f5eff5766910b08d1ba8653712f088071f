/// <reference types="colorette" />
export type LogLevel = 'trace' | 'debug' | 'info' | 'http' | 'warn' | 'error' | 'fatal';
export type LevelCode = number;
export declare function calculateLevel(levelCode: LevelCode): LogLevel;
export declare const levelsColors: {
    fatal: import("colorette").Color;
    error: import("colorette").Color;
    warn: import("colorette").Color;
    http: import("colorette").Color;
    info: import("colorette").Color;
    debug: import("colorette").Color;
    trace: import("colorette").Color;
};
declare enum ARROWS {
    LEFT = "<--",
    RIGHT = "-->",
    EQUAL = "-=-",
    NEUTRAL = "---"
}
export declare const subSystemLevels: {
    color: {
        in: string;
        out: string;
        auth: string;
        fs: string;
        default: string;
    };
    white: {
        in: ARROWS;
        out: ARROWS;
        auth: ARROWS;
        fs: ARROWS;
        default: ARROWS;
    };
};
export {};
