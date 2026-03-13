import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/reference/acp.mdx"));

export function AcpSpec() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
