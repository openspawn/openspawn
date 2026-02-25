import { Kind, } from "graphql";
import JSON5 from "json5";
import { print } from "../graphql/printer.js";
export function printLink(link) {
    return print({
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "link",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "url",
                },
                value: {
                    kind: Kind.STRING,
                    value: [link.identity, link.version].filter(Boolean).join("/"),
                },
            },
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "import",
                },
                value: {
                    kind: Kind.LIST,
                    values: link.imports.map((im) => {
                        if (!im.alias) {
                            return {
                                kind: Kind.STRING,
                                value: im.name,
                            };
                        }
                        return {
                            kind: Kind.OBJECT,
                            fields: [
                                {
                                    kind: Kind.OBJECT_FIELD,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "name",
                                    },
                                    value: {
                                        kind: Kind.STRING,
                                        value: im.name,
                                    },
                                },
                                {
                                    kind: Kind.OBJECT_FIELD,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "as",
                                    },
                                    value: {
                                        kind: Kind.STRING,
                                        value: im.alias,
                                    },
                                },
                            ],
                        };
                    }),
                },
            },
        ],
    });
}
export function parseLinkUrl(urlString) {
    const url = new URL(urlString);
    const parts = url.pathname.split("/").filter(Boolean);
    const len = parts.length;
    if (!len) {
        return { name: null, version: null, identity: url.origin };
    }
    const last = parts[len - 1];
    const secondLast = parts[len - 2];
    const potentiallyNameAndVersion = typeof secondLast === "string";
    if (potentiallyNameAndVersion) {
        return {
            name: secondLast,
            version: last,
            identity: url.origin +
                "/" +
                parts
                    .slice(0, len - 2)
                    .concat(secondLast)
                    .join("/"),
        };
    }
    if (/^v\d+/i.test(last)) {
        return {
            name: null,
            version: last,
            identity: url.origin,
        };
    }
    return {
        name: last,
        version: null,
        identity: url.origin +
            "/" +
            parts
                .slice(0, len - 2)
                .concat(last)
                .join("/"),
    };
}
export function parseLinkImport(importString) {
    try {
        const bindings = JSON5.parse(importString);
        if (!Array.isArray(bindings)) {
            throw new Error(`Expected an array`);
        }
        return bindings.map((binding) => {
            if (typeof binding === "string") {
                return {
                    kind: binding.startsWith("@") ? "directive" : "type",
                    name: binding,
                };
            }
            if (typeof binding === "object" && binding.name) {
                const nameKind = binding.name.startsWith("@") ? "directive" : "type";
                if (!binding.as) {
                    return {
                        kind: nameKind,
                        name: binding.name,
                    };
                }
                const aliasKind = binding.as.startsWith("@") ? "directive" : "type";
                if (nameKind !== aliasKind) {
                    throw new Error(`${binding.name} and ${binding.as} must be of the same kind`);
                }
                return {
                    kind: nameKind,
                    name: binding.name,
                    alias: binding.as,
                };
            }
            throw new Error(`Syntax`);
        });
    }
    catch (error) {
        throw new Error(`Invalid import binding: ${importString}: ${String(error)}`);
    }
}
export function mergeLinks(links) {
    const groupByIdentity = new Map();
    for (const link of links) {
        const existing = groupByIdentity.get(link.identity);
        if (!existing) {
            const importedDirectives = link.imports.filter((im) => im.kind === "directive");
            if (importedDirectives.length === 0) {
                continue;
            }
            groupByIdentity.set(link.identity, {
                name: link.name,
                highestVersion: link.version ?? "",
                imports: link.imports.filter((im) => im.kind === "directive"),
            });
        }
        else {
            if (link.version &&
                parseFloat(link.version.replace("v", "")) >
                    parseFloat(existing.highestVersion.replace("v", ""))) {
                existing.highestVersion = link.version;
            }
            for (const im of link.imports) {
                if (im.kind === "type") {
                    continue;
                }
                const hasImport = existing.imports.some((existingIm) => existingIm.kind === im.kind && existingIm.name === im.name);
                if (!hasImport) {
                    existing.imports.push(im);
                }
            }
            if (link.name) {
                existing.name = link.name;
            }
        }
    }
    return Array.from(groupByIdentity.entries()).map(([identity, link]) => ({
        identity,
        version: link.highestVersion,
        imports: Array.from(link.imports).map((link) => ({
            kind: link.kind,
            name: link.name,
            alias: link.alias,
        })),
        name: link.name,
    }));
}
export function parseLink(urlString, importString) {
    const spec = parseLinkUrl(urlString);
    return {
        name: spec.name,
        version: spec.version,
        identity: spec.identity,
        imports: parseLinkImport(importString),
    };
}
export function parseLinkDirective(directive) {
    const urlArg = directive.arguments?.find(isUrlArgument);
    if (!urlArg) {
        return null;
    }
    const importArg = directive.arguments?.find(isImportArgument);
    const spec = parseLinkUrl(urlArg?.value.value);
    return {
        name: spec.name,
        version: spec.version,
        identity: spec.identity,
        imports: parseLinkImport(importArg ? print(importArg.value) : "[]"),
    };
}
function isUrlArgument(arg) {
    return arg.name.value === "url" && arg.value.kind === Kind.STRING;
}
function isImportArgument(arg) {
    return arg.name.value === "import" && arg.value.kind === Kind.LIST;
}
export const sdl = `
  directive @link(
    url: String
    as: String
    for: link__Purpose
    import: [link__Import]
  ) repeatable on SCHEMA

  scalar link__Import

  enum link__Purpose {
    """
    \`SECURITY\` features provide metadata necessary to securely resolve fields.
    """
    SECURITY

    """
    \`EXECUTION\` features provide metadata necessary for operation execution.
    """
    EXECUTION
  }
`;
