import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/reference/api.mdx"));

export function ApiReference() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
