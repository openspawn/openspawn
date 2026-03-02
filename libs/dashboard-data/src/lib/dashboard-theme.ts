/**
 * Dashboard theme detection via VITE_DASHBOARD_THEME env var.
 * 
 * "openspawn" (default) = clean shadcn dashboard for team.openspawn.ai
 * "bikinibottom" = BB-themed demo for bikinibottom.ai
 */

export type DashboardTheme = 'openspawn' | 'bikinibottom';

export const DASHBOARD_THEME: DashboardTheme =
  (import.meta.env.VITE_DASHBOARD_THEME as string) === 'bikinibottom'
    ? 'bikinibottom'
    : 'openspawn';

export const isBBTheme = DASHBOARD_THEME === 'bikinibottom';
export const isOpenSpawnTheme = DASHBOARD_THEME === 'openspawn';
