import { DocumentNode } from "graphql";
import { FederatedLinkImport } from "./link-import.js";
import { FederatedLinkUrl } from "./link-url.js";
export declare class FederatedLink {
    private readonly _url;
    private readonly _as;
    private readonly _imports;
    constructor(_url: FederatedLinkUrl, _as: string | null, _imports: FederatedLinkImport[]);
    static fromTypedefs(typeDefs: DocumentNode): FederatedLink[];
    private get namespace();
    toString(): string;
    private get defaultImport();
    get identity(): string;
    supports(version: string): boolean;
    supports(major: number, minor: number): boolean;
    supports(version: FederatedLinkUrl): boolean;
    supports(version: null): boolean;
    resolveImportName(elementName: string): string;
    get imports(): readonly FederatedLinkImport[];
}
//# sourceMappingURL=link.d.ts.map