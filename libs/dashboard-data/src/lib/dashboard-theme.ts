/**
 * Dashboard theme detection via VITE_DASHBOARD_THEME env var.
 *
 * "openspawn" (default) = clean shadcn dashboard for team.openspawn.ai
 * "bikinibottom" = BB-themed demo for bikinibottom.ai
 */

export enum DashboardTheme {
  OpenSpawn = "openspawn",
  BikiniBottom = "bikinibottom",
}

export const DASHBOARD_THEME: DashboardTheme =
  (import.meta.env.VITE_DASHBOARD_THEME as string) === DashboardTheme.BikiniBottom
    ? DashboardTheme.BikiniBottom
    : DashboardTheme.OpenSpawn;

export const isBBTheme = DASHBOARD_THEME === DashboardTheme.BikiniBottom;
export const isOpenSpawnTheme = DASHBOARD_THEME === DashboardTheme.OpenSpawn;
