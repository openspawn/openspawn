import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/architecture/integrations.mdx"));

export function Integrations() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
