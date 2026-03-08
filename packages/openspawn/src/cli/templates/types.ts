import { CulturePreset } from "../../core/types.js";

export interface Template {
  name: string;
  label: string;
  description: string;
  emoji: string;
  category: "general" | "industry";
  culturePreset: CulturePreset;
  content: string;
}
