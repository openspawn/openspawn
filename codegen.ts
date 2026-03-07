import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.gql",
  documents: ["libs/dashboard-data/src/**/*.ts", "libs/dashboard-data/src/**/*.tsx"],
  ignoreNoDocuments: true,
  generates: {
    "libs/dashboard-data/src/graphql/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
        skipTypename: true,
        enumsAsTypes: false,
        scalars: {
          DateTime: "string",
          Date: "string",
        },
      },
    },
    "libs/dashboard-data/src/graphql/generated/hooks.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-react-query"],
      config: {
        fetcher: {
          func: "../fetcher#fetcher",
          isReactHook: false,
        },
        reactQueryVersion: 5,
        skipTypename: true,
        enumsAsTypes: false,
        exposeQueryKeys: true,
        exposeFetcher: true,
        scalars: {
          DateTime: "string",
          Date: "string",
        },
      },
    },
  },
};

export default config;
