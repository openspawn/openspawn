"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCopyPlugin = createCopyPlugin;
const CopyWebpackPlugin = require("copy-webpack-plugin");
function createCopyPlugin(assets) {
    return new CopyWebpackPlugin({
        patterns: assets.map((asset) => {
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
    });
}
