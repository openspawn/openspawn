import path from 'path';

const attribute = 'id';
const hookId = 'usePrefetch';
const importPackage = '@module-federation/data-prefetch/react';
var babel = (babel, options) => {
    const t = babel.types;
    let shouldHandle = false;
    let scope = '';
    const { name, exposes } = options;
    if (!exposes) {
        return {};
    }
    const exposesKey = Object.keys(exposes);
    const processedExposes = exposesKey.map((expose) => ({
        key: expose.replace('.', ''),
        value: path.resolve(typeof exposes[expose] === 'string'
            ?
                exposes[expose]
            :
                exposes[expose].import),
    }));
    return {
        visitor: {
            ImportDeclaration(nodePath, state) {
                const source = nodePath.node.source.value;
                const { specifiers } = nodePath.node;
                const { filename } = state.file.opts;
                if (source === importPackage) {
                    shouldHandle = specifiers.some((specifier) => specifier.imported &&
                        specifier.imported.name === hookId &&
                        processedExposes.find((expose) => expose.value === filename && (scope = expose.key)));
                }
            },
            CallExpression(nodePath) {
                if (shouldHandle &&
                    t.isIdentifier(nodePath.node.callee, { name: hookId }) &&
                    nodePath.node.arguments.length > 0) {
                    const objectExpression = nodePath.node.arguments[0];
                    if (objectExpression &&
                        t.isObjectExpression(objectExpression) &&
                        !objectExpression.properties.find((p) => p.key.name === attribute)) {
                        objectExpression.properties.push(t.objectProperty(t.identifier(attribute), t.stringLiteral(name + scope)));
                    }
                }
            },
        },
    };
};

export { babel as default };
//# sourceMappingURL=babel.esm.js.map
