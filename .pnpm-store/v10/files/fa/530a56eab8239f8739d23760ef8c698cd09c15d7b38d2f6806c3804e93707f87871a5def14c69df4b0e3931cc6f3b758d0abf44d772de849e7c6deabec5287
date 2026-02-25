import { TemplateUIOptions } from '@verdaccio/types';
import { Manifest } from './manifest';
export type Template = {
    manifest: Manifest;
    options: TemplateUIOptions;
    metaScripts?: string[];
    scriptsBodyAfter?: string[];
    scriptsBodyBefore?: string[];
};
export interface WebpackManifest {
    [key: string]: string;
}
export default function renderTemplate(template: Template, manifest: WebpackManifest): string;
