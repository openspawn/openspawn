import { Suspense, type ReactNode } from "react";
import { MDXProvider } from "@mdx-js/react";
import { mdxComponents } from "@openspawn/docs-ui";
import { DocsLayout } from "./docs-layout";

interface MdxDocPageProps {
  children: ReactNode;
}

export function MdxDocPage({ children }: MdxDocPageProps) {
  return (
    <MDXProvider components={mdxComponents}>
      <DocsLayout>
        <Suspense fallback={<div className="text-slate-500">Loading...</div>}>{children}</Suspense>
      </DocsLayout>
    </MDXProvider>
  );
}
