#!/usr/bin/env node
/**
 * Reads database-expectations.json (path via DB_EXPECTATIONS_FILE).
 * Uses psql + libpq env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const IDENT = /^[a-z_][a-z0-9_]*$/i;
const TYPE_NAME = /^[a-z0-9_]+$/i;

function quoteLiteral(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function loadSpec(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function getActiveProfileName(spec) {
  return (
    process.env.DB_EXPECTATIONS_PROFILE ||
    spec.activeProfile ||
    "restoredFromDump"
  );
}

function getExpectedPrivilegesAfterRestore(spec) {
  if (spec.profiles && typeof spec.profiles === "object") {
    const name = getActiveProfileName(spec);
    const block = spec.profiles[name];
    if (block && block.expectedPrivilegesAfterRestore) {
      return block.expectedPrivilegesAfterRestore;
    }
    throw new Error(
      `Profile not found or empty: ${name} (set activeProfile or DB_EXPECTATIONS_PROFILE)`
    );
  }
  if (spec.expectedPrivilegesAfterRestore) {
    return spec.expectedPrivilegesAfterRestore;
  }
  throw new Error("Missing profiles or expectedPrivilegesAfterRestore");
}

function psqlArgs() {
  const host = process.env.DB_HOST || "db";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "postgres";
  const db = process.env.DB_NAME || "infoanav";
  return {
    host,
    port,
    user,
    db,
    pass: process.env.DB_PASSWORD || "admin",
    argv: [
      "-h",
      host,
      "-p",
      String(port),
      "-U",
      user,
      "-d",
      db,
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
    ],
  };
}

function runSql(sql) {
  const { pass, argv } = psqlArgs();
  return execFileSync("psql", [...argv, "-c", sql], {
    encoding: "utf8",
    env: { ...process.env, PGPASSWORD: pass },
  }).trim();
}

function assertIdent(name, ctx) {
  if (!name || !IDENT.test(name)) {
    throw new Error(`Invalid identifier in ${ctx}: ${JSON.stringify(name)}`);
  }
}

function listBaseTables(schema) {
  assertIdent(schema, "listBaseTables.schema");
  const q = `SELECT table_name FROM information_schema.tables WHERE table_schema = ${quoteLiteral(schema)} AND table_type = 'BASE TABLE' ORDER BY table_name`;
  const out = runSql(q);
  if (!out) return [];
  return out.split("\n").filter(Boolean);
}

function roleExists(roleName) {
  assertIdent(roleName, "roleExists");
  const v = runSql(
    `SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = ${quoteLiteral(roleName)})`
  );
  return v === "t";
}

function hasSchemaPrivilege(role, schema, priv) {
  assertIdent(role, "hasSchemaPrivilege.role");
  assertIdent(schema, "hasSchemaPrivilege.schema");
  assertIdent(priv, "hasSchemaPrivilege.priv");
  const v = runSql(
    `SELECT has_schema_privilege(${quoteLiteral(role)}, ${quoteLiteral(schema)}, ${quoteLiteral(priv)})`
  );
  return v === "t";
}

function hasTablePrivilege(role, schema, table, priv) {
  assertIdent(role, "hasTablePrivilege.role");
  assertIdent(schema, "hasTablePrivilege.schema");
  assertIdent(table, "hasTablePrivilege.table");
  assertIdent(priv, "hasTablePrivilege.priv");
  const v = runSql(
    `SELECT has_table_privilege(${quoteLiteral(role)}, ${quoteLiteral(`${schema}.${table}`)}, ${quoteLiteral(priv)})`
  );
  return v === "t";
}

function functionSignature(schema, name, argTypes) {
  assertIdent(schema, "functionSignature.schema");
  assertIdent(name, "functionSignature.name");
  for (const t of argTypes) {
    if (!TYPE_NAME.test(t)) {
      throw new Error(`Invalid arg type: ${t}`);
    }
  }
  const args = argTypes.join(", ");
  return `${schema}.${name}(${args})`;
}

function hasFunctionPrivilege(role, schema, name, argTypes, priv) {
  assertIdent(role, "hasFunctionPrivilege.role");
  assertIdent(priv, "hasFunctionPrivilege.priv");
  const sig = functionSignature(schema, name, argTypes);
  const v = runSql(
    `SELECT has_function_privilege(${quoteLiteral(role)}, ${quoteLiteral(sig)}, ${quoteLiteral(priv)})`
  );
  return v === "t";
}

function cmdValidate(filePath) {
  const spec = loadSpec(filePath);
  if (!spec.rolesToEnsureBeforeRestore || !Array.isArray(spec.rolesToEnsureBeforeRestore)) {
    throw new Error("Missing rolesToEnsureBeforeRestore array");
  }
  const privs = getExpectedPrivilegesAfterRestore(spec);
  for (const r of spec.rolesToEnsureBeforeRestore) {
    assertIdent(r.name, "rolesToEnsureBeforeRestore.name");
  }
  for (const roleName of Object.keys(privs)) {
    assertIdent(roleName, "expectedPrivilegesAfterRestore key");
  }
  console.log(
    "[verify-db-expectations] JSON OK:",
    filePath,
    "profile:",
    spec.profiles ? getActiveProfileName(spec) : "(legacy)"
  );
}

function cmdEnsureRoles(filePath) {
  const spec = loadSpec(filePath);
  for (const r of spec.rolesToEnsureBeforeRestore) {
    assertIdent(r.name, "ensure role name");
    if (roleExists(r.name)) {
      console.log(`[verify-db-expectations] Role exists: ${r.name}`);
      continue;
    }
    const login = r.noLogin === false ? "LOGIN" : "NOLOGIN";
    runSql(`CREATE ROLE ${r.name} ${login};`);
    console.log(`[verify-db-expectations] Created role: ${r.name} (${login})`);
  }
}

function verifyRoleGrants(roleName, cfg) {
  let failures = 0;
  const schemas = cfg.schemas || [];
  for (const s of schemas) {
    assertIdent(s.name, "schema.name");
    for (const p of s.privileges || []) {
      if (!hasSchemaPrivilege(roleName, s.name, p)) {
        console.error(
          `[verify-db-expectations] FAIL ${roleName}: missing schema ${s.name} ${p}`
        );
        failures += 1;
      }
    }
  }

  for (const block of cfg.tablesInSchema || []) {
    assertIdent(block.schema, "tablesInSchema.schema");
    const privs = block.privileges || [];
    let tables = [];
    if (block.match === "all_base_tables") {
      tables = listBaseTables(block.schema);
    } else if (block.match === "explicit") {
      tables = block.tables || [];
      for (const t of tables) {
        assertIdent(t, "tablesInSchema.tables[]");
      }
    } else {
      throw new Error(`Unknown tablesInSchema.match: ${block.match}`);
    }
    for (const t of tables) {
      assertIdent(t, "table from information_schema");
      for (const p of privs) {
        if (!hasTablePrivilege(roleName, block.schema, t, p)) {
          console.error(
            `[verify-db-expectations] FAIL ${roleName}: ${block.schema}.${t} missing ${p}`
          );
          failures += 1;
        }
      }
    }
  }

  for (const t of cfg.tables || []) {
    assertIdent(t.schema, "table.schema");
    assertIdent(t.name, "table.name");
    for (const p of t.privileges || []) {
      if (!hasTablePrivilege(roleName, t.schema, t.name, p)) {
        console.error(
          `[verify-db-expectations] FAIL ${roleName}: ${t.schema}.${t.name} missing ${p}`
        );
        failures += 1;
      }
    }
  }

  for (const f of cfg.functions || []) {
    assertIdent(f.schema, "function.schema");
    assertIdent(f.name, "function.name");
    const argTypes = f.argTypes || [];
    for (const p of f.privileges || []) {
      if (!hasFunctionPrivilege(roleName, f.schema, f.name, argTypes, p)) {
        const sig = functionSignature(f.schema, f.name, argTypes);
        console.error(
          `[verify-db-expectations] FAIL ${roleName}: ${sig} missing ${p}`
        );
        failures += 1;
      }
    }
  }

  return failures;
}

function cmdVerifyGrants(filePath) {
  const spec = loadSpec(filePath);
  const privs = getExpectedPrivilegesAfterRestore(spec);
  let failures = 0;
  for (const [roleName, cfg] of Object.entries(privs)) {
    if (!roleExists(roleName)) {
      console.error(`[verify-db-expectations] FAIL: role missing: ${roleName}`);
      failures += 1;
      continue;
    }
    failures += verifyRoleGrants(roleName, cfg);
  }
  if (failures === 0) {
    console.log("[verify-db-expectations] All privilege checks passed.");
    process.exit(0);
  }
  console.error(`[verify-db-expectations] ${failures} check(s) failed.`);
  process.exit(1);
}

function main() {
  const filePath = path.resolve(
    process.cwd(),
    process.env.DB_EXPECTATIONS_FILE || "database-expectations.json"
  );
  const cmd = process.argv[2];
  if (!cmd) {
    console.error("Usage: verify-db-expectations.cjs <validate|ensure-roles|verify-grants>");
    process.exit(2);
  }
  if (!fs.existsSync(filePath)) {
    console.error("Expectations file not found:", filePath);
    process.exit(1);
  }
  if (cmd === "validate") {
    cmdValidate(filePath);
    return;
  }
  if (cmd === "ensure-roles") {
    cmdEnsureRoles(filePath);
    return;
  }
  if (cmd === "verify-grants") {
    cmdVerifyGrants(filePath);
    return;
  }
  console.error("Unknown command:", cmd);
  process.exit(2);
}

main();
