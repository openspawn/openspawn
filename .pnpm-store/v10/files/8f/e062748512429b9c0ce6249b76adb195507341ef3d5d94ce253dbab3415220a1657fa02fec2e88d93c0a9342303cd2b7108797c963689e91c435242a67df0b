import {
  consumeTypes,
  generateTypesInChildProcess,
  rpc_exports
} from "./chunk-N7GTIQUA.js";
import {
  cloneDeepOptions,
  generateTypes,
  isTSProject,
  retrieveTypesAssetsInfo,
  validateOptions
} from "./chunk-RWXNVNFM.js";
import {
  getIPV4,
  logger
} from "./chunk-WWV5RWOP.js";
import {
  WEB_CLIENT_OPTIONS_IDENTIFIER,
  __async,
  __name,
  __publicField,
  __spreadProps,
  __spreadValues
} from "./chunk-647HGGGS.js";

// src/plugins/DevPlugin.ts
import fs from "fs-extra";
import path4 from "path";

// src/dev-worker/createDevWorker.ts
import * as path2 from "path";
import * as fse from "fs-extra";

// src/dev-worker/DevWorker.ts
import path from "path";
var _DevWorker = class _DevWorker {
  constructor(options) {
    __publicField(this, "_rpcWorker");
    __publicField(this, "_options");
    __publicField(this, "_res");
    this._options = cloneDeepOptions(options);
    this.removeUnSerializationOptions();
    this._rpcWorker = rpc_exports.createRpcWorker(path.resolve(__dirname, "./fork-dev-worker.js"), {}, void 0, false);
    this._res = this._rpcWorker.connect(this._options);
  }
  // moduleFederationConfig.manifest may have un serialization options
  removeUnSerializationOptions() {
    var _a, _b, _c, _d;
    (_b = (_a = this._options.host) == null ? void 0 : _a.moduleFederationConfig) == null ? true : delete _b.manifest;
    (_d = (_c = this._options.remote) == null ? void 0 : _c.moduleFederationConfig) == null ? true : delete _d.manifest;
  }
  get controlledPromise() {
    return this._res;
  }
  update() {
    var _a, _b;
    (_b = (_a = this._rpcWorker.process) == null ? void 0 : _a.send) == null ? void 0 : _b.call(_a, {
      type: rpc_exports.RpcGMCallTypes.CALL,
      id: this._rpcWorker.id,
      args: [
        void 0,
        "update"
      ]
    });
  }
  exit() {
    var _a;
    (_a = this._rpcWorker) == null ? void 0 : _a.terminate();
  }
};
__name(_DevWorker, "DevWorker");
var DevWorker = _DevWorker;

// src/dev-worker/createDevWorker.ts
function removeLogFile() {
  return __async(this, null, function* () {
    try {
      const logDir = path2.resolve(process.cwd(), ".mf/typesGenerate.log");
      yield fse.remove(logDir);
    } catch (err) {
      console.error("removeLogFile error", "forkDevWorker", err);
    }
  });
}
__name(removeLogFile, "removeLogFile");
function createDevWorker(options) {
  removeLogFile();
  return new DevWorker(__spreadValues({}, options));
}
__name(createDevWorker, "createDevWorker");

// src/plugins/DevPlugin.ts
import { normalizeOptions, TEMP_DIR as BasicTempDir } from "@module-federation/sdk";

// src/plugins/utils.ts
import path3 from "path";
function isDev() {
  return process.env["NODE_ENV"] === "development";
}
__name(isDev, "isDev");
function isPrd() {
  return process.env["NODE_ENV"] === "production";
}
__name(isPrd, "isPrd");
function getCompilerOutputDir(compiler) {
  try {
    return path3.relative(compiler.context, compiler.outputPath || compiler.options.output.path);
  } catch (err) {
    return "";
  }
}
__name(getCompilerOutputDir, "getCompilerOutputDir");

