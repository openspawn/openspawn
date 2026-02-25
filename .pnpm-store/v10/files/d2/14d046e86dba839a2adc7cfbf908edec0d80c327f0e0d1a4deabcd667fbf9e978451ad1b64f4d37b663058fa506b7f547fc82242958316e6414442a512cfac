"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addGoWorkDependency = exports.createGoWork = exports.createGoMod = exports.parseGoList = exports.isGoWorkspace = exports.supportsGoWorkspace = exports.getGoModules = exports.getGoShortVersion = exports.getGoVersion = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const constants_1 = require("../constants");
const REGEXS = {
    import: /import\s+(?:(\w+)\s+)?"([^"]+)"|\(([\s\S]*?)\)/,
    use: /use\s+(\(([^)]*)\)|([^\n]*))/,
    version: /go(?<version>\S+) /,
};
/**
 * Retrieves the current Go version using its CLI.
 */
const getGoVersion = () => {
    const rawVersion = (0, child_process_1.execSync)('go version');
    if (rawVersion != null) {
        return REGEXS.version.exec(rawVersion.toString()).groups.version;
    }
    throw new Error('Cannot retrieve current Go version');
};
exports.getGoVersion = getGoVersion;
/**
 * Retrieves the current Go version without the patch number.
 */
const getGoShortVersion = () => {
    const [major, minor] = (0, exports.getGoVersion)().split('.');
    return `${major}.${minor}`;
};
exports.getGoShortVersion = getGoShortVersion;
/**
 * Executes the `go list -m -json` command in the
 * specified directory and returns the output as a string.
 *
 * @param cwd the current working directory where the command should be executed.
 * @param failSilently if true, the function will return an empty string instead of throwing an error when the command fails.
 * @returns The output of the `go list -m -json` command as a string.
 * @throws Will throw an error if the command fails and `failSilently` is false.
 */
const getGoModules = (cwd, failSilently) => {
    try {
        return (0, child_process_1.execSync)('go list -m -json', {
            encoding: 'utf-8',
            cwd,
            stdio: ['ignore'],
            windowsHide: true,
        });
    }
    catch (error) {
        if (failSilently) {
            return '';
        }
        else {
            throw error;
        }
    }
};
exports.getGoModules = getGoModules;
/**
 * Checks if the current Go version supports workspaces.
 */
const supportsGoWorkspace = () => {
    const toNumbers = (s) => s.split('.').map((v) => parseInt(v) || 0);
    const [major, minor] = toNumbers((0, exports.getGoVersion)());
    const [miniMajor, miniMinor] = toNumbers(constants_1.GO_WORK_MINIMUM_VERSION);
    return major > miniMajor || (major === miniMajor && minor >= miniMinor);
};
exports.supportsGoWorkspace = supportsGoWorkspace;
/**
 * Checks if the current project uses a Go multi-modules workspace.
 *
 * @param tree the project tree
 */
const isGoWorkspace = (tree) => tree.exists(constants_1.GO_WORK_FILE);
exports.isGoWorkspace = isGoWorkspace;
/**
 * Parses a Go list (also support list with only one item).
 *
 * @param listType type of list to parse
 * @param content list to parse as a string
 */
const parseGoList = (listType, content) => {
    var _a, _b, _c;
    const exec = REGEXS[listType].exec(content);
    return ((_c = (_b = ((_a = exec === null || exec === void 0 ? void 0 : exec[2]) !== null && _a !== void 0 ? _a : exec === null || exec === void 0 ? void 0 : exec[3])) === null || _b === void 0 ? void 0 : _b.trim().split(/\n+/).map((line) => line.trim())) !== null && _c !== void 0 ? _c : []);
};
exports.parseGoList = parseGoList;
/**
 * Creates a go.mod file in the project.
 *
 * @param tree the project tree
 * @param name the module name
 * @param folder the project folder
 */
const createGoMod = (tree, name, folder) => {
    const filePath = folder ? (0, path_1.join)(folder, constants_1.GO_MOD_FILE) : constants_1.GO_MOD_FILE;
    if (!tree.exists(filePath)) {
        tree.write(filePath, `module ${name}\n\ngo ${(0, exports.getGoShortVersion)()}\n`);
    }
};
exports.createGoMod = createGoMod;
/**
 * Creates a go.work file in the project.
 *
 * @param tree the project tree
 */
const createGoWork = (tree) => {
    if (!tree.exists(constants_1.GO_WORK_FILE)) {
        tree.write(constants_1.GO_WORK_FILE, `go ${(0, exports.getGoShortVersion)()}\n`);
    }
};
exports.createGoWork = createGoWork;
/**
 * Adds a dependency to the go.work file.
 *
 * @param tree the project tree
 * @param projectRoot root of the dependency to add
 */
const addGoWorkDependency = (tree, projectRoot) => {
    const goWorkContent = tree.read(constants_1.GO_WORK_FILE).toString();
    const exisitingModules = (0, exports.parseGoList)('use', goWorkContent);
    const modules = [...new Set([...exisitingModules, `./${projectRoot}`])].sort((m1, m2) => m1.localeCompare(m2));
    if (modules.every((m) => exisitingModules.includes(m))) {
        return;
    }
    const use = modules.length > 1
        ? 'use (\n' + modules.map((m) => `\t${m}\n`).join('') + ')'
        : `use ${modules[0]}`;
    tree.write(constants_1.GO_WORK_FILE, exisitingModules.length > 0
        ? goWorkContent.replace(REGEXS['use'], use)
        : `${goWorkContent}\n${use}\n`);
};
exports.addGoWorkDependency = addGoWorkDependency;
//# sourceMappingURL=go-bridge.js.map