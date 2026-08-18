#!/usr/bin/env node

/**
 * Invite or recover a production admin via Supabase Auth.
 * Does not print passwords or recovery action links.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL
 */

const { createClient } = require("@supabase/supabase-js");

function fail(message) {
  console.error(message);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

if (!url || url.includes("your-project") || url.includes("placeholder")) {
  fail("NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder.");
}
if (
  !serviceRoleKey ||
  serviceRoleKey.startsWith("your-") ||
  serviceRoleKey.includes("placeholder")
) {
  fail("SUPABASE_SERVICE_ROLE_KEY is missing or still a placeholder.");
}
if (!adminEmail || !adminEmail.includes("@")) {
  fail("Set ADMIN_EMAIL to the administrator address that should receive the invite or reset email.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllUsers() {
  const emails = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const user of users) {
      if (user.email) emails.push(user.email.toLowerCase());
    }
    if (users.length < 200) break;
  }
  return emails;
}

async function main() {
  const emails = await listAllUsers();
  const unique = [...new Set(emails)].sort();
  if (unique.length) {
    console.log(`Existing Auth users: ${unique.length}`);
    for (const email of unique) console.log(`- ${email}`);
  } else {
    console.log("No Auth users found.");
  }

  if (unique.includes(adminEmail)) {
    const { error } = await supabase.auth.resetPasswordForEmail(adminEmail);
    if (error) throw error;
    console.log(
      `Admin already exists (${adminEmail}). A password reset email was requested. Set the new password from that email, then sign in at /login.`,
    );
    return;
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(adminEmail);
  if (error) throw error;
  if (data?.user?.email) {
    console.log(
      `Invited new admin ${data.user.email}. Open the invite email, set a password, then sign in at /login.`,
    );
    return;
  }
  fail("Invite did not return a user.");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Failed to provision admin.");
});
