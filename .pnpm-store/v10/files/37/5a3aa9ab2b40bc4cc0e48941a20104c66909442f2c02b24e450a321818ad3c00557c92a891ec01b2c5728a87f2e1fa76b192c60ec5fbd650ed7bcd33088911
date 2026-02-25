import { parse, print } from "graphql";
import { addDirectiveOnTypes, getReachableTypes, } from "./reachable-type-filter.js";
import { transformSupergraphToPublicSchema } from "../graphql/transform-supergraph-to-public-schema.js";
export const addInaccessibleToUnreachableTypes = (resolveName, compositionResult) => {
    const inaccessibleDirectiveName = resolveName("https://specs.apollo.dev/inaccessible", "@inaccessible");
    const federationTypes = new Set([
        resolveName("https://specs.apollo.dev/join", "FieldSet"),
        resolveName("https://specs.apollo.dev/join", "Graph"),
        resolveName("https://specs.apollo.dev/link", "Import"),
        resolveName("https://specs.apollo.dev/link", "Purpose"),
        resolveName("https://specs.apollo.dev/federation", "Policy"),
        resolveName("https://specs.apollo.dev/federation", "Scope"),
        resolveName("https://specs.apollo.dev/join", "DirectiveArguments"),
    ]);
    const reachableTypeNames = getReachableTypes(parse(compositionResult.publicSdl));
    for (const federationType of federationTypes) {
        reachableTypeNames.add(federationType);
    }
    const supergraphSDL = addDirectiveOnTypes({
        documentNode: parse(compositionResult.supergraphSdl),
        excludedTypeNames: reachableTypeNames,
        directiveName: inaccessibleDirectiveName,
    });
    return {
        supergraphSdl: print(supergraphSDL),
        publicSdl: print(transformSupergraphToPublicSchema(supergraphSDL)),
    };
};
