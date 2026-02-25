import { createLogger, isBrowserEnv, isReactNativeEnv, isDebugMode, composeKeyWithSeparator, loadScriptNode, loadScript, createLink, createScript, safeToString, getResourceUrl, isManifestProvider, generateSnapshotFromManifest, warn as warn$1 } from '@module-federation/sdk';
export { loadScript, loadScriptNode } from '@module-federation/sdk';
import { RUNTIME_008, getShortErrorMsg, runtimeDescMap, RUNTIME_001, RUNTIME_002, RUNTIME_007, RUNTIME_003, RUNTIME_005, RUNTIME_006, RUNTIME_004 } from '@module-federation/error-codes';

const LOG_CATEGORY = '[ Federation Runtime ]';
// FIXME: pre-bundle ?
const logger = createLogger(LOG_CATEGORY);
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function assert(condition, msg) {
    if (!condition) {
        error(msg);
    }
}
function error(msg) {
    if (msg instanceof Error) {
        // Check if the message already starts with the log category to avoid duplication
        if (!msg.message.startsWith(LOG_CATEGORY)) {
            msg.message = `${LOG_CATEGORY}: ${msg.message}`;
        }
        throw msg;
    }
    throw new Error(`${LOG_CATEGORY}: ${msg}`);
}
function warn(msg) {
    if (msg instanceof Error) {
        // Check if the message already starts with the log category to avoid duplication
        if (!msg.message.startsWith(LOG_CATEGORY)) {
            msg.message = `${LOG_CATEGORY}: ${msg.message}`;
        }
        logger.warn(msg);
    }
    else {
        logger.warn(msg);
    }
}

