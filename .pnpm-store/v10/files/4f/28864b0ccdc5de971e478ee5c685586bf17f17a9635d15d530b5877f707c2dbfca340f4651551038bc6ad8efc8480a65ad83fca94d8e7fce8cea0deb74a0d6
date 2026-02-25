import type { NxWebpackExecutionContext } from '../../utils/config';
import type { NxAppWebpackPluginOptions } from '../nx-webpack-plugin/nx-app-webpack-plugin-options';
import type { Compiler, Configuration } from 'webpack';
/**
 * This function is used to wrap the legacy plugin function to be used with the `composePlugins` function.
 * Initially the webpack config would be passed to the legacy plugin function and the options would be passed as a second argument.
 * example:
 * module.exports = composePlugins(
      withNx(),
      (config) => {
        return config;
      }
  );

Since composePlugins is async, this function is used to wrap the legacy plugin function to be async.
Using the nxUseLegacyPlugin function, the first argument is the legacy plugin function and the second argument is the options.
The context options are created and passed to the legacy plugin function.

module.exports = async () => ({
  plugins: [
  ...otherPlugins,
    await nxUseLegacyPlugin(require({path}), options),
  ],
});
 * @param fn The legacy plugin function usually from `combinedPlugins`
 * @param executorOptions The options passed usually inside the executor or the config file
 * @returns Webpack configuration
 */
export declare function useLegacyNxPlugin(fn: (config: Configuration, ctx: NxWebpackExecutionContext) => Promise<Configuration>, executorOptions: NxAppWebpackPluginOptions): Promise<{
    apply(compiler: Compiler): void;
}>;
//# sourceMappingURL=use-legacy-nx-plugin.d.ts.map