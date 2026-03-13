import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/guides/troubleshooting.mdx"));

export function Troubleshooting() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
