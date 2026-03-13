import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/reference/agent-config-compat.mdx"));

export function AgentConfigCompat() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
