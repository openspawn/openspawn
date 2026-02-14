import { Outlet } from "@tanstack/react-router";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-200 overflow-x-hidden">
      {/* Subtle ocean backdrop */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.04) 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(139,92,246,0.03) 0%, transparent 60%)",
        }}
      />
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