function addUniqueItem(arr, item) {
    if (arr.findIndex((name) => name === item) === -1) {
        arr.push(item);
    }
    return arr;
}
function getFMId(remoteInfo) {
    if ('version' in remoteInfo && remoteInfo.version) {
        return `${remoteInfo.name}:${remoteInfo.version}`;
    }
    else if ('entry' in remoteInfo && remoteInfo.entry) {
        return `${remoteInfo.name}:${remoteInfo.entry}`;
    }
    else {
        return `${remoteInfo.name}`;
    }
}
function isRemoteInfoWithEntry(remote) {
    return typeof remote.entry !== 'undefined';
}
function isPureRemoteEntry(remote) {
    return !remote.entry.includes('.json');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeWrapper(callback, disableWarn) {
    try {
        const res = await callback();
        return res;
    }
    catch (e) {
        !disableWarn && warn(e);
        return;
    }
}
function isObject(val) {
    return val && typeof val === 'object';
}
const objectToString = Object.prototype.toString;
// eslint-disable-next-line @typescript-eslint/ban-types
function isPlainObject(val) {
    return objectToString.call(val) === '[object Object]';
}
function isStaticResourcesEqual(url1, url2) {
    const REG_EXP = /^(https?:)?\/\//i;
    // Transform url1 and url2 into relative paths
    const relativeUrl1 = url1.replace(REG_EXP, '').replace(/\/$/, '');
    const relativeUrl2 = url2.replace(REG_EXP, '').replace(/\/$/, '');
    // Check if the relative paths are identical
    return relativeUrl1 === relativeUrl2;
}
function arrayOptions(options) {
    return Array.isArray(options) ? options : [options];
}
function getRemoteEntryInfoFromSnapshot(snapshot) {
    const defaultRemoteEntryInfo = {
        url: '',
        type: 'global',
        globalName: '',
    };
    if (isBrowserEnv() || isReactNativeEnv() || !('ssrRemoteEntry' in snapshot)) {
        return 'remoteEntry' in snapshot
            ? {
                url: snapshot.remoteEntry,
                type: snapshot.remoteEntryType,
                globalName: snapshot.globalName,
            }
            : defaultRemoteEntryInfo;
    }
    if ('ssrRemoteEntry' in snapshot) {
        return {
            url: snapshot.ssrRemoteEntry || defaultRemoteEntryInfo.url,
            type: snapshot.ssrRemoteEntryType || defaultRemoteEntryInfo.type,
            globalName: snapshot.globalName,
        };
    }
    return defaultRemoteEntryInfo;
}
const processModuleAlias = (name, subPath) => {
    // @host/ ./button -> @host/button
    let moduleName;
    if (name.endsWith('/')) {
        moduleName = name.slice(0, -1);
    }
    else {
        moduleName = name;
    }
    if (subPath.startsWith('.')) {
        subPath = subPath.slice(1);
    }
    moduleName = moduleName + subPath;
    return moduleName;
};

const CurrentGlobal = typeof globalThis === 'object' ? globalThis : window;
const nativeGlobal = (() => {
    try {
        // get real window (incase of sandbox)
        return document.defaultView;
    }
    catch {
        // node env
        return CurrentGlobal;
    }
})();
const Global = nativeGlobal;
function definePropertyGlobalVal(target, key, val) {
    Object.defineProperty(target, key, {
        value: val,
        configurable: false,
        writable: true,
    });
}
function includeOwnProperty(target, key) {
    return Object.hasOwnProperty.call(target, key);
}
// This section is to prevent encapsulation by certain microfrontend frameworks. Due to reuse policies, sandbox escapes.
// The sandbox in the microfrontend does not replicate the value of 'configurable'.
// If there is no loading content on the global object, this section defines the loading object.
if (!includeOwnProperty(CurrentGlobal, '__GLOBAL_LOADING_REMOTE_ENTRY__')) {
    definePropertyGlobalVal(CurrentGlobal, '__GLOBAL_LOADING_REMOTE_ENTRY__', {});
}
const globalLoading = CurrentGlobal.__GLOBAL_LOADING_REMOTE_ENTRY__;
function setGlobalDefaultVal(target) {
    if (includeOwnProperty(target, '__VMOK__') &&
        !includeOwnProperty(target, '__FEDERATION__')) {
        definePropertyGlobalVal(target, '__FEDERATION__', target.__VMOK__);
    }
    if (!includeOwnProperty(target, '__FEDERATION__')) {
        definePropertyGlobalVal(target, '__FEDERATION__', {
            __GLOBAL_PLUGIN__: [],
            __INSTANCES__: [],
            moduleInfo: {},
            __SHARE__: {},
            __MANIFEST_LOADING__: {},
            __PRELOADED_MAP__: new Map(),
        });
        definePropertyGlobalVal(target, '__VMOK__', target.__FEDERATION__);
    }
    target.__FEDERATION__.__GLOBAL_PLUGIN__ ??= [];
    target.__FEDERATION__.__INSTANCES__ ??= [];
    target.__FEDERATION__.moduleInfo ??= {};
    target.__FEDERATION__.__SHARE__ ??= {};
    target.__FEDERATION__.__MANIFEST_LOADING__ ??= {};
    target.__FEDERATION__.__PRELOADED_MAP__ ??= new Map();
}
setGlobalDefaultVal(CurrentGlobal);
setGlobalDefaultVal(nativeGlobal);
function resetFederationGlobalInfo() {
    CurrentGlobal.__FEDERATION__.__GLOBAL_PLUGIN__ = [];
    CurrentGlobal.__FEDERATION__.__INSTANCES__ = [];
    CurrentGlobal.__FEDERATION__.moduleInfo = {};
    CurrentGlobal.__FEDERATION__.__SHARE__ = {};
    CurrentGlobal.__FEDERATION__.__MANIFEST_LOADING__ = {};
    Object.keys(globalLoading).forEach((key) => {
        delete globalLoading[key];
    });
}
function setGlobalFederationInstance(FederationInstance) {
    CurrentGlobal.__FEDERATION__.__INSTANCES__.push(FederationInstance);
}
function getGlobalFederationConstructor() {
    return CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR__;
}
function setGlobalFederationConstructor(FederationConstructor, isDebug = isDebugMode()) {
    if (isDebug) {
        CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR__ = FederationConstructor;
        CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR_VERSION__ = "2.0.0";
    }
}
// eslint-disable-next-line @typescript-eslint/ban-types
function getInfoWithoutType(target, key) {
    if (typeof key === 'string') {
        const keyRes = target[key];
        if (keyRes) {
            return {
                value: target[key],
                key: key,
            };
        }
        else {
            const targetKeys = Object.keys(target);
            for (const targetKey of targetKeys) {
                const [targetTypeOrName, _] = targetKey.split(':');
                const nKey = `${targetTypeOrName}:${key}`;
                const typeWithKeyRes = target[nKey];
                if (typeWithKeyRes) {
                    return {
                        value: typeWithKeyRes,
                        key: nKey,
                    };
                }
            }
            return {
                value: undefined,
                key: key,
            };
        }
    }
    else {
        throw new Error('key must be string');
    }
}
const getGlobalSnapshot = () => nativeGlobal.__FEDERATION__.moduleInfo;
const getTargetSnapshotInfoByModuleInfo = (moduleInfo, snapshot) => {
    // Check if the remote is included in the hostSnapshot
    const moduleKey = getFMId(moduleInfo);
    const getModuleInfo = getInfoWithoutType(snapshot, moduleKey).value;
    // The remoteSnapshot might not include a version
    if (getModuleInfo &&
        !getModuleInfo.version &&
        'version' in moduleInfo &&
        moduleInfo['version']) {
        getModuleInfo.version = moduleInfo['version'];
    }
    if (getModuleInfo) {
        return getModuleInfo;
    }
    // If the remote is not included in the hostSnapshot, deploy a micro app snapshot
    if ('version' in moduleInfo && moduleInfo['version']) {
        const { version, ...resModuleInfo } = moduleInfo;
        const moduleKeyWithoutVersion = getFMId(resModuleInfo);
        const getModuleInfoWithoutVersion = getInfoWithoutType(nativeGlobal.__FEDERATION__.moduleInfo, moduleKeyWithoutVersion).value;
        if (getModuleInfoWithoutVersion?.version === version) {
            return getModuleInfoWithoutVersion;
        }
    }
    return;
};
const getGlobalSnapshotInfoByModuleInfo = (moduleInfo) => getTargetSnapshotInfoByModuleInfo(moduleInfo, nativeGlobal.__FEDERATION__.moduleInfo);
const setGlobalSnapshotInfoByModuleInfo = (remoteInfo, moduleDetailInfo) => {
    const moduleKey = getFMId(remoteInfo);
    nativeGlobal.__FEDERATION__.moduleInfo[moduleKey] = moduleDetailInfo;
    return nativeGlobal.__FEDERATION__.moduleInfo;
};
const addGlobalSnapshot = (moduleInfos) => {
    nativeGlobal.__FEDERATION__.moduleInfo = {
        ...nativeGlobal.__FEDERATION__.moduleInfo,
        ...moduleInfos,
    };
    return () => {
        const keys = Object.keys(moduleInfos);
        for (const key of keys) {
            delete nativeGlobal.__FEDERATION__.moduleInfo[key];
        }
    };
};
const getRemoteEntryExports = (name, globalName) => {
    const remoteEntryKey = globalName || `__FEDERATION_${name}:custom__`;
    const entryExports = CurrentGlobal[remoteEntryKey];
    return {
        remoteEntryKey,
        entryExports,
    };
};
// This function is used to register global plugins.
// It iterates over the provided plugins and checks if they are already registered.
// If a plugin is not registered, it is added to the global plugins.
// If a plugin is already registered, a warning message is logged.
const registerGlobalPlugins = (plugins) => {
    const { __GLOBAL_PLUGIN__ } = nativeGlobal.__FEDERATION__;
    plugins.forEach((plugin) => {
        if (__GLOBAL_PLUGIN__.findIndex((p) => p.name === plugin.name) === -1) {
            __GLOBAL_PLUGIN__.push(plugin);
        }
        else {
            warn(`The plugin ${plugin.name} has been registered.`);
        }
    });
};
const getGlobalHostPlugins = () => nativeGlobal.__FEDERATION__.__GLOBAL_PLUGIN__;
const getPreloaded = (id) => CurrentGlobal.__FEDERATION__.__PRELOADED_MAP__.get(id);
const setPreloaded = (id) => CurrentGlobal.__FEDERATION__.__PRELOADED_MAP__.set(id, true);

const DEFAULT_SCOPE = 'default';
const DEFAULT_REMOTE_TYPE = 'global';

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// those constants are based on https://www.rubydoc.info/gems/semantic_range/3.0.0/SemanticRange#BUILDIDENTIFIER-constant
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
const buildIdentifier = '[0-9A-Za-z-]+';
const build = `(?:\\+(${buildIdentifier}(?:\\.${buildIdentifier})*))`;
const numericIdentifier = '0|[1-9]\\d*';
const numericIdentifierLoose = '[0-9]+';
const nonNumericIdentifier = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';
const preReleaseIdentifierLoose = `(?:${numericIdentifierLoose}|${nonNumericIdentifier})`;
const preReleaseLoose = `(?:-?(${preReleaseIdentifierLoose}(?:\\.${preReleaseIdentifierLoose})*))`;
const preReleaseIdentifier = `(?:${numericIdentifier}|${nonNumericIdentifier})`;
const preRelease = `(?:-(${preReleaseIdentifier}(?:\\.${preReleaseIdentifier})*))`;
const xRangeIdentifier = `${numericIdentifier}|x|X|\\*`;
const xRangePlain = `[v=\\s]*(${xRangeIdentifier})(?:\\.(${xRangeIdentifier})(?:\\.(${xRangeIdentifier})(?:${preRelease})?${build}?)?)?`;
const hyphenRange = `^\\s*(${xRangePlain})\\s+-\\s+(${xRangePlain})\\s*$`;
const mainVersionLoose = `(${numericIdentifierLoose})\\.(${numericIdentifierLoose})\\.(${numericIdentifierLoose})`;
const loosePlain = `[v=\\s]*${mainVersionLoose}${preReleaseLoose}?${build}?`;
const gtlt = '((?:<|>)?=?)';
const comparatorTrim = `(\\s*)${gtlt}\\s*(${loosePlain}|${xRangePlain})`;
const loneTilde = '(?:~>?)';
const tildeTrim = `(\\s*)${loneTilde}\\s+`;
const loneCaret = '(?:\\^)';
const caretTrim = `(\\s*)${loneCaret}\\s+`;
const star = '(<|>)?=?\\s*\\*';
const caret = `^${loneCaret}${xRangePlain}$`;
const mainVersion = `(${numericIdentifier})\\.(${numericIdentifier})\\.(${numericIdentifier})`;
const fullPlain = `v?${mainVersion}${preRelease}?${build}?`;
const tilde = `^${loneTilde}${xRangePlain}$`;
const xRange = `^${gtlt}\\s*${xRangePlain}$`;
const comparator = `^${gtlt}\\s*(${fullPlain})$|^$`;
// copy from semver package
const gte0 = '^\\s*>=\\s*0.0.0\\s*$';

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
function parseRegex(source) {
    return new RegExp(source);
}
function isXVersion(version) {
    return !version || version.toLowerCase() === 'x' || version === '*';
}
function pipe(...fns) {
    return (x) => fns.reduce((v, f) => f(v), x);
}
function extractComparator(comparatorString) {
    return comparatorString.match(parseRegex(comparator));
}
function combineVersion(major, minor, patch, preRelease) {
    const mainVersion = `${major}.${minor}.${patch}`;
    if (preRelease) {
        return `${mainVersion}-${preRelease}`;
    }
    return mainVersion;
}

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
function parseHyphen(range) {
    return range.replace(parseRegex(hyphenRange), (_range, from, fromMajor, fromMinor, fromPatch, _fromPreRelease, _fromBuild, to, toMajor, toMinor, toPatch, toPreRelease) => {
        if (isXVersion(fromMajor)) {
            from = '';
        }
        else if (isXVersion(fromMinor)) {
            from = `>=${fromMajor}.0.0`;
        }
        else if (isXVersion(fromPatch)) {
            from = `>=${fromMajor}.${fromMinor}.0`;
        }
        else {
            from = `>=${from}`;
        }
        if (isXVersion(toMajor)) {
            to = '';
        }
        else if (isXVersion(toMinor)) {
            to = `<${Number(toMajor) + 1}.0.0-0`;
        }
        else if (isXVersion(toPatch)) {
            to = `<${toMajor}.${Number(toMinor) + 1}.0-0`;
        }
        else if (toPreRelease) {
            to = `<=${toMajor}.${toMinor}.${toPatch}-${toPreRelease}`;
        }
        else {
            to = `<=${to}`;
        }
        return `${from} ${to}`.trim();
    });
}
function parseComparatorTrim(range) {
    return range.replace(parseRegex(comparatorTrim), '$1$2$3');
}
function parseTildeTrim(range) {
    return range.replace(parseRegex(tildeTrim), '$1~');
}
function parseCaretTrim(range) {
    return range.replace(parseRegex(caretTrim), '$1^');
}
function parseCarets(range) {
    return range
        .trim()
        .split(/\s+/)
        .map((rangeVersion) => rangeVersion.replace(parseRegex(caret), (_, major, minor, patch, preRelease) => {
        if (isXVersion(major)) {
            return '';
        }
        else if (isXVersion(minor)) {
            return `>=${major}.0.0 <${Number(major) + 1}.0.0-0`;
        }
        else if (isXVersion(patch)) {
            if (major === '0') {
                return `>=${major}.${minor}.0 <${major}.${Number(minor) + 1}.0-0`;
            }
            else {
                return `>=${major}.${minor}.0 <${Number(major) + 1}.0.0-0`;
            }
        }
        else if (preRelease) {
            if (major === '0') {
                if (minor === '0') {
                    return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${minor}.${Number(patch) + 1}-0`;
                }
                else {
                    return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${Number(minor) + 1}.0-0`;
                }
            }
            else {
                return `>=${major}.${minor}.${patch}-${preRelease} <${Number(major) + 1}.0.0-0`;
            }
        }
        else {
            if (major === '0') {
                if (minor === '0') {
                    return `>=${major}.${minor}.${patch} <${major}.${minor}.${Number(patch) + 1}-0`;
                }
                else {
                    return `>=${major}.${minor}.${patch} <${major}.${Number(minor) + 1}.0-0`;
                }
            }
            return `>=${major}.${minor}.${patch} <${Number(major) + 1}.0.0-0`;
        }
    }))
        .join(' ');
}
function parseTildes(range) {
    return range
        .trim()
        .split(/\s+/)
        .map((rangeVersion) => rangeVersion.replace(parseRegex(tilde), (_, major, minor, patch, preRelease) => {
        if (isXVersion(major)) {
            return '';
        }
        else if (isXVersion(minor)) {
            return `>=${major}.0.0 <${Number(major) + 1}.0.0-0`;
        }
        else if (isXVersion(patch)) {
            return `>=${major}.${minor}.0 <${major}.${Number(minor) + 1}.0-0`;
        }
        else if (preRelease) {
            return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${Number(minor) + 1}.0-0`;
        }
        return `>=${major}.${minor}.${patch} <${major}.${Number(minor) + 1}.0-0`;
    }))
        .join(' ');
}
function parseXRanges(range) {
    return range
        .split(/\s+/)
        .map((rangeVersion) => rangeVersion
        .trim()
        .replace(parseRegex(xRange), (ret, gtlt, major, minor, patch, preRelease) => {
        const isXMajor = isXVersion(major);
        const isXMinor = isXMajor || isXVersion(minor);
        const isXPatch = isXMinor || isXVersion(patch);
        if (gtlt === '=' && isXPatch) {
            gtlt = '';
        }
        preRelease = '';
        if (isXMajor) {
            if (gtlt === '>' || gtlt === '<') {
                // nothing is allowed
                return '<0.0.0-0';
            }
            else {
                // nothing is forbidden
                return '*';
            }
        }
        else if (gtlt && isXPatch) {
            // replace X with 0
            if (isXMinor) {
                minor = 0;
            }
            patch = 0;
            if (gtlt === '>') {
                // >1 => >=2.0.0
                // >1.2 => >=1.3.0
                gtlt = '>=';
                if (isXMinor) {
                    major = Number(major) + 1;
                    minor = 0;
                    patch = 0;
                }
                else {
                    minor = Number(minor) + 1;
                    patch = 0;
                }
            }
            else if (gtlt === '<=') {
                // <=0.7.x is actually <0.8.0, since any 0.7.x should pass
                // Similarly, <=7.x is actually <8.0.0, etc.
                gtlt = '<';
                if (isXMinor) {
                    major = Number(major) + 1;
                }
                else {
                    minor = Number(minor) + 1;
                }
            }
            if (gtlt === '<') {
                preRelease = '-0';
            }
            return `${gtlt + major}.${minor}.${patch}${preRelease}`;
        }
        else if (isXMinor) {
            return `>=${major}.0.0${preRelease} <${Number(major) + 1}.0.0-0`;
        }
        else if (isXPatch) {
            return `>=${major}.${minor}.0${preRelease} <${major}.${Number(minor) + 1}.0-0`;
        }
        return ret;
    }))
        .join(' ');
}
function parseStar(range) {
    return range.trim().replace(parseRegex(star), '');
}
function parseGTE0(comparatorString) {
    return comparatorString.trim().replace(parseRegex(gte0), '');
}

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
function compareAtom(rangeAtom, versionAtom) {
    rangeAtom = Number(rangeAtom) || rangeAtom;
    versionAtom = Number(versionAtom) || versionAtom;
    if (rangeAtom > versionAtom) {
        return 1;
    }
    if (rangeAtom === versionAtom) {
        return 0;
    }
    return -1;
}
function comparePreRelease(rangeAtom, versionAtom) {
    const { preRelease: rangePreRelease } = rangeAtom;
    const { preRelease: versionPreRelease } = versionAtom;
    if (rangePreRelease === undefined && Boolean(versionPreRelease)) {
        return 1;
    }
    if (Boolean(rangePreRelease) && versionPreRelease === undefined) {
        return -1;
    }
    if (rangePreRelease === undefined && versionPreRelease === undefined) {
        return 0;
    }
    for (let i = 0, n = rangePreRelease.length; i <= n; i++) {
        const rangeElement = rangePreRelease[i];
        const versionElement = versionPreRelease[i];
        if (rangeElement === versionElement) {
            continue;
        }
        if (rangeElement === undefined && versionElement === undefined) {
            return 0;
        }
        if (!rangeElement) {
            return 1;
        }
        if (!versionElement) {
            return -1;
        }
        return compareAtom(rangeElement, versionElement);
    }
    return 0;
}
function compareVersion(rangeAtom, versionAtom) {
    return (compareAtom(rangeAtom.major, versionAtom.major) ||
        compareAtom(rangeAtom.minor, versionAtom.minor) ||
        compareAtom(rangeAtom.patch, versionAtom.patch) ||
        comparePreRelease(rangeAtom, versionAtom));
}
function eq(rangeAtom, versionAtom) {
    return rangeAtom.version === versionAtom.version;
}
function compare(rangeAtom, versionAtom) {
    switch (rangeAtom.operator) {
        case '':
        case '=':
            return eq(rangeAtom, versionAtom);
        case '>':
            return compareVersion(rangeAtom, versionAtom) < 0;
        case '>=':
            return (eq(rangeAtom, versionAtom) || compareVersion(rangeAtom, versionAtom) < 0);
        case '<':
            return compareVersion(rangeAtom, versionAtom) > 0;
        case '<=':
            return (eq(rangeAtom, versionAtom) || compareVersion(rangeAtom, versionAtom) > 0);
        case undefined: {
            // mean * or x -> all versions
            return true;
        }
        default:
            return false;
    }
}

// fork from https://github.com/originjs/vite-plugin-federation/blob/v1.1.12/packages/lib/src/utils/semver/index.ts
// Copyright (c)
// vite-plugin-federation is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.
function parseComparatorString(range) {
    return pipe(
    // handle caret
    // ^ --> * (any, kinda silly)
    // ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
    // ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
    // ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
    // ^1.2.3 --> >=1.2.3 <2.0.0-0
    // ^1.2.0 --> >=1.2.0 <2.0.0-0
    parseCarets, 
    // handle tilde
    // ~, ~> --> * (any, kinda silly)
    // ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
    // ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
    // ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
    // ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
    // ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
    parseTildes, parseXRanges, parseStar)(range);
}
function parseRange(range) {
    return pipe(
    // handle hyphenRange
    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
    parseHyphen, 
    // handle trim comparator
    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
    parseComparatorTrim, 
    // handle trim tilde
    // `~ 1.2.3` => `~1.2.3`
    parseTildeTrim, 
    // handle trim caret
    // `^ 1.2.3` => `^1.2.3`
    parseCaretTrim)(range.trim())
        .split(/\s+/)
        .join(' ');
}
function satisfy(version, range) {
    if (!version) {
        return false;
    }
    // Extract version details once
    const extractedVersion = extractComparator(version);
    if (!extractedVersion) {
        // If the version string is invalid, it can't satisfy any range
        return false;
    }
    const [, versionOperator, , versionMajor, versionMinor, versionPatch, versionPreRelease,] = extractedVersion;
    const versionAtom = {
        operator: versionOperator,
        version: combineVersion(versionMajor, versionMinor, versionPatch, versionPreRelease), // exclude build atom
        major: versionMajor,
        minor: versionMinor,
        patch: versionPatch,
        preRelease: versionPreRelease?.split('.'),
    };
    // Split the range by || to handle OR conditions
    const orRanges = range.split('||');
    for (const orRange of orRanges) {
        const trimmedOrRange = orRange.trim();
        if (!trimmedOrRange) {
            // An empty range string signifies wildcard *, satisfy any valid version
            // (We already checked if the version itself is valid)
            return true;
        }
        // Handle simple wildcards explicitly before complex parsing
        if (trimmedOrRange === '*' || trimmedOrRange === 'x') {
            return true;
        }
        try {
            // Apply existing parsing logic to the current OR sub-range
            const parsedSubRange = parseRange(trimmedOrRange); // Handles hyphens, trims etc.
            // Check if the result of initial parsing is empty, which can happen
            // for some wildcard cases handled by parseRange/parseComparatorString.
            // E.g. `parseStar` used in `parseComparatorString` returns ''.
            if (!parsedSubRange.trim()) {
                // If parsing results in empty string, treat as wildcard match
                return true;
            }
            const parsedComparatorString = parsedSubRange
                .split(' ')
                .map((rangeVersion) => parseComparatorString(rangeVersion)) // Expands ^, ~
                .join(' ');
            // Check again if the comparator string became empty after specific parsing like ^ or ~
            if (!parsedComparatorString.trim()) {
                return true;
            }
            // Split the sub-range by space for implicit AND conditions
            const comparators = parsedComparatorString
                .split(/\s+/)
                .map((comparator) => parseGTE0(comparator))
                // Filter out empty strings that might result from multiple spaces
                .filter(Boolean);
            // If a sub-range becomes empty after parsing (e.g., invalid characters),
            // it cannot be satisfied. This check might be redundant now but kept for safety.
            if (comparators.length === 0) {
                continue;
            }
            let subRangeSatisfied = true;
            for (const comparator of comparators) {
                const extractedComparator = extractComparator(comparator);
                // If any part of the AND sub-range is invalid, the sub-range is not satisfied
                if (!extractedComparator) {
                    subRangeSatisfied = false;
                    break;
                }
                const [, rangeOperator, , rangeMajor, rangeMinor, rangePatch, rangePreRelease,] = extractedComparator;
                const rangeAtom = {
                    operator: rangeOperator,
                    version: combineVersion(rangeMajor, rangeMinor, rangePatch, rangePreRelease),
                    major: rangeMajor,
                    minor: rangeMinor,
                    patch: rangePatch,
                    preRelease: rangePreRelease?.split('.'),
                };
                // Check if the version satisfies this specific comparator in the AND chain
                if (!compare(rangeAtom, versionAtom)) {
                    subRangeSatisfied = false; // This part of the AND condition failed
                    break; // No need to check further comparators in this sub-range
                }
            }
            // If all AND conditions within this OR sub-range were met, the overall range is satisfied
            if (subRangeSatisfied) {
                return true;
            }
        }
        catch (e) {
            // Log error and treat this sub-range as unsatisfied
            console.error(`[semver] Error processing range part "${trimmedOrRange}":`, e);
            continue;
        }
    }
    // If none of the OR sub-ranges were satisfied
    return false;
}

function formatShare(shareArgs, from, name, shareStrategy) {
    let get;
    if ('get' in shareArgs) {
        // eslint-disable-next-line prefer-destructuring
        get = shareArgs.get;
    }
    else if ('lib' in shareArgs) {
        get = () => Promise.resolve(shareArgs.lib);
    }
    else {
        get = () => Promise.resolve(() => {
            throw new Error(`Can not get shared '${name}'!`);
        });
    }
    if (shareArgs.shareConfig?.eager && shareArgs.treeShaking) {
        throw new Error('Can not set "eager:true" and "treeShaking" at the same time!');
    }
    return {
        deps: [],
        useIn: [],
        from,
        loading: null,
        ...shareArgs,
        shareConfig: {
            requiredVersion: `^${shareArgs.version}`,
            singleton: false,
            eager: false,
            strictVersion: false,
            ...shareArgs.shareConfig,
        },
        get,
        loaded: shareArgs?.loaded || 'lib' in shareArgs ? true : undefined,
        version: shareArgs.version ?? '0',
        scope: Array.isArray(shareArgs.scope)
            ? shareArgs.scope
            : [shareArgs.scope ?? 'default'],
        strategy: (shareArgs.strategy ?? shareStrategy) || 'version-first',
        treeShaking: shareArgs.treeShaking
            ? {
                ...shareArgs.treeShaking,
                mode: shareArgs.treeShaking.mode ?? 'server-calc',
                status: shareArgs.treeShaking.status ?? 1 /* TreeShakingStatus.UNKNOWN */,
                useIn: [],
            }
            : undefined,
    };
}
function formatShareConfigs(prevOptions, newOptions) {
    const shareArgs = newOptions.shared || {};
    const from = newOptions.name;
    const newShareInfos = Object.keys(shareArgs).reduce((res, pkgName) => {
        const arrayShareArgs = arrayOptions(shareArgs[pkgName]);
        res[pkgName] = res[pkgName] || [];
        arrayShareArgs.forEach((shareConfig) => {
            res[pkgName].push(formatShare(shareConfig, from, pkgName, newOptions.shareStrategy));
        });
        return res;
    }, {});
    const allShareInfos = {
        ...prevOptions.shared,
    };
    Object.keys(newShareInfos).forEach((shareKey) => {
        if (!allShareInfos[shareKey]) {
            allShareInfos[shareKey] = newShareInfos[shareKey];
        }
        else {
            newShareInfos[shareKey].forEach((newUserSharedOptions) => {
                const isSameVersion = allShareInfos[shareKey].find((sharedVal) => sharedVal.version === newUserSharedOptions.version);
                if (!isSameVersion) {
                    allShareInfos[shareKey].push(newUserSharedOptions);
                }
            });
        }
    });
    return { allShareInfos, newShareInfos };
}
function shouldUseTreeShaking(treeShaking, usedExports) {
    if (!treeShaking) {
        return false;
    }
    const { status, mode } = treeShaking;
    if (status === 0 /* TreeShakingStatus.NO_USE */) {
        return false;
    }
    if (status === 2 /* TreeShakingStatus.CALCULATED */) {
        return true;
    }
    if (mode === 'runtime-infer') {
        if (!usedExports) {
            return true;
        }
        return isMatchUsedExports(treeShaking, usedExports);
    }
    return false;
}
/**
 * compare version a and b, return true if a is less than b
 */
function versionLt(a, b) {
    const transformInvalidVersion = (version) => {
        const isNumberVersion = !Number.isNaN(Number(version));
        if (isNumberVersion) {
            const splitArr = version.split('.');
            let validVersion = version;
            for (let i = 0; i < 3 - splitArr.length; i++) {
                validVersion += '.0';
            }
            return validVersion;
        }
        return version;
    };
    if (satisfy(transformInvalidVersion(a), `<=${transformInvalidVersion(b)}`)) {
        return true;
    }
    else {
        return false;
    }
}
const findVersion = (shareVersionMap, cb) => {
    const callback = cb ||
        function (prev, cur) {
            return versionLt(prev, cur);
        };
    return Object.keys(shareVersionMap).reduce((prev, cur) => {
        if (!prev) {
            return cur;
        }
        if (callback(prev, cur)) {
            return cur;
        }
        // default version is '0' https://github.com/webpack/webpack/blob/main/lib/sharing/ProvideSharedModule.js#L136
        if (prev === '0') {
            return cur;
        }
        return prev;
    }, 0);
};
const isLoaded = (shared) => {
    return Boolean(shared.loaded) || typeof shared.lib === 'function';
};
const isLoading = (shared) => {
    return Boolean(shared.loading);
};
const isMatchUsedExports = (treeShaking, usedExports) => {
    if (!treeShaking || !usedExports) {
        return false;
    }
    const { usedExports: treeShakingUsedExports } = treeShaking;
    if (!treeShakingUsedExports) {
        return false;
    }
    if (usedExports.every((e) => treeShakingUsedExports.includes(e))) {
        return true;
    }
    return false;
};
function findSingletonVersionOrderByVersion(shareScopeMap, scope, pkgName, treeShaking) {
    const versions = shareScopeMap[scope][pkgName];
    let version = '';
    let useTreesShaking = shouldUseTreeShaking(treeShaking);
    // return false means use prev version
    const callback = function (prev, cur) {
        if (useTreesShaking) {
            if (!versions[prev].treeShaking) {
                return true;
            }
            if (!versions[cur].treeShaking) {
                return false;
            }
            return !isLoaded(versions[prev].treeShaking) && versionLt(prev, cur);
        }
        return !isLoaded(versions[prev]) && versionLt(prev, cur);
    };
    if (useTreesShaking) {
        version = findVersion(shareScopeMap[scope][pkgName], callback);
        if (version) {
            return {
                version,
                useTreesShaking,
            };
        }
        useTreesShaking = false;
    }
    return {
        version: findVersion(shareScopeMap[scope][pkgName], callback),
        useTreesShaking,
    };
}
const isLoadingOrLoaded = (shared) => {
    return isLoaded(shared) || isLoading(shared);
};
function findSingletonVersionOrderByLoaded(shareScopeMap, scope, pkgName, treeShaking) {
    const versions = shareScopeMap[scope][pkgName];
    let version = '';
    let useTreesShaking = shouldUseTreeShaking(treeShaking);
    // return false means use prev version
    const callback = function (prev, cur) {
        if (useTreesShaking) {
            if (!versions[prev].treeShaking) {
                return true;
            }
            if (!versions[cur].treeShaking) {
                return false;
            }
            if (isLoadingOrLoaded(versions[cur].treeShaking)) {
                if (isLoadingOrLoaded(versions[prev].treeShaking)) {
                    return Boolean(versionLt(prev, cur));
                }
                else {
                    return true;
                }
            }
            if (isLoadingOrLoaded(versions[prev].treeShaking)) {
                return false;
            }
        }
        if (isLoadingOrLoaded(versions[cur])) {
            if (isLoadingOrLoaded(versions[prev])) {
                return Boolean(versionLt(prev, cur));
            }
            else {
                return true;
            }
        }
        if (isLoadingOrLoaded(versions[prev])) {
            return false;
        }
        return versionLt(prev, cur);
    };
    if (useTreesShaking) {
        version = findVersion(shareScopeMap[scope][pkgName], callback);
        if (version) {
            return {
                version,
                useTreesShaking,
            };
        }
        useTreesShaking = false;
    }
    return {
        version: findVersion(shareScopeMap[scope][pkgName], callback),
        useTreesShaking,
    };
}
function getFindShareFunction(strategy) {
    if (strategy === 'loaded-first') {
        return findSingletonVersionOrderByLoaded;
    }
    return findSingletonVersionOrderByVersion;
}
function getRegisteredShare(localShareScopeMap, pkgName, shareInfo, resolveShare) {
    if (!localShareScopeMap) {
        return;
    }
    const { shareConfig, scope = DEFAULT_SCOPE, strategy, treeShaking, } = shareInfo;
    const scopes = Array.isArray(scope) ? scope : [scope];
    for (const sc of scopes) {
        if (shareConfig &&
            localShareScopeMap[sc] &&
            localShareScopeMap[sc][pkgName]) {
            const { requiredVersion } = shareConfig;
            const findShareFunction = getFindShareFunction(strategy);
            const { version: maxOrSingletonVersion, useTreesShaking } = findShareFunction(localShareScopeMap, sc, pkgName, treeShaking);
            const defaultResolver = () => {
                const shared = localShareScopeMap[sc][pkgName][maxOrSingletonVersion];
                if (shareConfig.singleton) {
                    if (typeof requiredVersion === 'string' &&
                        !satisfy(maxOrSingletonVersion, requiredVersion)) {
                        const msg = `Version ${maxOrSingletonVersion} from ${maxOrSingletonVersion && shared.from} of shared singleton module ${pkgName} does not satisfy the requirement of ${shareInfo.from} which needs ${requiredVersion})`;
                        if (shareConfig.strictVersion) {
                            error(msg);
                        }
                        else {
                            warn(msg);
                        }
                    }
                    return {
                        shared,
                        useTreesShaking,
                    };
                }
                else {
                    if (requiredVersion === false || requiredVersion === '*') {
                        return {
                            shared,
                            useTreesShaking,
                        };
                    }
                    if (satisfy(maxOrSingletonVersion, requiredVersion)) {
                        return {
                            shared,
                            useTreesShaking,
                        };
                    }
                    const _usedTreeShaking = shouldUseTreeShaking(treeShaking);
                    if (_usedTreeShaking) {
                        for (const [versionKey, versionValue] of Object.entries(localShareScopeMap[sc][pkgName])) {
                            if (!shouldUseTreeShaking(versionValue.treeShaking, treeShaking?.usedExports)) {
                                continue;
                            }
                            if (satisfy(versionKey, requiredVersion)) {
                                return {
                                    shared: versionValue,
                                    useTreesShaking: _usedTreeShaking,
                                };
                            }
                        }
                    }
                    for (const [versionKey, versionValue] of Object.entries(localShareScopeMap[sc][pkgName])) {
                        if (satisfy(versionKey, requiredVersion)) {
                            return {
                                shared: versionValue,
                                useTreesShaking: false,
                            };
                        }
                    }
                }
                return;
            };
            const params = {
                shareScopeMap: localShareScopeMap,
                scope: sc,
                pkgName,
                version: maxOrSingletonVersion,
                GlobalFederation: Global.__FEDERATION__,
                shareInfo,
                resolver: defaultResolver,
            };
            const resolveShared = resolveShare.emit(params) || params;
            return resolveShared.resolver();
        }
    }
}
function getGlobalShareScope() {
    return Global.__FEDERATION__.__SHARE__;
}
function getTargetSharedOptions(options) {
    const { pkgName, extraOptions, shareInfos } = options;
    const defaultResolver = (sharedOptions) => {
        if (!sharedOptions) {
            return undefined;
        }
        const shareVersionMap = {};
        sharedOptions.forEach((shared) => {
            shareVersionMap[shared.version] = shared;
        });
        const callback = function (prev, cur) {
            return (
            // TODO: consider multiple treeShaking shared scenes
            !isLoaded(shareVersionMap[prev]) && versionLt(prev, cur));
        };
        const maxVersion = findVersion(shareVersionMap, callback);
        return shareVersionMap[maxVersion];
    };
    const resolver = extraOptions?.resolver ?? defaultResolver;
    const isPlainObject = (val) => {
        return val !== null && typeof val === 'object' && !Array.isArray(val);
    };
    const merge = (...sources) => {
        const out = {};
        for (const src of sources) {
            if (!src)
                continue;
            for (const [key, value] of Object.entries(src)) {
                const prev = out[key];
                if (isPlainObject(prev) && isPlainObject(value)) {
                    out[key] = merge(prev, value);
                }
                else if (value !== undefined) {
                    out[key] = value;
                }
            }
        }
        return out;
    };
    return merge(resolver(shareInfos[pkgName]), extraOptions?.customShareInfo);
}
const addUseIn = (shared, from) => {
    if (!shared.useIn) {
        shared.useIn = [];
    }
    addUniqueItem(shared.useIn, from);
};
function directShare(shared, useTreesShaking) {
    if (useTreesShaking && shared.treeShaking) {
        return shared.treeShaking;
    }
    return shared;
}

function getBuilderId() {
    //@ts-ignore
    return typeof FEDERATION_BUILD_IDENTIFIER !== 'undefined'
        ? //@ts-ignore
            FEDERATION_BUILD_IDENTIFIER
        : '';
}

// Function to match a remote with its name and expose
// id: pkgName(@federation/app1) + expose(button) = @federation/app1/button
// id: alias(app1) + expose(button) = app1/button
// id: alias(app1/utils) + expose(loadash/sort) = app1/utils/loadash/sort
function matchRemoteWithNameAndExpose(remotes, id) {
    for (const remote of remotes) {
        // match pkgName
        const isNameMatched = id.startsWith(remote.name);
        let expose = id.replace(remote.name, '');
        if (isNameMatched) {
            if (expose.startsWith('/')) {
                const pkgNameOrAlias = remote.name;
                expose = `.${expose}`;
                return {
                    pkgNameOrAlias,
                    expose,
                    remote,
                };
            }
            else if (expose === '') {
                return {
                    pkgNameOrAlias: remote.name,
                    expose: '.',
                    remote,
                };
            }
        }
        // match alias
        const isAliasMatched = remote.alias && id.startsWith(remote.alias);
        let exposeWithAlias = remote.alias && id.replace(remote.alias, '');
        if (remote.alias && isAliasMatched) {
            if (exposeWithAlias && exposeWithAlias.startsWith('/')) {
                const pkgNameOrAlias = remote.alias;
                exposeWithAlias = `.${exposeWithAlias}`;
                return {
                    pkgNameOrAlias,
                    expose: exposeWithAlias,
                    remote,
                };
            }
            else if (exposeWithAlias === '') {
                return {
                    pkgNameOrAlias: remote.alias,
                    expose: '.',
                    remote,
                };
            }
        }
    }
    return;
}
// Function to match a remote with its name or alias
function matchRemote(remotes, nameOrAlias) {
    for (const remote of remotes) {
        const isNameMatched = nameOrAlias === remote.name;
        if (isNameMatched) {
            return remote;
        }
        const isAliasMatched = remote.alias && nameOrAlias === remote.alias;
        if (isAliasMatched) {
            return remote;
        }
    }
    return;
}

function registerPlugins(plugins, instance) {
    const globalPlugins = getGlobalHostPlugins();
    const hookInstances = [
        instance.hooks,
        instance.remoteHandler.hooks,
        instance.sharedHandler.hooks,
        instance.snapshotHandler.hooks,
        instance.loaderHook,
        instance.bridgeHook,
    ];
    // Incorporate global plugins
    if (globalPlugins.length > 0) {
        globalPlugins.forEach((plugin) => {
            if (plugins?.find((item) => item.name !== plugin.name)) {
                plugins.push(plugin);
            }
        });
    }
    if (plugins && plugins.length > 0) {
        plugins.forEach((plugin) => {
            hookInstances.forEach((hookInstance) => {
                hookInstance.applyPlugin(plugin, instance);
            });
        });
    }
    return plugins;
}

const importCallback = '.then(callbacks[0]).catch(callbacks[1])';
async function loadEsmEntry({ entry, remoteEntryExports, }) {
    return new Promise((resolve, reject) => {
        try {
            if (!remoteEntryExports) {
                if (typeof FEDERATION_ALLOW_NEW_FUNCTION !== 'undefined') {
                    new Function('callbacks', `import("${entry}")${importCallback}`)([
                        resolve,
                        reject,
                    ]);
                }
                else {
                    import(/* webpackIgnore: true */ /* @vite-ignore */ entry)
                        .then(resolve)
                        .catch(reject);
                }
            }
            else {
                resolve(remoteEntryExports);
            }
        }
        catch (e) {
            reject(e);
        }
    });
}
async function loadSystemJsEntry({ entry, remoteEntryExports, }) {
    return new Promise((resolve, reject) => {
        try {
            if (!remoteEntryExports) {
                //@ts-ignore
                if (typeof __system_context__ === 'undefined') {
                    //@ts-ignore
                    System.import(entry).then(resolve).catch(reject);
                }
                else {
                    new Function('callbacks', `System.import("${entry}")${importCallback}`)([resolve, reject]);
                }
            }
            else {
                resolve(remoteEntryExports);
            }
        }
        catch (e) {
            reject(e);
        }
    });
}
function handleRemoteEntryLoaded(name, globalName, entry) {
    const { remoteEntryKey, entryExports } = getRemoteEntryExports(name, globalName);
    assert(entryExports, getShortErrorMsg(RUNTIME_001, runtimeDescMap, {
        remoteName: name,
        remoteEntryUrl: entry,
        remoteEntryKey,
    }));
    return entryExports;
}
async function loadEntryScript({ name, globalName, entry, loaderHook, getEntryUrl, }) {
    const { entryExports: remoteEntryExports } = getRemoteEntryExports(name, globalName);
    if (remoteEntryExports) {
        return remoteEntryExports;
    }
    // if getEntryUrl is passed, use the getEntryUrl to get the entry url
    const url = getEntryUrl ? getEntryUrl(entry) : entry;
    return loadScript(url, {
        attrs: {},
        createScriptHook: (url, attrs) => {
            const res = loaderHook.lifecycle.createScript.emit({ url, attrs });
            if (!res)
                return;
            if (res instanceof HTMLScriptElement) {
                return res;
            }
            if ('script' in res || 'timeout' in res) {
                return res;
            }
            return;
        },
    })
        .then(() => {
        return handleRemoteEntryLoaded(name, globalName, entry);
    })
        .catch((e) => {
        assert(undefined, getShortErrorMsg(RUNTIME_008, runtimeDescMap, {
            remoteName: name,
            resourceUrl: entry,
        }));
        throw e;
    });
}
async function loadEntryDom({ remoteInfo, remoteEntryExports, loaderHook, getEntryUrl, }) {
    const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
    switch (type) {
        case 'esm':
        case 'module':
            return loadEsmEntry({ entry, remoteEntryExports });
        case 'system':
            return loadSystemJsEntry({ entry, remoteEntryExports });
        default:
            return loadEntryScript({
                entry,
                globalName,
                name,
                loaderHook,
                getEntryUrl,
            });
    }
}
async function loadEntryNode({ remoteInfo, loaderHook, }) {
    const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
    const { entryExports: remoteEntryExports } = getRemoteEntryExports(name, globalName);
    if (remoteEntryExports) {
        return remoteEntryExports;
    }
    return loadScriptNode(entry, {
        attrs: { name, globalName, type },
        loaderHook: {
            createScriptHook: (url, attrs = {}) => {
                const res = loaderHook.lifecycle.createScript.emit({ url, attrs });
                if (!res)
                    return;
                if ('url' in res) {
                    return res;
                }
                return;
            },
        },
    })
        .then(() => {
        return handleRemoteEntryLoaded(name, globalName, entry);
    })
        .catch((e) => {
        throw e;
    });
}
function getRemoteEntryUniqueKey(remoteInfo) {
    const { entry, name } = remoteInfo;
    return composeKeyWithSeparator(name, entry);
}
async function getRemoteEntry(params) {
    const { origin, remoteEntryExports, remoteInfo, getEntryUrl, _inErrorHandling = false, } = params;
    const uniqueKey = getRemoteEntryUniqueKey(remoteInfo);
    if (remoteEntryExports) {
        return remoteEntryExports;
    }
    if (!globalLoading[uniqueKey]) {
        const loadEntryHook = origin.remoteHandler.hooks.lifecycle.loadEntry;
        const loaderHook = origin.loaderHook;
        globalLoading[uniqueKey] = loadEntryHook
            .emit({
            loaderHook,
            remoteInfo,
            remoteEntryExports,
        })
            .then((res) => {
            if (res) {
                return res;
            }
            // Use ENV_TARGET if defined, otherwise fallback to isBrowserEnv, must keep this
            const isWebEnvironment = typeof ENV_TARGET !== 'undefined'
                ? ENV_TARGET === 'web'
                : isBrowserEnv();
            return isWebEnvironment
                ? loadEntryDom({
                    remoteInfo,
                    remoteEntryExports,
                    loaderHook,
                    getEntryUrl,
                })
                : loadEntryNode({ remoteInfo, loaderHook });
        })
            .catch(async (err) => {
            const uniqueKey = getRemoteEntryUniqueKey(remoteInfo);
            const isScriptLoadError = err instanceof Error && err.message.includes(RUNTIME_008);
            if (isScriptLoadError && !_inErrorHandling) {
                const wrappedGetRemoteEntry = (params) => {
                    return getRemoteEntry({ ...params, _inErrorHandling: true });
                };
                const RemoteEntryExports = await origin.loaderHook.lifecycle.loadEntryError.emit({
                    getRemoteEntry: wrappedGetRemoteEntry,
                    origin,
                    remoteInfo: remoteInfo,
                    remoteEntryExports,
                    globalLoading,
                    uniqueKey,
                });
                if (RemoteEntryExports) {
                    return RemoteEntryExports;
                }
            }
            throw err;
        });
    }
    return globalLoading[uniqueKey];
}
function getRemoteInfo(remote) {
    return {
        ...remote,
        entry: 'entry' in remote ? remote.entry : '',
        type: remote.type || DEFAULT_REMOTE_TYPE,
        entryGlobalName: remote.entryGlobalName || remote.name,
        shareScope: remote.shareScope || DEFAULT_SCOPE,
    };
}

function defaultPreloadArgs(preloadConfig) {
    return {
        resourceCategory: 'sync',
        share: true,
        depsRemote: true,
        prefetchInterface: false,
        ...preloadConfig,
    };
}
function formatPreloadArgs(remotes, preloadArgs) {
    return preloadArgs.map((args) => {
        const remoteInfo = matchRemote(remotes, args.nameOrAlias);
        assert(remoteInfo, `Unable to preload ${args.nameOrAlias} as it is not included in ${!remoteInfo &&
            safeToString({
                remoteInfo,
                remotes,
            })}`);
        return {
            remote: remoteInfo,
            preloadConfig: defaultPreloadArgs(args),
        };
    });
}
function normalizePreloadExposes(exposes) {
    if (!exposes) {
        return [];
    }
    return exposes.map((expose) => {
        if (expose === '.') {
            return expose;
        }
        if (expose.startsWith('./')) {
            return expose.replace('./', '');
        }
        return expose;
    });
}
function preloadAssets(remoteInfo, host, assets, 
// It is used to distinguish preload from load remote parallel loading
useLinkPreload = true) {
    const { cssAssets, jsAssetsWithoutEntry, entryAssets } = assets;
    if (host.options.inBrowser) {
        entryAssets.forEach((asset) => {
            const { moduleInfo } = asset;
            const module = host.moduleCache.get(remoteInfo.name);
            if (module) {
                getRemoteEntry({
                    origin: host,
                    remoteInfo: moduleInfo,
                    remoteEntryExports: module.remoteEntryExports,
                });
            }
            else {
                getRemoteEntry({
                    origin: host,
                    remoteInfo: moduleInfo,
                    remoteEntryExports: undefined,
                });
            }
        });
        if (useLinkPreload) {
            const defaultAttrs = {
                rel: 'preload',
                as: 'style',
            };
            cssAssets.forEach((cssUrl) => {
                const { link: cssEl, needAttach } = createLink({
                    url: cssUrl,
                    cb: () => {
                        // noop
                    },
                    attrs: defaultAttrs,
                    createLinkHook: (url, attrs) => {
                        const res = host.loaderHook.lifecycle.createLink.emit({
                            url,
                            attrs,
                        });
                        if (res instanceof HTMLLinkElement) {
                            return res;
                        }
                        return;
                    },
                });
                needAttach && document.head.appendChild(cssEl);
            });
        }
        else {
            const defaultAttrs = {
                rel: 'stylesheet',
                type: 'text/css',
            };
            cssAssets.forEach((cssUrl) => {
                const { link: cssEl, needAttach } = createLink({
                    url: cssUrl,
                    cb: () => {
                        // noop
                    },
                    attrs: defaultAttrs,
                    createLinkHook: (url, attrs) => {
                        const res = host.loaderHook.lifecycle.createLink.emit({
                            url,
                            attrs,
                        });
                        if (res instanceof HTMLLinkElement) {
                            return res;
                        }
                        return;
                    },
                    needDeleteLink: false,
                });
                needAttach && document.head.appendChild(cssEl);
            });
        }
        if (useLinkPreload) {
            const defaultAttrs = {
                rel: 'preload',
                as: 'script',
            };
            jsAssetsWithoutEntry.forEach((jsUrl) => {
                const { link: linkEl, needAttach } = createLink({
                    url: jsUrl,
                    cb: () => {
                        // noop
                    },
                    attrs: defaultAttrs,
                    createLinkHook: (url, attrs) => {
                        const res = host.loaderHook.lifecycle.createLink.emit({
                            url,
                            attrs,
                        });
                        if (res instanceof HTMLLinkElement) {
                            return res;
                        }
                        return;
                    },
                });
                needAttach && document.head.appendChild(linkEl);
            });
        }
        else {
            const defaultAttrs = {
                fetchpriority: 'high',
                type: remoteInfo?.type === 'module' ? 'module' : 'text/javascript',
            };
            jsAssetsWithoutEntry.forEach((jsUrl) => {
                const { script: scriptEl, needAttach } = createScript({
                    url: jsUrl,
                    cb: () => {
                        // noop
                    },
                    attrs: defaultAttrs,
                    createScriptHook: (url, attrs) => {
                        const res = host.loaderHook.lifecycle.createScript.emit({
                            url,
                            attrs,
                        });
                        if (res instanceof HTMLScriptElement) {
                            return res;
                        }
                        return;
                    },
                    needDeleteScript: true,
                });
                needAttach && document.head.appendChild(scriptEl);
            });
        }
    }
}

const ShareUtils = {
    getRegisteredShare,
    getGlobalShareScope,
};
const GlobalUtils = {
    Global,
    nativeGlobal,
    resetFederationGlobalInfo,
    setGlobalFederationInstance,
    getGlobalFederationConstructor,
    setGlobalFederationConstructor,
    getInfoWithoutType,
    getGlobalSnapshot,
    getTargetSnapshotInfoByModuleInfo,
    getGlobalSnapshotInfoByModuleInfo,
    setGlobalSnapshotInfoByModuleInfo,
    addGlobalSnapshot,
    getRemoteEntryExports,
    registerGlobalPlugins,
    getGlobalHostPlugins,
    getPreloaded,
    setPreloaded,
};
var helpers = {
    global: GlobalUtils,
    share: ShareUtils,
    utils: {
        matchRemoteWithNameAndExpose,
        preloadAssets,
        getRemoteInfo,
    },
};

function createRemoteEntryInitOptions(remoteInfo, hostShareScopeMap) {
    const localShareScopeMap = hostShareScopeMap;
    const shareScopeKeys = Array.isArray(remoteInfo.shareScope)
        ? remoteInfo.shareScope
        : [remoteInfo.shareScope];
    if (!shareScopeKeys.length) {
        shareScopeKeys.push('default');
    }
    shareScopeKeys.forEach((shareScopeKey) => {
        if (!localShareScopeMap[shareScopeKey]) {
            localShareScopeMap[shareScopeKey] = {};
        }
    });
    const remoteEntryInitOptions = {
        version: remoteInfo.version || '',
        shareScopeKeys: Array.isArray(remoteInfo.shareScope)
            ? shareScopeKeys
            : remoteInfo.shareScope || 'default',
    };
    // Help to find host instance
    Object.defineProperty(remoteEntryInitOptions, 'shareScopeMap', {
        value: localShareScopeMap,
        // remoteEntryInitOptions will be traversed and assigned during container init, ,so this attribute is not allowed to be traversed
        enumerable: false,
    });
    // TODO: compate legacy init params, should use shareScopeMap if exist
    const shareScope = localShareScopeMap[shareScopeKeys[0]];
    const initScope = [];
    return {
        remoteEntryInitOptions,
        shareScope,
        initScope,
    };
}
class Module {
    constructor({ remoteInfo, host, }) {
        this.inited = false;
        this.initing = false;
        this.lib = undefined;
        this.remoteInfo = remoteInfo;
        this.host = host;
    }
    async getEntry() {
        if (this.remoteEntryExports) {
            return this.remoteEntryExports;
        }
        const remoteEntryExports = await getRemoteEntry({
            origin: this.host,
            remoteInfo: this.remoteInfo,
            remoteEntryExports: this.remoteEntryExports,
        });
        assert(remoteEntryExports, `remoteEntryExports is undefined \n ${safeToString(this.remoteInfo)}`);
        this.remoteEntryExports = remoteEntryExports;
        return this.remoteEntryExports;
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async init(id, remoteSnapshot) {
        // Get remoteEntry.js
        const remoteEntryExports = await this.getEntry();
        if (!this.inited && !this.initing) {
            this.initing = true;
            const { remoteEntryInitOptions, shareScope, initScope } = createRemoteEntryInitOptions(this.remoteInfo, this.host.shareScopeMap);
            const initContainerOptions = await this.host.hooks.lifecycle.beforeInitContainer.emit({
                shareScope,
                // @ts-ignore shareScopeMap will be set by Object.defineProperty
                remoteEntryInitOptions,
                initScope,
                remoteInfo: this.remoteInfo,
                origin: this.host,
            });
            if (typeof remoteEntryExports?.init === 'undefined') {
                error(getShortErrorMsg(RUNTIME_002, runtimeDescMap, {
                    hostName: this.host.name,
                    remoteName: this.remoteInfo.name,
                    remoteEntryUrl: this.remoteInfo.entry,
                    remoteEntryKey: this.remoteInfo.entryGlobalName,
                }));
            }
            await remoteEntryExports.init(initContainerOptions.shareScope, initContainerOptions.initScope, initContainerOptions.remoteEntryInitOptions);
            await this.host.hooks.lifecycle.initContainer.emit({
                ...initContainerOptions,
                id,
                remoteSnapshot,
                remoteEntryExports,
            });
            this.inited = true;
        }
        return remoteEntryExports;
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async get(id, expose, options, remoteSnapshot) {
        const { loadFactory = true } = options || { loadFactory: true };
        const remoteEntryExports = await this.init(id, remoteSnapshot);
        this.lib = remoteEntryExports;
        let moduleFactory;
        moduleFactory = await this.host.loaderHook.lifecycle.getModuleFactory.emit({
            remoteEntryExports,
            expose,
            moduleInfo: this.remoteInfo,
        });
        // get exposeGetter
        if (!moduleFactory) {
            moduleFactory = await remoteEntryExports.get(expose);
        }
        assert(moduleFactory, `${getFMId(this.remoteInfo)} remote don't export ${expose}.`);
        // keep symbol for module name always one format
        const symbolName = processModuleAlias(this.remoteInfo.name, expose);
        const wrapModuleFactory = this.wraperFactory(moduleFactory, symbolName);
        if (!loadFactory) {
            return wrapModuleFactory;
        }
        const exposeContent = await wrapModuleFactory();
        return exposeContent;
    }
    wraperFactory(moduleFactory, id) {
        function defineModuleId(res, id) {
            if (res &&
                typeof res === 'object' &&
                Object.isExtensible(res) &&
                !Object.getOwnPropertyDescriptor(res, Symbol.for('mf_module_id'))) {
                Object.defineProperty(res, Symbol.for('mf_module_id'), {
                    value: id,
                    enumerable: false,
                });
            }
        }
        if (moduleFactory instanceof Promise) {
            return async () => {
                const res = await moduleFactory();
                // This parameter is used for bridge debugging
                defineModuleId(res, id);
                return res;
            };
        }
        else {
            return () => {
                const res = moduleFactory();
                // This parameter is used for bridge debugging
                defineModuleId(res, id);
                return res;
            };
        }
    }
}

class SyncHook {
    constructor(type) {
        this.type = '';
        this.listeners = new Set();
        if (type) {
            this.type = type;
        }
    }
    on(fn) {
        if (typeof fn === 'function') {
            this.listeners.add(fn);
        }
    }
    once(fn) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.on(function wrapper(...args) {
            self.remove(wrapper);
            // eslint-disable-next-line prefer-spread
            return fn.apply(null, args);
        });
    }
    emit(...data) {
        let result;
        if (this.listeners.size > 0) {
            // eslint-disable-next-line prefer-spread
            this.listeners.forEach((fn) => {
                result = fn(...data);
            });
        }
        return result;
    }
    remove(fn) {
        this.listeners.delete(fn);
    }
    removeAll() {
        this.listeners.clear();
    }
}

class AsyncHook extends SyncHook {
    emit(...data) {
        let result;
        const ls = Array.from(this.listeners);
        if (ls.length > 0) {
            let i = 0;
            const call = (prev) => {
                if (prev === false) {
                    return false; // Abort process
                }
                else if (i < ls.length) {
                    return Promise.resolve(ls[i++].apply(null, data)).then(call);
                }
                else {
                    return prev;
                }
            };
            result = call();
        }
        return Promise.resolve(result);
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function checkReturnData(originalData, returnedData) {
    if (!isObject(returnedData)) {
        return false;
    }
    if (originalData !== returnedData) {
        // eslint-disable-next-line no-restricted-syntax
        for (const key in originalData) {
            if (!(key in returnedData)) {
                return false;
            }
        }
    }
    return true;
}
class SyncWaterfallHook extends SyncHook {
    constructor(type) {
        super();
        this.onerror = error;
        this.type = type;
    }
    emit(data) {
        if (!isObject(data)) {
            error(`The data for the "${this.type}" hook should be an object.`);
        }
        for (const fn of this.listeners) {
            try {
                const tempData = fn(data);
                if (checkReturnData(data, tempData)) {
                    data = tempData;
                }
                else {
                    this.onerror(`A plugin returned an unacceptable value for the "${this.type}" type.`);
                    break;
                }
            }
            catch (e) {
                warn(e);
                this.onerror(e);
            }
        }
        return data;
    }
}

class AsyncWaterfallHook extends SyncHook {
    constructor(type) {
        super();
        this.onerror = error;
        this.type = type;
    }
    emit(data) {
        if (!isObject(data)) {
            error(`The response data for the "${this.type}" hook must be an object.`);
        }
        const ls = Array.from(this.listeners);
        if (ls.length > 0) {
            let i = 0;
            const processError = (e) => {
                warn(e);
                this.onerror(e);
                return data;
            };
            const call = (prevData) => {
                if (checkReturnData(data, prevData)) {
                    data = prevData;
                    if (i < ls.length) {
                        try {
                            return Promise.resolve(ls[i++](data)).then(call, processError);
                        }
                        catch (e) {
                            return processError(e);
                        }
                    }
                }
                else {
                    this.onerror(`A plugin returned an incorrect value for the "${this.type}" type.`);
                }
                return data;
            };
            return Promise.resolve(call(data));
        }
        return Promise.resolve(data);
    }
}

class PluginSystem {
    constructor(lifecycle) {
        this.registerPlugins = {};
        this.lifecycle = lifecycle;
        this.lifecycleKeys = Object.keys(lifecycle);
    }
    applyPlugin(plugin, instance) {
        assert(isPlainObject(plugin), 'Plugin configuration is invalid.');
        // The plugin's name is mandatory and must be unique
        const pluginName = plugin.name;
        assert(pluginName, 'A name must be provided by the plugin.');
        if (!this.registerPlugins[pluginName]) {
            this.registerPlugins[pluginName] = plugin;
            plugin.apply?.(instance);
            Object.keys(this.lifecycle).forEach((key) => {
                const pluginLife = plugin[key];
                if (pluginLife) {
                    this.lifecycle[key].on(pluginLife);
                }
            });
        }
    }
    removePlugin(pluginName) {
        assert(pluginName, 'A name is required.');
        const plugin = this.registerPlugins[pluginName];
        assert(plugin, `The plugin "${pluginName}" is not registered.`);
        Object.keys(plugin).forEach((key) => {
            if (key !== 'name') {
                this.lifecycle[key].remove(plugin[key]);
            }
        });
    }
}

function assignRemoteInfo(remoteInfo, remoteSnapshot) {
    const remoteEntryInfo = getRemoteEntryInfoFromSnapshot(remoteSnapshot);
    if (!remoteEntryInfo.url) {
        error(`The attribute remoteEntry of ${remoteInfo.name} must not be undefined.`);
    }
    let entryUrl = getResourceUrl(remoteSnapshot, remoteEntryInfo.url);
    if (!isBrowserEnv() && !entryUrl.startsWith('http')) {
        entryUrl = `https:${entryUrl}`;
    }
    remoteInfo.type = remoteEntryInfo.type;
    remoteInfo.entryGlobalName = remoteEntryInfo.globalName;
    remoteInfo.entry = entryUrl;
    remoteInfo.version = remoteSnapshot.version;
    remoteInfo.buildVersion = remoteSnapshot.buildVersion;
}
function snapshotPlugin() {
    return {
        name: 'snapshot-plugin',
        async afterResolve(args) {
            const { remote, pkgNameOrAlias, expose, origin, remoteInfo, id } = args;
            if (!isRemoteInfoWithEntry(remote) || !isPureRemoteEntry(remote)) {
                const { remoteSnapshot, globalSnapshot } = await origin.snapshotHandler.loadRemoteSnapshotInfo({
                    moduleInfo: remote,
                    id,
                });
                assignRemoteInfo(remoteInfo, remoteSnapshot);
                // preloading assets
                const preloadOptions = {
                    remote,
                    preloadConfig: {
                        nameOrAlias: pkgNameOrAlias,
                        exposes: [expose],
                        resourceCategory: 'sync',
                        share: false,
                        depsRemote: false,
                    },
                };
                const assets = await origin.remoteHandler.hooks.lifecycle.generatePreloadAssets.emit({
                    origin,
                    preloadOptions,
                    remoteInfo,
                    remote,
                    remoteSnapshot,
                    globalSnapshot,
                });
                if (assets) {
                    preloadAssets(remoteInfo, origin, assets, false);
                }
                return {
                    ...args,
                    remoteSnapshot,
                };
            }
            return args;
        },
    };
}

// name
// name:version
function splitId(id) {
    const splitInfo = id.split(':');
    if (splitInfo.length === 1) {
        return {
            name: splitInfo[0],
            version: undefined,
        };
    }
    else if (splitInfo.length === 2) {
        return {
            name: splitInfo[0],
            version: splitInfo[1],
        };
    }
    else {
        return {
            name: splitInfo[1],
            version: splitInfo[2],
        };
    }
}
// Traverse all nodes in moduleInfo and traverse the entire snapshot
function traverseModuleInfo(globalSnapshot, remoteInfo, traverse, isRoot, memo = {}, remoteSnapshot) {
    const id = getFMId(remoteInfo);
    const { value: snapshotValue } = getInfoWithoutType(globalSnapshot, id);
    const effectiveRemoteSnapshot = remoteSnapshot || snapshotValue;
    if (effectiveRemoteSnapshot && !isManifestProvider(effectiveRemoteSnapshot)) {
        traverse(effectiveRemoteSnapshot, remoteInfo, isRoot);
        if (effectiveRemoteSnapshot.remotesInfo) {
            const remoteKeys = Object.keys(effectiveRemoteSnapshot.remotesInfo);
            for (const key of remoteKeys) {
                if (memo[key]) {
                    continue;
                }
                memo[key] = true;
                const subRemoteInfo = splitId(key);
                const remoteValue = effectiveRemoteSnapshot.remotesInfo[key];
                traverseModuleInfo(globalSnapshot, {
                    name: subRemoteInfo.name,
                    version: remoteValue.matchedVersion,
                }, traverse, false, memo, undefined);
            }
        }
    }
}
const isExisted = (type, url) => {
    return document.querySelector(`${type}[${type === 'link' ? 'href' : 'src'}="${url}"]`);
};
// eslint-disable-next-line max-lines-per-function
function generatePreloadAssets(origin, preloadOptions, remote, globalSnapshot, remoteSnapshot) {
    const cssAssets = [];
    const jsAssets = [];
    const entryAssets = [];
    const loadedSharedJsAssets = new Set();
    const loadedSharedCssAssets = new Set();
    const { options } = origin;
    const { preloadConfig: rootPreloadConfig } = preloadOptions;
    const { depsRemote } = rootPreloadConfig;
    const memo = {};
    traverseModuleInfo(globalSnapshot, remote, (moduleInfoSnapshot, remoteInfo, isRoot) => {
        let preloadConfig;
        if (isRoot) {
            preloadConfig = rootPreloadConfig;
        }
        else {
            if (Array.isArray(depsRemote)) {
                // eslint-disable-next-line array-callback-return
                const findPreloadConfig = depsRemote.find((remoteConfig) => {
                    if (remoteConfig.nameOrAlias === remoteInfo.name ||
                        remoteConfig.nameOrAlias === remoteInfo.alias) {
                        return true;
                    }
                    return false;
                });
                if (!findPreloadConfig) {
                    return;
                }
                preloadConfig = defaultPreloadArgs(findPreloadConfig);
            }
            else if (depsRemote === true) {
                preloadConfig = rootPreloadConfig;
            }
            else {
                return;
            }
        }
        const remoteEntryUrl = getResourceUrl(moduleInfoSnapshot, getRemoteEntryInfoFromSnapshot(moduleInfoSnapshot).url);
        if (remoteEntryUrl) {
            entryAssets.push({
                name: remoteInfo.name,
                moduleInfo: {
                    name: remoteInfo.name,
                    entry: remoteEntryUrl,
                    type: 'remoteEntryType' in moduleInfoSnapshot
                        ? moduleInfoSnapshot.remoteEntryType
                        : 'global',
                    entryGlobalName: 'globalName' in moduleInfoSnapshot
                        ? moduleInfoSnapshot.globalName
                        : remoteInfo.name,
                    shareScope: '',
                    version: 'version' in moduleInfoSnapshot
                        ? moduleInfoSnapshot.version
                        : undefined,
                },
                url: remoteEntryUrl,
            });
        }
        let moduleAssetsInfo = 'modules' in moduleInfoSnapshot ? moduleInfoSnapshot.modules : [];
        const normalizedPreloadExposes = normalizePreloadExposes(preloadConfig.exposes);
        if (normalizedPreloadExposes.length && 'modules' in moduleInfoSnapshot) {
            moduleAssetsInfo = moduleInfoSnapshot?.modules?.reduce((assets, moduleAssetInfo) => {
                if (normalizedPreloadExposes?.indexOf(moduleAssetInfo.moduleName) !==
                    -1) {
                    assets.push(moduleAssetInfo);
                }
                return assets;
            }, []);
        }
        function handleAssets(assets) {
            const assetsRes = assets.map((asset) => getResourceUrl(moduleInfoSnapshot, asset));
            if (preloadConfig.filter) {
                return assetsRes.filter(preloadConfig.filter);
            }
            return assetsRes;
        }
        if (moduleAssetsInfo) {
            const assetsLength = moduleAssetsInfo.length;
            for (let index = 0; index < assetsLength; index++) {
                const assetsInfo = moduleAssetsInfo[index];
                const exposeFullPath = `${remoteInfo.name}/${assetsInfo.moduleName}`;
                origin.remoteHandler.hooks.lifecycle.handlePreloadModule.emit({
                    id: assetsInfo.moduleName === '.' ? remoteInfo.name : exposeFullPath,
                    name: remoteInfo.name,
                    remoteSnapshot: moduleInfoSnapshot,
                    preloadConfig,
                    remote: remoteInfo,
                    origin,
                });
                const preloaded = getPreloaded(exposeFullPath);
                if (preloaded) {
                    continue;
                }
                if (preloadConfig.resourceCategory === 'all') {
                    cssAssets.push(...handleAssets(assetsInfo.assets.css.async));
                    cssAssets.push(...handleAssets(assetsInfo.assets.css.sync));
                    jsAssets.push(...handleAssets(assetsInfo.assets.js.async));
                    jsAssets.push(...handleAssets(assetsInfo.assets.js.sync));
                    // eslint-disable-next-line no-constant-condition
                }
                else if ((preloadConfig.resourceCategory = 'sync')) {
                    cssAssets.push(...handleAssets(assetsInfo.assets.css.sync));
                    jsAssets.push(...handleAssets(assetsInfo.assets.js.sync));
                }
                setPreloaded(exposeFullPath);
            }
        }
    }, true, memo, remoteSnapshot);
    if (remoteSnapshot.shared && remoteSnapshot.shared.length > 0) {
        const collectSharedAssets = (shareInfo, snapshotShared) => {
            const { shared: registeredShared } = getRegisteredShare(origin.shareScopeMap, snapshotShared.sharedName, shareInfo, origin.sharedHandler.hooks.lifecycle.resolveShare) || {};
            // If the global share does not exist, or the lib function does not exist, it means that the shared has not been loaded yet and can be preloaded.
            if (registeredShared && typeof registeredShared.lib === 'function') {
                snapshotShared.assets.js.sync.forEach((asset) => {
                    loadedSharedJsAssets.add(asset);
                });
                snapshotShared.assets.css.sync.forEach((asset) => {
                    loadedSharedCssAssets.add(asset);
                });
            }
        };
        remoteSnapshot.shared.forEach((shared) => {
            const shareInfos = options.shared?.[shared.sharedName];
            if (!shareInfos) {
                return;
            }
            // if no version, preload all shared
            const sharedOptions = shared.version
                ? shareInfos.find((s) => s.version === shared.version)
                : shareInfos;
            if (!sharedOptions) {
                return;
            }
            const arrayShareInfo = arrayOptions(sharedOptions);
            arrayShareInfo.forEach((s) => {
                collectSharedAssets(s, shared);
            });
        });
    }
    const needPreloadJsAssets = jsAssets.filter((asset) => !loadedSharedJsAssets.has(asset) && !isExisted('script', asset));
    const needPreloadCssAssets = cssAssets.filter((asset) => !loadedSharedCssAssets.has(asset) && !isExisted('link', asset));
    return {
        cssAssets: needPreloadCssAssets,
        jsAssetsWithoutEntry: needPreloadJsAssets,
        entryAssets: entryAssets.filter((entry) => !isExisted('script', entry.url)),
    };
}
const generatePreloadAssetsPlugin = function () {
    return {
        name: 'generate-preload-assets-plugin',
        async generatePreloadAssets(args) {
            const { origin, preloadOptions, remoteInfo, remote, globalSnapshot, remoteSnapshot, } = args;
            if (!isBrowserEnv()) {
                return {
                    cssAssets: [],
                    jsAssetsWithoutEntry: [],
                    entryAssets: [],
                };
            }
            if (isRemoteInfoWithEntry(remote) && isPureRemoteEntry(remote)) {
                return {
                    cssAssets: [],
                    jsAssetsWithoutEntry: [],
                    entryAssets: [
                        {
                            name: remote.name,
                            url: remote.entry,
                            moduleInfo: {
                                name: remoteInfo.name,
                                entry: remote.entry,
                                type: remoteInfo.type || 'global',
                                entryGlobalName: '',
                                shareScope: '',
                            },
                        },
                    ],
                };
            }
            assignRemoteInfo(remoteInfo, remoteSnapshot);
            const assets = generatePreloadAssets(origin, preloadOptions, remoteInfo, globalSnapshot, remoteSnapshot);
            return assets;
        },
    };
};

function getGlobalRemoteInfo(moduleInfo, origin) {
    const hostGlobalSnapshot = getGlobalSnapshotInfoByModuleInfo({
        name: origin.name,
        version: origin.options.version,
    });
    // get remote detail info from global
    const globalRemoteInfo = hostGlobalSnapshot &&
        'remotesInfo' in hostGlobalSnapshot &&
        hostGlobalSnapshot.remotesInfo &&
        getInfoWithoutType(hostGlobalSnapshot.remotesInfo, moduleInfo.name).value;
    if (globalRemoteInfo && globalRemoteInfo.matchedVersion) {
        return {
            hostGlobalSnapshot,
            globalSnapshot: getGlobalSnapshot(),
            remoteSnapshot: getGlobalSnapshotInfoByModuleInfo({
                name: moduleInfo.name,
                version: globalRemoteInfo.matchedVersion,
            }),
        };
    }
    return {
        hostGlobalSnapshot: undefined,
        globalSnapshot: getGlobalSnapshot(),
        remoteSnapshot: getGlobalSnapshotInfoByModuleInfo({
            name: moduleInfo.name,
            version: 'version' in moduleInfo ? moduleInfo.version : undefined,
        }),
    };
}
class SnapshotHandler {
    constructor(HostInstance) {
        this.loadingHostSnapshot = null;
        this.manifestCache = new Map();
        this.hooks = new PluginSystem({
            beforeLoadRemoteSnapshot: new AsyncHook('beforeLoadRemoteSnapshot'),
            loadSnapshot: new AsyncWaterfallHook('loadGlobalSnapshot'),
            loadRemoteSnapshot: new AsyncWaterfallHook('loadRemoteSnapshot'),
            afterLoadSnapshot: new AsyncWaterfallHook('afterLoadSnapshot'),
        });
        this.manifestLoading = Global.__FEDERATION__.__MANIFEST_LOADING__;
        this.HostInstance = HostInstance;
        this.loaderHook = HostInstance.loaderHook;
    }
    // eslint-disable-next-line max-lines-per-function
    async loadRemoteSnapshotInfo({ moduleInfo, id, expose, }) {
        const { options } = this.HostInstance;
        await this.hooks.lifecycle.beforeLoadRemoteSnapshot.emit({
            options,
            moduleInfo,
        });
        let hostSnapshot = getGlobalSnapshotInfoByModuleInfo({
            name: this.HostInstance.options.name,
            version: this.HostInstance.options.version,
        });
        if (!hostSnapshot) {
            hostSnapshot = {
                version: this.HostInstance.options.version || '',
                remoteEntry: '',
                remotesInfo: {},
            };
            addGlobalSnapshot({
                [this.HostInstance.options.name]: hostSnapshot,
            });
        }
        // In dynamic loadRemote scenarios, incomplete remotesInfo delivery may occur. In such cases, the remotesInfo in the host needs to be completed in the snapshot at runtime.
        // This ensures the snapshot's integrity and helps the chrome plugin correctly identify all producer modules, ensuring that proxyable producer modules will not be missing.
        if (hostSnapshot &&
            'remotesInfo' in hostSnapshot &&
            !getInfoWithoutType(hostSnapshot.remotesInfo, moduleInfo.name).value) {
            if ('version' in moduleInfo || 'entry' in moduleInfo) {
                hostSnapshot.remotesInfo = {
                    ...hostSnapshot?.remotesInfo,
                    [moduleInfo.name]: {
                        matchedVersion: 'version' in moduleInfo ? moduleInfo.version : moduleInfo.entry,
                    },
                };
            }
        }
        const { hostGlobalSnapshot, remoteSnapshot, globalSnapshot } = this.getGlobalRemoteInfo(moduleInfo);
        const { remoteSnapshot: globalRemoteSnapshot, globalSnapshot: globalSnapshotRes, } = await this.hooks.lifecycle.loadSnapshot.emit({
            options,
            moduleInfo,
            hostGlobalSnapshot,
            remoteSnapshot,
            globalSnapshot,
        });
        let mSnapshot;
        let gSnapshot;
        // global snapshot includes manifest or module info includes manifest
        if (globalRemoteSnapshot) {
            if (isManifestProvider(globalRemoteSnapshot)) {
                const remoteEntry = isBrowserEnv()
                    ? globalRemoteSnapshot.remoteEntry
                    : globalRemoteSnapshot.ssrRemoteEntry ||
                        globalRemoteSnapshot.remoteEntry ||
                        '';
                const moduleSnapshot = await this.getManifestJson(remoteEntry, moduleInfo, {});
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const globalSnapshotRes = setGlobalSnapshotInfoByModuleInfo({
                    ...moduleInfo,
                    // The global remote may be overridden
                    // Therefore, set the snapshot key to the global address of the actual request
                    entry: remoteEntry,
                }, moduleSnapshot);
                mSnapshot = moduleSnapshot;
                gSnapshot = globalSnapshotRes;
            }
            else {
                const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
                    options: this.HostInstance.options,
                    moduleInfo,
                    remoteSnapshot: globalRemoteSnapshot,
                    from: 'global',
                });
                mSnapshot = remoteSnapshotRes;
                gSnapshot = globalSnapshotRes;
            }
        }
        else {
            if (isRemoteInfoWithEntry(moduleInfo)) {
                // get from manifest.json and merge remote info from remote server
                const moduleSnapshot = await this.getManifestJson(moduleInfo.entry, moduleInfo, {});
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const globalSnapshotRes = setGlobalSnapshotInfoByModuleInfo(moduleInfo, moduleSnapshot);
                const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
                    options: this.HostInstance.options,
                    moduleInfo,
                    remoteSnapshot: moduleSnapshot,
                    from: 'global',
                });
                mSnapshot = remoteSnapshotRes;
                gSnapshot = globalSnapshotRes;
            }
            else {
                error(getShortErrorMsg(RUNTIME_007, runtimeDescMap, {
                    hostName: moduleInfo.name,
                    hostVersion: moduleInfo.version,
                    globalSnapshot: JSON.stringify(globalSnapshotRes),
                }));
            }
        }
        await this.hooks.lifecycle.afterLoadSnapshot.emit({
            id,
            host: this.HostInstance,
            options,
            moduleInfo,
            remoteSnapshot: mSnapshot,
        });
        return {
            remoteSnapshot: mSnapshot,
            globalSnapshot: gSnapshot,
        };
    }
    getGlobalRemoteInfo(moduleInfo) {
        return getGlobalRemoteInfo(moduleInfo, this.HostInstance);
    }
    async getManifestJson(manifestUrl, moduleInfo, extraOptions) {
        const getManifest = async () => {
            let manifestJson = this.manifestCache.get(manifestUrl);
            if (manifestJson) {
                return manifestJson;
            }
            try {
                let res = await this.loaderHook.lifecycle.fetch.emit(manifestUrl, {});
                if (!res || !(res instanceof Response)) {
                    res = await fetch(manifestUrl, {});
                }
                manifestJson = (await res.json());
            }
            catch (err) {
                manifestJson =
                    (await this.HostInstance.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
                        id: manifestUrl,
                        error: err,
                        from: 'runtime',
                        lifecycle: 'afterResolve',
                        origin: this.HostInstance,
                    }));
                if (!manifestJson) {
                    delete this.manifestLoading[manifestUrl];
                    error(getShortErrorMsg(RUNTIME_003, runtimeDescMap, {
                        manifestUrl,
                        moduleName: moduleInfo.name,
                        hostName: this.HostInstance.options.name,
                    }, `${err}`));
                }
            }
            assert(manifestJson.metaData && manifestJson.exposes && manifestJson.shared, `${manifestUrl} is not a federation manifest`);
            this.manifestCache.set(manifestUrl, manifestJson);
            return manifestJson;
        };
        const asyncLoadProcess = async () => {
            const manifestJson = await getManifest();
            const remoteSnapshot = generateSnapshotFromManifest(manifestJson, {
                version: manifestUrl,
            });
            const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
                options: this.HostInstance.options,
                moduleInfo,
                manifestJson,
                remoteSnapshot,
                manifestUrl,
                from: 'manifest',
            });
            return remoteSnapshotRes;
        };
        if (!this.manifestLoading[manifestUrl]) {
            this.manifestLoading[manifestUrl] = asyncLoadProcess().then((res) => res);
        }
        return this.manifestLoading[manifestUrl];
    }
}

