import { ConfigYaml } from '@verdaccio/types';
/**
 * Exposes a server factory to be instantiated programmatically.
 *
    const app = await runServer(); // default configuration
    const app = await runServer('./config/config.yaml');
    const app = await runServer({ configuration });
    app.listen(4000, (event) => {
      // do something
    });
 * @param config
 */
export declare function runServer(config?: string | ConfigYaml, options?: {
    listenArg?: string;
}): Promise<any>;
/**
 * Return a native HTTP/HTTPS server instance
 * @param config
 * @param addr
 * @param app
 */
export declare function createServerFactory(config: ConfigYaml, addr: any, app: any): any;
