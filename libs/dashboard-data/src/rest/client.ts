import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";
import { getSandboxUrl } from "../lib/sandbox-url";

export const api = createClient<paths>({
  baseUrl: `${getSandboxUrl()}/api`,
});
