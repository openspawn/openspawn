"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_NAME = void 0;
const sdk_1 = require("@module-federation/sdk");
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const SharedDependency_1 = __importDefault(require("./SharedDependency"));
const SharedEntryDependency_1 = __importDefault(require("./SharedEntryDependency"));
const SharedEntryModuleFactory_1 = __importDefault(require("./SharedEntryModuleFactory"));
const utils_1 = require("../../../container/runtime/utils");
const FederationRuntimeModule_1 = __importDefault(require("../../../container/runtime/FederationRuntimeModule"));
const EntryDependency = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/dependencies/EntryDependency'));
exports.PLUGIN_NAME = 'SharedContainerPlugin';
const HOT_UPDATE_SUFFIX = '.hot-update';
class SharedContainerPlugin {
    constructor(options) {
        this.name = exports.PLUGIN_NAME;
        this.filename = '';
        const { mfName, shareName, request, library, independentShareFileName } = options;
        const version = options.version || '0.0.0';
        this._globalName = (0, sdk_1.encodeName)(`${mfName}_${shareName}_${version}`);
        const fileName = independentShareFileName || `${version}/share-entry.js`;
        this._shareName = shareName;
        this._options = {
            name: shareName,
            request: request,
            library: (library
                ? { ...library, name: this._globalName }
                : undefined) || {
                type: 'global',
                name: this._globalName,
            },
            version,
            fileName,
        };
    }
    getData() {
        return [this.filename, this._globalName, this._options.version];
    }
    apply(compiler) {
        const { library, name, request, fileName } = this._options;
        if (library.type &&
            compiler.options.output &&
            compiler.options.output.enabledLibraryTypes &&
            !compiler.options.output.enabledLibraryTypes.includes(library.type)) {
            compiler.options.output.enabledLibraryTypes.push(library.type);
        }
        compiler.hooks.make.tapAsync(exports.PLUGIN_NAME, async (compilation, callback) => {
            const dep = new SharedEntryDependency_1.default(name, request);
            dep.loc = { name: name };
            compilation.addEntry(compilation.options.context || '', dep, {
                name: name,
                filename: fileName,
                library: {
                    type: library.type,
                    name: this._globalName,
                },
            }, (error) => {
                if (error) {
                    throw error;
                }
            });
            callback();
        });
        // add the container entry module
        compiler.hooks.thisCompilation.tap(exports.PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
            compilation.dependencyFactories.set(SharedEntryDependency_1.default, new SharedEntryModuleFactory_1.default());
            compilation.dependencyFactories.set(SharedDependency_1.default, normalModuleFactory);
            if (!compilation.dependencyFactories.has(EntryDependency)) {
                compilation.dependencyFactories.set(EntryDependency, normalModuleFactory);
            }
            compilation.hooks.additionalTreeRuntimeRequirements.tap(exports.PLUGIN_NAME, (chunk, set) => {
                set.add((0, utils_1.getFederationGlobalScope)(compiler.webpack.RuntimeGlobals));
                set.add(compiler.webpack.RuntimeGlobals.runtimeId);
                compilation.addRuntimeModule(chunk, new FederationRuntimeModule_1.default(set, name, { name, remotes: [] }));
            });
            compilation.hooks.processAssets.tapPromise({
                name: 'getManifestFileName',
                stage: 
                // @ts-ignore use runtime variable in case peer dep not installed
                compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
            }, async () => {
                const remoteEntryPoint = compilation.entrypoints.get(name);
                (0, sdk_1.assert)(remoteEntryPoint, `Can not get shared ${name} entryPoint!`);
                const remoteEntryNameChunk = compilation.namedChunks.get(name);
                (0, sdk_1.assert)(remoteEntryNameChunk, `Can not get shared ${name} chunk!`);
                const files = Array.from(remoteEntryNameChunk.files).filter((f) => !f.includes(HOT_UPDATE_SUFFIX) && !f.endsWith('.css'));
                (0, sdk_1.assert)(files.length > 0, `no files found for shared ${name} chunk`);
                (0, sdk_1.assert)(files.length === 1, `shared ${name} chunk should not have multiple files!, current files: ${files.join(',')}`);
                this.filename = files[0];
            });
        });
    }
}
exports.default = SharedContainerPlugin;
//# sourceMappingURL=SharedContainerPlugin.js.map