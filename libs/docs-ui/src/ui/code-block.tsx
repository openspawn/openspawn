export function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="terminal my-4">
      {title && (
        <div className="terminal-header">
          <span className="text-xs text-slate-500">{title}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}