// src/plugins/DevPlugin.ts
var PROCESS_EXIT_CODE;
(function(PROCESS_EXIT_CODE2) {
  PROCESS_EXIT_CODE2[PROCESS_EXIT_CODE2["SUCCESS"] = 0] = "SUCCESS";
  PROCESS_EXIT_CODE2[PROCESS_EXIT_CODE2["FAILURE"] = 1] = "FAILURE";
})(PROCESS_EXIT_CODE || (PROCESS_EXIT_CODE = {}));
function ensureTempDir(filePath) {
  try {
    const dir = path4.dirname(filePath);
    fs.ensureDirSync(dir);
  } catch (_err) {
  }
}
__name(ensureTempDir, "ensureTempDir");
var _DevPlugin = class _DevPlugin {
  constructor(options, dtsOptions, generateTypesPromise, fetchRemoteTypeUrlsPromise) {
    __publicField(this, "name", "MFDevPlugin");
    __publicField(this, "_options");
    __publicField(this, "_devWorker");
    __publicField(this, "dtsOptions");
    __publicField(this, "generateTypesPromise");
    __publicField(this, "fetchRemoteTypeUrlsPromise");
    this._options = options;
    this.generateTypesPromise = generateTypesPromise;
    this.dtsOptions = dtsOptions;
    this.fetchRemoteTypeUrlsPromise = fetchRemoteTypeUrlsPromise;
  }
  static ensureLiveReloadEntry(options, filePath) {
    ensureTempDir(filePath);
    const liveReloadEntry = fs.readFileSync(path4.join(__dirname, "./iife/launch-web-client.js")).toString("utf-8");
    const liveReloadEntryWithOptions = liveReloadEntry.replace(WEB_CLIENT_OPTIONS_IDENTIFIER, JSON.stringify(options));
    fs.writeFileSync(filePath, liveReloadEntryWithOptions);
  }
  _stopWhenSIGTERMOrSIGINT() {
    process.on("SIGTERM", () => {
      logger.info(`${this._options.name} Process(${process.pid}) SIGTERM, mf server will exit...`);
      this._exit(0);
    });
    process.on("SIGINT", () => {
      logger.info(`${this._options.name} Process(${process.pid}) SIGINT, mf server will exit...`);
      this._exit(0);
    });
  }
  _handleUnexpectedExit() {
    process.on("unhandledRejection", (error) => {
      logger.error(error);
      logger.error(`Process(${process.pid}) unhandledRejection, mf server will exit...`);
      this._exit(1);
    });
    process.on("uncaughtException", (error) => {
      logger.error(error);
      logger.error(`Process(${process.pid}) uncaughtException, mf server will exit...`);
      this._exit(1);
    });
  }
  _exit(exitCode = 0) {
    var _a;
    (_a = this._devWorker) == null ? void 0 : _a.exit();
    process.exit(exitCode);
  }
  _afterEmit() {
    var _a;
    (_a = this._devWorker) == null ? void 0 : _a.update();
  }
  apply(compiler) {
    var _a;
    const { _options: { name, dev, dts } } = this;
    const normalizedDev = normalizeOptions(true, {
      disableLiveReload: true,
      disableHotTypesReload: false,
      disableDynamicRemoteTypeHints: false
    }, "mfOptions.dev")(dev);
    if (!isDev() || normalizedDev === false) {
      return;
    }
    new compiler.webpack.DefinePlugin({
      FEDERATION_IPV4: JSON.stringify(getIPV4())
    }).apply(compiler);
    if (normalizedDev.disableHotTypesReload && normalizedDev.disableLiveReload && normalizedDev.disableDynamicRemoteTypeHints) {
      return;
    }
    if (!name) {
      throw new Error("name is required if you want to enable dev server!");
    }
    if (!normalizedDev.disableDynamicRemoteTypeHints) {
      if (!this._options.runtimePlugins) {
        this._options.runtimePlugins = [];
      }
      this._options.runtimePlugins.push(path4.resolve(__dirname, "dynamic-remote-type-hints-plugin.js"));
    }
    if (!normalizedDev.disableLiveReload) {
      const TEMP_DIR = path4.join(`${process.cwd()}/node_modules`, BasicTempDir);
      const filepath = path4.join(TEMP_DIR, `live-reload.js`);
      if (typeof compiler.options.entry === "object") {
        _DevPlugin.ensureLiveReloadEntry({
          name
        }, filepath);
        Object.keys(compiler.options.entry).forEach((entry) => {
          const normalizedEntry = compiler.options.entry[entry];
          if (typeof normalizedEntry === "object" && Array.isArray(normalizedEntry.import)) {
            normalizedEntry.import.unshift(filepath);
          }
        });
      }
    }
    const defaultGenerateTypes = {
      compileInChildProcess: true
    };
    const defaultConsumeTypes = {
      consumeAPITypes: true
    };
    const normalizedDtsOptions = normalizeOptions(isTSProject(dts, compiler.context), {
      //  remote types dist(.dev-server) not be used currently, so no need to set extractThirdParty etc
      generateTypes: defaultGenerateTypes,
      consumeTypes: defaultConsumeTypes,
      extraOptions: {},
      displayErrorInTerminal: (_a = this.dtsOptions) == null ? void 0 : _a.displayErrorInTerminal
    }, "mfOptions.dts")(dts);
    const normalizedGenerateTypes = normalizeOptions(Boolean(normalizedDtsOptions), defaultGenerateTypes, "mfOptions.dts.generateTypes")(normalizedDtsOptions === false ? void 0 : normalizedDtsOptions.generateTypes);
    const remote = normalizedGenerateTypes === false ? void 0 : __spreadProps(__spreadValues({
      implementation: normalizedDtsOptions === false ? void 0 : normalizedDtsOptions.implementation,
      context: compiler.context,
      outputDir: getCompilerOutputDir(compiler),
      moduleFederationConfig: __spreadValues({}, this._options),
      hostRemoteTypesFolder: normalizedGenerateTypes.typesFolder || "@mf-types"
    }, normalizedGenerateTypes), {
      typesFolder: `.dev-server`
    });
    const normalizedConsumeTypes = normalizeOptions(Boolean(normalizedDtsOptions), defaultConsumeTypes, "mfOptions.dts.consumeTypes")(normalizedDtsOptions === false ? void 0 : normalizedDtsOptions.consumeTypes);
    const host = normalizedConsumeTypes === false ? void 0 : __spreadValues({
      implementation: normalizedDtsOptions === false ? void 0 : normalizedDtsOptions.implementation,
      context: compiler.context,
      moduleFederationConfig: this._options,
      typesFolder: normalizedConsumeTypes.typesFolder || "@mf-types",
      abortOnError: false
    }, normalizedConsumeTypes);
    const extraOptions = normalizedDtsOptions ? normalizedDtsOptions.extraOptions || {} : {};
    if (!remote && !host && normalizedDev.disableLiveReload) {
      return;
    }
    if (remote && !(remote == null ? void 0 : remote.tsConfigPath) && typeof normalizedDtsOptions === "object" && normalizedDtsOptions.tsConfigPath) {
      remote.tsConfigPath = normalizedDtsOptions.tsConfigPath;
    }
    Promise.all([
      this.generateTypesPromise,
      this.fetchRemoteTypeUrlsPromise
    ]).then(([_, remoteTypeUrls]) => {
      this._devWorker = createDevWorker({
        name,
        remote,
        host: __spreadProps(__spreadValues({}, host), {
          remoteTypeUrls
        }),
        extraOptions,
        disableLiveReload: normalizedDev.disableHotTypesReload,
        disableHotTypesReload: normalizedDev.disableHotTypesReload
      });
    });
    this._stopWhenSIGTERMOrSIGINT();
    this._handleUnexpectedExit();
    compiler.hooks.afterEmit.tap(this.name, this._afterEmit.bind(this));
  }
};
__name(_DevPlugin, "DevPlugin");
var DevPlugin = _DevPlugin;

