import { ConstDirectiveNode } from "graphql";
export type Link = ReturnType<typeof parseLink>;
export type LinkImport = ReturnType<typeof parseLink>["imports"][number];
export declare function printLink(link: Link): string;
export declare function parseLinkUrl(urlString: string): {
    name: null;
    version: null;
    identity: string;
} | {
    name: string;
    version: string;
    identity: string;
} | {
    name: null;
    version: string;
    identity: string;
} | {
    name: string;
    version: null;
    identity: string;
};
export declare function parseLinkImport(importString: string): ({
    readonly kind: "type" | "directive";
    readonly name: string;
    readonly alias?: undefined;
} | {
    readonly kind: "type" | "directive";
    readonly name: string;
    readonly alias: string;
})[];
export declare function mergeLinks(links: readonly Link[]): readonly Link[];
export declare function parseLink(urlString: string, importString: string): {
    name: string | null;
    version: string | null;
    identity: string;
    imports: ({
        readonly kind: "type" | "directive";
        readonly name: string;
        readonly alias?: undefined;
    } | {
        readonly kind: "type" | "directive";
        readonly name: string;
        readonly alias: string;
    })[];
};
export declare function parseLinkDirective(directive: ConstDirectiveNode): {
    name: string | null;
    version: string | null;
    identity: string;
    imports: ({
        readonly kind: "type" | "directive";
        readonly name: string;
        readonly alias?: undefined;
    } | {
        readonly kind: "type" | "directive";
        readonly name: string;
        readonly alias: string;
    })[];
} | null;
export declare const sdl = "\n  directive @link(\n    url: String\n    as: String\n    for: link__Purpose\n    import: [link__Import]\n  ) repeatable on SCHEMA\n\n  scalar link__Import\n\n  enum link__Purpose {\n    \"\"\"\n    `SECURITY` features provide metadata necessary to securely resolve fields.\n    \"\"\"\n    SECURITY\n\n    \"\"\"\n    `EXECUTION` features provide metadata necessary for operation execution.\n    \"\"\"\n    EXECUTION\n  }\n";
//# sourceMappingURL=link.d.ts.map