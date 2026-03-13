import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CodeBlock } from "./code-block";
import { Callout, CalloutVariant } from "./callout";

function Heading({
  level,
  children,
  id,
  ...props
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  id?: string;
} & ComponentPropsWithoutRef<"h1">) {
  const Tag = `h${level}` as const;
  const sizes: Record<number, string> = {
    1: "text-3xl font-bold mb-6 mt-8 text-white",
    2: "text-2xl font-semibold mb-4 mt-8 text-white",
    3: "text-xl font-semibold mb-3 mt-6 text-slate-200",
    4: "text-lg font-medium mb-2 mt-4 text-slate-200",
    5: "text-base font-medium mb-2 mt-4 text-slate-300",
    6: "text-sm font-medium mb-2 mt-4 text-slate-400",
  };

  return (
    <Tag id={id} className={sizes[level]} {...props}>
      {children}
    </Tag>
  );
}

function Pre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  // If the child is a <code> element with a className like "language-xxx",
  // extract the language and text for CodeBlock
  if (
    children &&
    typeof children === "object" &&
    "props" in children &&
    typeof children.props.children === "string"
  ) {
    const langMatch = (children.props.className as string | undefined)?.match(/language-(\w+)/);
    return <CodeBlock title={langMatch?.[1]}>{children.props.children}</CodeBlock>;
  }
  return (
    <pre
      className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-slate-300 my-4"
      {...props}
    >
      {children}
    </pre>
  );
}

function Blockquote({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) {
  return (
    <Callout variant={CalloutVariant.Info} className="my-4" {...props}>
      {children}
    </Callout>
  );
}

export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => <Heading level={1} {...props} />,
  h2: (props: ComponentPropsWithoutRef<"h2">) => <Heading level={2} {...props} />,
  h3: (props: ComponentPropsWithoutRef<"h3">) => <Heading level={3} {...props} />,
  h4: (props: ComponentPropsWithoutRef<"h4">) => <Heading level={4} {...props} />,
  h5: (props: ComponentPropsWithoutRef<"h5">) => <Heading level={5} {...props} />,
  h6: (props: ComponentPropsWithoutRef<"h6">) => <Heading level={6} {...props} />,
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mb-4 text-slate-300 leading-relaxed" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-4 ml-6 list-disc space-y-1 text-slate-300" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1 text-slate-300" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="text-slate-300 leading-relaxed" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => {
    // Inline code only — fenced code blocks go through Pre → CodeBlock
    if (props.className?.startsWith("language-")) {
      return <code {...props} />;
    }
    return (
      <code
        className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-cyan-300 font-mono"
        {...props}
      />
    );
  },
  pre: Pre,
  blockquote: Blockquote,
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm text-slate-300 border-collapse" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => (
    <thead className="border-b border-white/10 text-left text-slate-400" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th className="px-3 py-2 font-medium" {...props} />
  ),
  tr: (props: ComponentPropsWithoutRef<"tr">) => (
    <tr className="border-b border-white/5" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => <td className="px-3 py-2" {...props} />,
  hr: (props: ComponentPropsWithoutRef<"hr">) => <hr className="my-8 border-white/10" {...props} />,
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  em: (props: ComponentPropsWithoutRef<"em">) => <em className="text-slate-200" {...props} />,
};
