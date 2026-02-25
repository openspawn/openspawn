"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js
var require_ms = __commonJS({
  "../../node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// ../../node_modules/.pnpm/debug@4.4.1_supports-color@5.5.0/node_modules/debug/src/common.js
var require_common = __commonJS({
  "../../node_modules/.pnpm/debug@4.4.1_supports-color@5.5.0/node_modules/debug/src/common.js"(exports2, module2) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug2(...args) {
          if (!debug2.enabled) {
            return;
          }
          const self = debug2;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug2.namespace = namespace;
        debug2.useColors = createDebug.useColors();
        debug2.color = createDebug.selectColor(namespace);
        debug2.extend = extend;
        debug2.destroy = createDebug.destroy;
        Object.defineProperty(debug2, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v2) => {
            enableOverride = v2;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug2);
        }
        return debug2;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search3, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search3.length) {
          if (templateIndex < template.length && (template[templateIndex] === search3[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module2.exports = setup;
  }
});

// ../../node_modules/.pnpm/debug@4.4.1_supports-color@5.5.0/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "../../node_modules/.pnpm/debug@4.4.1_supports-color@5.5.0/node_modules/debug/src/browser.js"(exports2, module2) {
    exports2.formatArgs = formatArgs;
    exports2.save = save5;
    exports2.load = load5;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c2 = "color: " + this.color;
      args.splice(1, 0, c2, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c2);
    }
    exports2.log = console.debug || console.log || (() => {
    });
    function save5(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load5() {
      let r;
      try {
        r = exports2.storage.getItem("debug") || exports2.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.j = function(v2) {
      try {
        return JSON.stringify(v2);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// ../../node_modules/.pnpm/has-flag@3.0.0/node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "../../node_modules/.pnpm/has-flag@3.0.0/node_modules/has-flag/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (flag, argv) => {
      argv = argv || process.argv;
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const pos = argv.indexOf(prefix + flag);
      const terminatorPos = argv.indexOf("--");
      return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
    };
  }
});

// ../../node_modules/.pnpm/supports-color@5.5.0/node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "../../node_modules/.pnpm/supports-color@5.5.0/node_modules/supports-color/index.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var hasFlag = require_has_flag();
    var env = process.env;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false")) {
      forceColor = false;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = true;
    }
    if ("FORCE_COLOR" in env) {
      forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(stream) {
      if (forceColor === false) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (stream && !stream.isTTY && forceColor !== true) {
        return 0;
      }
      const min = forceColor ? 1 : 0;
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(process.versions.node.split(".")[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      if (env.TERM === "dumb") {
        return min;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream);
      return translateLevel(level);
    }
    module2.exports = {
      supportsColor: getSupportLevel,
      stdout: getSupportLevel(process.stdout),
      stderr: getSupportLevel(process.stderr)
    };
  }
});

// ../../node_modules/.pnpm/debug@4.4.1_supports-color@5.5.0/node_modules/debug/src/node.js
var require_node = __commonJS({
  "../../node_modules/.pnpm/debug@4.4.1_supports-color@5.5.0/node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty");
    var util = require("util");
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save5;
    exports2.load = load5;
    exports2.useColors = useColors;
    exports2.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require_supports_color();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports2.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c2 = this.color;
        const colorCode = "\x1B[3" + (c2 < 8 ? c2 : "8;5;" + c2);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports2.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports2.inspectOpts, ...args) + "\n");
    }
    function save5(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load5() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.o = function(v2) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v2, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v2) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v2, this.inspectOpts);
    };
  }
});

