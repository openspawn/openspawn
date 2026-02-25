import debug from "debug";
const originalFormatArgs = debug.formatArgs;
debug.formatArgs = function (args) {
    originalFormatArgs.call(this, args);
    const line = args[0];
    const noColorsPrefix = ` ${this.namespace} `;
    const colorsPrefix = `${this.namespace}`;
    const noColorsStartsAt = line.indexOf(noColorsPrefix);
    if (noColorsStartsAt > -1) {
        args[0] = line.slice(noColorsStartsAt + noColorsPrefix.length);
    }
    else {
        const colorsStartsAt = line.indexOf(colorsPrefix);
        args[0] = line.slice(colorsStartsAt + colorsPrefix.length);
    }
};
export class LoggerContext {
    indent = {
        level: 0,
        str: "",
        times: [],
    };
    maxIdLength = 0;
    idUpdateFns = [];
    logger = debug("composition");
    firstLoggerAt = 0;
    down(time) {
        this.updateIndent(+1, time);
    }
    up(time) {
        if (this.indent.level > 0) {
            this.updateIndent(-1, time);
            return this.indent.times.pop();
        }
    }
    getTime() {
        if (!this.firstLoggerAt) {
            this.firstLoggerAt = Date.now();
            return 0;
        }
        return Date.now() - this.firstLoggerAt;
    }
    getIndent() {
        return this.indent;
    }
    register(id, idUpdateFn) {
        idUpdateFn(this.maxIdLength);
        this.idUpdateFns.push(idUpdateFn);
        const newMaxIdLength = Math.max(this.maxIdLength, id.length);
        if (newMaxIdLength > this.maxIdLength) {
            this.maxIdLength = newMaxIdLength;
            this.idUpdateFns.forEach((fn) => fn(newMaxIdLength));
        }
        return this.logger.extend(id);
    }
    updateIndent(delta, time) {
        if (this.indent.level + delta < 0) {
            return;
        }
        if (delta > 0) {
            this.indent.times.push(time);
        }
        this.indent.level += delta;
        this.indent.str = "│ ".repeat(this.indent.level);
    }
}
export class Logger {
    id;
    context;
    isEnabled;
    debug;
    idPrefix;
    constructor(id, context) {
        this.id = id;
        this.context = context;
        this.id = id;
        this.context = context;
        this.idPrefix = `${id}`;
        this.debug = this.context.register(this.id, this._updateIdPrefix.bind(this));
        this.isEnabled = this.debug.enabled;
        this.debug.log = console.log;
    }
    log(msg, prefix = "- ") {
        if (this.isEnabled) {
            this._log(prefix, msg);
        }
    }
    group(msg) {
        if (this.isEnabled) {
            this.log(msg, "┌ ");
            this.context.down(Date.now());
        }
    }
    groupEnd(msg) {
        if (this.isEnabled) {
            const time = this.context.up(Date.now());
            let message = msg ? (typeof msg === "string" ? msg : msg()) : "";
            if (time) {
                message += ` (${Date.now() - time}ms)`;
            }
            this.log(message, "└ ");
        }
    }
    create(id) {
        return new Logger(id, this.context);
    }
    _log(prefix, msg) {
        const indent = this.context.getIndent().str;
        const message = typeof msg === "string" ? msg : msg();
        if (this.isEnabled) {
            const sinceStart = this.context.getTime();
            const text = this.idPrefix + " " + indent + prefix + message + ` +${sinceStart}ms`;
            this.debug(text);
        }
    }
    _updateIdPrefix(maxLength) {
        this.idPrefix = this.id.padEnd(maxLength, " ");
    }
}
