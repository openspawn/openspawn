"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULE_NAME = void 0;
const devkit_1 = require("@nx/devkit");
const catalog_1 = require("@nx/devkit/src/utils/catalog");
const find_npm_dependencies_1 = require("@nx/js/src/utils/find-npm-dependencies");
const utils_1 = require("@typescript-eslint/utils");
const path_1 = require("path");
const semver_1 = require("semver");
const package_json_utils_1 = require("../utils/package-json-utils");
const project_graph_utils_1 = require("../utils/project-graph-utils");
const runtime_lint_utils_1 = require("../utils/runtime-lint-utils");
const WORKSPACE_VERSION_WILDCARD = 'workspace:*';
exports.RULE_NAME = 'dependency-checks';
exports.default = utils_1.ESLintUtils.RuleCreator(() => `https://github.com/nrwl/nx/blob/${devkit_1.NX_VERSION}/docs/generated/packages/eslint-plugin/documents/dependency-checks.md`)({
    name: exports.RULE_NAME,
    meta: {
        type: 'suggestion',
        docs: {
            description: `Checks dependencies in project's package.json for version mismatches`,
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    buildTargets: { type: 'array', items: { type: 'string' } },
                    ignoredDependencies: { type: 'array', items: { type: 'string' } },
                    ignoredFiles: { type: 'array', items: { type: 'string' } },
                    checkMissingDependencies: { type: 'boolean' },
                    checkObsoleteDependencies: { type: 'boolean' },
                    checkVersionMismatches: { type: 'boolean' },
                    includeTransitiveDependencies: { type: 'boolean' },
                    useLocalPathsForWorkspaceDependencies: { type: 'boolean' },
                    runtimeHelpers: { type: 'array', items: { type: 'string' } },
                    peerDepsVersionStrategy: {
                        type: 'string',
                        enum: ['installed', 'workspace'],
                        description: 'Strategy for peer dependency versions. "installed" uses versions from root package.json (default). "workspace" uses workspace:* for all peer dependencies to ensure version synchronization in integrated monorepos.',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            missingDependency: `The "{{projectName}}" project uses the following packages, but they are missing from "{{section}}":{{packageNames}}`,
            obsoleteDependency: `The "{{packageName}}" package is not used by "{{projectName}}" project.`,
            versionMismatch: `The version specifier does not contain the installed version of "{{packageName}}" package: {{version}}.`,
            missingDependencySection: `Dependency sections are missing from the "package.json" but following dependencies were detected:{{dependencies}}`,
            invalidCatalogReference: `Invalid catalog reference for "{{packageName}}": {{error}}`,
        },
    },
    defaultOptions: [
        {
            buildTargets: ['build'],
            checkMissingDependencies: true,
            checkObsoleteDependencies: true,
            checkVersionMismatches: true,
            ignoredDependencies: [],
            ignoredFiles: [],
            includeTransitiveDependencies: false,
            useLocalPathsForWorkspaceDependencies: false,
            runtimeHelpers: [],
            peerDepsVersionStrategy: 'installed',
        },
    ],
    create(context, [{ buildTargets, ignoredDependencies, ignoredFiles, checkMissingDependencies, checkObsoleteDependencies, checkVersionMismatches, includeTransitiveDependencies, useLocalPathsForWorkspaceDependencies, runtimeHelpers, peerDepsVersionStrategy = 'installed', },]) {
        if (!(0, runtime_lint_utils_1.getParserServices)(context).isJSON) {
            return {};
        }
        const fileName = (0, devkit_1.normalizePath)(context.filename ?? context.getFilename());
        // support only package.json
        if (!fileName.endsWith('/package.json')) {
            return {};
        }
        const sourceFilePath = (0, runtime_lint_utils_1.getSourceFilePath)(fileName, devkit_1.workspaceRoot);
        const { projectGraph, projectRootMappings, projectFileMap } = (0, project_graph_utils_1.readProjectGraph)(exports.RULE_NAME);
        if (!projectGraph) {
            return {};
        }
        const sourceProject = (0, runtime_lint_utils_1.findProject)(projectGraph, projectRootMappings, sourceFilePath);
        // check if source project exists
        if (!sourceProject) {
            return {};
        }
        // check if library has a build target
        const buildTarget = buildTargets.find((t) => sourceProject.data.targets?.[t]);
        if (!buildTarget) {
            return {};
        }
        const rootPackageJson = (0, package_json_utils_1.getPackageJson)((0, path_1.join)(devkit_1.workspaceRoot, 'package.json'));
        const npmDependencies = (0, find_npm_dependencies_1.findNpmDependencies)(devkit_1.workspaceRoot, sourceProject, projectGraph, projectFileMap, buildTarget, // TODO: What if child library has a build target different from the parent?
        {
            includeTransitiveDependencies,
            ignoredFiles,
            useLocalPathsForWorkspaceDependencies,
            runtimeHelpers,
        });
        const expectedDependencyNames = Object.keys(npmDependencies);
        const packageJson = JSON.parse(context.sourceCode.getText());
        const projPackageJsonDeps = (0, package_json_utils_1.getProductionDependencies)(packageJson);
        const rootPackageJsonDeps = (0, package_json_utils_1.getAllDependencies)(rootPackageJson);
        function getDependencySection(node) {
            // Check if this node is a dependency section itself
            const directSection = node.key?.value;
            if (['dependencies', 'peerDependencies', 'optionalDependencies'].includes(directSection)) {
                return directSection;
            }
            // Otherwise, traverse up to find the parent section
            const sectionProp = node.parent?.parent;
            return sectionProp?.key?.value;
        }
        function validateMissingDependencies(node) {
            if (!checkMissingDependencies) {
                return;
            }
            const missingDeps = expectedDependencyNames.filter((d) => !projPackageJsonDeps[d] && !ignoredDependencies.includes(d));
            if (missingDeps.length) {
                const dependencySection = getDependencySection(node);
                context.report({
                    node: node,
                    messageId: 'missingDependency',
                    data: {
                        packageNames: missingDeps.map((d) => `\n    - ${d}`).join(''),
                        section: node.key.value,
                        projectName: sourceProject.name,
                    },
                    fix(fixer) {
                        missingDeps.forEach((d) => {
                            if (dependencySection === 'peerDependencies' &&
                                peerDepsVersionStrategy === 'workspace') {
                                projPackageJsonDeps[d] = WORKSPACE_VERSION_WILDCARD;
                            }
                            else {
                                projPackageJsonDeps[d] =
                                    rootPackageJsonDeps[d] || npmDependencies[d];
                            }
                        });
                        const deps = node.value.properties;
                        const mappedDeps = missingDeps
                            .map((d) => `\n    "${d}": "${projPackageJsonDeps[d]}"`)
                            .join(',');
                        if (deps.length) {
                            return fixer.insertTextAfter(deps[deps.length - 1], `,${mappedDeps}`);
                        }
                        else {
                            return fixer.insertTextAfterRange([node.value.range[0] + 1, node.value.range[1] - 1], `${mappedDeps}\n  `);
                        }
                    },
                });
            }
        }
        function validateCatalogReferenceForPackage(node, packageName, packageRange) {
            const manager = (0, catalog_1.getCatalogManager)(devkit_1.workspaceRoot);
            if (!manager) {
                return;
            }
            if (!manager.isCatalogReference(packageRange)) {
                return;
            }
            try {
                manager.validateCatalogReference(devkit_1.workspaceRoot, packageName, packageRange);
            }
            catch (error) {
                context.report({
                    node: node,
                    messageId: 'invalidCatalogReference',
                    data: {
                        packageName: packageName,
                        error: error.message,
                    },
                });
            }
        }
        function validateVersionMatchesInstalled(node, packageName, packageRange) {
            if (!checkVersionMismatches)
                return;
            const dependencySection = getDependencySection(node);
            if (dependencySection === 'peerDependencies' &&
                peerDepsVersionStrategy === 'workspace' &&
                !packageRange.startsWith('workspace:')) {
                context.report({
                    node: node,
                    messageId: 'versionMismatch',
                    data: { packageName, version: WORKSPACE_VERSION_WILDCARD },
                    fix: (fixer) => fixer.replaceText(node, `"${packageName}": "${WORKSPACE_VERSION_WILDCARD}"`),
                });
                return;
            }
            // Resolve catalog references before validation
            let resolvedPackageRange = packageRange;
            const manager = (0, catalog_1.getCatalogManager)(devkit_1.workspaceRoot);
            if (manager?.isCatalogReference(packageRange)) {
                const resolved = manager.resolveCatalogReference(devkit_1.workspaceRoot, packageName, packageRange);
                if (!resolved) {
                    // Catalog resolution failed - this shouldn't happen because
                    // validateCatalogReferenceForPackage should have caught it earlier
                    // But if it does, skip validation gracefully
                    return;
                }
                resolvedPackageRange = resolved;
            }
            if (npmDependencies[packageName].startsWith('file:') ||
                resolvedPackageRange.startsWith('file:') ||
                npmDependencies[packageName] === '*' ||
                resolvedPackageRange === '*' ||
                resolvedPackageRange.startsWith('workspace:') ||
                (0, semver_1.satisfies)(npmDependencies[packageName], resolvedPackageRange, {
                    includePrerelease: true,
                })) {
                return;
            }
            context.report({
                node: node,
                messageId: 'versionMismatch',
                data: {
                    packageName: packageName,
                    version: npmDependencies[packageName],
                },
                fix: (fixer) => fixer.replaceText(node, `"${packageName}": "${rootPackageJsonDeps[packageName] || npmDependencies[packageName]}"`),
            });
        }
        function reportObsoleteDependency(node, packageName) {
            if (!checkObsoleteDependencies) {
                return;
            }
            context.report({
                node: node,
                messageId: 'obsoleteDependency',
                data: { packageName: packageName, projectName: sourceProject.name },
                fix: (fixer) => {
                    const isLastProperty = node.parent.properties[node.parent.properties.length - 1] === node;
                    const index = node.parent.properties.findIndex((n) => n === node);
                    if (index > 0) {
                        const previousNode = node.parent.properties[index - 1];
                        return fixer.removeRange([
                            previousNode.range[1] + (isLastProperty ? 0 : 1),
                            node.range[1] + (isLastProperty ? 0 : 1),
                        ]);
                    }
                    else {
                        const parent = node.parent;
                        // it's the only property
                        if (isLastProperty) {
                            return fixer.removeRange([
                                parent.range[0] + 1,
                                parent.range[1] - 1,
                            ]);
                        }
                        else {
                            return fixer.removeRange([
                                parent.range[0] + 1,
                                node.range[1] + 1,
                            ]);
                        }
                    }
                },
            });
        }
        function validateDependenciesSectionExistance(node) {
            if (!expectedDependencyNames.length ||
                !expectedDependencyNames.some((d) => !ignoredDependencies.includes(d))) {
                return;
            }
            if (!node.properties ||
                !node.properties.some((p) => ['dependencies', 'peerDependencies', 'optionalDependencies'].includes(p.key.value))) {
                context.report({
                    node: node,
                    messageId: 'missingDependencySection',
                    data: {
                        dependencies: expectedDependencyNames
                            .map((d) => `\n- "${d}"`)
                            .join(),
                    },
                    fix: (fixer) => {
                        expectedDependencyNames.sort().reduce((acc, d) => {
                            acc[d] = rootPackageJsonDeps[d] || npmDependencies[d];
                            return acc;
                        }, projPackageJsonDeps);
                        const dependencies = Object.keys(projPackageJsonDeps)
                            .map((d) => `\n    "${d}": "${projPackageJsonDeps[d]}"`)
                            .join(',');
                        if (!node.properties.length) {
                            return fixer.replaceText(node, `{\n  "dependencies": {${dependencies}\n  }\n}`);
                        }
                        else {
                            return fixer.insertTextAfter(node.properties[node.properties.length - 1], `,\n  "dependencies": {${dependencies}\n  }`);
                        }
                    },
                });
            }
        }
        return {
            ['JSONExpressionStatement > JSONObjectExpression > JSONProperty[key.value=/^(peer|optional)?dependencies$/i]'](node) {
                validateMissingDependencies(node);
            },
            ['JSONExpressionStatement > JSONObjectExpression > JSONProperty[key.value=/^(peer|optional)?dependencies$/i] > JSONObjectExpression > JSONProperty'](node) {
                const packageName = node.key.value;
                const packageRange = node.value.value;
                if (ignoredDependencies.includes(packageName)) {
                    return;
                }
                validateCatalogReferenceForPackage(node, packageName, packageRange);
                if (expectedDependencyNames.includes(packageName)) {
                    validateVersionMatchesInstalled(node, packageName, packageRange);
                }
                else {
                    reportObsoleteDependency(node, packageName);
                }
            },
            ['JSONExpressionStatement > JSONObjectExpression'](node) {
                validateDependenciesSectionExistance(node);
            },
        };
    },
});
