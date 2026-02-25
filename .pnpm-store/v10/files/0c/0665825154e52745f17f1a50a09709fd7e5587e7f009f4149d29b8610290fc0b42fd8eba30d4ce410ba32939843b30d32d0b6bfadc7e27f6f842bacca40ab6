import { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { RemoteUser } from '@verdaccio/types';
export type SignOptionsSignature = SignOptions;
export type VerifyOptionsSignature = VerifyOptions;
/**
 * Sign the payload and return JWT
 * https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
 * @param payload
 * @param secretOrPrivateKey
 * @param options
 */
export declare function signPayload(payload: RemoteUser, secretOrPrivateKey: string, options?: SignOptionsSignature): Promise<string>;
export declare function verifyPayload(token: string, secretOrPrivateKey: string, options?: VerifyOptionsSignature): RemoteUser;
