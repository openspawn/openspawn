import { NormalizedNxAppWebpackPluginOptions } from '../nx-app-webpack-plugin-options';
export declare function createLoaderFromCompiler(options: NormalizedNxAppWebpackPluginOptions): {
    test: RegExp;
    loader: string;
    exclude: RegExp;
    options: {
        cwd: string;
        emitDecoratorMetadata: boolean;
        isModern: boolean;
        isTest: boolean;
        envName: string;
        cacheDirectory: boolean;
        cacheCompression: boolean;
    };
} | {
    test: RegExp;
    loader: string;
    exclude: RegExp;
    options: {
        jsc: {
            parser: {
                syntax: string;
                decorators: boolean;
                tsx: boolean;
            };
            transform: {
                legacyDecorator: boolean;
                decoratorMetadata: boolean;
                react: {
                    runtime: string;
                };
            };
            loose: boolean;
        };
        configFile?: undefined;
        transpileOnly?: undefined;
        experimentalWatchApi?: undefined;
        getCustomTransformers?: undefined;
    };
} | {
    test: RegExp;
    loader: string;
    exclude: RegExp;
    options: {
        configFile: string;
        transpileOnly: boolean;
        experimentalWatchApi: boolean;
        getCustomTransformers: (program: any) => {
            before: any;
            after: any;
            afterDeclarations: any;
        };
        jsc?: undefined;
    };
};
//# sourceMappingURL=compiler-loaders.d.ts.map