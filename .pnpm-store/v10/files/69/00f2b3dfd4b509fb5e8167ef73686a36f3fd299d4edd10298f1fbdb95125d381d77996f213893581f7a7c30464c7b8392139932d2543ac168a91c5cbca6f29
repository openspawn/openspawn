import debug from "debug";
export declare class LoggerContext {
    private indent;
    private maxIdLength;
    private idUpdateFns;
    private logger;
    private firstLoggerAt;
    down(time: number): void;
    up(time: number): number | undefined;
    getTime(): number;
    getIndent(): {
        level: number;
        str: string;
        times: number[];
    };
    register(id: string, idUpdateFn: (len: number) => void): debug.Debugger;
    private updateIndent;
}
export declare class Logger {
    private id;
    private context;
    isEnabled: boolean;
    private debug;
    private idPrefix;
    constructor(id: string, context: LoggerContext);
    log(msg: string | (() => string), prefix?: string): void;
    group(msg: string | (() => string)): void;
    groupEnd(msg?: string | (() => string)): void;
    create(id: string): Logger;
    private _log;
    private _updateIdPrefix;
}
//# sourceMappingURL=logger.d.ts.map