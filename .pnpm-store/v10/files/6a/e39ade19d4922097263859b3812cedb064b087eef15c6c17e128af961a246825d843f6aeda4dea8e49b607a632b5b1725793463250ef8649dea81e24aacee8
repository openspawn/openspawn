"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseWrapperPlugin_1 = __importDefault(require("./BaseWrapperPlugin"));
const PLUGIN_NAME = 'FederationRuntimePlugin';
class FederationRuntimePlugin extends BaseWrapperPlugin_1.default {
    constructor(options) {
        super(options, PLUGIN_NAME, '../lib/container/runtime/FederationRuntimePlugin');
        this.entryFilePath = '';
    }
    createCorePluginInstance(CorePlugin, compiler) {
        const pluginInstance = new CorePlugin(this._options);
        pluginInstance.apply(compiler);
        this.entryFilePath = pluginInstance.entryFilePath;
    }
}
exports.default = FederationRuntimePlugin;
//# sourceMappingURL=FederationRuntimePlugin.js.map