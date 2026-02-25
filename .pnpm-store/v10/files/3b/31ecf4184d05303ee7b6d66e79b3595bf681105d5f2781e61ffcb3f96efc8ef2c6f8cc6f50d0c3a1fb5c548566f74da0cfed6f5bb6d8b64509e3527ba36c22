'use strict';

var sdk = require('@module-federation/sdk');
var chalk = require('chalk');
var path = require('path');
var core = require('@module-federation/dts-plugin/core');
var fs = require('fs');
var managers = require('@module-federation/managers');

const PLUGIN_IDENTIFIER = 'Module Federation Manifest Plugin';
const HOT_UPDATE_SUFFIX = '.hot-update';

const createBundlerLogger = typeof sdk.createInfrastructureLogger === 'function'
    ? sdk.createInfrastructureLogger
    : sdk.createLogger;
const logger = createBundlerLogger(chalk.cyan(`[ ${PLUGIN_IDENTIFIER} ]`));

function isHotFile(file) {
    return file.includes(HOT_UPDATE_SUFFIX);
}
const collectAssets = (assets, jsTargetSet, cssTargetSet) => {
    assets.forEach((file) => {
        if (file.endsWith('.css')) {
            cssTargetSet.add(file);
        }
        else {
            if (isDev()) {
                if (!isHotFile(file)) {
                    jsTargetSet.add(file);
                }
            }
            else {
                jsTargetSet.add(file);
            }
        }
    });
};
function getSharedModuleName(name) {
    const [_type, _shared, _module, _shareScope, sharedInfo] = name.split(' ');
    return sharedInfo.split('@').slice(0, -1).join('@');
}
function getAssetsByChunkIDs(compilation, chunkIDMap) {
    const arrayChunks = Array.from(compilation.chunks);
    const assetMap = {};
    Object.keys(chunkIDMap).forEach((key) => {
        const chunkIDs = Array.from(chunkIDMap[key]);
        if (!assetMap[key]) {
            assetMap[key] = {
                css: new Set(),
                js: new Set(),
            };
        }
        chunkIDs.forEach((chunkID) => {
            const chunk = arrayChunks.find((item) => item.id === chunkID);
            if (chunk) {
                collectAssets([...chunk.files], assetMap[key].js, assetMap[key].css);
            }
        });
    });
    const assets = {};
    Object.keys(assetMap).map((key) => {
        assets[key] = {
            js: Array.from(assetMap[key].js),
            css: Array.from(assetMap[key].css),
        };
    });
    return assets;
}
function findChunk(id, chunks) {
    for (const chunk of chunks) {
        if (id === chunk.id) {
            return chunk;
        }
    }
}
function getSharedModules(stats, sharedModules) {
    // 获取入口文件就是实际内容的 module
    const entryContentModuleNames = [];
    let effectiveSharedModules = stats.modules?.reduce((sum, module) => {
        for (const sharedModule of sharedModules) {
            if (sharedModule.name === module.issuerName) {
                entryContentModuleNames.push(sharedModule.name);
                sum.push([getSharedModuleName(module.issuerName), module]);
                return sum;
            }
        }
        return sum;
    }, []) || [];
    // 获取入口文件仅作为 Re Export 的 module
    const entryReExportModules = sharedModules.filter((sharedModule) => !entryContentModuleNames.includes(sharedModule.name));
    if (entryReExportModules.length) {
        effectiveSharedModules = effectiveSharedModules.concat(stats.modules.reduce((sum, module) => {
            let flag = false;
            for (const entryReExportModule of entryReExportModules) {
                if (flag) {
                    break;
                }
                if (module.reasons) {
                    for (const issueModule of module.reasons) {
                        if (issueModule.moduleName === entryReExportModule.name) {
                            sum.push([
                                getSharedModuleName(entryReExportModule.name),
                                module,
                            ]);
                            flag = true;
                            break;
                        }
                    }
                }
            }
            return sum;
        }, []));
    }
    return effectiveSharedModules;
}
function getAssetsByChunk(chunk, entryPointNames) {
    const assesSet = {
        js: {
            sync: new Set(),
            async: new Set(),
        },
        css: {
            sync: new Set(),
            async: new Set(),
        },
    };
    const collectChunkFiles = (targetChunk, type) => {
        [...targetChunk.groupsIterable].forEach((chunkGroup) => {
            if (chunkGroup.name && !entryPointNames.includes(chunkGroup.name)) {
                collectAssets(chunkGroup.getFiles(), assesSet.js[type], assesSet.css[type]);
            }
        });
    };
    collectChunkFiles(chunk, 'sync');
    [...chunk.getAllAsyncChunks()].forEach((asyncChunk) => {
        collectAssets([...asyncChunk.files], assesSet.js['async'], assesSet.css['async']);
        collectChunkFiles(asyncChunk, 'async');
    });
    const assets = {
        js: {
            sync: Array.from(assesSet.js.sync),
            async: Array.from(assesSet.js.async),
        },
        css: {
            sync: Array.from(assesSet.css.sync),
            async: Array.from(assesSet.css.async),
        },
    };
    return assets;
}
function assert(condition, msg) {
    if (!condition) {
        error(msg);
    }
}
function error(msg) {
    throw new Error(`[ ${PLUGIN_IDENTIFIER} ]: ${msg}`);
}
function isDev() {
    return process.env['NODE_ENV'] === 'development';
}
function getFileNameWithOutExt(str) {
    return str.replace(path.extname(str), '');
}
function getTypesMetaInfo(pluginOptions, context) {
    const defaultRemoteOptions = {
        generateAPITypes: true,
        compileInChildProcess: true,
    };
    const defaultTypesMetaInfo = {
        path: '',
        name: '',
        zip: '',
        api: '',
    };
    try {
        const normalizedDtsOptions = sdk.normalizeOptions(core.isTSProject(pluginOptions.dts, context), {
            generateTypes: defaultRemoteOptions,
            consumeTypes: {},
        }, 'mfOptions.dts')(pluginOptions.dts);
        if (normalizedDtsOptions === false) {
            return defaultTypesMetaInfo;
        }
        const normalizedRemote = sdk.normalizeOptions(true, defaultRemoteOptions, 'mfOptions.dts.generateTypes')(normalizedDtsOptions.generateTypes);
        if (normalizedRemote === false) {
            return defaultTypesMetaInfo;
        }
        const { apiFileName, zipName } = core.retrieveTypesAssetsInfo({
            ...normalizedRemote,
            context,
            moduleFederationConfig: pluginOptions,
        });
        return {
            path: '',
            name: '',
            zip: zipName,
            api: apiFileName,
        };
    }
    catch (err) {
        logger.warn(`getTypesMetaInfo failed, it will use the default types meta info, and the errors as belows: ${err}`);
        return defaultTypesMetaInfo;
    }
}