class SharedHandler {
    constructor(host) {
        this.hooks = new PluginSystem({
            beforeRegisterShare: new SyncWaterfallHook('beforeRegisterShare'),
            afterResolve: new AsyncWaterfallHook('afterResolve'),
            beforeLoadShare: new AsyncWaterfallHook('beforeLoadShare'),
            // not used yet
            loadShare: new AsyncHook(),
            resolveShare: new SyncWaterfallHook('resolveShare'),
            // maybe will change, temporarily for internal use only
            initContainerShareScopeMap: new SyncWaterfallHook('initContainerShareScopeMap'),
        });
        this.host = host;
        this.shareScopeMap = {};
        this.initTokens = {};
        this._setGlobalShareScopeMap(host.options);
    }
    // register shared in shareScopeMap
    registerShared(globalOptions, userOptions) {
        const { newShareInfos, allShareInfos } = formatShareConfigs(globalOptions, userOptions);
        const sharedKeys = Object.keys(newShareInfos);
        sharedKeys.forEach((sharedKey) => {
            const sharedVals = newShareInfos[sharedKey];
            sharedVals.forEach((sharedVal) => {
                sharedVal.scope.forEach((sc) => {
                    this.hooks.lifecycle.beforeRegisterShare.emit({
                        origin: this.host,
                        pkgName: sharedKey,
                        shared: sharedVal,
                    });
                    const registeredShared = this.shareScopeMap[sc]?.[sharedKey];
                    if (!registeredShared) {
                        this.setShared({
                            pkgName: sharedKey,
                            lib: sharedVal.lib,
                            get: sharedVal.get,
                            loaded: sharedVal.loaded || Boolean(sharedVal.lib),
                            shared: sharedVal,
                            from: userOptions.name,
                        });
                    }
                });
            });
        });
        return {
            newShareInfos,
            allShareInfos,
        };
    }
    async loadShare(pkgName, extraOptions) {
        const { host } = this;
        // This function performs the following steps:
        // 1. Checks if the currently loaded share already exists, if not, it throws an error
        // 2. Searches globally for a matching share, if found, it uses it directly
        // 3. If not found, it retrieves it from the current share and stores the obtained share globally.
        const shareOptions = getTargetSharedOptions({
            pkgName,
            extraOptions,
            shareInfos: host.options.shared,
        });
        if (shareOptions?.scope) {
            await Promise.all(shareOptions.scope.map(async (shareScope) => {
                await Promise.all(this.initializeSharing(shareScope, {
                    strategy: shareOptions.strategy,
                }));
                return;
            }));
        }
        const loadShareRes = await this.hooks.lifecycle.beforeLoadShare.emit({
            pkgName,
            shareInfo: shareOptions,
            shared: host.options.shared,
            origin: host,
        });
        const { shareInfo: shareOptionsRes } = loadShareRes;
        // Assert that shareInfoRes exists, if not, throw an error
        assert(shareOptionsRes, `Cannot find ${pkgName} Share in the ${host.options.name}. Please ensure that the ${pkgName} Share parameters have been injected`);
        const { shared: registeredShared, useTreesShaking } = getRegisteredShare(this.shareScopeMap, pkgName, shareOptionsRes, this.hooks.lifecycle.resolveShare) || {};
        if (registeredShared) {
            const targetShared = directShare(registeredShared, useTreesShaking);
            if (targetShared.lib) {
                addUseIn(targetShared, host.options.name);
                return targetShared.lib;
            }
            else if (targetShared.loading && !targetShared.loaded) {
                const factory = await targetShared.loading;
                targetShared.loaded = true;
                if (!targetShared.lib) {
                    targetShared.lib = factory;
                }
                addUseIn(targetShared, host.options.name);
                return factory;
            }
            else {
                const asyncLoadProcess = async () => {
                    const factory = await targetShared.get();
                    addUseIn(targetShared, host.options.name);
                    targetShared.loaded = true;
                    targetShared.lib = factory;
                    return factory;
                };
                const loading = asyncLoadProcess();
                this.setShared({
                    pkgName,
                    loaded: false,
                    shared: registeredShared,
                    from: host.options.name,
                    lib: null,
                    loading,
                    treeShaking: useTreesShaking
                        ? targetShared
                        : undefined,
                });
                return loading;
            }
        }
        else {
            if (extraOptions?.customShareInfo) {
                return false;
            }
            const _useTreeShaking = shouldUseTreeShaking(shareOptionsRes.treeShaking);
            const targetShared = directShare(shareOptionsRes, _useTreeShaking);
            const asyncLoadProcess = async () => {
                const factory = await targetShared.get();
                targetShared.lib = factory;
                targetShared.loaded = true;
                addUseIn(targetShared, host.options.name);
                const { shared: gShared, useTreesShaking: gUseTreeShaking } = getRegisteredShare(this.shareScopeMap, pkgName, shareOptionsRes, this.hooks.lifecycle.resolveShare) || {};
                if (gShared) {
                    const targetGShared = directShare(gShared, gUseTreeShaking);
                    targetGShared.lib = factory;
                    targetGShared.loaded = true;
                    gShared.from = shareOptionsRes.from;
                }
                return factory;
            };
            const loading = asyncLoadProcess();
            this.setShared({
                pkgName,
                loaded: false,
                shared: shareOptionsRes,
                from: host.options.name,
                lib: null,
                loading,
                treeShaking: _useTreeShaking
                    ? targetShared
                    : undefined,
            });
            return loading;
        }
    }
    /**
     * This function initializes the sharing sequence (executed only once per share scope).
     * It accepts one argument, the name of the share scope.
     * If the share scope does not exist, it creates one.
     */
    // eslint-disable-next-line @typescript-eslint/member-ordering
    initializeSharing(shareScopeName = DEFAULT_SCOPE, extraOptions) {
        const { host } = this;
        const from = extraOptions?.from;
        const strategy = extraOptions?.strategy;
        let initScope = extraOptions?.initScope;
        const promises = [];
        if (from !== 'build') {
            const { initTokens } = this;
            if (!initScope)
                initScope = [];
            let initToken = initTokens[shareScopeName];
            if (!initToken)
                initToken = initTokens[shareScopeName] = { from: this.host.name };
            if (initScope.indexOf(initToken) >= 0)
                return promises;
            initScope.push(initToken);
        }
        const shareScope = this.shareScopeMap;
        const hostName = host.options.name;
        // Creates a new share scope if necessary
        if (!shareScope[shareScopeName]) {
            shareScope[shareScopeName] = {};
        }
        // Executes all initialization snippets from all accessible modules
        const scope = shareScope[shareScopeName];
        const register = (name, shared) => {
            const { version, eager } = shared;
            scope[name] = scope[name] || {};
            const versions = scope[name];
            const activeVersion = versions[version] && directShare(versions[version]);
            const activeVersionEager = Boolean(activeVersion &&
                (('eager' in activeVersion && activeVersion.eager) ||
                    ('shareConfig' in activeVersion &&
                        activeVersion.shareConfig?.eager)));
            if (!activeVersion ||
                (activeVersion.strategy !== 'loaded-first' &&
                    !activeVersion.loaded &&
                    (Boolean(!eager) !== !activeVersionEager
                        ? eager
                        : hostName > versions[version].from))) {
                versions[version] = shared;
            }
        };
        const initRemoteModule = async (key) => {
            const { module } = await host.remoteHandler.getRemoteModuleAndOptions({
                id: key,
            });
            let remoteEntryExports = undefined;
            try {
                remoteEntryExports = await module.getEntry();
            }
            catch (error) {
                remoteEntryExports =
                    (await host.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
                        id: key,
                        error,
                        from: 'runtime',
                        lifecycle: 'beforeLoadShare',
                        origin: host,
                    }));
            }
            finally {
                if (remoteEntryExports?.init) {
                    module.remoteEntryExports = remoteEntryExports;
                    await module.init();
                }
            }
        };
        Object.keys(host.options.shared).forEach((shareName) => {
            const sharedArr = host.options.shared[shareName];
            sharedArr.forEach((shared) => {
                if (shared.scope.includes(shareScopeName)) {
                    register(shareName, shared);
                }
            });
        });
        // TODO: strategy==='version-first' need to be removed in the future
        if (host.options.shareStrategy === 'version-first' ||
            strategy === 'version-first') {
            host.options.remotes.forEach((remote) => {
                if (remote.shareScope === shareScopeName) {
                    promises.push(initRemoteModule(remote.name));
                }
            });
        }
        return promises;
    }
    // The lib function will only be available if the shared set by eager or runtime init is set or the shared is successfully loaded.
    // 1. If the loaded shared already exists globally, then it will be reused
    // 2. If lib exists in local shared, it will be used directly
    // 3. If the local get returns something other than Promise, then it will be used directly
    loadShareSync(pkgName, extraOptions) {
        const { host } = this;
        const shareOptions = getTargetSharedOptions({
            pkgName,
            extraOptions,
            shareInfos: host.options.shared,
        });
        if (shareOptions?.scope) {
            shareOptions.scope.forEach((shareScope) => {
                this.initializeSharing(shareScope, { strategy: shareOptions.strategy });
            });
        }
        const { shared: registeredShared, useTreesShaking } = getRegisteredShare(this.shareScopeMap, pkgName, shareOptions, this.hooks.lifecycle.resolveShare) || {};
        if (registeredShared) {
            if (typeof registeredShared.lib === 'function') {
                addUseIn(registeredShared, host.options.name);
                if (!registeredShared.loaded) {
                    registeredShared.loaded = true;
                    if (registeredShared.from === host.options.name) {
                        shareOptions.loaded = true;
                    }
                }
                return registeredShared.lib;
            }
            if (typeof registeredShared.get === 'function') {
                const module = registeredShared.get();
                if (!(module instanceof Promise)) {
                    addUseIn(registeredShared, host.options.name);
                    this.setShared({
                        pkgName,
                        loaded: true,
                        from: host.options.name,
                        lib: module,
                        shared: registeredShared,
                    });
                    return module;
                }
            }
        }
        if (shareOptions.lib) {
            if (!shareOptions.loaded) {
                shareOptions.loaded = true;
            }
            return shareOptions.lib;
        }
        if (shareOptions.get) {
            const module = shareOptions.get();
            if (module instanceof Promise) {
                const errorCode = extraOptions?.from === 'build' ? RUNTIME_005 : RUNTIME_006;
                throw new Error(getShortErrorMsg(errorCode, runtimeDescMap, {
                    hostName: host.options.name,
                    sharedPkgName: pkgName,
                }));
            }
            shareOptions.lib = module;
            this.setShared({
                pkgName,
                loaded: true,
                from: host.options.name,
                lib: shareOptions.lib,
                shared: shareOptions,
            });
            return shareOptions.lib;
        }
        throw new Error(getShortErrorMsg(RUNTIME_006, runtimeDescMap, {
            hostName: host.options.name,
            sharedPkgName: pkgName,
        }));
    }
    initShareScopeMap(scopeName, shareScope, extraOptions = {}) {
        const { host } = this;
        this.shareScopeMap[scopeName] = shareScope;
        this.hooks.lifecycle.initContainerShareScopeMap.emit({
            shareScope,
            options: host.options,
            origin: host,
            scopeName,
            hostShareScopeMap: extraOptions.hostShareScopeMap,
        });
    }
    setShared({ pkgName, shared, from, lib, loading, loaded, get, treeShaking, }) {
        const { version, scope = 'default', ...shareInfo } = shared;
        const scopes = Array.isArray(scope) ? scope : [scope];
        const mergeAttrs = (shared) => {
            const merge = (s, key, val) => {
                if (val && !s[key]) {
                    s[key] = val;
                }
            };
            const targetShared = (treeShaking ? shared.treeShaking : shared);
            merge(targetShared, 'loaded', loaded);
            merge(targetShared, 'loading', loading);
            merge(targetShared, 'get', get);
        };
        scopes.forEach((sc) => {
            if (!this.shareScopeMap[sc]) {
                this.shareScopeMap[sc] = {};
            }
            if (!this.shareScopeMap[sc][pkgName]) {
                this.shareScopeMap[sc][pkgName] = {};
            }
            if (!this.shareScopeMap[sc][pkgName][version]) {
                this.shareScopeMap[sc][pkgName][version] = {
                    version,
                    scope: [sc],
                    ...shareInfo,
                    lib,
                };
            }
            const registeredShared = this.shareScopeMap[sc][pkgName][version];
            mergeAttrs(registeredShared);
            if (from && registeredShared.from !== from) {
                registeredShared.from = from;
            }
        });
    }
    _setGlobalShareScopeMap(hostOptions) {
        const globalShareScopeMap = getGlobalShareScope();
        const identifier = hostOptions.id || hostOptions.name;
        if (identifier && !globalShareScopeMap[identifier]) {
            globalShareScopeMap[identifier] = this.shareScopeMap;
        }
    }
}

