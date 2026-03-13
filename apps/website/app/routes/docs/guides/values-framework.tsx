import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/guides/values-framework.mdx"));

export function ValuesFramework() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
