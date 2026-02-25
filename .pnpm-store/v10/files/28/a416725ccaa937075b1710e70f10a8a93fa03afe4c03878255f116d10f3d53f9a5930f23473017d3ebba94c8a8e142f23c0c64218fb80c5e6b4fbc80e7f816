"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseWrapperPlugin_1 = __importDefault(require("./BaseWrapperPlugin"));
const PLUGIN_NAME = 'FederationModulesPlugin';
class FederationModulesPlugin extends BaseWrapperPlugin_1.default {
    constructor() {
        super({}, PLUGIN_NAME, '../lib/container/runtime/FederationModulesPlugin');
    }
    static getCompilationHooks(compilation) {
        const CoreFederationModulesPlugin = require('../lib/container/runtime/FederationModulesPlugin')
            .default;
        return CoreFederationModulesPlugin.getCompilationHooks(compilation);
    }
    createCorePluginInstance(CorePlugin, compiler) {
        new CorePlugin().apply(compiler);
    }
}
exports.default = FederationModulesPlugin;
//# sourceMappingURL=FederationModulesPlugin.js.map