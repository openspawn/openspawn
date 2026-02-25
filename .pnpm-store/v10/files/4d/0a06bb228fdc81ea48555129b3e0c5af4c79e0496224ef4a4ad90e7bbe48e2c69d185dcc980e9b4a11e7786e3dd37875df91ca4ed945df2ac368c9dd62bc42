"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Plugin = void 0;
/**
 * Base Plugin Class
 *
 * Set of utilities for developing plugins.
 */
class Plugin {
  static version = 1;
  constructor(config, options) {
    this.version = Plugin.version;
    this.config = config;
    this.options = options;
  }
  getVersion() {
    return this.version;
  }
}

// --- STORAGE PLUGIN ---

/**
 * Storage Handler
 *
 * Used in storage plugin for managing packages and tarballs.
 */

/**
 * Storage Plugin interface
 *
 * https://verdaccio.org/docs/next/plugin-storage
 */

// --- MIDDLEWARE PLUGIN ---

/**
 * Middleware Plugin Interface
 *
 * https://verdaccio.org/docs/next/plugin-middleware
 *
 * This function allow add middleware to the application.
 *
 *  ```ts
 *  import express, { Request, Response } from 'express';
 * 
 *  class Middleware extends Plugin {
 *    // instances of auth and storage are injected
 *    register_middlewares(app, auth, storage) {
 *      const router = express.Router();
 *      router.post('/my-endpoint', (req: Request, res: Response): void => {
        res.status(200).end();
      });
 *    }
 *  }
 *
 *  const [plugin] = await asyncLoadPlugin(...);
 *  plugin.register_middlewares(app, auth, storage);
 *  ```
 */

// --- AUTH PLUGIN ---

/**
 * Authentication Plugin Interface
 *
 * https://verdaccio.org/docs/next/plugin-auth
 */

// --- FILTER PLUGIN ---

/**
 * Filter Plugin Interface
 *
 * https://verdaccio.org/docs/next/plugin-filter
 */
exports.Plugin = Plugin;
//# sourceMappingURL=plugin-utils.js.map