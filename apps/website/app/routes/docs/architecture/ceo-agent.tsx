import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/architecture/ceo-agent.mdx"));

export function CeoAgent() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
