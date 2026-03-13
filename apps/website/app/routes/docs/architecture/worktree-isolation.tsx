import { lazy } from "react";
import { MdxDocPage } from "../../../components/mdx-provider";

const Content = lazy(() => import("../../../../content/docs/architecture/worktree-isolation.mdx"));

export function WorktreeIsolation() {
  return (
    <MdxDocPage>
      <Content />
    </MdxDocPage>
  );
}
