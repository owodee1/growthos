export const MEMBER_ROLES = [
  "workspace_admin",
  "sales_manager",
  "team_leader",
  "sales_agent",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  group_admin: "Group administrator",
  workspace_admin: "Workspace admin",
  sales_manager: "Sales manager",
  team_leader: "Team leader",
  sales_agent: "Sales agent",
};

export const RELATIONSHIPS = ["own", "client", "partner"] as const;

export const RELATIONSHIP_LABELS: Record<string, string> = {
  own: "Beyond Limit’s own",
  client: "Client",
  partner: "Partner",
};

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
