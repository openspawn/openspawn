/**
 * Dashboard theme detection via VITE_DASHBOARD_THEME env var.
 * 
 * "openspawn" = clean shadcn dashboard for team.openspawn.ai
 * "bikinibottom" (default) = BB-themed demo for bikinibottom.ai
 */

export type DashboardTheme = 'openspawn' | 'bikinibottom';

export const DASHBOARD_THEME: DashboardTheme =
  (import.meta.env.VITE_DASHBOARD_THEME as string) === 'openspawn'
    ? 'openspawn'
    : 'bikinibottom';

export const isBBTheme = DASHBOARD_THEME === 'bikinibottom';
export const isOpenSpawnTheme = DASHBOARD_THEME === 'openspawn';
