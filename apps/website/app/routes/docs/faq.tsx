import { lazy } from "react";
import { MdxDocPage } from "../../components/mdx-provider";

const Content = lazy(() => import("../../../content/docs/faq.mdx"));

export function Faq() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
