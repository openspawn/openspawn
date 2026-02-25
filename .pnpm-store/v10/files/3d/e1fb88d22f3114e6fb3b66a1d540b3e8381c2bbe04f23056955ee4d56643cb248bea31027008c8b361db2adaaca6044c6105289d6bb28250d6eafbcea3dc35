import { type Tree } from '@nx/devkit';
export type GoListType = 'import' | 'use';
/**
 * Retrieves the current Go version using its CLI.
 */
export declare const getGoVersion: () => string;
/**
 * Retrieves the current Go version without the patch number.
 */
export declare const getGoShortVersion: () => string;
/**
 * Executes the `go list -m -json` command in the
 * specified directory and returns the output as a string.
 *
 * @param cwd the current working directory where the command should be executed.
 * @param failSilently if true, the function will return an empty string instead of throwing an error when the command fails.
 * @returns The output of the `go list -m -json` command as a string.
 * @throws Will throw an error if the command fails and `failSilently` is false.
 */
export declare const getGoModules: (cwd: string, failSilently: boolean) => string;
/**
 * Checks if the current Go version supports workspaces.
 */
export declare const supportsGoWorkspace: () => boolean;
/**
 * Checks if the current project uses a Go multi-modules workspace.
 *
 * @param tree the project tree
 */
export declare const isGoWorkspace: (tree: Tree) => boolean;
/**
 * Parses a Go list (also support list with only one item).
 *
 * @param listType type of list to parse
 * @param content list to parse as a string
 */
export declare const parseGoList: (listType: GoListType, content: string) => string[];
/**
 * Creates a go.mod file in the project.
 *
 * @param tree the project tree
 * @param name the module name
 * @param folder the project folder
 */
export declare const createGoMod: (tree: Tree, name: string, folder?: string) => void;
/**
 * Creates a go.work file in the project.
 *
 * @param tree the project tree
 */
export declare const createGoWork: (tree: Tree) => void;
/**
 * Adds a dependency to the go.work file.
 *
 * @param tree the project tree
 * @param projectRoot root of the dependency to add
 */
export declare const addGoWorkDependency: (tree: Tree, projectRoot: string) => void;
