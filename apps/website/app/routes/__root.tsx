import { Outlet } from "@tanstack/react-router";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-200">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
