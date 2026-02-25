import { Kind, } from "graphql";
import { FederatedLinkImport } from "./link-import.js";
import { FederatedLinkUrl } from "./link-url.js";
function linkFromCoreArgs(args) {
    const feature = args.find(({ name, value }) => name.value === "feature" && value.kind === Kind.STRING);
    if (feature) {
        const url = FederatedLinkUrl.fromUrl(feature.value.value);
        return new FederatedLink(url, null, []);
    }
    return;
}
function linkFromArgs(args) {
    let url, imports = [], as = null;
    for (const arg of args) {
        switch (arg.name.value) {
            case "url": {
                if (arg.value.kind === Kind.STRING) {
                    url = FederatedLinkUrl.fromUrl(arg.value.value);
                }
                else {
                    console.warn(`Unexpected kind, ${arg.value.kind}, for argument "url" in @link.`);
                }
                break;
            }
            case "import": {
                imports = FederatedLinkImport.fromTypedefs(arg.value);
                break;
            }
            case "as": {
                if (arg.value.kind === Kind.STRING) {
                    as = arg.value.value ?? null;
                }
                else {
                    console.warn(`Unexpected kind, ${arg.value.kind}, for argument "as" in @link.`);
                }
                break;
            }
            default: {
            }
        }
    }
    if (url !== undefined) {
        return new FederatedLink(url, as, imports);
    }
    return;
}
function namespaced(namespace, name) {
    if (namespace?.length) {
        if (name.startsWith("@")) {
            return `@${namespace}__${name.substring(1)}`;
        }
        return `${namespace}__${name}`;
    }
    return name;
}
export class FederatedLink {
    _url;
    _as;
    _imports;
    constructor(_url, _as, _imports) {
        this._url = _url;
        this._as = _as;
        this._imports = _imports;
    }
    static fromTypedefs(typeDefs) {
        let links = [];
        for (const definition of typeDefs.definitions) {
            if (definition.kind === Kind.SCHEMA_EXTENSION ||
                definition.kind === Kind.SCHEMA_DEFINITION) {
                const defLinks = definition.directives?.filter((directive) => directive.name.value === "link");
                const parsedLinks = defLinks
                    ?.map((l) => linkFromArgs(l.arguments ?? []))
                    .filter((l) => l !== undefined) ?? [];
                links = links.concat(parsedLinks);
                const defCores = definition.directives?.filter(({ name }) => name.value === "core");
                const coreLinks = defCores
                    ?.map((c) => linkFromCoreArgs(c.arguments ?? []))
                    .filter((l) => l !== undefined);
                if (coreLinks) {
                    links = links.concat(...coreLinks);
                }
            }
        }
        return links;
    }
    get namespace() {
        return this._as ?? this._url.name;
    }
    toString() {
        return `@link(url: "${this._url}"${this._as ? `, as: "${this._as}"` : ""}${this._imports.length ? `, import: [${this._imports.join(", ")}]` : ""})`;
    }
    get defaultImport() {
        return this.namespace && `@${this.namespace}`;
    }
    get identity() {
        return this._url.identity;
    }
    supports(...args) {
        return this._url.supports(...args);
    }
    resolveImportName(elementName) {
        if (this._url.name && elementName === `@${this._url.name}`) {
            return this.defaultImport.substring(1);
        }
        const imported = this._imports.find((i) => i.name === elementName);
        let resolvedName = imported?.as ?? imported?.name ?? namespaced(this.namespace, elementName);
        return resolvedName.startsWith("@")
            ? resolvedName.substring(1)
            : resolvedName;
    }
    get imports() {
        return this._imports;
    }
}