class ManifestManager {
    constructor() {
        this._options = {};
    }
    init(options) {
        this._options = options;
    }
    get fileName() {
        return sdk.getManifestFileName(this._options.manifest).manifestFileName;
    }
    updateManifest(options) {
        const manifest = this.generateManifest(options);
        return manifest;
    }
    generateManifest(options) {
        const { publicPath, stats, compiler } = options;
        // Initialize manifest with required properties from stats
        const { id, name, metaData } = stats;
        const manifest = {
            id,
            name,
            metaData,
            shared: [],
            remotes: [],
            exposes: [],
        };
        manifest.exposes = stats.exposes.reduce((sum, cur) => {
            const expose = {
                id: cur.id,
                name: cur.name,
                assets: cur.assets,
                path: cur.path,
            };
            sum.push(expose);
            return sum;
        }, []);
        manifest.shared = stats.shared.reduce((sum, cur) => {
            const shared = {
                id: cur.id,
                name: cur.name,
                version: cur.version,
                singleton: cur.singleton,
                requiredVersion: cur.requiredVersion,
                hash: cur.hash,
                assets: cur.assets,
            };
            sum.push(shared);
            return sum;
        }, []);
        manifest.remotes = stats.remotes.reduce((sum, cur) => {
            // @ts-ignore version/entry will be added as follow
            const remote = {
                federationContainerName: cur.federationContainerName,
                moduleName: cur.moduleName,
                alias: cur.alias,
            };
            if ('entry' in cur) {
                // @ts-ignore
                remote.entry = cur.entry;
            }
            else if ('version' in cur) {
                // @ts-ignore
                remote.entry = cur.version;
            }
            sum.push(remote);
            return sum;
        }, []);
        if (isDev() &&
            (process.env['MF_SSR_PRJ']
                ? compiler.options.target !== 'async-node'
                : true)) {
            logger.info(`Manifest Link: ${chalk.cyan(`${publicPath === 'auto' ? '{auto}/' : publicPath}${this.fileName}`)} `);
        }
        return manifest;
    }
}

