import {
  RpcGMCallTypes,
  exposeRpc,
  generateTypes
} from "./chunk-RWXNVNFM.js";
import "./chunk-WWV5RWOP.js";
import {
  __async,
  __name
} from "./chunk-647HGGGS.js";

// src/core/lib/forkGenerateDts.ts
function forkGenerateDts(options) {
  return __async(this, null, function* () {
    return generateTypes(options);
  });
}
__name(forkGenerateDts, "forkGenerateDts");
process.on("message", (message) => {
  if (message.type === RpcGMCallTypes.EXIT) {
    process.exit(0);
  }
});
exposeRpc(forkGenerateDts);
export {
  forkGenerateDts
};
