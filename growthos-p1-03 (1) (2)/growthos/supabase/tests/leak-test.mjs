// Cross-workspace leak test. Runs the real migration in an in-memory Postgres
// and checks that people only see and change what they should.
// Run with: npm run test:db

import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name} ${detail}`);
  }
}

// Run work as a signed-in user (or as nobody, with id = null).
async function as(userId, role, work) {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? ""]);
  try {
    return await work();
  } finally {
    await db.exec("reset role");
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}

async function rows(userId, sql, params = []) {
  return as(userId, "authenticated", async () => (await db.query(sql, params)).rows);
}

async function fails(userId, sql, params, pattern) {
  try {
    await as(userId, "authenticated", () => db.query(sql, params));
    return false;
  } catch (e) {
    return pattern.test(String(e.message));
  }
}

// ------------------------------------------------ pretend Supabase basics
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public to anon, authenticated;
  grant usage on schema auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`);

// The owner already has an account before the migration runs.
const owner = (
  await db.query(`insert into auth.users (email) values ('owner@example.com') returning id`)
).rows[0].id;

await db.exec(readFileSync(new URL("../migrations/0001_workspaces.sql", import.meta.url), "utf8"));

// ------------------------------------------------------------- test data
async function newUser(email) {
  return (await db.query(`insert into auth.users (email) values ($1) returning id`, [email])).rows[0].id;
}
const fiyAdmin = await newUser("fiy.admin@example.com");
const fiyAgent = await newUser("fiy.agent@example.com");
const ffAgent = await newUser("ff.agent@example.com");
const outsider = await newUser("outsider@example.com");

const org = (await db.query(`insert into organizations (name) values ('Beyond Limit') returning id`)).rows[0].id;
await db.query(`insert into organization_members values ($1, $2, 'super_admin')`, [owner, org]);

async function biz(name, slug, rel) {
  return (
    await db.query(
      `insert into businesses (organization_id, name, slug, relationship) values ($1,$2,$3,$4) returning id`,
      [org, name, slug, rel],
    )
  ).rows[0].id;
}
const fiyesi = await biz("Fiyesi", "fiyesi", "client");
const forkFlames = await biz("Fork & Flames", "fork-flames", "client");
await biz("Beyond Limit", "beyond-limit", "own");

await db.query(`insert into memberships values ($1,$2,'workspace_admin')`, [fiyAdmin, fiyesi]);
await db.query(`insert into memberships values ($1,$2,'sales_agent')`, [fiyAgent, fiyesi]);
await db.query(`insert into memberships values ($1,$2,'sales_agent')`, [ffAgent, forkFlames]);

// ------------------------------------------------------------------ tests
check(
  "existing account got a profile when the migration ran",
  (await db.query(`select 1 from profiles where id = $1`, [owner])).rows.length === 1,
);

let r = await rows(fiyAgent, `select slug from businesses order by slug`);
check("Fiyesi agent sees only Fiyesi", r.length === 1 && r[0].slug === "fiyesi", JSON.stringify(r));

r = await rows(ffAgent, `select slug from businesses`);
check("Fork & Flames agent sees only Fork & Flames", r.length === 1 && r[0].slug === "fork-flames");

r = await rows(outsider, `select * from businesses`);
check("person with no workspace sees no businesses", r.length === 0);

r = await rows(owner, `select slug from businesses`);
check("group administrator sees every workspace", r.length === 3);

r = await rows(fiyAgent, `select * from memberships where business_id = $1`, [forkFlames]);
check("Fiyesi agent cannot read Fork & Flames memberships", r.length === 0);

r = await rows(fiyAgent, `select * from profiles where id = $1`, [ffAgent]);
check("Fiyesi agent cannot see a Fork & Flames person's profile", r.length === 0);

r = await rows(fiyAgent, `select * from profiles where id = $1`, [fiyAdmin]);
check("Fiyesi agent can see a Fiyesi colleague's profile", r.length === 1);

r = await rows(fiyAgent, `select * from memberships`);
check("agent sees only their own membership row", r.length === 1 && r[0].user_id === fiyAgent);

r = await rows(fiyAdmin, `select user_id from memberships where business_id = $1`, [fiyesi]);
check("workspace admin sees all Fiyesi memberships", r.length === 2);

r = await rows(fiyAgent, `update memberships set role = 'workspace_admin' where user_id = $1 returning 1`, [fiyAgent]);
check("agent cannot promote themselves", r.length === 0);

r = await rows(fiyAgent, `update businesses set name = 'Hacked' where id = $1 returning 1`, [fiyesi]);
check("agent cannot rename a workspace", r.length === 0);

