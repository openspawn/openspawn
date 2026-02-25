export declare const FederationModuleManifest = "federation-manifest.json";
export declare const MANIFEST_EXT = ".json";
export declare const BROWSER_LOG_KEY = "FEDERATION_DEBUG";
export declare const NameTransformSymbol: {
    readonly AT: "@";
    readonly HYPHEN: "-";
    readonly SLASH: "/";
};
export declare const NameTransformMap: {
    readonly "@": "scope_";
    readonly "-": "_";
    readonly "/": "__";
};
export declare const EncodedNameTransformMap: {
    scope_: "@";
    _: "-";
    __: "/";
};
export declare const SEPARATOR = ":";
export declare const ManifestFileName = "mf-manifest.json";
export declare const StatsFileName = "mf-stats.json";
export declare const MFModuleType: {
    NPM: string;
    APP: string;
};
export declare const MODULE_DEVTOOL_IDENTIFIER = "__MF_DEVTOOLS_MODULE_INFO__";
export declare const ENCODE_NAME_PREFIX = "ENCODE_NAME_PREFIX";
export declare const TEMP_DIR = ".federation";
export declare const MFPrefetchCommon: {
    identifier: string;
    globalKey: string;
    library: string;
    exportsKey: string;
    fileName: string;
};
export declare const enum TreeShakingStatus {
    /**
     * Not handled by deploy server, needs to infer by the real runtime period.
     */
    UNKNOWN = 1,
    /**
     * It means the shared has been calculated , runtime should take this shared as first choice.
     */
    CALCULATED = 2,
    /**
     * It means the shared has been calculated, and marked as no used
     */
    NO_USE = 0
}
