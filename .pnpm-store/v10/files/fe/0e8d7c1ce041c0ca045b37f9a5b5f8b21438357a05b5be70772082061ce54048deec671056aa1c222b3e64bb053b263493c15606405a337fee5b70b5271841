"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyWebConfig = applyWebConfig;
const path = require("path");
const webpack_subresource_integrity_1 = require("webpack-subresource-integrity");
const webpack_1 = require("webpack");
const write_index_html_plugin_1 = require("../../write-index-html-plugin");
const hash_format_1 = require("../../../utils/hash-format");
const get_client_environment_1 = require("../../../utils/get-client-environment");
const normalize_entry_1 = require("../../../utils/webpack/normalize-entry");
const stylesheet_loaders_1 = require("./stylesheet-loaders");
const instantiate_script_plugins_1 = require("./instantiate-script-plugins");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
function applyWebConfig(options, config = {}, { useNormalizedEntry, } = {}) {
    if (global.NX_GRAPH_CREATION)
        return;
    // Defaults that was applied from executor schema previously.
    options.runtimeChunk ??= true; // need this for HMR and other things to work
    options.extractCss ??= true;
    options.generateIndexHtml ??= true;
    options.styles ??= [];
    options.scripts ??= [];
    const plugins = [];
    const stylesOptimization = typeof options.optimization === 'object'
        ? options.optimization.styles
        : options.optimization;
    if (Array.isArray(options.scripts)) {
        plugins.push(...(0, instantiate_script_plugins_1.instantiateScriptPlugins)(options));
    }
    if (options.index && options.generateIndexHtml) {
        plugins.push(new write_index_html_plugin_1.WriteIndexHtmlPlugin({
            crossOrigin: options.crossOrigin,
            sri: options.subresourceIntegrity,
            outputPath: path.basename(options.index),
            indexPath: path.join(options.root, options.index),
            baseHref: options.baseHref !== false ? options.baseHref : undefined,
            deployUrl: options.deployUrl,
            scripts: options.scripts,
            styles: options.styles,
        }));
    }
    if (options.subresourceIntegrity) {
        plugins.push(new webpack_subresource_integrity_1.SubresourceIntegrityPlugin());
    }
    const minimizer = [new webpack_1.ids.HashedModuleIdsPlugin()];
    if (stylesOptimization) {
        minimizer.push(new CssMinimizerPlugin({
            test: /\.(?:css|scss|sass|less)$/,
        }));
    }
    if (!options.ssr) {
        plugins.push(new webpack_1.DefinePlugin((0, get_client_environment_1.getClientEnvironment)(process.env.NODE_ENV).stringified));
    }
    const entries = {};
    const globalStylePaths = [];
    // Determine hashing format.
    const hashFormat = (0, hash_format_1.getOutputHashFormat)(options.outputHashing);
    const sassOptions = options.stylePreprocessorOptions?.sassOptions;
    const lessOptions = options.stylePreprocessorOptions?.lessOptions;
    const includePaths = [];
    if (options?.stylePreprocessorOptions?.includePaths?.length > 0) {
        options.stylePreprocessorOptions.includePaths.forEach((includePath) => includePaths.push(path.resolve(options.root, includePath)));
    }
    let lessPathOptions = {};
    if (includePaths.length > 0) {
        lessPathOptions = {
            paths: includePaths,
        };
    }
    // Process global styles.
    if (options.styles.length > 0) {
        (0, normalize_entry_1.normalizeExtraEntryPoints)(options.styles, 'styles').forEach((style) => {
            const resolvedPath = style.input.startsWith('.')
                ? style.input
                : path.resolve(options.root, style.input);
            // Add style entry points.
            if (entries[style.bundleName]) {
                entries[style.bundleName].import.push(resolvedPath);
            }
            else {
                entries[style.bundleName] = { import: [resolvedPath] };
            }
            // Add global css paths.
            globalStylePaths.push(resolvedPath);
        });
    }
    const cssModuleRules = [
        {
            test: /\.module\.css$/,
            exclude: globalStylePaths,
            use: (0, stylesheet_loaders_1.getCommonLoadersForCssModules)(options, includePaths),
        },
        {
            test: /\.module\.(scss|sass)$/,
            exclude: globalStylePaths,
            use: [
                ...(0, stylesheet_loaders_1.getCommonLoadersForCssModules)(options, includePaths),
                {
                    loader: require.resolve('sass-loader'),
                    options: {
                        api: 'modern-compiler',
                        implementation: require.resolve('sass-embedded'),
                        sassOptions: {
                            fiber: false,
                            precision: 8,
                            loadPaths: includePaths,
                            ...(sassOptions ?? {}),
                        },
                    },
                },
            ],
        },
        {
            test: /\.module\.less$/,
            exclude: globalStylePaths,
            use: [
                ...(0, stylesheet_loaders_1.getCommonLoadersForCssModules)(options, includePaths),
                {
                    loader: require.resolve('less-loader'),
                    options: {
                        lessOptions: {
                            paths: includePaths,
                            ...(lessOptions ?? {}),
                        },
                    },
                },
            ],
        },
    ];
    const globalCssRules = [
        {
            test: /\.css$/,
            exclude: globalStylePaths,
            use: (0, stylesheet_loaders_1.getCommonLoadersForGlobalCss)(options, includePaths),
        },
        {
            test: /\.scss$|\.sass$/,
            exclude: globalStylePaths,
            use: [
                ...(0, stylesheet_loaders_1.getCommonLoadersForGlobalCss)(options, includePaths),
                {
                    loader: require.resolve('sass-loader'),
                    options: {
                        api: 'modern-compiler',
                        implementation: require.resolve('sass-embedded'),
                        sourceMap: !!options.sourceMap,
                        sassOptions: {
                            fiber: false,
                            // bootstrap-sass requires a minimum precision of 8
                            precision: 8,
                            loadPaths: includePaths,
                            ...(sassOptions ?? {}),
                        },
                    },
                },
            ],
        },
        {
            test: /\.less$/,
            exclude: globalStylePaths,
            use: [
                ...(0, stylesheet_loaders_1.getCommonLoadersForGlobalCss)(options, includePaths),
                {
                    loader: require.resolve('less-loader'),
                    options: {
                        sourceMap: !!options.sourceMap,
                        lessOptions: {
                            javascriptEnabled: true,
                            ...lessPathOptions,
                            ...(lessOptions ?? {}),
                        },
                    },
                },
            ],
        },
    ];
    const globalStyleRules = [
        {
            test: /\.css$/,
            include: globalStylePaths,
            use: (0, stylesheet_loaders_1.getCommonLoadersForGlobalStyle)(options, includePaths),
        },
        {
            test: /\.scss$|\.sass$/,
            include: globalStylePaths,
            use: [
                ...(0, stylesheet_loaders_1.getCommonLoadersForGlobalStyle)(options, includePaths),
                {
                    loader: require.resolve('sass-loader'),
                    options: {
                        api: 'modern-compiler',
                        implementation: require.resolve('sass-embedded'),
                        sourceMap: !!options.sourceMap,
                        sassOptions: {
                            fiber: false,
                            // bootstrap-sass requires a minimum precision of 8
                            precision: 8,
                            loadPaths: includePaths,
                            ...(sassOptions ?? {}),
                        },
                    },
                },
            ],
        },
        {
            test: /\.less$/,
            include: globalStylePaths,
            use: [
                ...(0, stylesheet_loaders_1.getCommonLoadersForGlobalStyle)(options, includePaths),
                {
                    loader: require.resolve('less-loader'),
                    options: {
                        sourceMap: !!options.sourceMap,
                        lessOptions: {
                            javascriptEnabled: true,
                            ...lessPathOptions,
                            ...(lessOptions ?? {}),
                        },
                    },
                },
            ],
        },
    ];
    const rules = [
        {
            test: /\.css$|\.scss$|\.sass$|\.less$/,
            oneOf: [...cssModuleRules, ...globalCssRules, ...globalStyleRules],
        },
    ];
    if (options.extractCss) {
        plugins.push(
        // extract global css from js files into own css file
        new MiniCssExtractPlugin({
            filename: `[name]${hashFormat.extract}.css`,
        }));
    }
    config.output = {
        ...config.output,
        assetModuleFilename: '[name].[contenthash:20][ext]',
        crossOriginLoading: options.subresourceIntegrity
            ? 'anonymous'
            : false,
    };
    // In case users customize their webpack config with unsupported entry.
    if (typeof config.entry === 'function')
        throw new Error('Entry function is not supported. Use an object.');
    if (typeof config.entry === 'string')
        throw new Error('Entry string is not supported. Use an object.');
    if (Array.isArray(config.entry))
        throw new Error('Entry array is not supported. Use an object.');
    Object.entries(entries).forEach(([entryName, entryData]) => {
        if (useNormalizedEntry) {
            config.entry[entryName] = { import: entryData.import };
        }
        else {
            config.entry[entryName] = entryData.import;
        }
    });
    config.optimization = {
        ...config.optimization,
        minimizer: [...config.optimization.minimizer, ...minimizer],
        emitOnErrors: false,
        moduleIds: 'deterministic',
        runtimeChunk: options.runtimeChunk ? { name: 'runtime' } : false,
        splitChunks: {
            defaultSizeTypes: config.optimization.splitChunks !== false
                ? config.optimization.splitChunks?.defaultSizeTypes
                : ['...'],
            maxAsyncRequests: Infinity,
            cacheGroups: {
                default: !!options.commonChunk && {
                    chunks: 'async',
                    minChunks: 2,
                    priority: 10,
                },
                common: !!options.commonChunk && {
                    name: 'common',
                    chunks: 'async',
                    minChunks: 2,
                    enforce: true,
                    priority: 5,
                },
                vendors: false,
                vendor: !!options.vendorChunk && {
                    name: 'vendor',
                    chunks: (chunk) => chunk.name === 'main',
                    enforce: true,
                    test: /[\\/]node_modules[\\/]/,
                },
            },
        },
    };
    config.resolve.mainFields = ['browser', 'module', 'main'];
    config.module = {
        ...config.module,
        rules: [
            ...(config.module.rules ?? []),
            // Images: Inline small images, and emit a separate file otherwise (including SVGs).
            {
                test: /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10_000, // 10 kB
                    },
                },
            },
            // Fonts: Emit separate file and export the URL.
            {
                test: /\.(eot|otf|ttf|woff|woff2)$/,
                type: 'asset/resource',
            },
            ...rules,
        ],
    };
    config.plugins ??= [];
    config.plugins.push(...plugins);
}
