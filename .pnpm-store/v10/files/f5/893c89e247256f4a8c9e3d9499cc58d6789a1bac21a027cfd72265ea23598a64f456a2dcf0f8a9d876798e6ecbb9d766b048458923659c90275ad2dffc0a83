"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sdk_1 = require("@module-federation/sdk");
const CollectSharedEntryPlugin_1 = __importDefault(require("./CollectSharedEntryPlugin"));
const SharedUsedExportsOptimizerPlugin_1 = __importDefault(require("./SharedUsedExportsOptimizerPlugin"));
const SharedContainerPlugin_1 = __importDefault(require("./SharedContainerPlugin/SharedContainerPlugin"));
const options_1 = require("../../container/options");
const ConsumeSharedPlugin_1 = __importDefault(require("../ConsumeSharedPlugin"));
const IndependentSharedRuntimeModule_1 = __importDefault(require("./IndependentSharedRuntimeModule"));
const IGNORED_ENTRY = 'ignored-entry';
const filterPlugin = (plugin, treeShakingSharedExcludePlugins = []) => {
    if (!plugin) {
        return true;
    }
    const pluginName = plugin['name'] || plugin['constructor']?.name;
    if (!pluginName) {
        return true;
    }
    return ![
        'IndependentSharedPlugin',
        'ModuleFederationPlugin',
        'SharedUsedExportsOptimizerPlugin',
        'HtmlWebpackPlugin',
        'TreeShakingSharedPlugin',
        ...treeShakingSharedExcludePlugins,
    ].includes(pluginName);
};
const resolveOutputDir = (outputDir, shareName) => {
    return shareName ? path.join(outputDir, (0, sdk_1.encodeName)(shareName)) : outputDir;
};
class IndependentSharedPlugin {
    constructor(options) {
        this.buildAssets = {};
        this.name = 'IndependentSharedPlugin';
        const { outputDir, plugins, treeShaking, shared, name, manifest, injectTreeShakingUsedExports, library, treeShakingSharedExcludePlugins, } = options;
        this.shared = shared;
        this.treeShakingSharedExcludePlugins = treeShakingSharedExcludePlugins;
        this.mfName = name;
        this.outputDir = outputDir || 'independent-packages';
        this.plugins = plugins || [];
        this.treeShaking = treeShaking;
        this.manifest = manifest;
        this.injectTreeShakingUsedExports = injectTreeShakingUsedExports ?? true;
        this.library = library;
        this.sharedOptions = (0, options_1.parseOptions)(shared, (item, key) => {
            if (typeof item !== 'string')
                throw new Error(`Unexpected array in shared configuration for key "${key}"`);
            const config = item === key || !(0, sdk_1.isRequiredVersion)(item)
                ? {
                    import: item,
                }
                : {
                    import: key,
                    requiredVersion: item,
                };
            return config;
        }, (item) => {
            return item;
        });
    }
    apply(compiler) {
        const { manifest } = this;
        let runCount = 0;
        compiler.hooks.beforeRun.tapPromise('IndependentSharedPlugin', async () => {
            if (runCount) {
                return;
            }
            await this.createIndependentCompilers(compiler);
            runCount++;
        });
        compiler.hooks.watchRun.tapPromise('IndependentSharedPlugin', async () => {
            if (runCount) {
                return;
            }
            await this.createIndependentCompilers(compiler);
            runCount++;
        });
        compiler.hooks.thisCompilation.tap('IndependentSharedPlugin', (compilation) => {
            compilation.hooks.additionalTreeRuntimeRequirements.tap('OptimizeDependencyReferencedExportsPlugin', (chunk) => {
                compilation.addRuntimeModule(chunk, new IndependentSharedRuntimeModule_1.default(this.buildAssets, this.library?.type || 'global'));
            });
            // inject buildAssets to stats
            if (!manifest) {
                return;
            }
            compilation.hooks.processAssets.tapPromise({
                name: 'injectReferenceExports',
                stage: 
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                compilation.constructor
                    .PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
            }, async () => {
                const stats = compilation.getAsset(sdk_1.StatsFileName);
                if (!stats) {
                    return;
                }
                const statsContent = JSON.parse(stats.source.source().toString());
                const { shared } = statsContent;
                Object.entries(this.buildAssets).forEach(([key, item]) => {
                    const targetShared = shared.find((s) => s.name === key);
                    if (!targetShared) {
                        return;
                    }
                    item.forEach(([entry, version, globalName]) => {
                        if (version === targetShared.version) {
                            targetShared.fallback = entry;
                            targetShared.fallbackName = globalName;
                        }
                    });
                });
                compilation.updateAsset(sdk_1.StatsFileName, new compiler.webpack.sources.RawSource(JSON.stringify(statsContent)));
            });
        });
    }
    createEntry(context) {
        const { sharedOptions } = this;
        const entryContent = sharedOptions.reduce((acc, cur, index) => {
            return `${acc}import shared_${index} from '${cur[0]}';\n`;
        }, '');
        const entryPath = path.resolve(context, 'node_modules', '.federation', 
        // name,
        'shared-entry.js');
        if (!fs.existsSync(path.dirname(entryPath))) {
            fs.mkdirSync(path.dirname(entryPath), { recursive: true });
        }
        fs.writeFileSync(entryPath, entryContent);
        return entryPath;
    }
    async createIndependentCompilers(parentCompiler) {
        const { sharedOptions, outputDir } = this;
        console.log('Start building shared fallback resources ...');
        const shareRequestsMap = await this.createIndependentCompiler(parentCompiler);
        await Promise.all(sharedOptions.map(async ([shareName, shareConfig]) => {
            if (!shareConfig.treeShaking) {
                return;
            }
            const shareRequests = shareRequestsMap[shareName].requests;
            await Promise.all(shareRequests.map(async ([request, version]) => {
                const sharedConfig = sharedOptions.find(([name]) => name === shareName)?.[1];
                const [shareFileName, globalName, sharedVersion] = await this.createIndependentCompiler(parentCompiler, {
                    shareRequestsMap,
                    currentShare: {
                        shareName,
                        version,
                        request,
                        independentShareFileName: sharedConfig?.treeShaking?.filename,
                    },
                });
                if (typeof shareFileName === 'string') {
                    this.buildAssets[shareName] ||= [];
                    this.buildAssets[shareName].push([
                        path.join(resolveOutputDir(outputDir, shareName), shareFileName),
                        sharedVersion,
                        globalName,
                    ]);
                }
            }));
        }));
        console.log('All shared fallback have been compiled successfully');
    }
    async createIndependentCompiler(parentCompiler, extraOptions) {
        const { treeShaking, plugins, outputDir, sharedOptions, mfName, library, treeShakingSharedExcludePlugins, } = this;
        const outputDirWithShareName = resolveOutputDir(outputDir, extraOptions?.currentShare?.shareName || '');
        const parentConfig = parentCompiler.options;
        const finalPlugins = [];
        let extraPlugin;
        if (!extraOptions) {
            extraPlugin = new CollectSharedEntryPlugin_1.default({
                sharedOptions,
            });
        }
        else {
            extraPlugin = new SharedContainerPlugin_1.default({
                mfName: `${mfName}_${treeShaking ? 't' : 'f'}`,
                library: library,
                ...extraOptions.currentShare,
            });
            (parentConfig.plugins || []).forEach((plugin) => {
                if (plugin !== undefined &&
                    typeof plugin !== 'string' &&
                    filterPlugin(plugin, treeShakingSharedExcludePlugins)) {
                    finalPlugins.push(plugin);
                }
            });
            plugins.forEach((plugin) => {
                finalPlugins.push(plugin);
            });
            finalPlugins.push(new ConsumeSharedPlugin_1.default({
                consumes: sharedOptions
                    .filter(([key, options]) => extraOptions?.currentShare.shareName !==
                    (options.shareKey || key))
                    .map(([key, options]) => ({
                    [key]: {
                        import: !extraOptions ? options.import : false,
                        shareKey: options.shareKey || key,
                        shareScope: options.shareScope,
                        requiredVersion: options.requiredVersion,
                        strictVersion: options.strictVersion,
                        singleton: options.singleton,
                        packageName: options.packageName,
                        eager: options.eager,
                    },
                })),
            }));
            if (treeShaking) {
                finalPlugins.push(new SharedUsedExportsOptimizerPlugin_1.default(sharedOptions, this.injectTreeShakingUsedExports, [IGNORED_ENTRY], this.manifest));
            }
        }
        finalPlugins.push(extraPlugin);
        const fullOutputDir = path.resolve(parentCompiler.outputPath, outputDirWithShareName);
        // @ts-ignore webpack version is not the same as the one used in the plugin
        const compilerConfig = {
            ...parentConfig,
            mode: parentConfig.mode || 'development',
            ignoreWarnings: [],
            entry: {
                [IGNORED_ENTRY]: this.createEntry(parentCompiler.context),
            },
            // 输出配置
            output: {
                path: fullOutputDir,
                clean: true,
                publicPath: parentConfig.output?.publicPath || 'auto',
            },
            // 插件继承
            plugins: finalPlugins,
            // 优化配置继承
            optimization: {
                ...parentConfig.optimization,
                splitChunks: false, // 每个包独立，不拆分
            },
        };
        // 创建独立的 webpack compiler 实例
        const webpack = parentCompiler.webpack;
        const compiler = webpack.webpack(compilerConfig);
        // 设置文件系统
        compiler.inputFileSystem = parentCompiler.inputFileSystem;
        compiler.outputFileSystem = parentCompiler.outputFileSystem;
        compiler.intermediateFileSystem = parentCompiler.intermediateFileSystem;
        const { currentShare, shareRequestsMap } = extraOptions || {};
        return new Promise((resolve, reject) => {
            compiler.run((err, stats) => {
                const shareName = currentShare?.shareName || 'unknown shared package';
                const hasStatsErrors = !!stats &&
                    (stats.hasErrors?.() || stats.toJson?.()?.errors?.length > 0);
                if (err || hasStatsErrors) {
                    const lines = [];
                    if (err) {
                        const errMsg = (err && (err.stack || err.message)) || String(err);
                        lines.push(`Compiler error: ${errMsg}`);
                    }
                    if (stats?.toJson) {
                        const json = stats.toJson({
                            all: false,
                            errors: true,
                            warnings: false,
                            errorDetails: true,
                            moduleTrace: true,
                        });
                        const errors = (json && json.errors) || [];
                        if (errors.length) {
                            lines.push(`Webpack errors (${errors.length}):`);
                            const max = 5;
                            for (let i = 0; i < Math.min(errors.length, max); i++) {
                                const e = errors[i];
                                const where = e.moduleName || e.file || e.moduleIdentifier || '';
                                const loc = e.loc ? ` @ ${e.loc}` : '';
                                const msg = e.message || e.details || String(e);
                                lines.push(`  [${i + 1}] ${where}${loc}`);
                                lines.push(`      ${msg}`);
                            }
                            if (errors.length > max) {
                                lines.push(`  ... and ${errors.length - max} more errors`);
                            }
                        }
                    }
                    console.error(`❌ Shared "${shareName}" compilation failed\n${lines.join('\n')}`);
                    reject(err || new Error(`Shared "${shareName}" compilation failed`));
                    return;
                }
                shareRequestsMap &&
                    console.log(`Shared "${shareName}" compilation succeeded`);
                resolve(extraPlugin.getData());
            });
        });
    }
}
IndependentSharedPlugin.IndependentShareBuildAssetsFilename = 'independent-share-build-assets.json';
exports.default = IndependentSharedPlugin;
//# sourceMappingURL=IndependentSharedPlugin.js.map