// src/plugins/DtsPlugin.ts
import { normalizeOptions as normalizeOptions4 } from "@module-federation/sdk";

// src/plugins/ConsumeTypesPlugin.ts
import { infrastructureLogger as logger2 } from "@module-federation/sdk";
import { normalizeOptions as normalizeOptions2 } from "@module-federation/sdk";
var DEFAULT_CONSUME_TYPES = {
  abortOnError: false,
  consumeAPITypes: true,
  typesOnBuild: false
};
var normalizeConsumeTypesOptions = /* @__PURE__ */ __name(({ context, dtsOptions, pluginOptions }) => {
  const normalizedConsumeTypes = normalizeOptions2(true, DEFAULT_CONSUME_TYPES, "mfOptions.dts.consumeTypes")(dtsOptions.consumeTypes);
  if (!normalizedConsumeTypes) {
    return;
  }
  const dtsManagerOptions = {
    host: __spreadValues({
      implementation: dtsOptions.implementation,
      context,
      moduleFederationConfig: pluginOptions
    }, normalizedConsumeTypes),
    extraOptions: dtsOptions.extraOptions || {},
    displayErrorInTerminal: dtsOptions.displayErrorInTerminal
  };
  validateOptions(dtsManagerOptions.host);
  return dtsManagerOptions;
}, "normalizeConsumeTypesOptions");
var consumeTypesAPI = /* @__PURE__ */ __name((dtsManagerOptions, cb) => __async(void 0, null, function* () {
  const fetchRemoteTypeUrlsPromise = typeof dtsManagerOptions.host.remoteTypeUrls === "function" ? dtsManagerOptions.host.remoteTypeUrls() : Promise.resolve(dtsManagerOptions.host.remoteTypeUrls);
  return fetchRemoteTypeUrlsPromise.then((remoteTypeUrls) => {
    consumeTypes(__spreadProps(__spreadValues({}, dtsManagerOptions), {
      host: __spreadProps(__spreadValues({}, dtsManagerOptions.host), {
        remoteTypeUrls
      })
    })).then(() => {
      typeof cb === "function" && cb(remoteTypeUrls);
    }).catch(() => {
      typeof cb === "function" && cb(remoteTypeUrls);
    });
  });
}), "consumeTypesAPI");
var _ConsumeTypesPlugin = class _ConsumeTypesPlugin {
  constructor(pluginOptions, dtsOptions, fetchRemoteTypeUrlsResolve) {
    __publicField(this, "pluginOptions");
    __publicField(this, "dtsOptions");
    __publicField(this, "callback");
    __publicField(this, "fetchRemoteTypeUrlsResolve");
    this.pluginOptions = pluginOptions;
    this.dtsOptions = dtsOptions;
    this.fetchRemoteTypeUrlsResolve = fetchRemoteTypeUrlsResolve;
  }
  apply(compiler) {
    const { dtsOptions, pluginOptions, fetchRemoteTypeUrlsResolve } = this;
    const dtsManagerOptions = normalizeConsumeTypesOptions({
      context: compiler.context,
      dtsOptions,
      pluginOptions
    });
    if (!dtsManagerOptions) {
      fetchRemoteTypeUrlsResolve(void 0);
      return;
    }
    if (isPrd() && !dtsManagerOptions.host.typesOnBuild) {
      fetchRemoteTypeUrlsResolve(void 0);
      return;
    }
    logger2.debug("start fetching remote types...");
    const promise = consumeTypesAPI(dtsManagerOptions, fetchRemoteTypeUrlsResolve);
    compiler.hooks.thisCompilation.tap("mf:generateTypes", (compilation) => {
      compilation.hooks.processAssets.tapPromise({
        name: "mf:generateTypes",
        stage: (
          // @ts-expect-error use runtime variable in case peer dep not installed , it should execute before generate types
          compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER - 1
        )
      }, () => __async(this, null, function* () {
        yield promise;
        logger2.debug("fetch remote types success!");
      }));
    });
  }
};
__name(_ConsumeTypesPlugin, "ConsumeTypesPlugin");
var ConsumeTypesPlugin = _ConsumeTypesPlugin;