const isNonEmptyString = (value) => {
    return typeof value === 'string' && value.trim().length > 0;
};
const normalizeExposeValue = (exposeValue) => {
    if (!exposeValue) {
        return undefined;
    }
    const toImportArray = (value) => {
        if (isNonEmptyString(value)) {
            return [value];
        }
        if (Array.isArray(value)) {
            const normalized = value.filter(isNonEmptyString);
            return normalized.length ? normalized : undefined;
        }
        return undefined;
    };
    if (typeof exposeValue === 'object') {
        if ('import' in exposeValue) {
            const { import: rawImport, name } = exposeValue;
            const normalizedImport = toImportArray(rawImport);
            if (!normalizedImport?.length) {
                return undefined;
            }
            return {
                import: normalizedImport,
                ...(isNonEmptyString(name) ? { name } : {}),
            };
        }
        return undefined;
    }
    const normalizedImport = toImportArray(exposeValue);
    if (!normalizedImport?.length) {
        return undefined;
    }
    return { import: normalizedImport };
};
const parseContainerExposeEntries = (identifier) => {
    const startIndex = identifier.indexOf('[');
    if (startIndex < 0) {
        return undefined;
    }
    let depth = 0;
    let inString = false;
    let isEscaped = false;
    for (let cursor = startIndex; cursor < identifier.length; cursor++) {
        const char = identifier[cursor];
        if (isEscaped) {
            isEscaped = false;
            continue;
        }
        if (char === '\\') {
            isEscaped = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (inString) {
            continue;
        }
        if (char === '[') {
            depth++;
        }
        else if (char === ']') {
            depth--;
            if (depth === 0) {
                const serialized = identifier.slice(startIndex, cursor + 1);
                try {
                    return JSON.parse(serialized);
                }
                catch {
                    return undefined;
                }
            }
        }
    }
    return undefined;
};
const getExposeName = (exposeKey) => {
    return exposeKey.replace('./', '');
};
function getExposeItem({ exposeKey, name, file, }) {
    const exposeModuleName = getExposeName(exposeKey);
    return {
        path: exposeKey,
        id: sdk.composeKeyWithSeparator(name, exposeModuleName),
        name: exposeModuleName,
        // @ts-ignore to deduplicate
        requires: [],
        file: path.relative(process.cwd(), file.import[0]),
        assets: {
            js: {
                async: [],
                sync: [],
            },
            css: {
                async: [],
                sync: [],
            },
        },
    };
}
const getShareItem = ({ pkgName, normalizedShareOptions, pkgVersion, hostName, }) => {
    return {
        ...normalizedShareOptions,
        id: `${hostName}:${pkgName}`,
        requiredVersion: normalizedShareOptions?.requiredVersion || `^${pkgVersion}`,
        name: pkgName,
        version: pkgVersion,
        assets: {
            js: {
                async: [],
                sync: [],
            },
            css: {
                async: [],
                sync: [],
            },
        },
        // @ts-ignore to deduplicate
        usedIn: new Set(),
    };
};
class ModuleHandler {
    constructor(options, modules, { bundler }) {
        this._bundler = 'webpack';
        this._remoteManager = new managers.RemoteManager();
        this._sharedManager = new managers.SharedManager();
        this._options = options;
        this._modules = modules;
        this._bundler = bundler;
        this._containerManager = new managers.ContainerManager();
        this._containerManager.init(options);
        this._remoteManager = new managers.RemoteManager();
        this._remoteManager.init(options);
        this._sharedManager = new managers.SharedManager();
        this._sharedManager.init(options);
    }
    get isRspack() {
        return this._bundler === 'rspack';
    }
    _handleSharedModule(mod, sharedMap, exposesMap) {
        const { identifier, moduleType } = mod;
        if (!identifier) {
            return;
        }
        const sharedManagerNormalizedOptions = this._sharedManager.normalizedOptions;
        const initShared = (pkgName, pkgVersion) => {
            if (sharedMap[pkgName]) {
                return;
            }
            sharedMap[pkgName] = getShareItem({
                pkgName,
                pkgVersion,
                normalizedShareOptions: sharedManagerNormalizedOptions[pkgName],
                hostName: this._options.name,
            });
        };
        const collectRelationshipMap = (mod, pkgName) => {
            const { issuerName, reasons } = mod;
            if (issuerName) {
                if (exposesMap[getFileNameWithOutExt(issuerName)]) {
                    const expose = exposesMap[getFileNameWithOutExt(issuerName)];
                    // @ts-ignore use Set to deduplicate
                    expose.requires.push(pkgName);
                    // @ts-ignore use Set to deduplicate
                    sharedMap[pkgName].usedIn.add(expose.path);
                }
            }
            if (reasons) {
                reasons.forEach(({ resolvedModule, moduleName }) => {
                    let exposeModName = this.isRspack ? moduleName : resolvedModule;
                    // filters out entrypoints
                    if (exposeModName) {
                        if (exposesMap[getFileNameWithOutExt(exposeModName)]) {
                            const expose = exposesMap[getFileNameWithOutExt(exposeModName)];
                            // @ts-ignore to deduplicate
                            expose.requires.push(pkgName);
                            // @ts-ignore to deduplicate
                            sharedMap[pkgName].usedIn.add(expose.path);
                        }
                    }
                });
            }
        };
        const parseResolvedIdentifier = (nameAndVersion) => {
            let name = '';
            let version = '';
            if (nameAndVersion.startsWith('@')) {
                const splitInfo = nameAndVersion.split('@');
                splitInfo[0] = '@';
                name = splitInfo[0] + splitInfo[1];
                version = splitInfo[2];
            }
            else if (nameAndVersion.includes('@')) {
                [name, version] = nameAndVersion.split('@');
                version = version.replace(/[\^~>|>=]/g, '');
            }
            return {
                name,
                version,
            };
        };
        if (moduleType === 'provide-module') {
            // identifier(rspack) = provide shared module (default) react@18.2.0 = /temp/node_modules/.pnpm/react@18.2.0/node_modules/react/index.js
            // identifier(webpack) = provide module (default) react@18.2.0 = /temp/node_modules/.pnpm/react@18.2.0/node_modules/react/index.js
            const data = identifier.split(' ');
            const nameAndVersion = this.isRspack ? data[4] : data[3];
            const { name, version } = parseResolvedIdentifier(nameAndVersion);
            if (name && version) {
                initShared(name, version);
                collectRelationshipMap(mod, name);
            }
        }
        if (moduleType === 'consume-shared-module') {
            // identifier(rspack) = consume shared module (default) lodash/get@^4.17.21 (strict) (fallback: /temp/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/get.js)
            // identifier(webpack) = consume-shared-module|default|react-dom|!=1.8...2...0|false|/temp/node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/index.js|true|false
            const SEPARATOR = this.isRspack ? ' ' : '|';
            const data = identifier.split(SEPARATOR);
            let pkgName = '';
            let pkgVersion = '';
            if (this.isRspack) {
                const nameAndVersion = data[4];
                const res = parseResolvedIdentifier(nameAndVersion);
                pkgName = res.name;
                pkgVersion = res.version;
            }
            else {
                pkgName = data[2];
                const pkgVersionRange = data[3];
                pkgVersion = '';
                if (pkgVersionRange.startsWith('=')) {
                    pkgVersion = data[3].replace('=', '');
                }
                else {
                    if (sharedManagerNormalizedOptions[pkgName]) {
                        pkgVersion = sharedManagerNormalizedOptions[pkgName].version;
                    }
                    else {
                        const fullPkgName = pkgName.split('/').slice(0, -1).join('/');
                        // pkgName: react-dom/
                        if (sharedManagerNormalizedOptions[`${fullPkgName}/`]) {
                            if (sharedManagerNormalizedOptions[fullPkgName]) {
                                pkgVersion =
                                    sharedManagerNormalizedOptions[fullPkgName].version;
                            }
                            else {
                                pkgVersion =
                                    sharedManagerNormalizedOptions[`${fullPkgName}/`].version;
                            }
                        }
                    }
                }
            }
            if (pkgName && pkgVersion) {
                initShared(pkgName, pkgVersion);
                collectRelationshipMap(mod, pkgName);
            }
        }
    }
    _handleRemoteModule(mod, remotes, remotesConsumerMap) {
        const { identifier, reasons, nameForCondition } = mod;
        if (!identifier) {
            return;
        }
        const remoteManagerNormalizedOptions = this._remoteManager.normalizedOptions;
        // identifier = remote (default) webpack/container/reference/app2 ./Button
        const data = identifier.split(' ');
        if (data.length === 4) {
            const moduleName = data[3].replace('./', '');
            const remoteAlias = data[2].replace('webpack/container/reference/', '');
            const normalizedRemote = remoteManagerNormalizedOptions[remoteAlias];
            const basicRemote = {
                alias: normalizedRemote.alias,
                consumingFederationContainerName: this._options.name || '',
                federationContainerName: remoteManagerNormalizedOptions[remoteAlias].name,
                moduleName,
                // @ts-ignore to deduplicate
                usedIn: new Set(),
            };
            if (!nameForCondition) {
                return;
            }
            let remote;
            if ('version' in normalizedRemote) {
                remote = {
                    ...basicRemote,
                    version: normalizedRemote.version,
                };
            }
            else {
                remote = {
                    ...basicRemote,
                    entry: normalizedRemote.entry,
                };
            }
            remotes.push(remote);
            remotesConsumerMap[nameForCondition] = remote;
        }
        if (reasons) {
            reasons.forEach(({ userRequest, resolvedModule, moduleName }) => {
                let exposeModName = this.isRspack ? moduleName : resolvedModule;
                if (userRequest && exposeModName && remotesConsumerMap[userRequest]) {
                    // @ts-ignore to deduplicate
                    remotesConsumerMap[userRequest].usedIn.add(exposeModName.replace('./', ''));
                }
            });
        }
    }
    _handleContainerModule(mod, exposesMap) {
        const { identifier } = mod;
        if (!identifier) {
            return;
        }
        // identifier: container entry (default) [[".",{"import":["./src/routes/page.tsx"],"name":"__federation_expose_default_export"}]]'
        const entries = parseContainerExposeEntries(identifier) ??
            this._getContainerExposeEntriesFromOptions();
        if (!entries) {
            return;
        }
        entries.forEach(([prefixedName, file]) => {
            // TODO: support multiple import
            exposesMap[getFileNameWithOutExt(file.import[0])] = getExposeItem({
                exposeKey: prefixedName,
                name: this._options.name,
                file,
            });
        });
    }
    _getContainerExposeEntriesFromOptions() {
        const exposes = this._containerManager.containerPluginExposesOptions;
        const normalizedEntries = Object.entries(exposes).reduce((acc, [exposeKey, exposeOptions]) => {
            const normalizedExpose = normalizeExposeValue(exposeOptions);
            if (!normalizedExpose?.import.length) {
                return acc;
            }
            acc.push([exposeKey, normalizedExpose]);
            return acc;
        }, []);
        if (normalizedEntries.length) {
            return normalizedEntries;
        }
        const rawExposes = this._options.exposes;
        if (!rawExposes || Array.isArray(rawExposes)) {
            return undefined;
        }
        const normalizedFromOptions = Object.entries(rawExposes).reduce((acc, [exposeKey, exposeOptions]) => {
            const normalizedExpose = normalizeExposeValue(exposeOptions);
            if (!normalizedExpose?.import.length) {
                return acc;
            }
            acc.push([exposeKey, normalizedExpose]);
            return acc;
        }, []);
        return normalizedFromOptions.length ? normalizedFromOptions : undefined;
    }
    _initializeExposesFromOptions(exposesMap) {
        if (!this._options.name || !this._containerManager.enable) {
            return;
        }
        const exposes = this._containerManager.containerPluginExposesOptions;
        Object.entries(exposes).forEach(([exposeKey, exposeOptions]) => {
            if (!exposeOptions.import?.length) {
                return;
            }
            const [exposeImport] = exposeOptions.import;
            if (!exposeImport) {
                return;
            }
            const exposeMapKey = getFileNameWithOutExt(exposeImport);
            if (!exposesMap[exposeMapKey]) {
                exposesMap[exposeMapKey] = getExposeItem({
                    exposeKey,
                    name: this._options.name,
                    file: exposeOptions,
                });
            }
        });
    }
    collect() {
        const remotes = [];
        const remotesConsumerMap = {};
        const exposesMap = {};
        const sharedMap = {};
        this._initializeExposesFromOptions(exposesMap);
        const isSharedModule = (moduleType) => {
            return Boolean(moduleType &&
                ['provide-module', 'consume-shared-module'].includes(moduleType));
        };
        const isContainerModule = (identifier) => {
            return identifier.startsWith('container entry');
        };
        const isRemoteModule = (identifier) => {
            return identifier.startsWith('remote ');
        };
        // handle remote/expose
        this._modules.forEach((mod) => {
            const { identifier, reasons, nameForCondition, moduleType } = mod;
            if (!identifier) {
                return;
            }
            if (isSharedModule(moduleType)) {
                this._handleSharedModule(mod, sharedMap, exposesMap);
            }
            if (isRemoteModule(identifier)) {
                this._handleRemoteModule(mod, remotes, remotesConsumerMap);
            }
            else if (!this._containerManager.enable &&
                isContainerModule(identifier)) {
                this._handleContainerModule(mod, exposesMap);
            }
        });
        return {
            remotes,
            exposesMap,
            sharedMap,
        };
    }
}

/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable max-depth */
class StatsManager {
    constructor() {
        this._options = {};
        this._bundler = 'webpack';
        this._containerManager = new managers.ContainerManager();
        this._remoteManager = new managers.RemoteManager();
        this._sharedManager = new managers.SharedManager();
        this._pkgJsonManager = new managers.PKGJsonManager();
    }
    getBuildInfo(context) {
        const rootPath = context || process.cwd();
        const pkg = this._pkgJsonManager.readPKGJson(rootPath);
        return {
            buildVersion: managers.utils.getBuildVersion(rootPath),
            buildName: managers.utils.getBuildName() || pkg['name'],
        };
    }
    get fileName() {
        return sdk.getManifestFileName(this._options.manifest).statsFileName;
    }
    setMetaDataPublicPath(metaData, compiler) {
        if (this._options.getPublicPath) {
            if ('publicPath' in metaData) {
                // @ts-ignore
                delete metaData.publicPath;
            }
            metaData.getPublicPath = this._options.getPublicPath;
        }
        else {
            metaData.publicPath =
                this.getPublicPath(compiler);
        }
        return metaData;
    }
    _getMetaData(compiler, compilation, extraOptions) {
        const { context } = compiler.options;
        const { _options: { name }, } = this;
        const buildInfo = this.getBuildInfo(context);
        const type = this._pkgJsonManager.getExposeGarfishModuleType(context || process.cwd());
        const getRemoteEntryName = () => {
            if (!this._containerManager.enable) {
                return '';
            }
            assert(name, 'name is required');
            const remoteEntryPoint = compilation.entrypoints.get(name);
            assert(remoteEntryPoint, 'Can not get remoteEntry entryPoint!');
            const remoteEntryNameChunk = compilation.namedChunks.get(name);
            assert(remoteEntryNameChunk, 'Can not get remoteEntry chunk!');
            const files = Array.from(remoteEntryNameChunk.files).filter((f) => !f.includes(HOT_UPDATE_SUFFIX) && !f.endsWith('.css'));
            assert(files.length > 0, 'no files found for remoteEntry chunk');
            assert(files.length === 1, `remoteEntry chunk should not have multiple files!, current files: ${files.join(',')}`);
            const remoteEntryName = files[0];
            return remoteEntryName;
        };
        const globalName = this._containerManager.globalEntryName;
        assert(globalName, 'Can not get library.name, please ensure you have set library.name and the type is "string" !');
        assert(this._pluginVersion, 'Can not get pluginVersion, please ensure you have set pluginVersion !');
        const metaData = {
            name: name,
            type,
            buildInfo,
            remoteEntry: {
                name: getRemoteEntryName(),
                path: '',
                // same as the types supported by runtime, currently only global/var/script is supported
                type: this._options?.library?.type ||
                    'global',
            },
            types: getTypesMetaInfo(this._options, compiler.context),
            globalName: globalName,
            pluginVersion: this._pluginVersion,
        };
        let prefetchInterface = false;
        const prefetchFilePath = path.resolve(compiler.options.context || process.cwd(), `node_modules/.mf/${sdk.encodeName(name)}/${sdk.MFPrefetchCommon.fileName}`);
        const existPrefetch = fs.existsSync(prefetchFilePath);
        if (existPrefetch) {
            const content = fs.readFileSync(prefetchFilePath).toString();
            if (content) {
                prefetchInterface = true;
            }
        }
        metaData.prefetchInterface = prefetchInterface;
        return this.setMetaDataPublicPath(metaData, compiler);
    }
    _getFilteredModules(stats) {
        const filteredModules = stats.modules.filter((module) => {
            if (!module || !module.name) {
                return false;
            }
            const array = [
                module.name.includes('container entry'),
                module.name.includes('remote '),
                module.name.includes('shared module '),
                module.name.includes('provide module '),
            ];
            return array.some((item) => item);
        });
        return filteredModules;
    }
    _getModuleAssets(compilation, entryPointNames) {
        const { chunks } = compilation;
        const { exposeFileNameImportMap } = this._containerManager;
        const assets = {};
        chunks.forEach((chunk) => {
            if (typeof chunk.name === 'string' &&
                exposeFileNameImportMap[chunk.name]) {
                // TODO: support multiple import
                const exposeKey = exposeFileNameImportMap[chunk.name][0];
                assets[getFileNameWithOutExt(exposeKey)] = getAssetsByChunk(chunk, entryPointNames);
            }
        });
        return assets;
    }
    _getProvideSharedAssets(compilation, stats, entryPointNames) {
        const sharedModules = stats.modules.filter((module) => {
            if (!module || !module.name) {
                return false;
            }
            const array = [module.name.includes('consume shared module ')];
            return array.some((item) => item);
        });
        const manifestOverrideChunkIDMap = {};
        const effectiveSharedModules = getSharedModules(stats, sharedModules);
        effectiveSharedModules.forEach((item) => {
            const [sharedModuleName, sharedModule] = item;
            if (!manifestOverrideChunkIDMap[sharedModuleName]) {
                manifestOverrideChunkIDMap[sharedModuleName] = {
                    async: new Set(),
                    sync: new Set(),
                };
            }
            sharedModule.chunks.forEach((chunkID) => {
                const chunk = findChunk(chunkID, compilation.chunks);
                manifestOverrideChunkIDMap[sharedModuleName].sync.add(chunkID);
                if (!chunk) {
                    return;
                }
                [...chunk.groupsIterable].forEach((group) => {
                    if (group.name && !entryPointNames.includes(group.name)) {
                        manifestOverrideChunkIDMap[sharedModuleName].sync.add(group.id);
                    }
                });
            });
        });
        const assets = {
            js: {
                async: [],
                sync: [],
            },
            css: {
                async: [],
                sync: [],
            },
        };
        Object.keys(manifestOverrideChunkIDMap).forEach((override) => {
            const asyncAssets = getAssetsByChunkIDs(compilation, {
                [override]: manifestOverrideChunkIDMap[override].async,
            });
            const syncAssets = getAssetsByChunkIDs(compilation, {
                [override]: manifestOverrideChunkIDMap[override].sync,
            });
            assets[override] = {
                js: {
                    async: asyncAssets[override].js,
                    sync: syncAssets[override].js,
                },
                css: {
                    async: asyncAssets[override].css,
                    sync: syncAssets[override].css,
                },
            };
        });
        return assets;
    }
    async _generateStats(compiler, compilation, extraOptions) {
        try {
            const { name, manifest: manifestOptions = {}, exposes = {}, } = this._options;
            const metaData = this._getMetaData(compiler, compilation, extraOptions);
            const stats = {
                id: name,
                name: name,
                metaData,
                shared: [],
                remotes: [],
                exposes: [],
            };
            if (typeof manifestOptions === 'object' &&
                manifestOptions.disableAssetsAnalyze) {
                const remotes = this._remoteManager.statsRemoteWithEmptyUsedIn;
                stats.remotes = remotes;
                stats.exposes = Object.keys(exposes).map((exposeKey) => {
                    return getExposeItem({
                        exposeKey,
                        name: name,
                        file: {
                            import: exposes[exposeKey].import,
                        },
                    });
                });
                stats.shared = Object.entries(this._sharedManager.normalizedOptions).reduce((sum, cur) => {
                    const [pkgName, normalizedShareOptions] = cur;
                    sum.push(getShareItem({
                        pkgName,
                        normalizedShareOptions,
                        pkgVersion: managers.UNKNOWN_MODULE_NAME,
                        hostName: name,
                    }));
                    return sum;
                }, []);
                return stats;
            }
            const liveStats = compilation.getStats();
            const statsOptions = {
                all: false,
                modules: true,
                builtAt: true,
                hash: true,
                ids: true,
                version: true,
                entrypoints: true,
                assets: false,
                chunks: false,
                reasons: true,
            };
            if (this._bundler === 'webpack') {
                statsOptions['cached'] = true;
            }
            statsOptions['cachedModules'] = true;
            const webpackStats = liveStats.toJson(statsOptions);
            const filteredModules = this._getFilteredModules(webpackStats);
            const moduleHandler = new ModuleHandler(this._options, filteredModules, {
                bundler: this._bundler,
            });
            const { remotes, exposesMap, sharedMap } = moduleHandler.collect();
            const entryPointNames = [...compilation.entrypoints.values()]
                .map((e) => e.name)
                .filter((v) => !!v);
            await Promise.all([
                new Promise((resolve) => {
                    const sharedAssets = this._getProvideSharedAssets(compilation, webpackStats, entryPointNames);
                    Object.keys(sharedMap).forEach((sharedKey) => {
                        const assets = sharedAssets[sharedKey];
                        if (assets) {
                            sharedMap[sharedKey].assets = assets;
                        }
                    });
                    resolve();
                }),
                new Promise((resolve) => {
                    const moduleAssets = this._getModuleAssets(compilation, entryPointNames);
                    Object.keys(exposesMap).forEach((exposeKey) => {
                        const assets = moduleAssets[exposeKey];
                        if (assets) {
                            exposesMap[exposeKey].assets = assets;
                        }
                        exposesMap[exposeKey].requires = Array.from(new Set(exposesMap[exposeKey].requires));
                    });
                    resolve();
                }),
            ]);
            await Promise.all([
                new Promise((resolve) => {
                    const remoteMemo = new Set();
                    stats.remotes = remotes.map((remote) => {
                        remoteMemo.add(remote.federationContainerName);
                        return {
                            ...remote,
                            usedIn: Array.from(remote.usedIn.values()),
                        };
                    });
                    const statsRemoteWithEmptyUsedIn = this._remoteManager.statsRemoteWithEmptyUsedIn;
                    statsRemoteWithEmptyUsedIn.forEach((remoteInfo) => {
                        if (!remoteMemo.has(remoteInfo.federationContainerName)) {
                            stats.remotes.push(remoteInfo);
                        }
                    });
                    resolve();
                }),
                new Promise((resolve) => {
                    stats.shared = Object.values(sharedMap).map((shared) => ({
                        ...shared,
                        usedIn: Array.from(shared.usedIn),
                    }));
                    resolve();
                }),
            ]);
            await new Promise((resolve) => {
                const sharedAssets = stats.shared.reduce((sum, shared) => {
                    const { js, css } = shared.assets;
                    [...js.sync, ...js.async, ...css.async, css.sync].forEach((asset) => {
                        sum.add(asset);
                    });
                    return sum;
                }, new Set());
                const { fileExposeKeyMap } = this._containerManager;
                stats.exposes = [];
                Object.entries(fileExposeKeyMap).forEach(([exposeFileWithoutExt, exposeKeySet]) => {
                    const expose = exposesMap[exposeFileWithoutExt] || {
                        assets: {
                            js: { sync: [], async: [] },
                            css: { sync: [], async: [] },
                        },
                    };
                    exposeKeySet.forEach((exposeKey) => {
                        const { js, css } = expose.assets;
                        const exposeModuleName = getExposeName(exposeKey);
                        stats.exposes.push({
                            ...expose,
                            path: exposeKey,
                            id: sdk.composeKeyWithSeparator(this._options.name, exposeModuleName),
                            name: exposeModuleName,
                            assets: {
                                js: {
                                    sync: js.sync.filter((asset) => !sharedAssets.has(asset)),
                                    async: js.async.filter((asset) => !sharedAssets.has(asset)),
                                },
                                css: {
                                    sync: css.sync.filter((asset) => !sharedAssets.has(asset)),
                                    async: css.async.filter((asset) => !sharedAssets.has(asset)),
                                },
                            },
                        });
                    });
                });
                Object.values(exposesMap).map((expose) => {
                    const { js, css } = expose.assets;
                    return {
                        ...expose,
                        assets: {
                            js: {
                                sync: js.sync.filter((asset) => !sharedAssets.has(asset)),
                                async: js.async.filter((asset) => !sharedAssets.has(asset)),
                            },
                            css: {
                                sync: css.sync.filter((asset) => !sharedAssets.has(asset)),
                                async: css.async.filter((asset) => !sharedAssets.has(asset)),
                            },
                        },
                    };
                });
                resolve();
            });
            return stats;
        }
        catch (err) {
            throw err;
        }
    }
    getPublicPath(compiler) {
        if (this._publicPath) {
            return this._publicPath;
        }
        const { output: { publicPath: originalPublicPath }, } = compiler.options;
        let publicPath = originalPublicPath;
        this._publicPath = publicPath;
        return publicPath;
    }
    init(options, { pluginVersion, bundler, }) {
        this._options = options;
        this._pluginVersion = pluginVersion;
        this._bundler = bundler;
        this._containerManager = new managers.ContainerManager();
        this._containerManager.init(options);
        this._remoteManager = new managers.RemoteManager();
        this._remoteManager.init(options);
        this._sharedManager = new managers.SharedManager();
        this._sharedManager.init(options);
    }
    updateStats(stats, compiler) {
        const { metaData } = stats;
        if (!metaData.types) {
            metaData.types = getTypesMetaInfo(this._options, compiler.context);
        }
        if (!metaData.pluginVersion) {
            metaData.pluginVersion = this._pluginVersion;
        }
        this.setMetaDataPublicPath(metaData, compiler);
        // rspack not support legacy prefetch, and this field should be removed in the future
        metaData.prefetchInterface = false;
        return stats;
    }
    async generateStats(compiler, compilation) {
        try {
            const stats = await this._generateStats(compiler, compilation);
            return stats;
        }
        catch (err) {
            throw err;
        }
    }
    validate(compiler) {
        const { output: { publicPath }, } = compiler.options;
        if (typeof publicPath !== 'string') {
            logger.warn(`Manifest will not generate, because publicPath can only be string, but got '${publicPath}'`);
            return false;
        }
        else if (publicPath === 'auto') {
            logger.warn(`Manifest will use absolute path resolution via its host at runtime, reason: publicPath='${publicPath}'`);
            return true;
        }
        return true;
    }
}

class StatsPlugin {
    constructor(options, { pluginVersion, bundler, }) {
        this.name = 'StatsPlugin';
        this._options = {};
        this._statsManager = new StatsManager();
        this._manifestManager = new ManifestManager();
        this._enable = true;
        this._bundler = 'webpack';
        try {
            this._options = options;
            this._bundler = bundler;
            this._statsManager.init(this._options, { pluginVersion, bundler });
            this._manifestManager.init(this._options);
        }
        catch (err) {
            if (err instanceof Error) {
                err.message = `[ ${PLUGIN_IDENTIFIER} ]: Manifest will not generate, because: ${err.message}`;
            }
            logger.error(err);
            this._enable = false;
        }
    }
    apply(compiler) {
        sdk.bindLoggerToCompiler(logger, compiler, PLUGIN_IDENTIFIER);
        if (!this._enable) {
            return;
        }
        const res = this._statsManager.validate(compiler);
        if (!res) {
            return;
        }
        compiler.hooks.thisCompilation.tap('generateStats', (compilation) => {
            compilation.hooks.processAssets.tapPromise({
                name: 'generateStats',
                // @ts-ignore use runtime variable in case peer dep not installed
                stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
            }, async () => {
                if (this._options.manifest !== false) {
                    const existedStats = compilation.getAsset(this._statsManager.fileName);
                    // new rspack should hit
                    if (existedStats) {
                        let updatedStats = this._statsManager.updateStats(JSON.parse(existedStats.source.source().toString()), compiler);
                        if (typeof this._options.manifest === 'object' &&
                            this._options.manifest.additionalData) {
                            updatedStats =
                                (await this._options.manifest.additionalData({
                                    stats: updatedStats,
                                    compiler,
                                    compilation,
                                    bundler: this._bundler,
                                })) || updatedStats;
                        }
                        compilation.updateAsset(this._statsManager.fileName, new compiler.webpack.sources.RawSource(JSON.stringify(updatedStats, null, 2)));
                        const updatedManifest = this._manifestManager.updateManifest({
                            compilation,
                            stats: updatedStats,
                            publicPath: this._statsManager.getPublicPath(compiler),
                            compiler,
                            bundler: this._bundler,
                        });
                        const source = new compiler.webpack.sources.RawSource(JSON.stringify(updatedManifest, null, 2));
                        compilation.updateAsset(this._manifestManager.fileName, source);
                        return;
                    }
                    // webpack + legacy rspack
                    let stats = await this._statsManager.generateStats(compiler, compilation);
                    if (typeof this._options.manifest === 'object' &&
                        this._options.manifest.additionalData) {
                        stats =
                            (await this._options.manifest.additionalData({
                                stats,
                                compiler,
                                compilation,
                                bundler: this._bundler,
                            })) || stats;
                    }
                    const manifest = await this._manifestManager.generateManifest({
                        compilation,
                        stats: stats,
                        publicPath: this._statsManager.getPublicPath(compiler),
                        compiler,
                        bundler: this._bundler,
                    });
                    compilation.emitAsset(this._statsManager.fileName, new compiler.webpack.sources.RawSource(JSON.stringify(stats, null, 2)));
                    compilation.emitAsset(this._manifestManager.fileName, new compiler.webpack.sources.RawSource(JSON.stringify(manifest, null, 2)));
                }
            });
        });
    }
}

exports.ManifestManager = ManifestManager;
exports.StatsManager = StatsManager;
exports.StatsPlugin = StatsPlugin;
//# sourceMappingURL=index.cjs.js.map
