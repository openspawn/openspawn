import type { TSESLint } from '@typescript-eslint/utils';
type ESLintRules = Record<string, TSESLint.RuleModule<string, unknown[]>>;
/**
 * Load ESLint rules from a directory.
 *
 * This utility allows loading custom ESLint rules from any directory within the workspace,
 * not just the default `tools/eslint-rules` location. It's useful for:
 * - Loading rules from a custom directory structure
 * - Loading rules from npm workspace packages (e.g., linked packages via npm/yarn/pnpm workspaces)
 * - Loading rules from multiple directories with different configurations
 *
 * The directory must contain an index file (index.ts, index.js, etc.) that exports the rules.
 *
 * @param directory - The directory path to load rules from. Can be absolute or relative to workspace root.
 * @param tsConfigPath - Optional path to tsconfig.json for TypeScript compilation.
 *                       If not provided, will search for tsconfig.json starting from
 *                       the directory and traversing up to the workspace root.
 * @returns An object containing the loaded ESLint rules (without any prefix).
 *          Returns an empty object if the directory doesn't exist or loading fails.
 *
 * @example
 * ```typescript
 * // Load rules from a custom directory (relative to workspace root)
 * const customRules = await loadWorkspaceRules('packages/my-eslint-plugin/rules');
 *
 * // Load rules with a specific tsconfig
 * const customRules = await loadWorkspaceRules(
 *   'packages/my-eslint-plugin/rules',
 *   'packages/my-eslint-plugin/tsconfig.json'
 * );
 *
 * // Or use absolute paths
 * const customRules = loadWorkspaceRules('/absolute/path/to/rules');
 * ```
 */
export declare function loadWorkspaceRules(directory: string, tsConfigPath?: string): Promise<ESLintRules>;
export declare const workspaceRules: ESLintRules;
export {};
//# sourceMappingURL=resolve-workspace-rules.d.ts.map