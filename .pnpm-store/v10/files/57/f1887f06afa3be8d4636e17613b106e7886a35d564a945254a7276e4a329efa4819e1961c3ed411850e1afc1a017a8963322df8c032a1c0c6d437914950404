"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitUntilServerIsListening = waitUntilServerIsListening;
const net = require("net");
function waitUntilServerIsListening(port) {
    const allowedErrorCodes = ['ECONNREFUSED', 'ECONNRESET'];
    const maxAttempts = 25;
    let attempts = 0;
    const client = new net.Socket();
    const cleanup = () => {
        client.removeAllListeners('connect');
        client.removeAllListeners('error');
        client.end();
        client.destroy();
        client.unref();
    };
    return new Promise((resolve, reject) => {
        const listen = () => {
            client.once('connect', () => {
                cleanup();
                resolve();
            });
            client.on('error', (err) => {
                if (attempts > maxAttempts ||
                    !allowedErrorCodes.includes(err['code'])) {
                    cleanup();
                    reject(err);
                }
                else {
                    attempts++;
                    setTimeout(listen, 100 * attempts);
                }
            });
            client.connect({ port, host: 'localhost' });
        };
        listen();
    });
}
