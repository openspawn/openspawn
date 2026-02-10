import { useState } from "react";
import { User, Shield, Key, Building2, Palette, Webhook, WebhookIcon, Github } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { PageHeader } from "../components/ui/page-header";
import { ProfileSettings } from "../components/settings/profile-settings";
import { SecuritySettings } from "../components/settings/security-settings";
import { ApiKeySettings } from "../components/settings/api-key-settings";
import { OrgSettings } from "../components/settings/org-settings";
import { AppearanceSettings } from "../components/settings/appearance-settings";
import { WebhooksSettings } from "../components/settings/webhooks-settings";
import { InboundWebhooksSettings } from "../components/settings/inbound-webhooks-settings";
import { GitHubSettings } from "../components/settings/github-settings";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and organization settings"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 lg:w-[1120px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="inbound" className="flex items-center gap-2">
            <WebhookIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Inbound</span>
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Org</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeySettings />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksSettings />
        </TabsContent>

        <TabsContent value="inbound">
          <InboundWebhooksSettings />
        </TabsContent>

        <TabsContent value="github">
          <GitHubSettings />
        </TabsContent>

        <TabsContent value="organization">
          <OrgSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
