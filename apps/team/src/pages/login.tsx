import { useAuth } from "../contexts";

export function LoginPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center space-y-2">
          <span className="text-4xl">⚡</span>
          <h1 className="text-2xl font-bold text-white">OpenSpawn</h1>
          <p className="text-sm text-white/40">Sign in to your team dashboard</p>
        </div>

        <button
          onClick={() => loginWithGoogle()}
          className="w-full rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
