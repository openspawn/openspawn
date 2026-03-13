import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/reference/event-driven-agents.mdx"));

export function EventDrivenAgents() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