// ../../node_modules/.pnpm/debug@4.4.1_supports-color@5.5.0/node_modules/debug/src/index.js
var require_src = __commonJS({
  "../../node_modules/.pnpm/debug@4.4.1_supports-color@5.5.0/node_modules/debug/src/index.js"(exports2, module2) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  SearchMemoryIndexer: () => indexer_default
});
module.exports = __toCommonJS(index_exports);

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/tokenizer/languages.js
var STEMMERS = {
  arabic: "ar",
  armenian: "am",
  bulgarian: "bg",
  danish: "dk",
  dutch: "nl",
  english: "en",
  finnish: "fi",
  french: "fr",
  german: "de",
  greek: "gr",
  hungarian: "hu",
  indian: "in",
  indonesian: "id",
  irish: "ie",
  italian: "it",
  lithuanian: "lt",
  nepali: "np",
  norwegian: "no",
  portuguese: "pt",
  romanian: "ro",
  russian: "ru",
  serbian: "rs",
  slovenian: "ru",
  spanish: "es",
  swedish: "se",
  tamil: "ta",
  turkish: "tr",
  ukrainian: "uk"
};
var SPLITTERS = {
  dutch: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  english: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  french: /[^a-z0-9äâàéèëêïîöôùüûœç-]+/gim,
  italian: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  norwegian: /[^a-z0-9_æøåÆØÅäÄöÖüÜ]+/gim,
  portuguese: /[^a-z0-9à-úÀ-Ú]/gim,
  russian: /[^a-z0-9а-яА-ЯёЁ]+/gim,
  spanish: /[^a-z0-9A-Zá-úÁ-ÚñÑüÜ]+/gim,
  swedish: /[^a-z0-9_åÅäÄöÖüÜ-]+/gim,
  german: /[^a-z0-9A-ZäöüÄÖÜß]+/gim,
  finnish: /[^a-z0-9äöÄÖ]+/gim,
  danish: /[^a-z0-9æøåÆØÅ]+/gim,
  hungarian: /[^a-z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+/gim,
  romanian: /[^a-z0-9ăâîșțĂÂÎȘȚ]+/gim,
  serbian: /[^a-z0-9čćžšđČĆŽŠĐ]+/gim,
  turkish: /[^a-z0-9çÇğĞıİöÖşŞüÜ]+/gim,
  lithuanian: /[^a-z0-9ąčęėįšųūžĄČĘĖĮŠŲŪŽ]+/gim,
  arabic: /[^a-z0-9أ-ي]+/gim,
  nepali: /[^a-z0-9अ-ह]+/gim,
  irish: /[^a-z0-9áéíóúÁÉÍÓÚ]+/gim,
  indian: /[^a-z0-9अ-ह]+/gim,
  armenian: /[^a-z0-9ա-ֆ]+/gim,
  greek: /[^a-z0-9α-ωά-ώ]+/gim,
  indonesian: /[^a-z0-9]+/gim,
  ukrainian: /[^a-z0-9а-яА-ЯіїєІЇЄ]+/gim,
  slovenian: /[^a-z0-9čžšČŽŠ]+/gim,
  bulgarian: /[^a-z0-9а-яА-Я]+/gim,
  tamil: /[^a-z0-9அ-ஹ]+/gim
};
var SUPPORTED_LANGUAGES = Object.keys(STEMMERS);

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/utils.js
var baseId = Date.now().toString().slice(5);
var lastId = 0;
var nano = BigInt(1e3);
var milli = BigInt(1e6);
var second = BigInt(1e9);
var MAX_ARGUMENT_FOR_STACK = 65535;
function safeArrayPush(arr, newArr) {
  if (newArr.length < MAX_ARGUMENT_FOR_STACK) {
    Array.prototype.push.apply(arr, newArr);
  } else {
    for (let i = 0; i < newArr.length; i += MAX_ARGUMENT_FOR_STACK) {
      Array.prototype.push.apply(arr, newArr.slice(i, i + MAX_ARGUMENT_FOR_STACK));
    }
  }
}
function sprintf(template, ...args) {
  return template.replace(/%(?:(?<position>\d+)\$)?(?<width>-?\d*\.?\d*)(?<type>[dfs])/g, function(...replaceArgs) {
    const groups = replaceArgs[replaceArgs.length - 1];
    const { width: rawWidth, type, position } = groups;
    const replacement = position ? args[Number.parseInt(position) - 1] : args.shift();
    const width = rawWidth === "" ? 0 : Number.parseInt(rawWidth);
    switch (type) {
      case "d":
        return replacement.toString().padStart(width, "0");
      case "f": {
        let value = replacement;
        const [padding, precision] = rawWidth.split(".").map((w) => Number.parseFloat(w));
        if (typeof precision === "number" && precision >= 0) {
          value = value.toFixed(precision);
        }
        return typeof padding === "number" && padding >= 0 ? value.toString().padStart(width, "0") : value.toString();
      }
      case "s":
        return width < 0 ? replacement.toString().padEnd(-width, " ") : replacement.toString().padStart(width, " ");
      default:
        return replacement;
    }
  });
}
async function formatNanoseconds(value) {
  if (typeof value === "number") {
    value = BigInt(value);
  }
  if (value < nano) {
    return `${value}ns`;
  } else if (value < milli) {
    return `${value / nano}\u03BCs`;
  } else if (value < second) {
    return `${value / milli}ms`;
  }
  return `${value / second}s`;
}
async function getNanosecondsTime() {
  if (typeof process !== "undefined" && process.hrtime !== void 0) {
    return process.hrtime.bigint();
  }
  if (typeof performance !== "undefined") {
    return BigInt(Math.floor(performance.now() * 1e6));
  }
  return BigInt(0);
}
async function uniqueId() {
  return `${baseId}-${lastId++}`;
}
function getOwnProperty(object, property) {
  if (Object.hasOwn === void 0) {
    return Object.prototype.hasOwnProperty.call(object, property) ? object[property] : void 0;
  }
  return Object.hasOwn(object, property) ? object[property] : void 0;
}
function sortTokenScorePredicate(a, b) {
  if (b[1] === a[1]) {
    return a[0] - b[0];
  }
  return b[1] - a[1];
}
function intersect(arrays) {
  if (arrays.length === 0) {
    return [];
  } else if (arrays.length === 1) {
    return arrays[0];
  }
  for (let i = 1; i < arrays.length; i++) {
    if (arrays[i].length < arrays[0].length) {
      const tmp = arrays[0];
      arrays[0] = arrays[i];
      arrays[i] = tmp;
    }
  }
  const set = /* @__PURE__ */ new Map();
  for (const elem of arrays[0]) {
    set.set(elem, 1);
  }
  for (let i = 1; i < arrays.length; i++) {
    let found = 0;
    for (const elem of arrays[i]) {
      const count2 = set.get(elem);
      if (count2 === i) {
        set.set(elem, count2 + 1);
        found++;
      }
    }
    if (found === 0) return [];
  }
  return arrays[0].filter((e) => {
    const count2 = set.get(e);
    if (count2 !== void 0) set.set(e, 0);
    return count2 === arrays.length;
  });
}
async function getDocumentProperties(doc, paths) {
  const properties = {};
  const pathsLength = paths.length;
  for (let i = 0; i < pathsLength; i++) {
    const path = paths[i];
    const pathTokens = path.split(".");
    let current = doc;
    const pathTokensLength = pathTokens.length;
    for (let j = 0; j < pathTokensLength; j++) {
      current = current[pathTokens[j]];
      if (typeof current === "object" && !Array.isArray(current) && current !== null && j === pathTokensLength - 1) {
        current = void 0;
        break;
      } else if ((current === null || typeof current !== "object") && j < pathTokensLength - 1) {
        current = void 0;
        break;
      }
    }
    if (typeof current !== "undefined") {
      properties[path] = current;
    }
  }
  return properties;
}
async function getNested(obj, path) {
  const props = await getDocumentProperties(obj, [
    path
  ]);
  return props[path];
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/errors.js
var allLanguages = SUPPORTED_LANGUAGES.join("\n - ");
var errors = {
  NO_LANGUAGE_WITH_CUSTOM_TOKENIZER: "Do not pass the language option to create when using a custom tokenizer.",
  LANGUAGE_NOT_SUPPORTED: `Language "%s" is not supported.
Supported languages are:
 - ${allLanguages}`,
  INVALID_STEMMER_FUNCTION_TYPE: `config.stemmer property must be a function.`,
  MISSING_STEMMER: `As of version 1.0.0 @orama/orama does not ship non English stemmers by default. To solve this, please explicitly import and specify the "%s" stemmer from the package @orama/stemmers. See https://docs.oramasearch.com/text-analysis/stemming for more information.`,
  CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY: "Custom stop words array must only contain strings.",
  UNSUPPORTED_COMPONENT: `Unsupported component "%s".`,
  COMPONENT_MUST_BE_FUNCTION: `The component "%s" must be a function.`,
  COMPONENT_MUST_BE_FUNCTION_OR_ARRAY_FUNCTIONS: `The component "%s" must be a function or an array of functions.`,
  INVALID_SCHEMA_TYPE: `Unsupported schema type "%s" at "%s". Expected "string", "boolean" or "number" or array of them.`,
  DOCUMENT_ID_MUST_BE_STRING: `Document id must be of type "string". Got "%s" instead.`,
  DOCUMENT_ALREADY_EXISTS: `A document with id "%s" already exists.`,
  DOCUMENT_DOES_NOT_EXIST: `A document with id "%s" does not exists.`,
  MISSING_DOCUMENT_PROPERTY: `Missing searchable property "%s".`,
  INVALID_DOCUMENT_PROPERTY: `Invalid document property "%s": expected "%s", got "%s"`,
  UNKNOWN_INDEX: `Invalid property name "%s". Expected a wildcard string ("*") or array containing one of the following properties: %s`,
  INVALID_BOOST_VALUE: `Boost value must be a number greater than, or less than 0.`,
  INVALID_FILTER_OPERATION: `You can only use one operation per filter, you requested %d.`,
  SCHEMA_VALIDATION_FAILURE: `Cannot insert document due schema validation failure on "%s" property.`,
  INVALID_SORT_SCHEMA_TYPE: `Unsupported sort schema type "%s" at "%s". Expected "string" or "number".`,
  CANNOT_SORT_BY_ARRAY: `Cannot configure sort for "%s" because it is an array (%s).`,
  UNABLE_TO_SORT_ON_UNKNOWN_FIELD: `Unable to sort on unknown field "%s". Allowed fields: %s`,
  SORT_DISABLED: `Sort is disabled. Please read the documentation at https://docs.oramasearch for more information.`,
  UNKNOWN_GROUP_BY_PROPERTY: `Unknown groupBy property "%s".`,
  INVALID_GROUP_BY_PROPERTY: `Invalid groupBy property "%s". Allowed types: "%s", but given "%s".`,
  UNKNOWN_FILTER_PROPERTY: `Unknown filter property "%s".`,
  INVALID_VECTOR_SIZE: `Vector size must be a number greater than 0. Got "%s" instead.`,
  INVALID_VECTOR_VALUE: `Vector value must be a number greater than 0. Got "%s" instead.`,
  INVALID_INPUT_VECTOR: `Property "%s" was declared as a %s-dimentional vector, but got a %s-dimentional vector instead.
Input vectors must be of the size declared in the schema, as calculating similarity between vectors of different sizes can lead to unexpected results.`,
  WRONG_SEARCH_PROPERTY_TYPE: `Property "%s" is not searchable. Only "string" properties are searchable.`
};
function createError(code, ...args) {
  const error = new Error(sprintf(errors[code] ?? `Unsupported Orama Error code: ${code}`, ...args));
  error.code = code;
  if ("captureStackTrace" in Error.prototype) {
    Error.captureStackTrace(error);
  }
  return error;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/defaults.js
async function formatElapsedTime(n) {
  return {
    raw: Number(n),
    formatted: await formatNanoseconds(n)
  };
}
async function getDocumentIndexId(doc) {
  if (doc.id) {
    if (typeof doc.id !== "string") {
      throw createError("DOCUMENT_ID_MUST_BE_STRING", typeof doc.id);
    }
    return doc.id;
  }
  return await uniqueId();
}
async function validateSchema(doc, schema) {
  for (const [prop, type] of Object.entries(schema)) {
    const value = doc[prop];
    const typeOfValue = typeof value;
    if (typeOfValue === "undefined") {
      continue;
    }
    if (type === "enum" && (typeOfValue === "string" || typeOfValue === "number")) {
      continue;
    }
    const typeOfType = typeof type;
    if (isVectorType(type)) {
      const vectorSize = getVectorSize(type);
      if (!Array.isArray(value) || value.length !== vectorSize) {
        throw createError("INVALID_INPUT_VECTOR", prop, vectorSize, value.length);
      }
      continue;
    }
    if (typeOfType === "string" && isArrayType(type)) {
      if (!Array.isArray(value)) {
        return prop;
      }
      const expectedType = getInnerType(type);
      const valueLength = value.length;
      for (let i = 0; i < valueLength; i++) {
        if (typeof value[i] !== expectedType) {
          return prop + "." + i;
        }
      }
      continue;
    }
    if (typeOfType === "object") {
      if (!value || typeOfValue !== "object") {
        return prop;
      }
      const subProp = await validateSchema(value, type);
      if (subProp) {
        return prop + "." + subProp;
      }
      continue;
    }
    if (typeOfValue !== type) {
      return prop;
    }
  }
  return void 0;
}
var IS_ARRAY_TYPE = {
  string: false,
  number: false,
  boolean: false,
  enum: false,
  "string[]": true,
  "number[]": true,
  "boolean[]": true
};
var INNER_TYPE = {
  "string[]": "string",
  "number[]": "number",
  "boolean[]": "boolean"
};
function isVectorType(type) {
  return /^vector\[\d+\]$/.test(type);
}
function isArrayType(type) {
  return IS_ARRAY_TYPE[type];
}
function getInnerType(type) {
  return INNER_TYPE[type];
}
function getVectorSize(type) {
  const size = Number(type.slice(7, -1));
  switch (true) {
    case isNaN(size):
      throw createError("INVALID_VECTOR_VALUE", type);
    case size <= 0:
      throw createError("INVALID_VECTOR_SIZE", type);
    default:
      return size;
  }
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/internal-document-id-store.js
function createInternalDocumentIDStore() {
  return {
    idToInternalId: /* @__PURE__ */ new Map(),
    internalIdToId: [],
    save,
    load
  };
}
function save(store2) {
  return {
    internalIdToId: store2.internalIdToId
  };
}
function load(orama, raw) {
  const { internalIdToId } = raw;
  orama.internalDocumentIDStore.idToInternalId.clear();
  orama.internalDocumentIDStore.internalIdToId = [];
  for (let i = 0; i < internalIdToId.length; i++) {
    orama.internalDocumentIDStore.idToInternalId.set(internalIdToId[i], i + 1);
    orama.internalDocumentIDStore.internalIdToId.push(internalIdToId[i]);
  }
}
function getInternalDocumentId(store2, id) {
  if (typeof id === "string") {
    const internalId = store2.idToInternalId.get(id);
    if (internalId) {
      return internalId;
    }
    const currentId = store2.idToInternalId.size + 1;
    store2.idToInternalId.set(id, currentId);
    store2.internalIdToId.push(id);
    return currentId;
  }
  if (id > store2.internalIdToId.length) {
    return getInternalDocumentId(store2, id.toString());
  }
  return id;
}
function getDocumentIdFromInternalId(store2, internalId) {
  if (store2.internalIdToId.length < internalId) {
    throw new Error(`Invalid internalId ${internalId}`);
  }
  return store2.internalIdToId[internalId - 1];
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/documents-store.js
async function create(_, sharedInternalDocumentStore) {
  return {
    sharedInternalDocumentStore,
    docs: {},
    count: 0
  };
}
async function get(store2, id) {
  const internalId = getInternalDocumentId(store2.sharedInternalDocumentStore, id);
  return store2.docs[internalId];
}
async function getMultiple(store2, ids) {
  const found = Array.from({
    length: ids.length
  });
  for (let i = 0; i < ids.length; i++) {
    const internalId = getInternalDocumentId(store2.sharedInternalDocumentStore, ids[i]);
    found[i] = store2.docs[internalId];
  }
  return found;
}
async function getAll(store2) {
  return store2.docs;
}
async function store(store2, id, doc) {
  const internalId = getInternalDocumentId(store2.sharedInternalDocumentStore, id);
  if (typeof store2.docs[internalId] !== "undefined") {
    return false;
  }
  store2.docs[internalId] = doc;
  store2.count++;
  return true;
}
async function remove(store2, id) {
  const internalId = getInternalDocumentId(store2.sharedInternalDocumentStore, id);
  if (typeof store2.docs[internalId] === "undefined") {
    return false;
  }
  delete store2.docs[internalId];
  store2.count--;
  return true;
}
async function count(store2) {
  return store2.count;
}
async function load2(sharedInternalDocumentStore, raw) {
  const rawDocument = raw;
  return {
    docs: rawDocument.docs,
    count: rawDocument.count,
    sharedInternalDocumentStore
  };
}
async function save2(store2) {
  return {
    docs: store2.docs,
    count: store2.count
  };
}
async function createDocumentsStore() {
  return {
    create,
    get,
    getMultiple,
    getAll,
    store,
    remove,
    count,
    load: load2,
    save: save2
  };
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/hooks.js
var OBJECT_COMPONENTS = [
  "tokenizer",
  "index",
  "documentsStore",
  "sorter"
];
var FUNCTION_COMPONENTS = [
  "validateSchema",
  "getDocumentIndexId",
  "getDocumentProperties",
  "formatElapsedTime"
];
var SINGLE_OR_ARRAY_COMPONENTS = [
  "beforeInsert",
  "afterInsert",
  "beforeRemove",
  "afterRemove",
  "beforeUpdate",
  "afterUpdate",
  "afterSearch",
  "beforeMultipleInsert",
  "afterMultipleInsert",
  "beforeMultipleRemove",
  "afterMultipleRemove",
  "beforeMultipleUpdate",
  "afterMultipleUpdate"
];
async function runSingleHook(hooks, orama, id, doc) {
  const hooksLength = hooks.length;
  for (let i = 0; i < hooksLength; i++) {
    await hooks[i](orama, id, doc);
  }
}
async function runAfterSearch(hooks, db, params, language, results) {
  const hooksLength = hooks.length;
  for (let i = 0; i < hooksLength; i++) {
    await hooks[i](db, params, language, results);
  }
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/trees/avl.js
var BALANCE_STATE = {
  UNBALANCED_RIGHT: -2,
  SLIGHTLY_UNBALANCED_RIGHT: -1,
  BALANCED: 0,
  SLIGHTLY_UNBALANCED_LEFT: 1,
  UNBALANCED_LEFT: 2
};
function getHeight(node) {
  return node ? node.height : -1;
}
function rotateLeft(node) {
  const right = node.right;
  node.right = right.left;
  right.left = node;
  node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1;
  right.height = Math.max(getHeight(right.left), getHeight(right.right)) + 1;
  return right;
}
function rotateRight(node) {
  const left = node.left;
  node.left = left.right;
  left.right = node;
  node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1;
  left.height = Math.max(getHeight(left.left), getHeight(left.right)) + 1;
  return left;
}
function rangeSearch(node, min, max) {
  if (!node) {
    return [];
  }
  const result = [];
  function traverse(node2) {
    if (!node2) {
      return;
    }
    if (node2.key > min) {
      traverse(node2.left);
    }
    if (node2.key >= min && node2.key <= max) {
      safeArrayPush(result, node2.value);
    }
    if (node2.key < max) {
      traverse(node2.right);
    }
  }
  traverse(node);
  return result;
}
function greaterThan(node, key, inclusive = false) {
  if (!node) {
    return [];
  }
  const result = [];
  function traverse(node2) {
    if (!node2) {
      return;
    }
    if (inclusive && node2.key >= key) {
      safeArrayPush(result, node2.value);
    }
    if (!inclusive && node2.key > key) {
      safeArrayPush(result, node2.value);
    }
    traverse(node2.left);
    traverse(node2.right);
  }
  traverse(node);
  return result;
}
function lessThan(node, key, inclusive = false) {
  if (!node) {
    return [];
  }
  const result = [];
  function traverse(node2) {
    if (!node2) {
      return;
    }
    if (inclusive && node2.key <= key) {
      safeArrayPush(result, node2.value);
    }
    if (!inclusive && node2.key < key) {
      safeArrayPush(result, node2.value);
    }
    traverse(node2.left);
    traverse(node2.right);
  }
  traverse(node);
  return result;
}
function getNodeByKey(node, key) {
  while (node !== null) {
    if (key < node.key) {
      node = node.left;
    } else if (key > node.key) {
      node = node.right;
    } else {
      return node;
    }
  }
  return null;
}
function create2(key, value) {
  return {
    key,
    value,
    left: null,
    right: null,
    height: 0
  };
}
function insert(root, key, value) {
  let parent = null;
  let current = root;
  while (current !== null) {
    parent = current;
    if (key < current.key) {
      current = current.left;
    } else if (key > current.key) {
      current = current.right;
    } else {
      current.value = current.value.concat(value);
      return root;
    }
  }
  const newNode = create2(key, value);
  if (!parent) {
    root = newNode;
  } else if (key < parent.key) {
    parent.left = newNode;
  } else {
    parent.right = newNode;
  }
  current = newNode;
  while (parent) {
    const balanceFactor = getHeight(parent.left) - getHeight(parent.right);
    if (balanceFactor === BALANCE_STATE.UNBALANCED_LEFT) {
      if (key > parent.left.key) {
        parent.left = rotateLeft(parent.left);
      }
      parent = rotateRight(parent);
    }
    if (balanceFactor === BALANCE_STATE.UNBALANCED_RIGHT) {
      if (key < parent.right.key) {
        parent.right = rotateRight(parent.right);
      }
      parent = rotateLeft(parent);
    }
    if (parent === root) {
      break;
    }
    current = parent;
    parent = getNodeParent(root, current.key);
  }
  return root;
}
function getNodeParent(root, key) {
  let current = root;
  let parent = null;
  while (current !== null) {
    if (key < current.key) {
      parent = current;
      current = current.left;
    } else if (key > current.key) {
      parent = current;
      current = current.right;
    } else {
      break;
    }
  }
  return parent;
}
function find(root, key) {
  const node = getNodeByKey(root, key);
  if (!node) {
    return null;
  }
  return node.value;
}
function remove2(root, key) {
  let node = root;
  let parentNode = null;
  while (node && node.key !== key) {
    parentNode = node;
    if (key < node.key) {
      node = node.left;
    } else {
      node = node.right;
    }
  }
  if (!node) {
    return null;
  }
  if (!node.left && !node.right) {
    if (!parentNode) {
      root = null;
    } else {
      if (parentNode.left === node) {
        parentNode.left = null;
      } else {
        parentNode.right = null;
      }
    }
  } else if (node.left && node.right) {
    let minValueNode = node.right;
    let minValueParent = node;
    while (minValueNode.left) {
      minValueParent = minValueNode;
      minValueNode = minValueNode.left;
    }
    node.key = minValueNode.key;
    if (minValueParent === node) {
      minValueParent.right = minValueNode.right;
    } else {
      minValueParent.left = minValueNode.right;
    }
  } else {
    const childNode = node.left ? node.left : node.right;
    if (!parentNode) {
      root = childNode;
    } else {
      if (parentNode.left === node) {
        parentNode.left = childNode;
      } else {
        parentNode.right = childNode;
      }
    }
  }
  return root;
}
function removeDocument(root, id, key) {
  const node = getNodeByKey(root, key);
  if (!node) {
    return;
  }
  if (node.value.length === 1) {
    remove2(root, key);
    return;
  }
  node.value.splice(node.value.indexOf(id), 1);
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/levenshtein.js
function _boundedLevenshtein(a, b, tolerance) {
  if (a === b) {
    return 0;
  }
  const swap = a;
  if (a.length > b.length) {
    a = b;
    b = swap;
  }
  let lenA = a.length;
  let lenB = b.length;
  while (lenA > 0 && a.charCodeAt(~-lenA) === b.charCodeAt(~-lenB)) {
    lenA--;
    lenB--;
  }
  if (!lenA) {
    return lenB > tolerance ? -1 : lenB;
  }
  let startIdx = 0;
  while (startIdx < lenA && a.charCodeAt(startIdx) === b.charCodeAt(startIdx)) {
    startIdx++;
  }
  lenA -= startIdx;
  lenB -= startIdx;
  if (lenA === 0) {
    return lenB > tolerance ? -1 : lenB;
  }
  const delta = lenB - lenA;
  if (tolerance > lenB) {
    tolerance = lenB;
  } else if (delta > tolerance) {
    return -1;
  }
  let i = 0;
  const row = [];
  const characterCodeCache = [];
  while (i < tolerance) {
    characterCodeCache[i] = b.charCodeAt(startIdx + i);
    row[i] = ++i;
  }
  while (i < lenB) {
    characterCodeCache[i] = b.charCodeAt(startIdx + i);
    row[i++] = tolerance + 1;
  }
  const offset = tolerance - delta;
  const haveMax = tolerance < lenB;
  let jStart = 0;
  let jEnd = tolerance;
  let current = 0;
  let left = 0;
  let above = 0;
  let charA = 0;
  let j = 0;
  for (i = 0; i < lenA; i++) {
    left = i;
    current = i + 1;
    charA = a.charCodeAt(startIdx + i);
    jStart += i > offset ? 1 : 0;
    jEnd += jEnd < lenB ? 1 : 0;
    for (j = jStart; j < jEnd; j++) {
      above = current;
      current = left;
      left = row[j];
      if (charA !== characterCodeCache[j]) {
        if (left < current) {
          current = left;
        }
        if (above < current) {
          current = above;
        }
        current++;
      }
      row[j] = current;
    }
    if (haveMax && row[i + delta] > tolerance) {
      return -1;
    }
  }
  return current <= tolerance ? current : -1;
}
function syncBoundedLevenshtein(a, b, tolerance) {
  const distance = _boundedLevenshtein(a, b, tolerance);
  return {
    distance,
    isBounded: distance >= 0
  };
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/trees/radix.js
var Node = class {
  constructor(key, subWord, end) {
    this.key = key;
    this.subWord = subWord;
    this.end = end;
  }
  children = {};
  docs = [];
  word = "";
  toJSON() {
    return {
      word: this.word,
      subWord: this.subWord,
      children: this.children,
      docs: this.docs,
      end: this.end
    };
  }
};
function updateParent(node, parent) {
  node.word = parent.word + node.subWord;
}
function addDocument(node, docID) {
  node.docs.push(docID);
}
function removeDocument2(node, docID) {
  const index = node.docs.indexOf(docID);
  if (index === -1) {
    return false;
  }
  node.docs.splice(index, 1);
  return true;
}
function findAllWords(node, output, term, exact, tolerance) {
  if (node.end) {
    const { word, docs: docIDs } = node;
    if (exact && word !== term) {
      return {};
    }
    if (!getOwnProperty(output, word)) {
      if (tolerance) {
        const difference = Math.abs(term.length - word.length);
        if (difference <= tolerance && syncBoundedLevenshtein(term, word, tolerance).isBounded) {
          output[word] = [];
        }
      } else {
        output[word] = [];
      }
    }
    if (getOwnProperty(output, word) && docIDs.length) {
      const docs = new Set(output[word]);
      const docIDsLength = docIDs.length;
      for (let i = 0; i < docIDsLength; i++) {
        docs.add(docIDs[i]);
      }
      output[word] = Array.from(docs);
    }
  }
  for (const character of Object.keys(node.children)) {
    findAllWords(node.children[character], output, term, exact, tolerance);
  }
  return output;
}
function getCommonPrefix(a, b) {
  let commonPrefix = "";
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      return commonPrefix;
    }
    commonPrefix += a[i];
  }
  return commonPrefix;
}
function create3(end = false, subWord = "", key = "") {
  return new Node(key, subWord, end);
}
function insert2(root, word, docId) {
  for (let i = 0; i < word.length; i++) {
    const currentCharacter = word[i];
    const wordAtIndex = word.substring(i);
    const rootChildCurrentChar = root.children[currentCharacter];
    if (rootChildCurrentChar) {
      const edgeLabel = rootChildCurrentChar.subWord;
      const edgeLabelLength = edgeLabel.length;
      const commonPrefix = getCommonPrefix(edgeLabel, wordAtIndex);
      const commonPrefixLength = commonPrefix.length;
      if (edgeLabel === wordAtIndex) {
        addDocument(rootChildCurrentChar, docId);
        rootChildCurrentChar.end = true;
        return;
      }
      const edgeLabelAtCommonPrefix = edgeLabel[commonPrefixLength];
      if (commonPrefixLength < edgeLabelLength && commonPrefixLength === wordAtIndex.length) {
        const newNode = create3(true, wordAtIndex, currentCharacter);
        newNode.children[edgeLabelAtCommonPrefix] = rootChildCurrentChar;
        const newNodeChild = newNode.children[edgeLabelAtCommonPrefix];
        newNodeChild.subWord = edgeLabel.substring(commonPrefixLength);
        newNodeChild.key = edgeLabelAtCommonPrefix;
        root.children[currentCharacter] = newNode;
        updateParent(newNode, root);
        updateParent(newNodeChild, newNode);
        addDocument(newNode, docId);
        return;
      }
      if (commonPrefixLength < edgeLabelLength && commonPrefixLength < wordAtIndex.length) {
        const inbetweenNode = create3(false, commonPrefix, currentCharacter);
        inbetweenNode.children[edgeLabelAtCommonPrefix] = rootChildCurrentChar;
        root.children[currentCharacter] = inbetweenNode;
        const inbetweenNodeChild = inbetweenNode.children[edgeLabelAtCommonPrefix];
        inbetweenNodeChild.subWord = edgeLabel.substring(commonPrefixLength);
        inbetweenNodeChild.key = edgeLabelAtCommonPrefix;
        const wordAtCommonPrefix = wordAtIndex[commonPrefixLength];
        const newNode = create3(true, word.substring(i + commonPrefixLength), wordAtCommonPrefix);
        addDocument(newNode, docId);
        inbetweenNode.children[wordAtCommonPrefix] = newNode;
        updateParent(inbetweenNode, root);
        updateParent(newNode, inbetweenNode);
        updateParent(inbetweenNodeChild, inbetweenNode);
        return;
      }
      i += edgeLabelLength - 1;
      root = rootChildCurrentChar;
    } else {
      const newNode = create3(true, wordAtIndex, currentCharacter);
      addDocument(newNode, docId);
      root.children[currentCharacter] = newNode;
      updateParent(newNode, root);
      return;
    }
  }
}
function find2(root, { term, exact, tolerance }) {
  for (let i = 0; i < term.length; i++) {
    const character = term[i];
    if (character in root.children) {
      const rootChildCurrentChar = root.children[character];
      const edgeLabel = rootChildCurrentChar.subWord;
      const termSubstring = term.substring(i);
      const commonPrefix = getCommonPrefix(edgeLabel, termSubstring);
      const commonPrefixLength = commonPrefix.length;
      if (commonPrefixLength !== edgeLabel.length && commonPrefixLength !== termSubstring.length) {
        if (tolerance) break;
        return {};
      }
      i += rootChildCurrentChar.subWord.length - 1;
      root = rootChildCurrentChar;
    } else {
      return {};
    }
  }
  const output = {};
  findAllWords(root, output, term, exact, tolerance);
  return output;
}
function removeDocumentByWord(root, term, docID, exact = true) {
  if (!term) {
    return true;
  }
  for (let i = 0; i < term.length; i++) {
    const character = term[i];
    if (character in root.children) {
      const rootChildCurrentChar = root.children[character];
      i += rootChildCurrentChar.subWord.length - 1;
      root = rootChildCurrentChar;
      if (exact && root.word !== term) {
      } else {
        removeDocument2(root, docID);
      }
    } else {
      return false;
    }
  }
  return true;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/trees/flat.js
function create4() {
  return {
    numberToDocumentId: /* @__PURE__ */ new Map()
  };
}
function insert3(root, key, value) {
  if (root.numberToDocumentId.has(key)) {
    root.numberToDocumentId.get(key).push(value);
    return root;
  }
  root.numberToDocumentId.set(key, [
    value
  ]);
  return root;
}
function removeDocument3(root, id, key) {
  var _root_numberToDocumentId_get, _root_numberToDocumentId_get1;
  root === null || root === void 0 ? void 0 : root.numberToDocumentId.set(key, ((_root_numberToDocumentId_get = root === null || root === void 0 ? void 0 : root.numberToDocumentId.get(key)) === null || _root_numberToDocumentId_get === void 0 ? void 0 : _root_numberToDocumentId_get.filter((v2) => v2 !== id)) ?? []);
  if (((_root_numberToDocumentId_get1 = root === null || root === void 0 ? void 0 : root.numberToDocumentId.get(key)) === null || _root_numberToDocumentId_get1 === void 0 ? void 0 : _root_numberToDocumentId_get1.length) === 0) {
    root === null || root === void 0 ? void 0 : root.numberToDocumentId.delete(key);
  }
}
function filter(root, operation) {
  const operationKeys = Object.keys(operation);
  if (operationKeys.length !== 1) {
    throw new Error("Invalid operation");
  }
  const operationType = operationKeys[0];
  switch (operationType) {
    case "eq": {
      const value = operation[operationType];
      return root.numberToDocumentId.get(value) ?? [];
    }
    case "in": {
      const value = operation[operationType];
      const result = [];
      for (const v2 of value) {
        const ids = root.numberToDocumentId.get(v2);
        if (ids) {
          result.push(...ids);
        }
      }
      return result;
    }
    case "nin": {
      const value = operation[operationType];
      const result = [];
      const keys = root.numberToDocumentId.keys();
      for (const key of keys) {
        if (value.includes(key)) {
          continue;
        }
        const ids = root.numberToDocumentId.get(key);
        if (ids) {
          result.push(...ids);
        }
      }
      return result;
    }
  }
  throw new Error("Invalid operation");
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/algorithms.js
function prioritizeTokenScores(arrays, boost, threshold = 1, keywordsCount) {
  if (boost === 0) {
    throw createError("INVALID_BOOST_VALUE");
  }
  const tokenScoresMap = /* @__PURE__ */ new Map();
  const tokenKeywordsCountMap = /* @__PURE__ */ new Map();
  const mapsLength = arrays.length;
  for (let i = 0; i < mapsLength; i++) {
    const arr = arrays[i];
    const entriesLength = arr.length;
    for (let j = 0; j < entriesLength; j++) {
      const [token, score] = arr[j];
      const boostScore = score * boost;
      const oldScore = tokenScoresMap.get(token);
      if (oldScore !== void 0) {
        tokenScoresMap.set(token, oldScore * 1.5 + boostScore);
        tokenKeywordsCountMap.set(token, tokenKeywordsCountMap.get(token) + 1);
      } else {
        tokenScoresMap.set(token, boostScore);
        tokenKeywordsCountMap.set(token, 1);
      }
    }
  }
  const tokenScores = [];
  for (const tokenScoreEntry of tokenScoresMap.entries()) {
    tokenScores.push(tokenScoreEntry);
  }
  const results = tokenScores.sort((a, b) => b[1] - a[1]);
  if (threshold === 1) {
    return results;
  }
  const allResults = results.length;
  const tokenKeywordsCount = [];
  for (const tokenKeywordsCountEntry of tokenKeywordsCountMap.entries()) {
    tokenKeywordsCount.push(tokenKeywordsCountEntry);
  }
  const keywordsPerToken = tokenKeywordsCount.sort((a, b) => b[1] - a[1]);
  let lastTokenWithAllKeywords = void 0;
  for (let i = 0; i < allResults; i++) {
    if (keywordsPerToken[i][1] === keywordsCount) {
      lastTokenWithAllKeywords = i;
    } else {
      break;
    }
  }
  if (typeof lastTokenWithAllKeywords === "undefined") {
    if (threshold === 0) {
      return [];
    }
    lastTokenWithAllKeywords = 0;
  }
  if (threshold === 0) {
    return results.slice(0, lastTokenWithAllKeywords + 1);
  }
  const thresholdLength = lastTokenWithAllKeywords + Math.ceil(threshold * 100 * (results.length - lastTokenWithAllKeywords) / 100);
  return results.slice(0, results.length + thresholdLength);
}
function BM25(tf, matchingCount, docsCount, fieldLength, averageFieldLength, BM25Params) {
  const { k, b, d } = BM25Params;
  const idf = Math.log(1 + (docsCount - matchingCount + 0.5) / (matchingCount + 0.5));
  return idf * (d + tf * (k + 1)) / (tf + k * (1 - b + b * fieldLength / averageFieldLength));
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/cosine-similarity.js
function getMagnitude(vector, vectorLength) {
  let magnitude = 0;
  for (let i = 0; i < vectorLength; i++) {
    magnitude += vector[i] * vector[i];
  }
  return Math.sqrt(magnitude);
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/index.js
async function insertDocumentScoreParameters(index, prop, id, tokens, docsCount) {
  const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
  index.avgFieldLength[prop] = ((index.avgFieldLength[prop] ?? 0) * (docsCount - 1) + tokens.length) / docsCount;
  index.fieldLengths[prop][internalId] = tokens.length;
  index.frequencies[prop][internalId] = {};
}
async function insertTokenScoreParameters(index, prop, id, tokens, token) {
  let tokenFrequency = 0;
  for (const t of tokens) {
    if (t === token) {
      tokenFrequency++;
    }
  }
  const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
  const tf = tokenFrequency / tokens.length;
  index.frequencies[prop][internalId][token] = tf;
  if (!(token in index.tokenOccurrences[prop])) {
    index.tokenOccurrences[prop][token] = 0;
  }
  index.tokenOccurrences[prop][token] = (index.tokenOccurrences[prop][token] ?? 0) + 1;
}
async function removeDocumentScoreParameters(index, prop, id, docsCount) {
  const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
  index.avgFieldLength[prop] = (index.avgFieldLength[prop] * docsCount - index.fieldLengths[prop][internalId]) / (docsCount - 1);
  index.fieldLengths[prop][internalId] = void 0;
  index.frequencies[prop][internalId] = void 0;
}
async function removeTokenScoreParameters(index, prop, token) {
  index.tokenOccurrences[prop][token]--;
}
async function calculateResultScores(context, index, prop, term, ids) {
  const documentIDs = Array.from(ids);
  const avgFieldLength = index.avgFieldLength[prop];
  const fieldLengths = index.fieldLengths[prop];
  const oramaOccurrences = index.tokenOccurrences[prop];
  const oramaFrequencies = index.frequencies[prop];
  const termOccurrences = typeof oramaOccurrences[term] === "number" ? oramaOccurrences[term] ?? 0 : 0;
  const scoreList = [];
  const documentIDsLength = documentIDs.length;
  for (let k = 0; k < documentIDsLength; k++) {
    var _oramaFrequencies_internalId;
    const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, documentIDs[k]);
    const tf = (oramaFrequencies === null || oramaFrequencies === void 0 ? void 0 : (_oramaFrequencies_internalId = oramaFrequencies[internalId]) === null || _oramaFrequencies_internalId === void 0 ? void 0 : _oramaFrequencies_internalId[term]) ?? 0;
    const bm25 = BM25(tf, termOccurrences, context.docsCount, fieldLengths[internalId], avgFieldLength, context.params.relevance);
    scoreList.push([
      internalId,
      bm25
    ]);
  }
  return scoreList;
}
async function create5(orama, sharedInternalDocumentStore, schema, index, prefix = "") {
  if (!index) {
    index = {
      sharedInternalDocumentStore,
      indexes: {},
      vectorIndexes: {},
      searchableProperties: [],
      searchablePropertiesWithTypes: {},
      frequencies: {},
      tokenOccurrences: {},
      avgFieldLength: {},
      fieldLengths: {}
    };
  }
  for (const [prop, type] of Object.entries(schema)) {
    const typeActualType = typeof type;
    const path = `${prefix}${prefix ? "." : ""}${prop}`;
    if (typeActualType === "object" && !Array.isArray(type)) {
      create5(orama, sharedInternalDocumentStore, type, index, path);
      continue;
    }
    if (isVectorType(type)) {
      index.searchableProperties.push(path);
      index.searchablePropertiesWithTypes[path] = type;
      index.vectorIndexes[path] = {
        size: getVectorSize(type),
        vectors: {}
      };
    } else {
      switch (type) {
        case "boolean":
        case "boolean[]":
          index.indexes[path] = {
            type: "Bool",
            node: {
              true: [],
              false: []
            }
          };
          break;
        case "number":
        case "number[]":
          index.indexes[path] = {
            type: "AVL",
            node: create2(0, [])
          };
          break;
        case "string":
        case "string[]":
          index.indexes[path] = {
            type: "Radix",
            node: create3()
          };
          index.avgFieldLength[path] = 0;
          index.frequencies[path] = {};
          index.tokenOccurrences[path] = {};
          index.fieldLengths[path] = {};
          break;
        case "enum":
          index.indexes[path] = {
            type: "Flat",
            node: create4()
          };
          break;
        default:
          throw createError("INVALID_SCHEMA_TYPE", Array.isArray(type) ? "array" : type, path);
      }
      index.searchableProperties.push(path);
      index.searchablePropertiesWithTypes[path] = type;
    }
  }
  return index;
}
async function insertScalar(implementation, index, prop, id, value, schemaType, language, tokenizer, docsCount) {
  const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
  const { type, node } = index.indexes[prop];
  switch (type) {
    case "Bool": {
      node[value ? "true" : "false"].push(internalId);
      break;
    }
    case "AVL":
      insert(node, value, [
        internalId
      ]);
      break;
    case "Radix": {
      const tokens = await tokenizer.tokenize(value, language, prop);
      await implementation.insertDocumentScoreParameters(index, prop, internalId, tokens, docsCount);
      for (const token of tokens) {
        await implementation.insertTokenScoreParameters(index, prop, internalId, tokens, token);
        insert2(node, token, internalId);
      }
      break;
    }
    case "Flat": {
      insert3(node, value, internalId);
      break;
    }
  }
}
async function insert4(implementation, index, prop, id, value, schemaType, language, tokenizer, docsCount) {
  if (isVectorType(schemaType)) {
    return insertVector(index, prop, value, id);
  }
  if (!isArrayType(schemaType)) {
    return insertScalar(implementation, index, prop, id, value, schemaType, language, tokenizer, docsCount);
  }
  const innerSchemaType = getInnerType(schemaType);
  const elements = value;
  const elementsLength = elements.length;
  for (let i = 0; i < elementsLength; i++) {
    await insertScalar(implementation, index, prop, id, elements[i], innerSchemaType, language, tokenizer, docsCount);
  }
}
function insertVector(index, prop, value, id) {
  if (!(value instanceof Float32Array)) {
    value = new Float32Array(value);
  }
  const size = index.vectorIndexes[prop].size;
  const magnitude = getMagnitude(value, size);
  index.vectorIndexes[prop].vectors[id] = [
    magnitude,
    value
  ];
}
async function removeScalar(implementation, index, prop, id, value, schemaType, language, tokenizer, docsCount) {
  const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
  const { type, node } = index.indexes[prop];
  switch (type) {
    case "AVL": {
      removeDocument(node, internalId, value);
      return true;
    }
    case "Bool": {
      const booleanKey = value ? "true" : "false";
      const position = node[booleanKey].indexOf(internalId);
      node[value ? "true" : "false"].splice(position, 1);
      return true;
    }
    case "Radix": {
      const tokens = await tokenizer.tokenize(value, language, prop);
      await implementation.removeDocumentScoreParameters(index, prop, id, docsCount);
      for (const token of tokens) {
        await implementation.removeTokenScoreParameters(index, prop, token);
        removeDocumentByWord(node, token, internalId);
      }
      return true;
    }
    case "Flat": {
      removeDocument3(node, internalId, value);
      return true;
    }
  }
}
async function remove3(implementation, index, prop, id, value, schemaType, language, tokenizer, docsCount) {
  if (!isArrayType(schemaType)) {
    return removeScalar(implementation, index, prop, id, value, schemaType, language, tokenizer, docsCount);
  }
  const innerSchemaType = getInnerType(schemaType);
  const elements = value;
  const elementsLength = elements.length;
  for (let i = 0; i < elementsLength; i++) {
    await removeScalar(implementation, index, prop, id, elements[i], innerSchemaType, language, tokenizer, docsCount);
  }
  return true;
}
async function search(context, index, prop, term) {
  if (!(prop in index.tokenOccurrences)) {
    return [];
  }
  const { node, type } = index.indexes[prop];
  if (type !== "Radix") {
    throw createError("WRONG_SEARCH_PROPERTY_TYPE", prop);
  }
  const { exact, tolerance } = context.params;
  const searchResult = find2(node, {
    term,
    exact,
    tolerance
  });
  const ids = /* @__PURE__ */ new Set();
  for (const key in searchResult) {
    for (const id of searchResult[key]) {
      ids.add(id);
    }
  }
  return context.index.calculateResultScores(context, index, prop, term, Array.from(ids));
}
async function searchByWhereClause(context, index, filters) {
  const filterKeys = Object.keys(filters);
  const filtersMap = filterKeys.reduce((acc, key) => ({
    [key]: [],
    ...acc
  }), {});
  for (const param of filterKeys) {
    const operation = filters[param];
    if (typeof index.indexes[param] === "undefined") {
      throw createError("UNKNOWN_FILTER_PROPERTY", param);
    }
    const { node, type } = index.indexes[param];
    if (type === "Bool") {
      const idx = node;
      const filteredIDs = idx[operation.toString()];
      safeArrayPush(filtersMap[param], filteredIDs);
      continue;
    }
    if (type === "Radix" && (typeof operation === "string" || Array.isArray(operation))) {
      for (const raw of [
        operation
      ].flat()) {
        const term = await context.tokenizer.tokenize(raw, context.language, param);
        for (const t of term) {
          const filteredIDsResults = find2(node, {
            term: t,
            exact: true
          });
          safeArrayPush(filtersMap[param], Object.values(filteredIDsResults).flat());
        }
      }
      continue;
    }
    const operationKeys = Object.keys(operation);
    if (operationKeys.length > 1) {
      throw createError("INVALID_FILTER_OPERATION", operationKeys.length);
    }
    if (type === "Flat") {
      filtersMap[param].push(...filter(node, operation));
      continue;
    }
    if (type === "AVL") {
      const operationOpt = operationKeys[0];
      const operationValue = operation[operationOpt];
      let filteredIDs = [];
      switch (operationOpt) {
        case "gt": {
          filteredIDs = greaterThan(node, operationValue, false);
          break;
        }
        case "gte": {
          filteredIDs = greaterThan(node, operationValue, true);
          break;
        }
        case "lt": {
          filteredIDs = lessThan(node, operationValue, false);
          break;
        }
        case "lte": {
          filteredIDs = lessThan(node, operationValue, true);
          break;
        }
        case "eq": {
          filteredIDs = find(node, operationValue) ?? [];
          break;
        }
        case "between": {
          const [min, max] = operationValue;
          filteredIDs = rangeSearch(node, min, max);
          break;
        }
      }
      safeArrayPush(filtersMap[param], filteredIDs);
    }
  }
  const result = intersect(Object.values(filtersMap));
  return result;
}
async function getSearchableProperties(index) {
  return index.searchableProperties;
}
async function getSearchablePropertiesWithTypes(index) {
  return index.searchablePropertiesWithTypes;
}
function loadRadixNode(node) {
  const convertedNode = create3(node.end, node.subWord, node.key);
  convertedNode.docs = node.docs;
  convertedNode.word = node.word;
  for (const childrenKey of Object.keys(node.children)) {
    convertedNode.children[childrenKey] = loadRadixNode(node.children[childrenKey]);
  }
  return convertedNode;
}
function loadFlatNode(node) {
  return {
    numberToDocumentId: new Map(node)
  };
}
function saveFlatNode(node) {
  return Array.from(node.numberToDocumentId.entries());
}
async function load3(sharedInternalDocumentStore, raw) {
  const { indexes: rawIndexes, vectorIndexes: rawVectorIndexes, searchableProperties, searchablePropertiesWithTypes, frequencies, tokenOccurrences, avgFieldLength, fieldLengths } = raw;
  const indexes = {};
  const vectorIndexes = {};
  for (const prop of Object.keys(rawIndexes)) {
    const { node, type } = rawIndexes[prop];
    switch (type) {
      case "Radix":
        indexes[prop] = {
          type: "Radix",
          node: loadRadixNode(node)
        };
        break;
      case "Flat":
        indexes[prop] = {
          type: "Flat",
          node: loadFlatNode(node)
        };
        break;
      default:
        indexes[prop] = rawIndexes[prop];
    }
  }
  for (const idx of Object.keys(rawVectorIndexes)) {
    const vectors = rawVectorIndexes[idx].vectors;
    for (const vec in vectors) {
      vectors[vec] = [
        vectors[vec][0],
        new Float32Array(vectors[vec][1])
      ];
    }
    vectorIndexes[idx] = {
      size: rawVectorIndexes[idx].size,
      vectors
    };
  }
  return {
    sharedInternalDocumentStore,
    indexes,
    vectorIndexes,
    searchableProperties,
    searchablePropertiesWithTypes,
    frequencies,
    tokenOccurrences,
    avgFieldLength,
    fieldLengths
  };
}
async function save3(index) {
  const { indexes, vectorIndexes, searchableProperties, searchablePropertiesWithTypes, frequencies, tokenOccurrences, avgFieldLength, fieldLengths } = index;
  const vectorIndexesAsArrays = {};
  for (const idx of Object.keys(vectorIndexes)) {
    const vectors = vectorIndexes[idx].vectors;
    for (const vec in vectors) {
      vectors[vec] = [
        vectors[vec][0],
        Array.from(vectors[vec][1])
      ];
    }
    vectorIndexesAsArrays[idx] = {
      size: vectorIndexes[idx].size,
      vectors
    };
  }
  const savedIndexes = {};
  for (const name of Object.keys(indexes)) {
    const { type, node } = indexes[name];
    if (type !== "Flat") {
      savedIndexes[name] = indexes[name];
      continue;
    }
    savedIndexes[name] = {
      type: "Flat",
      node: saveFlatNode(node)
    };
  }
  return {
    indexes: savedIndexes,
    vectorIndexes: vectorIndexesAsArrays,
    searchableProperties,
    searchablePropertiesWithTypes,
    frequencies,
    tokenOccurrences,
    avgFieldLength,
    fieldLengths
  };
}
async function createIndex() {
  return {
    create: create5,
    insert: insert4,
    remove: remove3,
    insertDocumentScoreParameters,
    insertTokenScoreParameters,
    removeDocumentScoreParameters,
    removeTokenScoreParameters,
    calculateResultScores,
    search,
    searchByWhereClause,
    getSearchableProperties,
    getSearchablePropertiesWithTypes,
    load: load3,
    save: save3
  };
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/tokenizer/diacritics.js
var DIACRITICS_CHARCODE_START = 192;
var DIACRITICS_CHARCODE_END = 383;
var CHARCODE_REPLACE_MAPPING = [
  65,
  65,
  65,
  65,
  65,
  65,
  65,
  67,
  69,
  69,
  69,
  69,
  73,
  73,
  73,
  73,
  69,
  78,
  79,
  79,
  79,
  79,
  79,
  null,
  79,
  85,
  85,
  85,
  85,
  89,
  80,
  115,
  97,
  97,
  97,
  97,
  97,
  97,
  97,
  99,
  101,
  101,
  101,
  101,
  105,
  105,
  105,
  105,
  101,
  110,
  111,
  111,
  111,
  111,
  111,
  null,
  111,
  117,
  117,
  117,
  117,
  121,
  112,
  121,
  65,
  97,
  65,
  97,
  65,
  97,
  67,
  99,
  67,
  99,
  67,
  99,
  67,
  99,
  68,
  100,
  68,
  100,
  69,
  101,
  69,
  101,
  69,
  101,
  69,
  101,
  69,
  101,
  71,
  103,
  71,
  103,
  71,
  103,
  71,
  103,
  72,
  104,
  72,
  104,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  74,
  106,
  75,
  107,
  107,
  76,
  108,
  76,
  108,
  76,
  108,
  76,
  108,
  76,
  108,
  78,
  110,
  78,
  110,
  78,
  110,
  110,
  78,
  110,
  79,
  111,
  79,
  111,
  79,
  111,
  79,
  111,
  82,
  114,
  82,
  114,
  82,
  114,
  83,
  115,
  83,
  115,
  83,
  115,
  83,
  115,
  84,
  116,
  84,
  116,
  84,
  116,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  87,
  119,
  89,
  121,
  89,
  90,
  122,
  90,
  122,
  90,
  122,
  115
];
function replaceChar(charCode) {
  if (charCode < DIACRITICS_CHARCODE_START || charCode > DIACRITICS_CHARCODE_END) return charCode;
  return CHARCODE_REPLACE_MAPPING[charCode - DIACRITICS_CHARCODE_START] || charCode;
}
function replaceDiacritics(str) {
  const stringCharCode = [];
  for (let idx = 0; idx < str.length; idx++) {
    stringCharCode[idx] = replaceChar(str.charCodeAt(idx));
  }
  return String.fromCharCode(...stringCharCode);
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/tokenizer/english-stemmer.js
var step2List = {
  ational: "ate",
  tional: "tion",
  enci: "ence",
  anci: "ance",
  izer: "ize",
  bli: "ble",
  alli: "al",
  entli: "ent",
  eli: "e",
  ousli: "ous",
  ization: "ize",
  ation: "ate",
  ator: "ate",
  alism: "al",
  iveness: "ive",
  fulness: "ful",
  ousness: "ous",
  aliti: "al",
  iviti: "ive",
  biliti: "ble",
  logi: "log"
};
var step3List = {
  icate: "ic",
  ative: "",
  alize: "al",
  iciti: "ic",
  ical: "ic",
  ful: "",
  ness: ""
};
var c = "[^aeiou]";
var v = "[aeiouy]";
var C = c + "[^aeiouy]*";
var V = v + "[aeiou]*";
var mgr0 = "^(" + C + ")?" + V + C;
var meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$";
var mgr1 = "^(" + C + ")?" + V + C + V + C;
var s_v = "^(" + C + ")?" + v;
function stemmer(w) {
  let stem;
  let suffix;
  let re;
  let re2;
  let re3;
  let re4;
  if (w.length < 3) {
    return w;
  }
  const firstch = w.substring(0, 1);
  if (firstch == "y") {
    w = firstch.toUpperCase() + w.substring(1);
  }
  re = /^(.+?)(ss|i)es$/;
  re2 = /^(.+?)([^s])s$/;
  if (re.test(w)) {
    w = w.replace(re, "$1$2");
  } else if (re2.test(w)) {
    w = w.replace(re2, "$1$2");
  }
  re = /^(.+?)eed$/;
  re2 = /^(.+?)(ed|ing)$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    re = new RegExp(mgr0);
    if (re.test(fp[1])) {
      re = /.$/;
      w = w.replace(re, "");
    }
  } else if (re2.test(w)) {
    const fp = re2.exec(w);
    stem = fp[1];
    re2 = new RegExp(s_v);
    if (re2.test(stem)) {
      w = stem;
      re2 = /(at|bl|iz)$/;
      re3 = new RegExp("([^aeiouylsz])\\1$");
      re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
      if (re2.test(w)) {
        w = w + "e";
      } else if (re3.test(w)) {
        re = /.$/;
        w = w.replace(re, "");
      } else if (re4.test(w)) {
        w = w + "e";
      }
    }
  }
  re = /^(.+?)y$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp === null || fp === void 0 ? void 0 : fp[1];
    re = new RegExp(s_v);
    if (stem && re.test(stem)) {
      w = stem + "i";
    }
  }
  re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp === null || fp === void 0 ? void 0 : fp[1];
    suffix = fp === null || fp === void 0 ? void 0 : fp[2];
    re = new RegExp(mgr0);
    if (stem && re.test(stem)) {
      w = stem + step2List[suffix];
    }
  }
  re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp === null || fp === void 0 ? void 0 : fp[1];
    suffix = fp === null || fp === void 0 ? void 0 : fp[2];
    re = new RegExp(mgr0);
    if (stem && re.test(stem)) {
      w = stem + step3List[suffix];
    }
  }
  re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  re2 = /^(.+?)(s|t)(ion)$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp === null || fp === void 0 ? void 0 : fp[1];
    re = new RegExp(mgr1);
    if (stem && re.test(stem)) {
      w = stem;
    }
  } else if (re2.test(w)) {
    const fp = re2.exec(w);
    stem = (fp === null || fp === void 0 ? void 0 : fp[1]) ?? "" + (fp === null || fp === void 0 ? void 0 : fp[2]) ?? "";
    re2 = new RegExp(mgr1);
    if (re2.test(stem)) {
      w = stem;
    }
  }
  re = /^(.+?)e$/;
  if (re.test(w)) {
    const fp = re.exec(w);
    stem = fp === null || fp === void 0 ? void 0 : fp[1];
    re = new RegExp(mgr1);
    re2 = new RegExp(meq1);
    re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
    if (stem && (re.test(stem) || re2.test(stem) && !re3.test(stem))) {
      w = stem;
    }
  }
  re = /ll$/;
  re2 = new RegExp(mgr1);
  if (re.test(w) && re2.test(w)) {
    re = /.$/;
    w = w.replace(re, "");
  }
  if (firstch == "y") {
    w = firstch.toLowerCase() + w.substring(1);
  }
  return w;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/tokenizer/index.js
function normalizeToken(prop, token) {
  var _this_stopWords;
  const key = `${this.language}:${prop}:${token}`;
  if (this.normalizationCache.has(key)) {
    return this.normalizationCache.get(key);
  }
  if ((_this_stopWords = this.stopWords) === null || _this_stopWords === void 0 ? void 0 : _this_stopWords.includes(token)) {
    this.normalizationCache.set(key, "");
    return "";
  }
  if (this.stemmer && !this.stemmerSkipProperties.has(prop)) {
    token = this.stemmer(token);
  }
  token = replaceDiacritics(token);
  this.normalizationCache.set(key, token);
  return token;
}
function trim(text) {
  while (text[text.length - 1] === "") {
    text.pop();
  }
  while (text[0] === "") {
    text.shift();
  }
  return text;
}
function tokenize(input, language, prop) {
  if (language && language !== this.language) {
    throw createError("LANGUAGE_NOT_SUPPORTED", language);
  }
  if (typeof input !== "string") {
    return [
      input
    ];
  }
  let tokens;
  if (prop && this.tokenizeSkipProperties.has(prop)) {
    tokens = [
      this.normalizeToken.bind(this, prop ?? "")(input)
    ];
  } else {
    const splitRule = SPLITTERS[this.language];
    tokens = input.toLowerCase().split(splitRule).map(this.normalizeToken.bind(this, prop ?? "")).filter(Boolean);
  }
  const trimTokens = trim(tokens);
  if (!this.allowDuplicates) {
    return Array.from(new Set(trimTokens));
  }
  return trimTokens;
}
async function createTokenizer(config = {}) {
  if (!config.language) {
    config.language = "english";
  } else if (!SUPPORTED_LANGUAGES.includes(config.language)) {
    throw createError("LANGUAGE_NOT_SUPPORTED", config.language);
  }
  let stemmer2;
  if (config.stemming || config.stemmer && !("stemming" in config)) {
    if (config.stemmer) {
      if (typeof config.stemmer !== "function") {
        throw createError("INVALID_STEMMER_FUNCTION_TYPE");
      }
      stemmer2 = config.stemmer;
    } else {
      if (config.language === "english") {
        stemmer2 = stemmer;
      } else {
        throw createError("MISSING_STEMMER", config.language);
      }
    }
  }
  let stopWords;
  if (config.stopWords !== false) {
    stopWords = [];
    if (Array.isArray(config.stopWords)) {
      stopWords = config.stopWords;
    } else if (typeof config.stopWords === "function") {
      stopWords = await config.stopWords(stopWords);
    } else if (config.stopWords) {
      throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
    }
    if (!Array.isArray(stopWords)) {
      throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
    }
    for (const s of stopWords) {
      if (typeof s !== "string") {
        throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
      }
    }
  }
  const tokenizer = {
    tokenize,
    language: config.language,
    stemmer: stemmer2,
    stemmerSkipProperties: new Set(config.stemmerSkipProperties ? [
      config.stemmerSkipProperties
    ].flat() : []),
    tokenizeSkipProperties: new Set(config.tokenizeSkipProperties ? [
      config.tokenizeSkipProperties
    ].flat() : []),
    stopWords,
    allowDuplicates: Boolean(config.allowDuplicates),
    normalizeToken,
    normalizationCache: /* @__PURE__ */ new Map()
  };
  tokenizer.tokenize = tokenize.bind(tokenizer);
  tokenizer.normalizeToken = normalizeToken;
  return tokenizer;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/sorter.js
function innerCreate(orama, sharedInternalDocumentStore, schema, sortableDeniedProperties, prefix) {
  const sorter = {
    language: orama.tokenizer.language,
    sharedInternalDocumentStore,
    enabled: true,
    isSorted: true,
    sortableProperties: [],
    sortablePropertiesWithTypes: {},
    sorts: {}
  };
  for (const [prop, type] of Object.entries(schema)) {
    const typeActualType = typeof type;
    const path = `${prefix}${prefix ? "." : ""}${prop}`;
    if (sortableDeniedProperties.includes(path)) {
      continue;
    }
    if (typeActualType === "object" && !Array.isArray(type)) {
      const ret = innerCreate(orama, sharedInternalDocumentStore, type, sortableDeniedProperties, path);
      sorter.sortableProperties.push(...ret.sortableProperties);
      sorter.sorts = {
        ...sorter.sorts,
        ...ret.sorts
      };
      sorter.sortablePropertiesWithTypes = {
        ...sorter.sortablePropertiesWithTypes,
        ...ret.sortablePropertiesWithTypes
      };
      continue;
    }
    if (!isVectorType(type)) {
      switch (type) {
        case "boolean":
        case "number":
        case "string":
          sorter.sortableProperties.push(path);
          sorter.sortablePropertiesWithTypes[path] = type;
          sorter.sorts[path] = {
            docs: /* @__PURE__ */ new Map(),
            orderedDocsToRemove: /* @__PURE__ */ new Map(),
            orderedDocs: [],
            type
          };
          break;
        case "enum":
        case "boolean[]":
        case "number[]":
        case "string[]":
          continue;
        default:
          throw createError("INVALID_SORT_SCHEMA_TYPE", Array.isArray(type) ? "array" : type, path);
      }
    }
  }
  return sorter;
}
async function create6(orama, sharedInternalDocumentStore, schema, config) {
  const isSortEnabled = (config === null || config === void 0 ? void 0 : config.enabled) !== false;
  if (!isSortEnabled) {
    return {
      disabled: true
    };
  }
  return innerCreate(orama, sharedInternalDocumentStore, schema, (config || {}).unsortableProperties || [], "");
}
async function insert5(sorter, prop, id, value) {
  if (!sorter.enabled) {
    return;
  }
  sorter.isSorted = false;
  const internalId = getInternalDocumentId(sorter.sharedInternalDocumentStore, id);
  const s = sorter.sorts[prop];
  s.docs.set(internalId, s.orderedDocs.length);
  s.orderedDocs.push([
    internalId,
    value
  ]);
}
function ensureIsSorted(sorter) {
  if (sorter.isSorted) {
    return;
  }
  if (!sorter.enabled) {
    return;
  }
  const properties = Object.keys(sorter.sorts);
  for (const prop of properties) {
    ensurePropertyIsSorted(sorter, prop);
  }
  sorter.isSorted = true;
}
function stringSort(language, value, d) {
  return value[1].localeCompare(d[1], language);
}
function numberSort(value, d) {
  return value[1] - d[1];
}
function booleanSort(value, d) {
  return d[1] ? -1 : 1;
}
function ensurePropertyIsSorted(sorter, prop) {
  const s = sorter.sorts[prop];
  let predicate;
  switch (s.type) {
    case "string":
      predicate = stringSort.bind(null, sorter.language);
      break;
    case "number":
      predicate = numberSort.bind(null);
      break;
    case "boolean":
      predicate = booleanSort.bind(null);
      break;
  }
  s.orderedDocs.sort(predicate);
  const orderedDocsLength = s.orderedDocs.length;
  for (let i = 0; i < orderedDocsLength; i++) {
    const docId = s.orderedDocs[i][0];
    s.docs.set(docId, i);
  }
}
function ensureOrderedDocsAreDeleted(sorter) {
  const properties = Object.keys(sorter.sorts);
  for (const prop of properties) {
    ensureOrderedDocsAreDeletedByProperty(sorter, prop);
  }
}
function ensureOrderedDocsAreDeletedByProperty(sorter, prop) {
  const s = sorter.sorts[prop];
  if (!s.orderedDocsToRemove.size) return;
  s.orderedDocs = s.orderedDocs.filter((doc) => !s.orderedDocsToRemove.has(doc[0]));
  s.orderedDocsToRemove.clear();
}
async function remove4(sorter, prop, id) {
  if (!sorter.enabled) {
    return;
  }
  const s = sorter.sorts[prop];
  const internalId = getInternalDocumentId(sorter.sharedInternalDocumentStore, id);
  const index = s.docs.get(internalId);
  if (!index) return;
  s.docs.delete(internalId);
  s.orderedDocsToRemove.set(internalId, true);
}
async function sortBy(sorter, docIds, by) {
  if (!sorter.enabled) {
    throw createError("SORT_DISABLED");
  }
  const property = by.property;
  const isDesc = by.order === "DESC";
  const s = sorter.sorts[property];
  if (!s) {
    throw createError("UNABLE_TO_SORT_ON_UNKNOWN_FIELD", property, sorter.sortableProperties.join(", "));
  }
  ensureOrderedDocsAreDeletedByProperty(sorter, property);
  ensureIsSorted(sorter);
  docIds.sort((a, b) => {
    const indexOfA = s.docs.get(getInternalDocumentId(sorter.sharedInternalDocumentStore, a[0]));
    const indexOfB = s.docs.get(getInternalDocumentId(sorter.sharedInternalDocumentStore, b[0]));
    const isAIndexed = typeof indexOfA !== "undefined";
    const isBIndexed = typeof indexOfB !== "undefined";
    if (!isAIndexed && !isBIndexed) {
      return 0;
    }
    if (!isAIndexed) {
      return 1;
    }
    if (!isBIndexed) {
      return -1;
    }
    return isDesc ? indexOfB - indexOfA : indexOfA - indexOfB;
  });
  return docIds;
}
async function getSortableProperties(sorter) {
  if (!sorter.enabled) {
    return [];
  }
  return sorter.sortableProperties;
}
async function getSortablePropertiesWithTypes(sorter) {
  if (!sorter.enabled) {
    return {};
  }
  return sorter.sortablePropertiesWithTypes;
}
async function load4(sharedInternalDocumentStore, raw) {
  const rawDocument = raw;
  if (!rawDocument.enabled) {
    return {
      enabled: false
    };
  }
  const sorts = Object.keys(rawDocument.sorts).reduce((acc, prop) => {
    const { docs, orderedDocs, type } = rawDocument.sorts[prop];
    acc[prop] = {
      docs: new Map(Object.entries(docs).map(([k, v2]) => [
        +k,
        v2
      ])),
      orderedDocsToRemove: /* @__PURE__ */ new Map(),
      orderedDocs,
      type
    };
    return acc;
  }, {});
  return {
    sharedInternalDocumentStore,
    language: rawDocument.language,
    sortableProperties: rawDocument.sortableProperties,
    sortablePropertiesWithTypes: rawDocument.sortablePropertiesWithTypes,
    sorts,
    enabled: true,
    isSorted: rawDocument.isSorted
  };
}
async function save4(sorter) {
  if (!sorter.enabled) {
    return {
      enabled: false
    };
  }
  ensureOrderedDocsAreDeleted(sorter);
  ensureIsSorted(sorter);
  const sorts = Object.keys(sorter.sorts).reduce((acc, prop) => {
    const { docs, orderedDocs, type } = sorter.sorts[prop];
    acc[prop] = {
      docs: Object.fromEntries(docs.entries()),
      orderedDocs,
      type
    };
    return acc;
  }, {});
  return {
    language: sorter.language,
    sortableProperties: sorter.sortableProperties,
    sortablePropertiesWithTypes: sorter.sortablePropertiesWithTypes,
    sorts,
    enabled: sorter.enabled,
    isSorted: sorter.isSorted
  };
}
async function createSorter() {
  return {
    create: create6,
    insert: insert5,
    remove: remove4,
    save: save4,
    load: load4,
    sortBy,
    getSortableProperties,
    getSortablePropertiesWithTypes
  };
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/methods/create.js
function validateComponents(components) {
  const defaultComponents = {
    formatElapsedTime,
    getDocumentIndexId,
    getDocumentProperties,
    validateSchema
  };
  for (const rawKey of FUNCTION_COMPONENTS) {
    const key = rawKey;
    if (components[key]) {
      if (typeof components[key] !== "function") {
        throw createError("COMPONENT_MUST_BE_FUNCTION", key);
      }
    } else {
      components[key] = defaultComponents[key];
    }
  }
  for (const rawKey of SINGLE_OR_ARRAY_COMPONENTS) {
    const key = rawKey;
    const component = components[key];
    if (!component) {
      components[key] = [];
    } else if (!Array.isArray(components[key])) {
      components[key] = [
        components[key]
      ];
    }
    for (const fn of components[key]) {
      if (typeof fn !== "function") {
        throw createError("COMPONENT_MUST_BE_FUNCTION_OR_ARRAY_FUNCTIONS", key);
      }
    }
  }
  for (const rawKey of Object.keys(components)) {
    if (!OBJECT_COMPONENTS.includes(rawKey) && !FUNCTION_COMPONENTS.includes(rawKey) && !SINGLE_OR_ARRAY_COMPONENTS.includes(rawKey)) {
      throw createError("UNSUPPORTED_COMPONENT", rawKey);
    }
  }
}
async function create7({ schema, sort, language, components, id }) {
  if (!components) {
    components = {};
  }
  if (!id) {
    id = await uniqueId();
  }
  let tokenizer = components.tokenizer;
  let index = components.index;
  let documentsStore = components.documentsStore;
  let sorter = components.sorter;
  if (!tokenizer) {
    tokenizer = await createTokenizer({
      language: language ?? "english"
    });
  } else if (!tokenizer.tokenize) {
    tokenizer = await createTokenizer(tokenizer);
  }
  if (components.tokenizer && language) {
    throw createError("NO_LANGUAGE_WITH_CUSTOM_TOKENIZER");
  }
  const internalDocumentStore = createInternalDocumentIDStore();
  index ||= await createIndex();
  sorter ||= await createSorter();
  documentsStore ||= await createDocumentsStore();
  validateComponents(components);
  const { getDocumentProperties: getDocumentProperties2, getDocumentIndexId: getDocumentIndexId2, validateSchema: validateSchema2, beforeInsert, afterInsert, beforeRemove, afterRemove, beforeUpdate, afterUpdate, afterSearch, beforeMultipleInsert, afterMultipleInsert, beforeMultipleRemove, afterMultipleRemove, beforeMultipleUpdate, afterMultipleUpdate, formatElapsedTime: formatElapsedTime2 } = components;
  const orama = {
    data: {},
    caches: {},
    schema,
    tokenizer,
    index,
    sorter,
    documentsStore,
    internalDocumentIDStore: internalDocumentStore,
    getDocumentProperties: getDocumentProperties2,
    getDocumentIndexId: getDocumentIndexId2,
    validateSchema: validateSchema2,
    beforeInsert,
    afterInsert,
    beforeRemove,
    afterRemove,
    beforeUpdate,
    afterUpdate,
    afterSearch,
    beforeMultipleInsert,
    afterMultipleInsert,
    beforeMultipleRemove,
    afterMultipleRemove,
    beforeMultipleUpdate,
    afterMultipleUpdate,
    formatElapsedTime: formatElapsedTime2,
    id
  };
  orama.data = {
    index: await orama.index.create(orama, internalDocumentStore, schema),
    docs: await orama.documentsStore.create(orama, internalDocumentStore),
    sorting: await orama.sorter.create(orama, internalDocumentStore, schema, sort)
  };
  return orama;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/types.js
var kInsertions = Symbol("orama.insertions");
var kRemovals = Symbol("orama.removals");

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/sync-blocking-checker.js
var _globalThis_process;
var warn = ((_globalThis_process = globalThis.process) === null || _globalThis_process === void 0 ? void 0 : _globalThis_process.emitWarning) ?? function emitWarning(message, options) {
  console.warn(`[WARNING] [${options.code}] ${message}`);
};
function trackInsertion(orama) {
  if (typeof orama[kInsertions] !== "number") {
    queueMicrotask(() => {
      orama[kInsertions] = void 0;
    });
    orama[kInsertions] = 0;
  }
  if (orama[kInsertions] > 1e3) {
    warn("Orama's insert operation is synchronous. Please avoid inserting a large number of document in a single operation in order not to block the main thread or, in alternative, please use insertMultiple.", {
      code: "ORAMA0001"
    });
    orama[kInsertions] = -1;
  } else if (orama[kInsertions] >= 0) {
    orama[kInsertions]++;
  }
}
function trackRemoval(orama) {
  if (typeof orama[kRemovals] !== "number") {
    queueMicrotask(() => {
      orama[kRemovals] = void 0;
    });
    orama[kRemovals] = 0;
  }
  if (orama[kRemovals] > 1e3) {
    warn("Orama's remove operation is synchronous. Please avoid removing a large number of document in a single operation in order not to block the main thread, in alternative, please use updateMultiple.", {
      code: "ORAMA0002"
    });
    orama[kRemovals] = -1;
  } else if (orama[kRemovals] >= 0) {
    orama[kRemovals]++;
  }
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/methods/insert.js
async function insert6(orama, doc, language, skipHooks) {
  const errorProperty = await orama.validateSchema(doc, orama.schema);
  if (errorProperty) {
    throw createError("SCHEMA_VALIDATION_FAILURE", errorProperty);
  }
  return innerInsert(orama, doc, language, skipHooks);
}
async function innerInsert(orama, doc, language, skipHooks) {
  const { index, docs } = orama.data;
  const id = await orama.getDocumentIndexId(doc);
  if (typeof id !== "string") {
    throw createError("DOCUMENT_ID_MUST_BE_STRING", typeof id);
  }
  if (!await orama.documentsStore.store(docs, id, doc)) {
    throw createError("DOCUMENT_ALREADY_EXISTS", id);
  }
  const docsCount = await orama.documentsStore.count(docs);
  if (!skipHooks) {
    await runSingleHook(orama.beforeInsert, orama, id, doc);
  }
  const indexableProperties = await orama.index.getSearchableProperties(index);
  const indexablePropertiesWithTypes = await orama.index.getSearchablePropertiesWithTypes(index);
  const indexableValues = await orama.getDocumentProperties(doc, indexableProperties);
  for (const [key, value] of Object.entries(indexableValues)) {
    if (typeof value === "undefined") {
      continue;
    }
    const actualType = typeof value;
    const expectedType = indexablePropertiesWithTypes[key];
    if (isVectorType(expectedType) && Array.isArray(value)) {
      continue;
    }
    if (isArrayType(expectedType) && Array.isArray(value)) {
      continue;
    }
    if (expectedType === "enum" && (actualType === "string" || actualType === "number")) {
      continue;
    }
    if (actualType !== expectedType) {
      throw createError("INVALID_DOCUMENT_PROPERTY", key, expectedType, actualType);
    }
  }
  for (const prop of indexableProperties) {
    var _orama_index, _orama_index_beforeInsert, _orama_index1, _orama_index_afterInsert;
    const value = indexableValues[prop];
    if (typeof value === "undefined") {
      continue;
    }
    const expectedType = indexablePropertiesWithTypes[prop];
    await ((_orama_index_beforeInsert = (_orama_index = orama.index).beforeInsert) === null || _orama_index_beforeInsert === void 0 ? void 0 : _orama_index_beforeInsert.call(_orama_index, orama.data.index, prop, id, value, expectedType, language, orama.tokenizer, docsCount));
    await orama.index.insert(orama.index, orama.data.index, prop, id, value, expectedType, language, orama.tokenizer, docsCount);
    await ((_orama_index_afterInsert = (_orama_index1 = orama.index).afterInsert) === null || _orama_index_afterInsert === void 0 ? void 0 : _orama_index_afterInsert.call(_orama_index1, orama.data.index, prop, id, value, expectedType, language, orama.tokenizer, docsCount));
  }
  const sortableProperties = await orama.sorter.getSortableProperties(orama.data.sorting);
  const sortablePropertiesWithTypes = await orama.sorter.getSortablePropertiesWithTypes(orama.data.sorting);
  const sortableValues = await orama.getDocumentProperties(doc, sortableProperties);
  for (const prop of sortableProperties) {
    const value = sortableValues[prop];
    if (typeof value === "undefined") {
      continue;
    }
    const expectedType = sortablePropertiesWithTypes[prop];
    await orama.sorter.insert(orama.data.sorting, prop, id, value, expectedType, language);
  }
  if (!skipHooks) {
    await runSingleHook(orama.afterInsert, orama, id, doc);
  }
  trackInsertion(orama);
  return id;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/methods/remove.js
async function remove5(orama, id, language, skipHooks) {
  let result = true;
  const { index, docs } = orama.data;
  const doc = await orama.documentsStore.get(docs, id);
  if (!doc) {
    return false;
  }
  const docId = getDocumentIdFromInternalId(orama.internalDocumentIDStore, getInternalDocumentId(orama.internalDocumentIDStore, id));
  const docsCount = await orama.documentsStore.count(docs);
  if (!skipHooks) {
    await runSingleHook(orama.beforeRemove, orama, docId);
  }
  const indexableProperties = await orama.index.getSearchableProperties(index);
  const indexablePropertiesWithTypes = await orama.index.getSearchablePropertiesWithTypes(index);
  const values = await orama.getDocumentProperties(doc, indexableProperties);
  for (const prop of indexableProperties) {
    var _orama_index, _orama_index_beforeRemove, _orama_index1, _orama_index_afterRemove;
    const value = values[prop];
    if (typeof value === "undefined") {
      continue;
    }
    const schemaType = indexablePropertiesWithTypes[prop];
    await ((_orama_index_beforeRemove = (_orama_index = orama.index).beforeRemove) === null || _orama_index_beforeRemove === void 0 ? void 0 : _orama_index_beforeRemove.call(_orama_index, orama.data.index, prop, docId, value, schemaType, language, orama.tokenizer, docsCount));
    if (!await orama.index.remove(orama.index, orama.data.index, prop, id, value, schemaType, language, orama.tokenizer, docsCount)) {
      result = false;
    }
    await ((_orama_index_afterRemove = (_orama_index1 = orama.index).afterRemove) === null || _orama_index_afterRemove === void 0 ? void 0 : _orama_index_afterRemove.call(_orama_index1, orama.data.index, prop, docId, value, schemaType, language, orama.tokenizer, docsCount));
  }
  const sortableProperties = await orama.sorter.getSortableProperties(orama.data.sorting);
  const sortableValues = await orama.getDocumentProperties(doc, sortableProperties);
  for (const prop of sortableProperties) {
    if (typeof sortableValues[prop] === "undefined") {
      continue;
    }
    await orama.sorter.remove(orama.data.sorting, prop, id);
  }
  if (!skipHooks) {
    await runSingleHook(orama.afterRemove, orama, docId);
  }
  await orama.documentsStore.remove(orama.data.docs, id);
  trackRemoval(orama);
  return result;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/facets.js
function sortingPredicate(order = "desc", a, b) {
  if (order.toLowerCase() === "asc") {
    return a[1] - b[1];
  } else {
    return b[1] - a[1];
  }
}
async function getFacets(orama, results, facetsConfig) {
  const facets = {};
  const allIDs = results.map(([id]) => id);
  const allDocs = await orama.documentsStore.getMultiple(orama.data.docs, allIDs);
  const facetKeys = Object.keys(facetsConfig);
  const properties = await orama.index.getSearchablePropertiesWithTypes(orama.data.index);
  for (const facet of facetKeys) {
    let values = {};
    if (properties[facet] === "number") {
      const { ranges } = facetsConfig[facet];
      const tmp = [];
      for (const range of ranges) {
        tmp.push([
          `${range.from}-${range.to}`,
          0
        ]);
      }
      values = Object.fromEntries(tmp);
    }
    facets[facet] = {
      count: 0,
      values
    };
  }
  const allDocsLength = allDocs.length;
  for (let i = 0; i < allDocsLength; i++) {
    const doc = allDocs[i];
    for (const facet of facetKeys) {
      const facetValue = facet.includes(".") ? await getNested(doc, facet) : doc[facet];
      const propertyType = properties[facet];
      switch (propertyType) {
        case "number": {
          const ranges = facetsConfig[facet].ranges;
          calculateNumberFacet(ranges, facets[facet].values, facetValue);
          break;
        }
        case "number[]": {
          const alreadyInsertedValues = /* @__PURE__ */ new Set();
          const ranges = facetsConfig[facet].ranges;
          for (const v2 of facetValue) {
            calculateNumberFacet(ranges, facets[facet].values, v2, alreadyInsertedValues);
          }
          break;
        }
        case "boolean":
        case "string": {
          calculateBooleanOrStringFacet(facets[facet].values, facetValue, propertyType);
          break;
        }
        case "boolean[]":
        case "string[]": {
          const alreadyInsertedValues = /* @__PURE__ */ new Set();
          const innerType = propertyType === "boolean[]" ? "boolean" : "string";
          for (const v2 of facetValue) {
            calculateBooleanOrStringFacet(facets[facet].values, v2, innerType, alreadyInsertedValues);
          }
          break;
        }
      }
    }
  }
  for (const facet of facetKeys) {
    facets[facet].count = Object.keys(facets[facet].values).length;
    if (properties[facet] === "string") {
      const stringFacetDefinition = facetsConfig;
      facets[facet].values = Object.fromEntries(Object.entries(facets[facet].values).sort((a, b) => sortingPredicate(stringFacetDefinition.sort, a, b)).slice(stringFacetDefinition.offset ?? 0, stringFacetDefinition.limit ?? 10));
    }
  }
  return facets;
}
function calculateNumberFacet(ranges, values, facetValue, alreadyInsertedValues) {
  for (const range of ranges) {
    const value = `${range.from}-${range.to}`;
    if (alreadyInsertedValues && alreadyInsertedValues.has(value)) {
      continue;
    }
    if (facetValue >= range.from && facetValue <= range.to) {
      if (values[value] === void 0) {
        values[value] = 1;
      } else {
        values[value]++;
        if (alreadyInsertedValues) {
          alreadyInsertedValues.add(value);
        }
      }
    }
  }
}
function calculateBooleanOrStringFacet(values, facetValue, propertyType, alreadyInsertedValues) {
  const value = (facetValue === null || facetValue === void 0 ? void 0 : facetValue.toString()) ?? (propertyType === "boolean" ? "false" : "");
  if (alreadyInsertedValues && alreadyInsertedValues.has(value)) {
    return;
  }
  values[value] = (values[value] ?? 0) + 1;
  if (alreadyInsertedValues) {
    alreadyInsertedValues.add(value);
  }
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/filters.js
function intersectFilteredIDs(filtered, lookedUp) {
  const map = /* @__PURE__ */ new Map();
  const result = [];
  for (const id of filtered) {
    map.set(id, true);
  }
  for (const [id, score] of lookedUp) {
    if (map.has(id)) {
      result.push([
        id,
        score
      ]);
      map.delete(id);
    }
  }
  return result;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/components/groups.js
var DEFAULT_REDUCE = {
  reducer: (_, acc, res, index) => {
    acc[index] = res;
    return acc;
  },
  getInitialValue: (length) => Array.from({
    length
  })
};
var ALLOWED_TYPES = [
  "string",
  "number",
  "boolean"
];
async function getGroups(orama, results, groupBy) {
  const properties = groupBy.properties;
  const propertiesLength = properties.length;
  const schemaProperties = await orama.index.getSearchablePropertiesWithTypes(orama.data.index);
  for (let i = 0; i < propertiesLength; i++) {
    const property = properties[i];
    if (typeof schemaProperties[property] === "undefined") {
      throw createError("UNKNOWN_GROUP_BY_PROPERTY", property);
    }
    if (!ALLOWED_TYPES.includes(schemaProperties[property])) {
      throw createError("INVALID_GROUP_BY_PROPERTY", property, ALLOWED_TYPES.join(", "), schemaProperties[property]);
    }
  }
  const allIDs = results.map(([id]) => getDocumentIdFromInternalId(orama.internalDocumentIDStore, id));
  const allDocs = await orama.documentsStore.getMultiple(orama.data.docs, allIDs);
  const allDocsLength = allDocs.length;
  const returnedCount = groupBy.maxResult || Number.MAX_SAFE_INTEGER;
  const listOfValues = [];
  const g = {};
  for (let i = 0; i < propertiesLength; i++) {
    const groupByKey = properties[i];
    const group = {
      property: groupByKey,
      perValue: {}
    };
    const values = /* @__PURE__ */ new Set();
    for (let j = 0; j < allDocsLength; j++) {
      const doc = allDocs[j];
      const value = await getNested(doc, groupByKey);
      if (typeof value === "undefined") {
        continue;
      }
      const keyValue = typeof value !== "boolean" ? value : "" + value;
      if (typeof group.perValue[keyValue] === "undefined") {
        group.perValue[keyValue] = {
          indexes: [],
          count: 0
        };
      }
      if (group.perValue[keyValue].count >= returnedCount) {
        continue;
      }
      group.perValue[keyValue].indexes.push(j);
      group.perValue[keyValue].count++;
      values.add(value);
    }
    listOfValues.push(Array.from(values));
    g[groupByKey] = group;
  }
  const combinations = calculateCombination(listOfValues);
  const combinationsLength = combinations.length;
  const groups = [];
  for (let i = 0; i < combinationsLength; i++) {
    const combination = combinations[i];
    const combinationLength = combination.length;
    const group = {
      values: [],
      indexes: []
    };
    const indexes = [];
    for (let j = 0; j < combinationLength; j++) {
      const value = combination[j];
      const property = properties[j];
      indexes.push(g[property].perValue[typeof value !== "boolean" ? value : "" + value].indexes);
      group.values.push(value);
    }
    group.indexes = intersect(indexes).sort((a, b) => a - b);
    if (group.indexes.length === 0) {
      continue;
    }
    groups.push(group);
  }
  const groupsLength = groups.length;
  const res = Array.from({
    length: groupsLength
  });
  for (let i = 0; i < groupsLength; i++) {
    const group = groups[i];
    const reduce = groupBy.reduce || DEFAULT_REDUCE;
    const docs = group.indexes.map((index) => {
      return {
        id: allIDs[index],
        score: results[index][1],
        document: allDocs[index]
      };
    });
    const func = reduce.reducer.bind(null, group.values);
    const initialValue = reduce.getInitialValue(group.indexes.length);
    const aggregationValue = docs.reduce(func, initialValue);
    res[i] = {
      values: group.values,
      result: aggregationValue
    };
  }
  return res;
}
function calculateCombination(arrs, index = 0) {
  if (index + 1 === arrs.length) return arrs[index].map((item) => [
    item
  ]);
  const head = arrs[index];
  const c2 = calculateCombination(arrs, index + 1);
  const combinations = [];
  for (const value of head) {
    for (const combination of c2) {
      const result = [
        value
      ];
      safeArrayPush(result, combination);
      combinations.push(result);
    }
  }
  return combinations;
}

// ../../node_modules/.pnpm/@orama+orama@1.2.4/node_modules/@orama/orama/dist/methods/search.js
var defaultBM25Params = {
  k: 1.2,
  b: 0.75,
  d: 0.5
};
async function createSearchContext(tokenizer, index, documentsStore, language, params, properties, tokens, docsCount, timeStart) {
  const indexMap = {};
  const docsIntersection = {};
  for (const prop of properties) {
    const tokensMap = {};
    for (const token of tokens) {
      tokensMap[token] = [];
    }
    indexMap[prop] = tokensMap;
    docsIntersection[prop] = [];
  }
  return {
    timeStart,
    tokenizer,
    index,
    documentsStore,
    language,
    params,
    docsCount,
    uniqueDocsIDs: {},
    indexMap,
    docsIntersection
  };
}
async function search2(orama, params, language) {
  const timeStart = await getNanosecondsTime();
  params.relevance = Object.assign(params.relevance ?? {}, defaultBM25Params);
  const shouldCalculateFacets = params.facets && Object.keys(params.facets).length > 0;
  const { limit = 10, offset = 0, term, properties, threshold = 1, distinctOn } = params;
  const isPreflight = params.preflight === true;
  const { index, docs } = orama.data;
  const tokens = await orama.tokenizer.tokenize(term ?? "", language);
  let propertiesToSearch = orama.caches["propertiesToSearch"];
  if (!propertiesToSearch) {
    const propertiesToSearchWithTypes = await orama.index.getSearchablePropertiesWithTypes(index);
    propertiesToSearch = await orama.index.getSearchableProperties(index);
    propertiesToSearch = propertiesToSearch.filter((prop) => propertiesToSearchWithTypes[prop].startsWith("string"));
    orama.caches["propertiesToSearch"] = propertiesToSearch;
  }
  if (properties && properties !== "*") {
    for (const prop of properties) {
      if (!propertiesToSearch.includes(prop)) {
        throw createError("UNKNOWN_INDEX", prop, propertiesToSearch.join(", "));
      }
    }
    propertiesToSearch = propertiesToSearch.filter((prop) => properties.includes(prop));
  }
  const context = await createSearchContext(orama.tokenizer, orama.index, orama.documentsStore, language, params, propertiesToSearch, tokens, await orama.documentsStore.count(docs), timeStart);
  const hasFilters = Object.keys(params.where ?? {}).length > 0;
  let whereFiltersIDs = [];
  if (hasFilters) {
    whereFiltersIDs = await orama.index.searchByWhereClause(context, index, params.where);
  }
  const tokensLength = tokens.length;
  if (tokensLength) {
    const indexesLength = propertiesToSearch.length;
    for (let i = 0; i < indexesLength; i++) {
      var _params_boost;
      const prop = propertiesToSearch[i];
      const tokensLength2 = tokens.length;
      for (let j = 0; j < tokensLength2; j++) {
        const term2 = tokens[j];
        const scoreList = await orama.index.search(context, index, prop, term2);
        safeArrayPush(context.indexMap[prop][term2], scoreList);
      }
      const docIds = context.indexMap[prop];
      const vals = Object.values(docIds);
      context.docsIntersection[prop] = prioritizeTokenScores(vals, (params === null || params === void 0 ? void 0 : (_params_boost = params.boost) === null || _params_boost === void 0 ? void 0 : _params_boost[prop]) ?? 1, threshold, tokensLength2);
      const uniqueDocs = context.docsIntersection[prop];
      const uniqueDocsLength = uniqueDocs.length;
      for (let i2 = 0; i2 < uniqueDocsLength; i2++) {
        const [id, score] = uniqueDocs[i2];
        const prevScore = context.uniqueDocsIDs[id];
        if (prevScore) {
          context.uniqueDocsIDs[id] = prevScore + score + 0.5;
        } else {
          context.uniqueDocsIDs[id] = score;
        }
      }
    }
  } else if (tokens.length === 0 && term) {
    context.uniqueDocsIDs = {};
  } else {
    context.uniqueDocsIDs = Object.fromEntries(Object.keys(await orama.documentsStore.getAll(orama.data.docs)).map((k) => [
      k,
      0
    ]));
  }
  let uniqueDocsArray = Object.entries(context.uniqueDocsIDs).map(([id, score]) => [
    +id,
    score
  ]);
  if (hasFilters) {
    uniqueDocsArray = intersectFilteredIDs(whereFiltersIDs, uniqueDocsArray);
  }
  if (params.sortBy) {
    if (typeof params.sortBy === "function") {
      const ids = uniqueDocsArray.map(([id]) => id);
      const docs2 = await orama.documentsStore.getMultiple(orama.data.docs, ids);
      const docsWithIdAndScore = docs2.map((d, i) => [
        uniqueDocsArray[i][0],
        uniqueDocsArray[i][1],
        d
      ]);
      docsWithIdAndScore.sort(params.sortBy);
      uniqueDocsArray = docsWithIdAndScore.map(([id, score]) => [
        id,
        score
      ]);
    } else {
      uniqueDocsArray = await orama.sorter.sortBy(orama.data.sorting, uniqueDocsArray, params.sortBy).then((results2) => results2.map(([id, score]) => [
        getInternalDocumentId(orama.internalDocumentIDStore, id),
        score
      ]));
    }
  } else {
    uniqueDocsArray = uniqueDocsArray.sort(sortTokenScorePredicate);
  }
  let results;
  if (!isPreflight && distinctOn) {
    results = await fetchDocumentsWithDistinct(orama, uniqueDocsArray, offset, limit, distinctOn);
  } else if (!isPreflight) {
    results = await fetchDocuments(orama, uniqueDocsArray, offset, limit);
  }
  const searchResult = {
    elapsed: {
      formatted: "",
      raw: 0
    },
    // We keep the hits array empty if it's a preflight request.
    hits: [],
    count: uniqueDocsArray.length
  };
  if (typeof results !== "undefined") {
    searchResult.hits = results.filter(Boolean);
  }
  if (shouldCalculateFacets) {
    const facets = await getFacets(orama, uniqueDocsArray, params.facets);
    searchResult.facets = facets;
  }
  if (params.groupBy) {
    searchResult.groups = await getGroups(orama, uniqueDocsArray, params.groupBy);
  }
  if (orama.afterSearch) {
    await runAfterSearch(orama.afterSearch, orama, params, language, searchResult);
  }
  searchResult.elapsed = await orama.formatElapsedTime(await getNanosecondsTime() - context.timeStart);
  return searchResult;
}
async function fetchDocumentsWithDistinct(orama, uniqueDocsArray, offset, limit, distinctOn) {
  const docs = orama.data.docs;
  const values = /* @__PURE__ */ new Map();
  const results = [];
  const resultIDs = /* @__PURE__ */ new Set();
  const uniqueDocsArrayLength = uniqueDocsArray.length;
  let count2 = 0;
  for (let i = 0; i < uniqueDocsArrayLength; i++) {
    const idAndScore = uniqueDocsArray[i];
    if (typeof idAndScore === "undefined") {
      continue;
    }
    const [id, score] = idAndScore;
    if (resultIDs.has(id)) {
      continue;
    }
    const doc = await orama.documentsStore.get(docs, id);
    const value = await getNested(doc, distinctOn);
    if (typeof value === "undefined" || values.has(value)) {
      continue;
    }
    values.set(value, true);
    count2++;
    if (count2 <= offset) {
      continue;
    }
    results.push({
      id: getDocumentIdFromInternalId(orama.internalDocumentIDStore, id),
      score,
      document: doc
    });
    resultIDs.add(id);
    if (count2 >= offset + limit) {
      break;
    }
  }
  return results;
}
async function fetchDocuments(orama, uniqueDocsArray, offset, limit) {
  const docs = orama.data.docs;
  const results = Array.from({
    length: limit
  });
  const resultIDs = /* @__PURE__ */ new Set();
  for (let i = offset; i < limit + offset; i++) {
    const idAndScore = uniqueDocsArray[i];
    if (typeof idAndScore === "undefined") {
      break;
    }
    const [id, score] = idAndScore;
    if (!resultIDs.has(id)) {
      const fullDoc = await orama.documentsStore.get(docs, id);
      results[i] = {
        id: getDocumentIdFromInternalId(orama.internalDocumentIDStore, id),
        score,
        document: fullDoc
      };
      resultIDs.add(id);
    }
  }
  return results;
}

// src/indexer.ts
var import_debug = __toESM(require_src());
var debug = (0, import_debug.default)("verdaccio:search:indexer");
var SearchMemoryIndexer = class {
  database;
  storage;
  logger;
  /**
   * Set up the {Storage}
   * @param {*} storage An storage reference.
   */
  configureStorage(storage) {
    this.storage = storage;
  }
  /**
   * Performs a query to the indexer.
   * If the keyword is a * it returns all local elements
   * otherwise performs a search
   * @param {*} q the keyword
   * @return {Array} list of results.
   */
  async query(term) {
    if (this.database) {
      debug("searching %s at indexer", term);
      const searchResult = await search2(this.database, {
        term
      });
      return searchResult;
    }
  }
  prepareKeywords(keywords) {
    if (typeof keywords === "undefined") {
      return "";
    } else if (typeof keywords === "string") {
      return keywords;
    }
    return keywords.join(",");
  }
  /**
   * Add a new element to index
   * @param {*} pkg the package
   */
  async add(pkg) {
    if (this.database) {
      const name = pkg.name;
      debug("adding item %s to the indexer", name);
      const item = {
        id: name,
        name,
        description: pkg.description,
        version: pkg.version,
        keywords: this.prepareKeywords(pkg.keywords),
        author: pkg._npmUser ? pkg._npmUser.name : ""
      };
      await insert6(this.database, item);
    }
  }
  /**
   * Remove an element from the index.
   * @param {*} name the id element
   */
  async remove(name) {
    if (this.database) {
      debug("removing item %s to the indexer", name);
      await remove5(this.database, name);
    }
  }
  /**
   * Force a re-index.
   */
  async reindex() {
    debug("reindexing search indexer");
    this.storage?.getLocalDatabase(async (error, packages) => {
      if (error) {
        throw error;
      }
      let i = packages.length;
      if (i === 0) {
        debug("no packages to index");
      }
      while (i--) {
        const pkg = packages[i];
        debug("indexing package %s", pkg?.name);
        try {
          await this.add(pkg);
        } catch (err) {
          this.logger?.error({ err: err.message }, "error @{err} indexing package");
        }
      }
      debug("reindexed search indexer");
    });
  }
  async init(logger) {
    this.logger = logger;
    this.database = await create7({
      schema: {
        id: "string",
        name: "string",
        description: "string",
        keywords: "string",
        version: "string",
        readme: "string"
      }
    });
    this.reindex();
  }
};
var indexer_default = new SearchMemoryIndexer();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SearchMemoryIndexer
});
