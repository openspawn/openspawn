import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/reference/scenario-engine.mdx"));

export function ScenarioEngine() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
