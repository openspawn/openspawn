import { useState } from "react";
import { Building2, Users, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../../contexts";

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  lastActive: string;
}

// Mock data for demo
const MOCK_MEMBERS: OrgMember[] = [
  {
    id: "1",
    name: "Adam",
    email: "adam@openspawn.ai",
    role: "admin",
    lastActive: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Agent Dennis",
    email: "agentdennis@openspawn.ai",
    role: "operator",
    lastActive: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function OrgSettings() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("OpenSpawn");
  const [isSaving, setIsSaving] = useState(false);
  const [members] = useState<OrgMember[]>(MOCK_MEMBERS);

  const isAdmin = user?.role === "admin";

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "operator":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatLastActive = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization
          </CardTitle>
          <CardDescription>
            Manage your organization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                Only admins can change organization settings
              </p>
            )}
          </div>

          {isAdmin && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? "s" : ""} in your organization
            </CardDescription>
          </div>
          {isAdmin && (
            <Button variant="outline">
              Invite Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                      {member.id === user?.id && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Active {formatLastActive(member.lastActive)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isAdmin && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your entire organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
              <div>
                <p className="font-medium">Delete Organization</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this organization and all its data
                </p>
              </div>
              <Button variant="destructive">
                Delete Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
