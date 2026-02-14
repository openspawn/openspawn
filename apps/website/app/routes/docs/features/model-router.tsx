import { DocsLayout, CodeBlock } from "../../../components/docs-layout";

export function ModelRouterDocs() {
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Model Router</h1>
      <p className="mb-8 text-lg text-slate-400">
        Smart LLM routing across Ollama, Groq, and OpenRouter with automatic fallbacks and cost tracking.
      </p>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Overview</h2>
      <p className="mb-4 text-slate-400">
        Not every agent needs GPT-4. A Level 3 worker writing unit tests uses a local 7B model. A Level 10 executive making strategic decisions gets Claude 3.5 Sonnet.
      </p>
      <CodeBlock>{`Agent Level → Tier Selection → Provider → Model → Fallback if needed`}</CodeBlock>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Routing Tiers</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="py-2 pr-4 font-medium">Agent Level</th>
              <th className="py-2 pr-4 font-medium">Tier</th>
              <th className="py-2 pr-4 font-medium">Provider</th>
              <th className="py-2 pr-4 font-medium">Model</th>
              <th className="py-2 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            <tr className="border-b border-white/5">
              <td className="py-2 pr-4">L9–L10</td><td className="py-2 pr-4">Executive</td><td className="py-2 pr-4">OpenRouter</td><td className="py-2 pr-4 text-slate-400">Claude 3.5, GPT-4o</td><td className="py-2 text-amber-400">$$$</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-4">L7–L8</td><td className="py-2 pr-4">Lead</td><td className="py-2 pr-4">Groq</td><td className="py-2 pr-4 text-slate-400">Llama 3.1 70B</td><td className="py-2 text-amber-400">$</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-4">L1–L6</td><td className="py-2 pr-4">Worker</td><td className="py-2 pr-4">Ollama</td><td className="py-2 pr-4 text-slate-400">Qwen 2.5 7B</td><td className="py-2 text-emerald-400">Free</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Fallback Chains</h2>
      <p className="mb-4 text-slate-400">When a provider is unavailable, the router automatically falls back:</p>
      <CodeBlock>{`L9-10: OpenRouter → Groq (70B) → Ollama
L7-8:  Groq (70B) → OpenRouter → Ollama
L1-6:  Ollama (60%) / Groq 8B (40%) → OpenRouter (cheapest)`}</CodeBlock>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Providers</h2>
      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-200">Ollama (Local)</h3>
      <p className="mb-4 text-slate-400">$0 cost, 40–150ms latency. Runs Qwen 2.5 7B on your hardware. Best for L1–L6 workers.</p>
      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-200">Groq</h3>
      <p className="mb-4 text-slate-400">$0.05–$0.79/1K tokens, 80–300ms latency. Llama 3.1 8B/70B. Best for L7–L8 leads.</p>
      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-200">OpenRouter</h3>
      <p className="mb-4 text-slate-400">$2.50–$15/1K tokens, 200–800ms. Claude 3.5 Sonnet, GPT-4o. Best for L9–L10 executives.</p>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Metrics</h2>
      <CodeBlock title="bash">{`curl https://bikinibottom.ai/api/router/metrics`}</CodeBlock>
    </DocsLayout>
  );
}
