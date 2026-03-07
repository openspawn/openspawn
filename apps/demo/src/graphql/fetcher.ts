import { setDemoFetcher, setSandboxFetcher } from "@openspawn/dashboard-data";
import { demoFetcher } from "../demo/mock-fetcher";
import { sandboxFetcher } from "../demo/sandbox-fetcher";

// Register demo/sandbox fetchers with the data library
setDemoFetcher(demoFetcher);
setSandboxFetcher(sandboxFetcher);

export {
  fetcher,
  isDemoMode,
  isSandboxMode,
  graphqlClient,
  setDemoFetcher,
  setSandboxFetcher,
} from "@openspawn/dashboard-data";
