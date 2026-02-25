"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyBaseConfig = applyBaseConfig;
const path = require("path");
const license_webpack_plugin_1 = require("license-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack_1 = require("webpack");
const js_1 = require("@nx/js");
const stats_json_plugin_1 = require("../../stats-json-plugin");
const generate_package_json_plugin_1 = require("../../generate-package-json-plugin");
const hash_format_1 = require("../../../utils/hash-format");
const nx_tsconfig_paths_webpack_plugin_1 = require("../../nx-typescript-webpack-plugin/nx-tsconfig-paths-webpack-plugin");
const get_terser_ecma_version_1 = require("./get-terser-ecma-version");
const compiler_loaders_1 = require("./compiler-loaders");
const TerserPlugin = require("terser-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
const utils_1 = require("./utils");
const IGNORED_WEBPACK_WARNINGS = [
    /The comment file/i,
    /could not find any license/i,
];
const extensionAlias = {
    '.js': ['.ts', '.tsx', '.js', '.jsx'],
    '.mjs': ['.mts', '.mjs'],
    '.cjs': ['.cts', '.cjs'],
    '.jsx': ['.tsx', '.jsx'],
};
const extensions = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];
const mainFields = ['module', 'main'];
function applyBaseConfig(options, config = {}, { useNormalizedEntry, } = {}) {
    // Defaults that was applied from executor schema previously.
    options.compiler ??= 'babel';
    options.externalDependencies ??= 'all';
    options.fileReplacements ??= [];
    options.memoryLimit ??= 2048;
    options.transformers ??= [];
    applyNxIndependentConfig(options, config);
    // Some of the options only work during actual tasks, not when reading the webpack config during CreateNodes.
    if (global.NX_GRAPH_CREATION)
        return;
    applyNxDependentConfig(options, config, { useNormalizedEntry });
}
function applyNxIndependentConfig(options, config) {
    const hashFormat = (0, hash_format_1.getOutputHashFormat)(options.outputHashing);
    config.context = path.join(options.root, options.projectRoot);
    config.target ??= options.target;
    config.node = false;
    config.mode =
        // When the target is Node avoid any optimizations, such as replacing `process.env.NODE_ENV` with build time value.
        config.target === 'node'
            ? 'none'
            : // Otherwise, make sure it matches `process.env.NODE_ENV`.
                // When mode is development or production, webpack will automatically
                // configure DefinePlugin to replace `process.env.NODE_ENV` with the
                // build-time value. Thus, we need to make sure it's the same value to
                // avoid conflicts.
                //
                // When the NODE_ENV is something else (e.g. test), then set it to none
                // to prevent extra behavior from webpack.
                process.env.NODE_ENV === 'development' ||
                    process.env.NODE_ENV === 'production'
                    ? process.env.NODE_ENV
                    : 'none';
    // When target is Node, the Webpack mode will be set to 'none' which disables in memory caching and causes a full rebuild on every change.
    // So to mitigate this we enable in memory caching when target is Node and in watch mode.
    config.cache =
        'cache' in options
            ? options.cache
            : options.target === 'node' && options.watch
                ? { type: 'memory' }
                : undefined;
    config.devtool =
        options.sourceMap === true ? 'source-map' : options.sourceMap;
    config.output = {
        ...config.output,
        libraryTarget: (() => {
            const existingOutputConfig = config.output;
            const existingLibraryTarget = existingOutputConfig?.libraryTarget;
            const existingLibraryType = typeof existingOutputConfig?.library === 'object' &&
                'type' in existingOutputConfig?.library
                ? existingOutputConfig?.library?.type
                : undefined;
            // If user is using modern library.type, don't set the deprecated libraryTarget
            if (existingLibraryType !== undefined) {
                return undefined;
            }
            // If user has set libraryTarget explicitly, use it
            if (existingLibraryTarget !== undefined) {
                return existingLibraryTarget;
            }
            // Set defaults based on target when user hasn't configured anything
            if (options.target === 'node')
                return 'commonjs';
            if (options.target === 'async-node')
                return 'commonjs-module';
            return undefined;
        })(),
        path: config.output?.path ??
            (options.outputPath
                ? // If path is relative, it is relative from project root (aka cwd).
                    // Otherwise, it is relative to workspace root (legacy behavior).
                    options.outputPath.startsWith('.')
                        ? path.join(options.root, options.projectRoot, options.outputPath)
                        : path.join(options.root, options.outputPath)
                : undefined),
        filename: config.output?.filename ??
            (options.outputHashing ? `[name]${hashFormat.script}.js` : '[name].js'),
        chunkFilename: config.output?.chunkFilename ??
            (options.outputHashing ? `[name]${hashFormat.chunk}.js` : '[name].js'),
        hashFunction: config.output?.hashFunction ?? 'xxhash64',
        // Disabled for performance
        pathinfo: config.output?.pathinfo ?? false,
        // Use CJS for Node since it has the widest support.
        scriptType: config.output?.scriptType ??
            (options.target === 'node' ? undefined : 'module'),
    };
    config.watch = options.watch;
    config.watchOptions = {
        poll: options.poll,
    };
    config.profile = options.statsJson;
    config.performance = {
        ...config.performance,
        hints: false,
    };
    config.experiments = { ...config.experiments, cacheUnaffected: true };
    config.ignoreWarnings = [
        (x) => IGNORED_WEBPACK_WARNINGS.some((r) => typeof x === 'string' ? r.test(x) : r.test(x.message)),
        ...(config.ignoreWarnings ?? []),
    ];
    config.optimization = {
        ...config.optimization,
        sideEffects: true,
        minimize: typeof options.optimization === 'object'
            ? !!options.optimization.scripts
            : !!options.optimization,
        minimizer: [
            options.compiler !== 'swc'
                ? new TerserPlugin({
                    parallel: true,
                    terserOptions: {
                        keep_classnames: true,
                        ecma: (0, get_terser_ecma_version_1.getTerserEcmaVersion)(path.join(options.root, options.projectRoot)),
                        safari10: true,
                        format: {
                            ascii_only: true,
                            comments: false,
                            webkit: true,
                        },
                    },
                    extractComments: false,
                })
                : new TerserPlugin({
                    minify: TerserPlugin.swcMinify,
                    // `terserOptions` options will be passed to `swc`
                    terserOptions: {
                        module: true,
                        mangle: false,
                    },
                }),
        ],
        runtimeChunk: false,
        concatenateModules: true,
    };
    config.stats = {
        hash: true,
        timings: false,
        cached: false,
        cachedAssets: false,
        modules: false,
        warnings: true,
        errors: true,
        colors: !options.verbose && !options.statsJson,
        chunks: !!options.verbose,
        assets: !!options.verbose,
        chunkOrigins: !!options.verbose,
        chunkModules: !!options.verbose,
        children: !!options.verbose,
        reasons: !!options.verbose,
        version: !!options.verbose,
        errorDetails: !!options.verbose,
        moduleTrace: !!options.verbose,
        usedExports: !!options.verbose,
    };
    /**
     * Initialize properties that get set when webpack is used during task execution.
     * These properties may be used by consumers who expect them to not be undefined.
     *
     * When @nx/webpack/plugin resolves the config, it is not during a task, and therefore
     * these values are not set, which can lead to errors being thrown when reading
     * the webpack options from the resolved file.
     */
    config.entry ??= {};
    config.resolve ??= {};
    config.module ??= {};
    config.plugins ??= [];
    config.externals ??= [];
}
function applyNxDependentConfig(options, config, { useNormalizedEntry } = {}) {
    const tsConfig = options.tsConfig ?? (0, js_1.getRootTsConfigPath)();
    const plugins = [];
    const executorContext = {
        projectName: options.projectName,
        targetName: options.targetName,
        projectGraph: options.projectGraph,
        configurationName: options.configurationName,
        root: options.root,
    };
    const isUsingTsSolution = (0, ts_solution_setup_1.isUsingTsSolutionSetup)();
    options.useTsconfigPaths ??= !isUsingTsSolution;
    // If the project is using ts solutions setup, the paths are not in tsconfig and we should not use the plugin's paths.
    if (options.useTsconfigPaths) {
        plugins.push(new nx_tsconfig_paths_webpack_plugin_1.NxTsconfigPathsWebpackPlugin({ ...options, tsConfig }));
    }
    // Normalize typeCheckOptions from deprecated skipTypeChecking for backward compatibility
    const defaultTypeCheckOptions = { async: true };
    let typeCheckOptions;
    if (options.typeCheckOptions !== undefined) {
        if (options.typeCheckOptions === true) {
            typeCheckOptions = defaultTypeCheckOptions;
        }
        else if (options.typeCheckOptions === false) {
            typeCheckOptions = false;
        }
        else {
            typeCheckOptions = options.typeCheckOptions;
        }
    }
    else if (options.skipTypeChecking) {
        typeCheckOptions = false;
    }
    else {
        typeCheckOptions = defaultTypeCheckOptions;
    }
    // New TS Solution already has a typecheck target but allow it to run during serve
    const shouldTypeCheck = typeCheckOptions !== false &&
        (!isUsingTsSolution || process.env['WEBPACK_SERVE']);
    if (shouldTypeCheck) {
        const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
        plugins.push(new ForkTsCheckerWebpackPlugin({
            ...typeCheckOptions,
            typescript: {
                configFile: path.isAbsolute(tsConfig)
                    ? tsConfig
                    : path.join(options.root, tsConfig),
                memoryLimit: options.memoryLimit || 2018,
            },
        }));
    }
    const entries = [];
    if (options.main) {
        const mainEntry = options.outputFileName
            ? path.parse(options.outputFileName).name
            : 'main';
        entries.push({
            name: mainEntry,
            import: [path.resolve(options.root, options.main)],
        });
    }
    if (options.additionalEntryPoints) {
        for (const { entryName, entryPath } of options.additionalEntryPoints) {
            entries.push({
                name: entryName,
                import: [path.resolve(options.root, entryPath)],
            });
        }
    }
    if (options.polyfills) {
        entries.push({
            name: 'polyfills',
            import: [path.resolve(options.root, options.polyfills)],
        });
    }
    config.entry ??= {};
    entries.forEach((entry) => {
        if (useNormalizedEntry) {
            config.entry[entry.name] = { import: entry.import };
        }
        else {
            config.entry[entry.name] = entry.import;
        }
    });
    if (options.progress) {
        plugins.push(new webpack_1.ProgressPlugin({ profile: options.verbose }));
    }
    if (options.extractLicenses) {
        plugins.push(new license_webpack_plugin_1.LicenseWebpackPlugin({
            stats: {
                warnings: false,
                errors: false,
            },
            perChunkOutput: false,
            outputFilename: `3rdpartylicenses.txt`,
        }));
    }
    if (Array.isArray(options.assets) && options.assets.length > 0) {
        plugins.push(new CopyWebpackPlugin({
            patterns: options.assets.map((asset) => {
                return {
                    context: asset.input,
                    // Now we remove starting slash to make Webpack place it from the output root.
                    to: asset.output,
                    from: asset.glob,
                    globOptions: {
                        ignore: [
                            '.gitkeep',
                            '**/.DS_Store',
                            '**/Thumbs.db',
                            ...(asset.ignore ?? []),
                        ],
                        dot: true,
                    },
                };
            }),
        }));
    }
    if (options.generatePackageJson && executorContext) {
        plugins.push(new generate_package_json_plugin_1.GeneratePackageJsonPlugin({ ...options, tsConfig }));
    }
    if (options.statsJson) {
        plugins.push(new stats_json_plugin_1.StatsJsonPlugin());
    }
    const externals = options.mergeExternals && Array.isArray(config.externals)
        ? [...config.externals]
        : [];
    if (options.target === 'node' && options.externalDependencies === 'all') {
        const modulesDir = `${options.root}/node_modules`;
        const graph = options.projectGraph;
        const projectName = options.projectName;
        // Collect non-buildable TS project references so that they are bundled
        // in the final output. This is needed for projects that are not buildable
        // but are referenced by buildable projects.
        const nonBuildableWorkspaceLibs = isUsingTsSolution
            ? (0, utils_1.getNonBuildableLibs)(graph, projectName)
            : [];
        externals.push(nodeExternals({ modulesDir, allowlist: nonBuildableWorkspaceLibs }));
    }
    else if (Array.isArray(options.externalDependencies)) {
        externals.push(function (ctx, callback) {
            if (options.externalDependencies.includes(ctx.request)) {
                // not bundled
                return callback(null, `commonjs ${ctx.request}`);
            }
            // bundled
            callback();
        });
    }
    config.resolve = {
        ...config.resolve,
        extensions: [...(config?.resolve?.extensions ?? []), ...extensions],
        extensionAlias: {
            ...(config.resolve?.extensionAlias ?? {}),
            ...extensionAlias,
        },
        alias: {
            ...(config.resolve?.alias ?? {}),
            ...(options.fileReplacements?.reduce((aliases, replacement) => ({
                ...aliases,
                [replacement.replace]: replacement.with,
            }), {}) ?? {}),
        },
        mainFields: config.resolve?.mainFields ?? mainFields,
    };
    config.externals = externals;
    config.module = {
        ...config.module,
        // Enabled for performance
        unsafeCache: true,
        rules: [
            ...(config?.module?.rules ?? []),
            options.sourceMap && {
                test: /\.js$/,
                enforce: 'pre',
                loader: require.resolve('source-map-loader'),
            },
            {
                // There's an issue resolving paths without fully specified extensions
                // See: https://github.com/graphql/graphql-js/issues/2721
                // TODO(jack): Add a flag to turn this option on like Next.js does via experimental flag.
                // See: https://github.com/vercel/next.js/pull/29880
                test: /\.m?jsx?$/,
                resolve: {
                    fullySpecified: false,
                },
            },
            // There's an issue when using buildable libs and .js files (instead of .ts files),
            // where the wrong type is used (commonjs vs esm) resulting in export-imports throwing errors.
            // See: https://github.com/nrwl/nx/issues/10990
            {
                test: /\.js$/,
                type: 'javascript/auto',
            },
            (0, compiler_loaders_1.createLoaderFromCompiler)(options),
        ].filter((r) => !!r),
    };
    config.plugins ??= [];
    config.plugins.push(...plugins);
}
