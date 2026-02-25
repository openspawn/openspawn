"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCSSModuleLocalIdent = getCSSModuleLocalIdent;
const path_1 = require("path");
const loader_utils_1 = require("loader-utils");
function getCSSModuleLocalIdent(ctx, localIdentName, localName, options) {
    // Use the filename or folder name, based on some uses the index.js / index.module.(css|scss|sass) project style
    const fileNameOrFolder = ctx.resourcePath.match(/index\.module\.(css|scss|sass)$/)
        ? '[folder]'
        : '[name]';
    // Create a hash based on a the file location and class name. Will be unique across a project, and close to globally unique.
    const hash = (0, loader_utils_1.getHashDigest)(path_1.posix.relative(ctx.rootContext, ctx.resourcePath) + localName, 'md5', 'base64', 5);
    // Use loaderUtils to find the file or folder name
    const className = (0, loader_utils_1.interpolateName)(ctx, `${fileNameOrFolder}_${localName}__${hash}`, options);
    // Remove the .module that appears in every classname when based on the file and replace all "." with "_".
    return className.replace('.module_', '_').replace(/\./g, '_');
}
