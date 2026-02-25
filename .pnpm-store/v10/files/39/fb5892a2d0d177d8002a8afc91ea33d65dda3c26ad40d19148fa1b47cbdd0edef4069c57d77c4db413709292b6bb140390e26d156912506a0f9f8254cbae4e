import { Config } from '@verdaccio/types';
import { $NextFunctionVer, $RequestExtend, $ResponseExtend } from '../types';
/**
 * A middleware that avoid a registry points itself as proxy and avoid create infinite loops.
 * @param config
 * @returns
 */
export declare function antiLoop(config: Config): (req: $RequestExtend, res: $ResponseExtend, next: $NextFunctionVer) => void;
