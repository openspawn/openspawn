'use strict';

var runtimeCore = require('@module-federation/runtime-tools/runtime-core');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        for (var k in e) {
            n[k] = e[k];
        }
    }
    n.default = e;
    return Object.freeze(n);
}

var runtimeCore__namespace = /*#__PURE__*/_interopNamespaceDefault(runtimeCore);

function injectExternalRuntimeCorePlugin() {
    return {
        name: 'inject-external-runtime-core-plugin',
        version: "0.21.6",
        beforeInit(args) {
            const name = args.options.name;
            const version = "0.21.6";
            if (runtimeCore__namespace.Global._FEDERATION_RUNTIME_CORE &&
                runtimeCore__namespace.Global._FEDERATION_RUNTIME_CORE_FROM &&
                (runtimeCore__namespace.Global._FEDERATION_RUNTIME_CORE_FROM.name !== name ||
                    runtimeCore__namespace.Global._FEDERATION_RUNTIME_CORE_FROM.version !== version)) {
                console.warn(`Detect multiple module federation runtime! Injected runtime from ${runtimeCore__namespace.Global._FEDERATION_RUNTIME_CORE_FROM.name}@${runtimeCore__namespace.Global._FEDERATION_RUNTIME_CORE_FROM.version} and current is ${name}@${version}, pleasure ensure there is only one consumer to provider runtime!`);
                return args;
            }
            runtimeCore__namespace.Global._FEDERATION_RUNTIME_CORE = runtimeCore__namespace;
            runtimeCore__namespace.Global._FEDERATION_RUNTIME_CORE_FROM = {
                version,
                name,
            };
            return args;
        },
    };
}

module.exports = injectExternalRuntimeCorePlugin;
//# sourceMappingURL=index.cjs.cjs.map
