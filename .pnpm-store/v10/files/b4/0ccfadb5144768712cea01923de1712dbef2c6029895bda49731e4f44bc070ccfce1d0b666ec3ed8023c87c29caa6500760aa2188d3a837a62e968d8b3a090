"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonLoadersForCssModules = getCommonLoadersForCssModules;
exports.getCommonLoadersForGlobalCss = getCommonLoadersForGlobalCss;
exports.getCommonLoadersForGlobalStyle = getCommonLoadersForGlobalStyle;
const path = require("path");
const autoprefixer = require("autoprefixer");
const postcssImports = require("postcss-import");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const get_css_module_local_ident_1 = require("../../../utils/get-css-module-local-ident");
const hash_format_1 = require("../../../utils/hash-format");
const postcss_cli_resources_1 = require("../../../utils/webpack/plugins/postcss-cli-resources");
function getCommonLoadersForCssModules(options, includePaths) {
    // load component css as raw strings
    return [
        {
            loader: options.extractCss
                ? MiniCssExtractPlugin.loader
                : require.resolve('style-loader'),
        },
        {
            loader: require.resolve('css-loader'),
            options: {
                modules: {
                    mode: 'local',
                    getLocalIdent: get_css_module_local_ident_1.getCSSModuleLocalIdent,
                },
                importLoaders: 1,
            },
        },
        {
            loader: require.resolve('postcss-loader'),
            options: {
                implementation: require('postcss'),
                postcssOptions: postcssOptionsCreator(options, {
                    includePaths,
                    forCssModules: true,
                }),
            },
        },
    ];
}
function getCommonLoadersForGlobalCss(options, includePaths) {
    return [
        {
            loader: options.extractCss
                ? MiniCssExtractPlugin.loader
                : require.resolve('style-loader'),
        },
        { loader: require.resolve('css-loader'), options: { url: false } },
        {
            loader: require.resolve('postcss-loader'),
            options: {
                implementation: require('postcss'),
                postcssOptions: postcssOptionsCreator(options, {
                    includePaths,
                }),
            },
        },
    ];
}
function getCommonLoadersForGlobalStyle(options, includePaths) {
    return [
        {
            loader: options.extractCss
                ? MiniCssExtractPlugin.loader
                : require.resolve('style-loader'),
            options: { esModule: true },
        },
        { loader: require.resolve('css-loader'), options: { url: false } },
        {
            loader: require.resolve('postcss-loader'),
            options: {
                implementation: require('postcss'),
                postcssOptions: postcssOptionsCreator(options, {
                    includePaths,
                }),
            },
        },
    ];
}
function postcssOptionsCreator(options, { includePaths, forCssModules = false, }) {
    const hashFormat = (0, hash_format_1.getOutputHashFormat)(options.outputHashing);
    // PostCSS options depend on the webpack loader, but we need to set the `config` path as a string due to this check:
    // https://github.com/webpack-contrib/postcss-loader/blob/0d342b1/src/utils.js#L36
    const postcssOptions = (loader) => ({
        map: options.sourceMap &&
            options.sourceMap !== 'hidden' && {
            inline: true,
            annotation: false,
        },
        plugins: [
            postcssImports({
                addModulesDirectories: includePaths,
                resolve: (url) => (url.startsWith('~') ? url.slice(1) : url),
            }),
            ...(forCssModules
                ? []
                : [
                    (0, postcss_cli_resources_1.PostcssCliResources)({
                        baseHref: options.baseHref ? options.baseHref : undefined,
                        deployUrl: options.deployUrl,
                        loader,
                        filename: `[name]${hashFormat.file}.[ext]`,
                        publicPath: options.publicPath,
                        rebaseRootRelative: options.rebaseRootRelative,
                    }),
                    autoprefixer(),
                ]),
        ],
    });
    // If a path to postcssConfig is passed in, set it for app and all libs, otherwise
    // use automatic detection.
    if (typeof options.postcssConfig === 'string') {
        postcssOptions.config = path.join(options.root, options.postcssConfig);
    }
    return postcssOptions;
}