r = await rows(fiyAdmin, `update businesses set name = 'Fiyesi Ltd' where id = $1 returning 1`, [fiyesi]);
check("workspace admin can rename their own workspace", r.length === 1);

r = await rows(fiyAdmin, `update businesses set name = 'Nope' where id = $1 returning 1`, [forkFlames]);
check("workspace admin cannot rename another workspace", r.length === 0);

check(
  "workspace admin cannot move a workspace to another organisation",
  await fails(fiyAdmin, `update businesses set organization_id = gen_random_uuid() where id = $1`, [fiyesi], /permission denied/),
);

check(
  "workspace admin cannot change a workspace's slug",
  await fails(fiyAdmin, `update businesses set slug = 'x' where id = $1`, [fiyesi], /permission denied/),
);

check(
  "agent cannot create a workspace",
  await fails(
    fiyAgent,
    `insert into businesses (organization_id, name, slug, relationship) values ($1,'Evil','evil','client')`,
    [org],
    /row-level security/,
  ),
);

check(
  "workspace admin cannot create a workspace",
  await fails(
    fiyAdmin,
    `insert into businesses (organization_id, name, slug, relationship) values ($1,'Evil2','evil2','client')`,
    [org],
    /row-level security/,
  ),
);

r = await rows(
  owner,
  `insert into businesses (organization_id, name, slug, relationship) values ($1,'SOMA','soma','client') returning id`,
  [org],
);
check("group administrator can create a workspace", r.length === 1);

check(
  "nobody can insert memberships directly",
  await fails(owner, `insert into memberships values ($1,$2,'sales_agent')`, [outsider, fiyesi], /permission denied/),
);

check(
  "agent cannot add members",
  await fails(fiyAgent, `select add_member_by_email($1, 'outsider@example.com', 'sales_agent')`, [fiyesi], /do not have permission/),
);

check(
  "workspace admin cannot add members to another workspace",
  await fails(fiyAdmin, `select add_member_by_email($1, 'outsider@example.com', 'sales_agent')`, [forkFlames], /do not have permission/),
);

check(
  "adding an unknown email gives a clear message",
  await fails(fiyAdmin, `select add_member_by_email($1, 'nobody@example.com', 'sales_agent')`, [fiyesi], /No account exists/),
);

check(
  "adding a member with an invalid role is refused",
  await fails(fiyAdmin, `select add_member_by_email($1, 'outsider@example.com', 'super_admin')`, [fiyesi], /role does not exist/),
);

await rows(fiyAdmin, `select add_member_by_email($1, 'OUTSIDER@example.com', 'sales_manager')`, [fiyesi]);
r = await rows(outsider, `select slug from businesses`);
check("workspace admin can add a member (email not case sensitive)", r.length === 1 && r[0].slug === "fiyesi");

r = await rows(outsider, `select * from memberships where business_id = $1`, [fiyesi]);
check("new member still cannot see other members' rows", r.length === 1);

r = await rows(owner, `select add_member_by_email($1, 'ff.agent@example.com', 'team_leader')`, [fiyesi]);
r = await rows(ffAgent, `select slug from businesses order by slug`);
check("group administrator can add a person to a second workspace", r.length === 2);

r = await rows(fiyAdmin, `delete from memberships where user_id = $1 and business_id = $2 returning 1`, [outsider, fiyesi]);
check("workspace admin can remove a member", r.length === 1);

r = await rows(outsider, `select * from businesses`);
check("removed member loses access immediately", r.length === 0);

r = await rows(fiyAgent, `delete from memberships where user_id = $1 returning 1`, [fiyAdmin]);
check("agent cannot remove a colleague", r.length === 0);

r = await rows(fiyAgent, `update profiles set name = 'Me' where id = $1 returning 1`, [fiyAgent]);
check("person can edit their own name", r.length === 1);

r = await rows(fiyAgent, `update profiles set name = 'Them' where id = $1 returning 1`, [fiyAdmin]);
check("person cannot edit someone else's name", r.length === 0);

check(
  "person cannot change their own email on the profile",
  await fails(fiyAgent, `update profiles set email = 'x@example.com' where id = $1`, [fiyAgent], /permission denied/),
);

r = await rows(fiyAgent, `select * from organizations`);
check("agent cannot read organisation records", r.length === 0);

r = await rows(fiyAgent, `select * from organization_members`);
check("agent cannot read organisation administrators", r.length === 0);

check(
  "signed-out visitor (anon) cannot read businesses",
  await (async () => {
    try {
      await as(null, "anon", () => db.query(`select * from businesses`));
      return false;
    } catch (e) {
      return /permission denied/.test(e.message);
    }
  })(),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