// src/plugins/GenerateTypesPlugin.ts
import fs2 from "fs";
import path5 from "path";
import { logger as logger3, normalizeOptions as normalizeOptions3 } from "@module-federation/sdk";
var DEFAULT_GENERATE_TYPES = {
  generateAPITypes: true,
  compileInChildProcess: true,
  abortOnError: false,
  extractThirdParty: false,
  extractRemoteTypes: false
};
var normalizeGenerateTypesOptions = /* @__PURE__ */ __name(({ context, outputDir, dtsOptions, pluginOptions }) => {
  const normalizedGenerateTypes = normalizeOptions3(true, DEFAULT_GENERATE_TYPES, "mfOptions.dts.generateTypes")(dtsOptions.generateTypes);
  if (!normalizedGenerateTypes) {
    return;
  }
  const normalizedConsumeTypes = normalizeOptions3(true, {}, "mfOptions.dts.consumeTypes")(dtsOptions.consumeTypes);
  const finalOptions = {
    remote: __spreadValues({
      implementation: dtsOptions.implementation,
      context,
      outputDir,
      moduleFederationConfig: pluginOptions
    }, normalizedGenerateTypes),
    host: normalizedConsumeTypes === false ? void 0 : __spreadProps(__spreadValues({
      context,
      moduleFederationConfig: pluginOptions
    }, normalizedConsumeTypes), {
      // generateTypes only use host basic config, eg: typeFolders
      remoteTypeUrls: typeof (normalizedConsumeTypes == null ? void 0 : normalizedConsumeTypes.remoteTypeUrls) === "object" ? normalizedConsumeTypes == null ? void 0 : normalizedConsumeTypes.remoteTypeUrls : void 0
    }),
    extraOptions: dtsOptions.extraOptions || {},
    displayErrorInTerminal: dtsOptions.displayErrorInTerminal
  };
  if (dtsOptions.tsConfigPath && !finalOptions.remote.tsConfigPath) {
    finalOptions.remote.tsConfigPath = dtsOptions.tsConfigPath;
  }
  validateOptions(finalOptions.remote);
  return finalOptions;
}, "normalizeGenerateTypesOptions");
var getGenerateTypesFn = /* @__PURE__ */ __name((dtsManagerOptions) => {
  let fn = generateTypes;
  if (dtsManagerOptions.remote.compileInChildProcess) {
    fn = generateTypesInChildProcess;
  }
  return fn;
}, "getGenerateTypesFn");
var generateTypesAPI = /* @__PURE__ */ __name(({ dtsManagerOptions }) => {
  const fn = getGenerateTypesFn(dtsManagerOptions);
  return fn(dtsManagerOptions);
}, "generateTypesAPI");
var _GenerateTypesPlugin = class _GenerateTypesPlugin {
  constructor(pluginOptions, dtsOptions, fetchRemoteTypeUrlsPromise, callback) {
    __publicField(this, "pluginOptions");
    __publicField(this, "dtsOptions");
    __publicField(this, "fetchRemoteTypeUrlsPromise");
    __publicField(this, "callback");
    this.pluginOptions = pluginOptions;
    this.dtsOptions = dtsOptions;
    this.fetchRemoteTypeUrlsPromise = fetchRemoteTypeUrlsPromise;
    this.callback = callback;
  }
  apply(compiler) {
    const { dtsOptions, pluginOptions, fetchRemoteTypeUrlsPromise, callback } = this;
    const outputDir = getCompilerOutputDir(compiler);
    const context = compiler.context;
    const dtsManagerOptions = normalizeGenerateTypesOptions({
      context,
      outputDir,
      dtsOptions,
      pluginOptions
    });
    if (!dtsManagerOptions) {
      callback();
      return;
    }
    const isProd = !isDev();
    const emitTypesFiles = /* @__PURE__ */ __name((compilation) => __async(this, null, function* () {
      try {
        const { zipTypesPath, apiTypesPath, zipName, apiFileName } = retrieveTypesAssetsInfo(dtsManagerOptions.remote);
        if (isProd && zipName && compilation.getAsset(zipName)) {
          callback();
          return;
        }
        logger3.debug("start generating types...");
        yield generateTypesAPI({
          dtsManagerOptions
        });
        logger3.debug("generate types success!");
        if (isProd) {
          if (zipTypesPath && !compilation.getAsset(zipName) && fs2.existsSync(zipTypesPath)) {
            compilation.emitAsset(zipName, new compiler.webpack.sources.RawSource(fs2.readFileSync(zipTypesPath), false));
          }
          if (apiTypesPath && !compilation.getAsset(apiFileName) && fs2.existsSync(apiTypesPath)) {
            compilation.emitAsset(apiFileName, new compiler.webpack.sources.RawSource(fs2.readFileSync(apiTypesPath), false));
          }
          callback();
        } else {
          const isEEXIST = /* @__PURE__ */ __name((err) => {
            return err.code == "EEXIST";
          }, "isEEXIST");
          if (zipTypesPath && fs2.existsSync(zipTypesPath)) {
            const zipContent = fs2.readFileSync(zipTypesPath);
            const zipOutputPath = path5.join(compiler.outputPath, zipName);
            yield new Promise((resolve2, reject) => {
              compiler.outputFileSystem.mkdir(
                path5.dirname(zipOutputPath),
                {
                  recursive: true
                },
                // @ts-ignore  type fixed in  https://github.com/webpack/webpack/releases/tag/v5.91.0
                (err) => {
                  if (err && !isEEXIST(err)) {
                    reject(err);
                  } else {
                    compiler.outputFileSystem.writeFile(
                      zipOutputPath,
                      // @ts-ignore
                      zipContent,
                      (writeErr) => {
                        if (writeErr && !isEEXIST(writeErr)) {
                          reject(writeErr);
                        } else {
                          resolve2();
                        }
                      }
                    );
                  }
                }
              );
            });
          }
          if (apiTypesPath && fs2.existsSync(apiTypesPath)) {
            const apiContent = fs2.readFileSync(apiTypesPath);
            const apiOutputPath = path5.join(compiler.outputPath, apiFileName);
            yield new Promise((resolve2, reject) => {
              compiler.outputFileSystem.mkdir(
                path5.dirname(apiOutputPath),
                {
                  recursive: true
                },
                // @ts-ignore  type fixed in  https://github.com/webpack/webpack/releases/tag/v5.91.0
                (err) => {
                  if (err && !isEEXIST(err)) {
                    reject(err);
                  } else {
                    compiler.outputFileSystem.writeFile(
                      apiOutputPath,
                      // @ts-ignore
                      apiContent,
                      (writeErr) => {
                        if (writeErr && !isEEXIST(writeErr)) {
                          reject(writeErr);
                        } else {
                          resolve2();
                        }
                      }
                    );
                  }
                }
              );
            });
          }
          callback();
        }
      } catch (err) {
        callback();
        if (dtsManagerOptions.displayErrorInTerminal) {
          console.error(err);
        }
        logger3.debug("generate types fail!");
      }
    }), "emitTypesFiles");
    compiler.hooks.thisCompilation.tap("mf:generateTypes", (compilation) => {
      compilation.hooks.processAssets.tapPromise({
        name: "mf:generateTypes",
        stage: (
          // @ts-expect-error use runtime variable in case peer dep not installed
          compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER
        )
      }, () => __async(this, null, function* () {
        yield fetchRemoteTypeUrlsPromise;
        const emitTypesFilesPromise = emitTypesFiles(compilation);
        if (isProd) {
          yield emitTypesFilesPromise;
        }
      }));
    });
  }
};
__name(_GenerateTypesPlugin, "GenerateTypesPlugin");
var GenerateTypesPlugin = _GenerateTypesPlugin;