class RemoteHandler {
    constructor(host) {
        this.hooks = new PluginSystem({
            beforeRegisterRemote: new SyncWaterfallHook('beforeRegisterRemote'),
            registerRemote: new SyncWaterfallHook('registerRemote'),
            beforeRequest: new AsyncWaterfallHook('beforeRequest'),
            onLoad: new AsyncHook('onLoad'),
            handlePreloadModule: new SyncHook('handlePreloadModule'),
            errorLoadRemote: new AsyncHook('errorLoadRemote'),
            beforePreloadRemote: new AsyncHook('beforePreloadRemote'),
            generatePreloadAssets: new AsyncHook('generatePreloadAssets'),
            // not used yet
            afterPreloadRemote: new AsyncHook(),
            // TODO: Move to loaderHook
            loadEntry: new AsyncHook(),
        });
        this.host = host;
        this.idToRemoteMap = {};
    }
    formatAndRegisterRemote(globalOptions, userOptions) {
        const userRemotes = userOptions.remotes || [];
        return userRemotes.reduce((res, remote) => {
            this.registerRemote(remote, res, { force: false });
            return res;
        }, globalOptions.remotes);
    }
    setIdToRemoteMap(id, remoteMatchInfo) {
        const { remote, expose } = remoteMatchInfo;
        const { name, alias } = remote;
        this.idToRemoteMap[id] = { name: remote.name, expose };
        if (alias && id.startsWith(name)) {
            const idWithAlias = id.replace(name, alias);
            this.idToRemoteMap[idWithAlias] = { name: remote.name, expose };
            return;
        }
        if (alias && id.startsWith(alias)) {
            const idWithName = id.replace(alias, name);
            this.idToRemoteMap[idWithName] = { name: remote.name, expose };
        }
    }
    // eslint-disable-next-line max-lines-per-function
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async loadRemote(id, options) {
        const { host } = this;
        try {
            const { loadFactory = true } = options || {
                loadFactory: true,
            };
            // 1. Validate the parameters of the retrieved module. There are two module request methods: pkgName + expose and alias + expose.
            // 2. Request the snapshot information of the current host and globally store the obtained snapshot information. The retrieved module information is partially offline and partially online. The online module information will retrieve the modules used online.
            // 3. Retrieve the detailed information of the current module from global (remoteEntry address, expose resource address)
            // 4. After retrieving remoteEntry, call the init of the module, and then retrieve the exported content of the module through get
            // id: pkgName(@federation/app1) + expose(button) = @federation/app1/button
            // id: alias(app1) + expose(button) = app1/button
            // id: alias(app1/utils) + expose(loadash/sort) = app1/utils/loadash/sort
            const { module, moduleOptions, remoteMatchInfo } = await this.getRemoteModuleAndOptions({
                id,
            });
            const { pkgNameOrAlias, remote, expose, id: idRes, remoteSnapshot, } = remoteMatchInfo;
            const moduleOrFactory = (await module.get(idRes, expose, options, remoteSnapshot));
            const moduleWrapper = await this.hooks.lifecycle.onLoad.emit({
                id: idRes,
                pkgNameOrAlias,
                expose,
                exposeModule: loadFactory ? moduleOrFactory : undefined,
                exposeModuleFactory: loadFactory ? undefined : moduleOrFactory,
                remote,
                options: moduleOptions,
                moduleInstance: module,
                origin: host,
            });
            this.setIdToRemoteMap(id, remoteMatchInfo);
            if (typeof moduleWrapper === 'function') {
                return moduleWrapper;
            }
            return moduleOrFactory;
        }
        catch (error) {
            const { from = 'runtime' } = options || { from: 'runtime' };
            const failOver = await this.hooks.lifecycle.errorLoadRemote.emit({
                id,
                error,
                from,
                lifecycle: 'onLoad',
                origin: host,
            });
            if (!failOver) {
                throw error;
            }
            return failOver;
        }
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async preloadRemote(preloadOptions) {
        const { host } = this;
        await this.hooks.lifecycle.beforePreloadRemote.emit({
            preloadOps: preloadOptions,
            options: host.options,
            origin: host,
        });
        const preloadOps = formatPreloadArgs(host.options.remotes, preloadOptions);
        await Promise.all(preloadOps.map(async (ops) => {
            const { remote } = ops;
            const remoteInfo = getRemoteInfo(remote);
            const { globalSnapshot, remoteSnapshot } = await host.snapshotHandler.loadRemoteSnapshotInfo({
                moduleInfo: remote,
            });
            const assets = await this.hooks.lifecycle.generatePreloadAssets.emit({
                origin: host,
                preloadOptions: ops,
                remote,
                remoteInfo,
                globalSnapshot,
                remoteSnapshot,
            });
            if (!assets) {
                return;
            }
            preloadAssets(remoteInfo, host, assets);
        }));
    }
    registerRemotes(remotes, options) {
        const { host } = this;
        remotes.forEach((remote) => {
            this.registerRemote(remote, host.options.remotes, {
                force: options?.force,
            });
        });
    }
    async getRemoteModuleAndOptions(options) {
        const { host } = this;
        const { id } = options;
        let loadRemoteArgs;
        try {
            loadRemoteArgs = await this.hooks.lifecycle.beforeRequest.emit({
                id,
                options: host.options,
                origin: host,
            });
        }
        catch (error) {
            loadRemoteArgs = (await this.hooks.lifecycle.errorLoadRemote.emit({
                id,
                options: host.options,
                origin: host,
                from: 'runtime',
                error,
                lifecycle: 'beforeRequest',
            }));
            if (!loadRemoteArgs) {
                throw error;
            }
        }
        const { id: idRes } = loadRemoteArgs;
        const remoteSplitInfo = matchRemoteWithNameAndExpose(host.options.remotes, idRes);
        assert(remoteSplitInfo, getShortErrorMsg(RUNTIME_004, runtimeDescMap, {
            hostName: host.options.name,
            requestId: idRes,
        }));
        const { remote: rawRemote } = remoteSplitInfo;
        const remoteInfo = getRemoteInfo(rawRemote);
        const matchInfo = await host.sharedHandler.hooks.lifecycle.afterResolve.emit({
            id: idRes,
            ...remoteSplitInfo,
            options: host.options,
            origin: host,
            remoteInfo,
        });
        const { remote, expose } = matchInfo;
        assert(remote && expose, `The 'beforeRequest' hook was executed, but it failed to return the correct 'remote' and 'expose' values while loading ${idRes}.`);
        let module = host.moduleCache.get(remote.name);
        const moduleOptions = {
            host: host,
            remoteInfo,
        };
        if (!module) {
            module = new Module(moduleOptions);
            host.moduleCache.set(remote.name, module);
        }
        return {
            module,
            moduleOptions,
            remoteMatchInfo: matchInfo,
        };
    }
    registerRemote(remote, targetRemotes, options) {
        const { host } = this;
        const normalizeRemote = () => {
            if (remote.alias) {
                // Validate if alias equals the prefix of remote.name and remote.alias, if so, throw an error
                // As multi-level path references cannot guarantee unique names, alias being a prefix of remote.name is not supported
                const findEqual = targetRemotes.find((item) => remote.alias &&
                    (item.name.startsWith(remote.alias) ||
                        item.alias?.startsWith(remote.alias)));
                assert(!findEqual, `The alias ${remote.alias} of remote ${remote.name} is not allowed to be the prefix of ${findEqual && findEqual.name} name or alias`);
            }
            // Set the remote entry to a complete path
            if ('entry' in remote) {
                if (isBrowserEnv() && !remote.entry.startsWith('http')) {
                    remote.entry = new URL(remote.entry, window.location.origin).href;
                }
            }
            if (!remote.shareScope) {
                remote.shareScope = DEFAULT_SCOPE;
            }
            if (!remote.type) {
                remote.type = DEFAULT_REMOTE_TYPE;
            }
        };
        this.hooks.lifecycle.beforeRegisterRemote.emit({ remote, origin: host });
        const registeredRemote = targetRemotes.find((item) => item.name === remote.name);
        if (!registeredRemote) {
            normalizeRemote();
            targetRemotes.push(remote);
            this.hooks.lifecycle.registerRemote.emit({ remote, origin: host });
        }
        else {
            const messages = [
                `The remote "${remote.name}" is already registered.`,
                'Please note that overriding it may cause unexpected errors.',
            ];
            if (options?.force) {
                // remove registered remote
                this.removeRemote(registeredRemote);
                normalizeRemote();
                targetRemotes.push(remote);
                this.hooks.lifecycle.registerRemote.emit({ remote, origin: host });
                warn$1(messages.join(' '));
            }
        }
    }
    removeRemote(remote) {
        try {
            const { host } = this;
            const { name } = remote;
            const remoteIndex = host.options.remotes.findIndex((item) => item.name === name);
            if (remoteIndex !== -1) {
                host.options.remotes.splice(remoteIndex, 1);
            }
            const loadedModule = host.moduleCache.get(remote.name);
            if (loadedModule) {
                const remoteInfo = loadedModule.remoteInfo;
                const key = remoteInfo.entryGlobalName;
                if (CurrentGlobal[key]) {
                    if (Object.getOwnPropertyDescriptor(CurrentGlobal, key)?.configurable) {
                        delete CurrentGlobal[key];
                    }
                    else {
                        // @ts-ignore
                        CurrentGlobal[key] = undefined;
                    }
                }
                const remoteEntryUniqueKey = getRemoteEntryUniqueKey(loadedModule.remoteInfo);
                if (globalLoading[remoteEntryUniqueKey]) {
                    delete globalLoading[remoteEntryUniqueKey];
                }
                host.snapshotHandler.manifestCache.delete(remoteInfo.entry);
                // delete unloaded shared and instance
                let remoteInsId = remoteInfo.buildVersion
                    ? composeKeyWithSeparator(remoteInfo.name, remoteInfo.buildVersion)
                    : remoteInfo.name;
                const remoteInsIndex = CurrentGlobal.__FEDERATION__.__INSTANCES__.findIndex((ins) => {
                    if (remoteInfo.buildVersion) {
                        return ins.options.id === remoteInsId;
                    }
                    else {
                        return ins.name === remoteInsId;
                    }
                });
                if (remoteInsIndex !== -1) {
                    const remoteIns = CurrentGlobal.__FEDERATION__.__INSTANCES__[remoteInsIndex];
                    remoteInsId = remoteIns.options.id || remoteInsId;
                    const globalShareScopeMap = getGlobalShareScope();
                    let isAllSharedNotUsed = true;
                    const needDeleteKeys = [];
                    Object.keys(globalShareScopeMap).forEach((instId) => {
                        const shareScopeMap = globalShareScopeMap[instId];
                        shareScopeMap &&
                            Object.keys(shareScopeMap).forEach((shareScope) => {
                                const shareScopeVal = shareScopeMap[shareScope];
                                shareScopeVal &&
                                    Object.keys(shareScopeVal).forEach((shareName) => {
                                        const sharedPkgs = shareScopeVal[shareName];
                                        sharedPkgs &&
                                            Object.keys(sharedPkgs).forEach((shareVersion) => {
                                                const shared = sharedPkgs[shareVersion];
                                                if (shared &&
                                                    typeof shared === 'object' &&
                                                    shared.from === remoteInfo.name) {
                                                    if (shared.loaded || shared.loading) {
                                                        shared.useIn = shared.useIn.filter((usedHostName) => usedHostName !== remoteInfo.name);
                                                        if (shared.useIn.length) {
                                                            isAllSharedNotUsed = false;
                                                        }
                                                        else {
                                                            needDeleteKeys.push([
                                                                instId,
                                                                shareScope,
                                                                shareName,
                                                                shareVersion,
                                                            ]);
                                                        }
                                                    }
                                                    else {
                                                        needDeleteKeys.push([
                                                            instId,
                                                            shareScope,
                                                            shareName,
                                                            shareVersion,
                                                        ]);
                                                    }
                                                }
                                            });
                                    });
                            });
                    });
                    if (isAllSharedNotUsed) {
                        remoteIns.shareScopeMap = {};
                        delete globalShareScopeMap[remoteInsId];
                    }
                    needDeleteKeys.forEach(([insId, shareScope, shareName, shareVersion]) => {
                        delete globalShareScopeMap[insId]?.[shareScope]?.[shareName]?.[shareVersion];
                    });
                    CurrentGlobal.__FEDERATION__.__INSTANCES__.splice(remoteInsIndex, 1);
                }
                const { hostGlobalSnapshot } = getGlobalRemoteInfo(remote, host);
                if (hostGlobalSnapshot) {
                    const remoteKey = hostGlobalSnapshot &&
                        'remotesInfo' in hostGlobalSnapshot &&
                        hostGlobalSnapshot.remotesInfo &&
                        getInfoWithoutType(hostGlobalSnapshot.remotesInfo, remote.name).key;
                    if (remoteKey) {
                        delete hostGlobalSnapshot.remotesInfo[remoteKey];
                        if (
                        //eslint-disable-next-line no-extra-boolean-cast
                        Boolean(Global.__FEDERATION__.__MANIFEST_LOADING__[remoteKey])) {
                            delete Global.__FEDERATION__.__MANIFEST_LOADING__[remoteKey];
                        }
                    }
                }
                host.moduleCache.delete(remote.name);
            }
        }
        catch (err) {
            logger.log('removeRemote fail: ', err);
        }
    }
}

const USE_SNAPSHOT = typeof FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN === 'boolean'
    ? !FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN
    : true; // Default to true (use snapshot) when not explicitly defined
class ModuleFederation {
    constructor(userOptions) {
        this.hooks = new PluginSystem({
            beforeInit: new SyncWaterfallHook('beforeInit'),
            init: new SyncHook(),
            // maybe will change, temporarily for internal use only
            beforeInitContainer: new AsyncWaterfallHook('beforeInitContainer'),
            // maybe will change, temporarily for internal use only
            initContainer: new AsyncWaterfallHook('initContainer'),
        });
        this.version = "2.0.0";
        this.moduleCache = new Map();
        this.loaderHook = new PluginSystem({
            // FIXME: may not be suitable , not open to the public yet
            getModuleInfo: new SyncHook(),
            createScript: new SyncHook(),
            createLink: new SyncHook(),
            fetch: new AsyncHook(),
            loadEntryError: new AsyncHook(),
            getModuleFactory: new AsyncHook(),
        });
        this.bridgeHook = new PluginSystem({
            beforeBridgeRender: new SyncHook(),
            afterBridgeRender: new SyncHook(),
            beforeBridgeDestroy: new SyncHook(),
            afterBridgeDestroy: new SyncHook(),
        });
        const plugins = USE_SNAPSHOT
            ? [snapshotPlugin(), generatePreloadAssetsPlugin()]
            : [];
        // TODO: Validate the details of the options
        // Initialize options with default values
        const defaultOptions = {
            id: getBuilderId(),
            name: userOptions.name,
            plugins,
            remotes: [],
            shared: {},
            inBrowser: isBrowserEnv(),
        };
        this.name = userOptions.name;
        this.options = defaultOptions;
        this.snapshotHandler = new SnapshotHandler(this);
        this.sharedHandler = new SharedHandler(this);
        this.remoteHandler = new RemoteHandler(this);
        this.shareScopeMap = this.sharedHandler.shareScopeMap;
        this.registerPlugins([
            ...defaultOptions.plugins,
            ...(userOptions.plugins || []),
        ]);
        this.options = this.formatOptions(defaultOptions, userOptions);
    }
    initOptions(userOptions) {
        this.registerPlugins(userOptions.plugins);
        const options = this.formatOptions(this.options, userOptions);
        this.options = options;
        return options;
    }
    async loadShare(pkgName, extraOptions) {
        return this.sharedHandler.loadShare(pkgName, extraOptions);
    }
    // The lib function will only be available if the shared set by eager or runtime init is set or the shared is successfully loaded.
    // 1. If the loaded shared already exists globally, then it will be reused
    // 2. If lib exists in local shared, it will be used directly
    // 3. If the local get returns something other than Promise, then it will be used directly
    loadShareSync(pkgName, extraOptions) {
        return this.sharedHandler.loadShareSync(pkgName, extraOptions);
    }
    initializeSharing(shareScopeName = DEFAULT_SCOPE, extraOptions) {
        return this.sharedHandler.initializeSharing(shareScopeName, extraOptions);
    }
    initRawContainer(name, url, container) {
        const remoteInfo = getRemoteInfo({ name, entry: url });
        const module = new Module({ host: this, remoteInfo });
        module.remoteEntryExports = container;
        this.moduleCache.set(name, module);
        return module;
    }
    // eslint-disable-next-line max-lines-per-function
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async loadRemote(id, options) {
        return this.remoteHandler.loadRemote(id, options);
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async preloadRemote(preloadOptions) {
        return this.remoteHandler.preloadRemote(preloadOptions);
    }
    initShareScopeMap(scopeName, shareScope, extraOptions = {}) {
        this.sharedHandler.initShareScopeMap(scopeName, shareScope, extraOptions);
    }
    formatOptions(globalOptions, userOptions) {
        const { allShareInfos: shared} = formatShareConfigs(globalOptions, userOptions);
        const { userOptions: userOptionsRes, options: globalOptionsRes } = this.hooks.lifecycle.beforeInit.emit({
            origin: this,
            userOptions,
            options: globalOptions,
            shareInfo: shared,
        });
        const remotes = this.remoteHandler.formatAndRegisterRemote(globalOptionsRes, userOptionsRes);
        const { allShareInfos } = this.sharedHandler.registerShared(globalOptionsRes, userOptionsRes);
        const plugins = [...globalOptionsRes.plugins];
        if (userOptionsRes.plugins) {
            userOptionsRes.plugins.forEach((plugin) => {
                if (!plugins.includes(plugin)) {
                    plugins.push(plugin);
                }
            });
        }
        const optionsRes = {
            ...globalOptions,
            ...userOptions,
            plugins,
            remotes,
            shared: allShareInfos,
        };
        this.hooks.lifecycle.init.emit({
            origin: this,
            options: optionsRes,
        });
        return optionsRes;
    }
    registerPlugins(plugins) {
        const pluginRes = registerPlugins(plugins, this);
        // Merge plugin
        this.options.plugins = this.options.plugins.reduce((res, plugin) => {
            if (!plugin)
                return res;
            if (res && !res.find((item) => item.name === plugin.name)) {
                res.push(plugin);
            }
            return res;
        }, pluginRes || []);
    }
    registerRemotes(remotes, options) {
        return this.remoteHandler.registerRemotes(remotes, options);
    }
    registerShared(shared) {
        this.sharedHandler.registerShared(this.options, {
            ...this.options,
            shared,
        });
    }
}

var index = /*#__PURE__*/Object.freeze({
    __proto__: null
});

export { CurrentGlobal, Global, Module, ModuleFederation, addGlobalSnapshot, assert, getGlobalFederationConstructor, getGlobalSnapshot, getInfoWithoutType, getRegisteredShare, getRemoteEntry, getRemoteInfo, helpers, isStaticResourcesEqual, matchRemoteWithNameAndExpose, registerGlobalPlugins, resetFederationGlobalInfo, safeWrapper, satisfy, setGlobalFederationConstructor, setGlobalFederationInstance, index as types };
//# sourceMappingURL=index.esm.js.map
