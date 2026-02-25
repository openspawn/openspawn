import { $NextFunctionVer, $RequestExtend, $ResponseExtend } from '../types';
export declare const LOG_STATUS_MESSAGE = "@{status}, user: @{user}(@{remoteIP}), req: '@{request.method} @{request.url}'";
export declare const LOG_VERDACCIO_ERROR = "@{status}, user: @{user}(@{remoteIP}), req: '@{request.method} @{request.url}', error: @{!error}";
export declare const LOG_VERDACCIO_BYTES = "@{status}, user: @{user}(@{remoteIP}), req: '@{request.method} @{request.url}', bytes: @{bytes.in}/@{bytes.out}";
export declare const log: (logger: any) => (req: $RequestExtend, res: $ResponseExtend, next: $NextFunctionVer) => void;