// src/plugins/DtsPlugin.ts
var normalizeDtsOptions = /* @__PURE__ */ __name((options, context, defaultOptions) => {
  return normalizeOptions4(isTSProject(options.dts, context), {
    generateTypes: (defaultOptions == null ? void 0 : defaultOptions.defaultGenerateOptions) || DEFAULT_GENERATE_TYPES,
    consumeTypes: (defaultOptions == null ? void 0 : defaultOptions.defaultConsumeOptions) || DEFAULT_CONSUME_TYPES,
    extraOptions: {},
    displayErrorInTerminal: true
  }, "mfOptions.dts")(options.dts);
}, "normalizeDtsOptions");
var excludeDts = /* @__PURE__ */ __name((filepath) => {
  if (typeof filepath !== "string") {
    return false;
  }
  const [_p, query] = filepath.split("?");
  if (query && query.startsWith("exclude-mf-dts")) {
    return true;
  }
  return false;
}, "excludeDts");
var _DtsPlugin = class _DtsPlugin {
  constructor(options) {
    __publicField(this, "options");
    __publicField(this, "clonedOptions");
    this.options = options;
    this.clonedOptions = __spreadValues({}, options);
  }
  apply(compiler) {
    const { options, clonedOptions } = this;
    if (options.exposes && typeof options.exposes === "object") {
      const cleanedExposes = {};
      Object.entries(options.exposes).forEach(([key, value]) => {
        if (typeof value === "string") {
          const [filepath, _query] = value.split("?");
          if (excludeDts(value)) {
            return;
          }
          cleanedExposes[key] = filepath;
        } else {
          if (typeof value === "object" && Array.isArray(value.import) && value.import.some((v) => excludeDts(v))) {
            return;
          }
          cleanedExposes[key] = value;
        }
      });
      clonedOptions.exposes = cleanedExposes;
    }
    const normalizedDtsOptions = normalizeDtsOptions(clonedOptions, compiler.context);
    if (typeof normalizedDtsOptions !== "object") {
      return;
    }
    let fetchRemoteTypeUrlsResolve;
    const fetchRemoteTypeUrlsPromise = new Promise((resolve2) => {
      fetchRemoteTypeUrlsResolve = resolve2;
    });
    let generateTypesPromiseResolve;
    const generateTypesPromise = new Promise((resolve2) => {
      generateTypesPromiseResolve = resolve2;
    });
    new DevPlugin(clonedOptions, normalizedDtsOptions, generateTypesPromise, fetchRemoteTypeUrlsPromise).apply(compiler);
    new GenerateTypesPlugin(clonedOptions, normalizedDtsOptions, fetchRemoteTypeUrlsPromise, generateTypesPromiseResolve).apply(compiler);
    new ConsumeTypesPlugin(clonedOptions, normalizedDtsOptions, fetchRemoteTypeUrlsResolve).apply(compiler);
  }
  addRuntimePlugins() {
    const { options, clonedOptions } = this;
    if (!clonedOptions.runtimePlugins) {
      return;
    }
    if (!options.runtimePlugins) {
      options.runtimePlugins = [];
    }
    clonedOptions.runtimePlugins.forEach((plugin) => {
      options.runtimePlugins.includes(plugin) || options.runtimePlugins.push(plugin);
    });
  }
};
__name(_DtsPlugin, "DtsPlugin");
var DtsPlugin = _DtsPlugin;
export {
  DtsPlugin,
  consumeTypesAPI,
  generateTypesAPI,
  isTSProject,
  normalizeConsumeTypesOptions,
  normalizeDtsOptions,
  normalizeGenerateTypesOptions
};
