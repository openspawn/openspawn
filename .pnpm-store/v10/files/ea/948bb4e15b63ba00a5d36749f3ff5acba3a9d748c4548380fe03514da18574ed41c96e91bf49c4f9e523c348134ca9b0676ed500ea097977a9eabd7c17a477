/// <reference types="node" />
import type { IncomingHttpHeaders } from 'node:http';
/**
 * Check if URI is starting with "http://", "https://" or "//"
 * @param {string} uri
 */
export declare function isURLhasValidProtocol(uri: string): boolean;
export declare function isHost(url?: string, options?: {}): boolean;
/**
 * Detect running protocol (http or https)
 */
export declare function getWebProtocol(headerProtocol: string | undefined, protocol: string): string;
export declare function wrapPrefix(prefix: string | void): string;
/**
 * Create base url for registry.
 * @return {String} base registry url
 */
export declare function combineBaseUrl(protocol: string, host: string, prefix?: string): string;
export declare function validateURL(publicUrl: string | void): boolean;
export type RequestOptions = {
    /**
     * Request host.
     */
    host: string;
    /**
     * Request protocol.
     */
    protocol: string;
    /**
     * Request headers.
     */
    headers: IncomingHttpHeaders;
    remoteAddress?: string;
    /**
     * Logged username the request, usually after token verification.
     */
    username?: string;
};
export declare function getPublicUrl(url_prefix: string | undefined, requestOptions: RequestOptions): string;
export declare const isURL: typeof import("validator/lib/isURL").default;
