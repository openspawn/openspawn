import type { ProjectGraph, ProjectGraphProjectNode } from '@nx/devkit';
export declare function createAllowlistFromExports(packageName: string, exports: Record<string, any> | string | undefined): (string | RegExp)[];
/**
 * Check if the library is buildable.
 * @param node from the project graph
 * @returns boolean
 */
export declare function isBuildableLibrary(node: ProjectGraphProjectNode): boolean;
/**
 * Get all transitive dependencies of a target that are non-buildable libraries.
 * This function traverses the project graph to find all dependencies of a given target,
 * @param graph Graph of the project
 * @param targetName The project name to get dependencies for
 * @param visited Set to keep track of visited nodes to prevent infinite loops in circular dependencies
 * @returns string[] - List of all transitive dependencies that are non-buildable libraries
 */
export declare function getAllTransitiveDeps(graph: ProjectGraph, targetName: string, visited?: Set<string>): string[];
/**
 * Get all non-buildable libraries in the project graph for a given project.
 * This function retrieves all direct and transitive dependencies of a project,
 * filtering out only those that are libraries and not buildable.
 * @param graph Project graph
 * @param projectName The project name to get dependencies for
 * @returns A list of all non-buildable libraries that the project depends on, including transitive dependencies.
 */
export declare function getNonBuildableLibs(graph: ProjectGraph, projectName: string): (string | RegExp)[];
//# sourceMappingURL=utils.d.ts.map