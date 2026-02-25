export declare class FederatedLinkUrl {
    readonly identity: string;
    readonly name: string | null;
    readonly version: string | null;
    private readonly major;
    private readonly minor;
    constructor(identity: string, name: string | null, version: string | null);
    toString(): string;
    static fromUrl: (urlSource: string) => FederatedLinkUrl;
    supports(version: string): boolean;
    supports(major: number, minor: number): boolean;
    supports(version: FederatedLinkUrl): boolean;
    supports(version: null): boolean;
    private isCompatibleVersion;
}
//# sourceMappingURL=link-url.d.ts.map