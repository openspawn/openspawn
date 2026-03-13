import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/guides/webhooks.mdx"));

export function Webhooks() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
