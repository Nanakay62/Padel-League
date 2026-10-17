/**
 * Production build gating script for Padel Ghana Admin Portals.
 *
 * Rules:
 * - CLUB_HOST and ADMIN_HOST come from environment variables only.
 * - The production build fails if any host is empty, localhost, or contains stitch.google.com.
 * - Scans dist/ to assert zero stitch.google.com URLs or fabricated compliance text.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function validatePortalHosts(env = process.env) {
  const clubHost = (env.CLUB_HOST || "").trim();
  const adminHost = (env.ADMIN_HOST || "").trim();

  const errors = [];

  // 1. Club Host Validation
  if (!clubHost) {
    errors.push("CLUB_HOST environment variable is missing or empty.");
  } else {
    if (clubHost.includes("localhost") || clubHost.includes("127.0.0.1")) {
      errors.push(`CLUB_HOST cannot be localhost: "${clubHost}"`);
    }
    if (clubHost.includes("stitch.google.com")) {
      errors.push(`CLUB_HOST cannot contain stitch.google.com: "${clubHost}"`);
    }
  }

  // 2. Admin Host Validation
  if (!adminHost) {
    errors.push("ADMIN_HOST environment variable is missing or empty.");
  } else {
    if (adminHost.includes("localhost") || adminHost.includes("127.0.0.1")) {
      errors.push(`ADMIN_HOST cannot be localhost: "${adminHost}"`);
    }
    if (adminHost.includes("stitch.google.com")) {
      errors.push(`ADMIN_HOST cannot contain stitch.google.com: "${adminHost}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    clubHost,
    adminHost,
  };
}

export function scanDistForViolations(distDir) {
  const forbiddenSubstrings = [
    "stitch.google.com",
    "Bank of Ghana compliant",
    "BoG certified",
    "Federation verified",
    "Disciplinary Council",
    "Disciplinary committee",
    "1,240+ players",
    "18 clubs",
  ];

  const violations = [];

  if (!fs.existsSync(distDir)) {
    return { valid: false, violations: [`Dist directory does not exist: ${distDir}`] };
  }

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && /\.(html|js|css|json)$/i.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const forbidden of forbiddenSubstrings) {
          if (content.includes(forbidden)) {
            violations.push({
              file: fullPath,
              forbidden,
            });
          }
        }
      }
    }
  }

  walk(distDir);

  return {
    valid: violations.length === 0,
    violations,
  };
}

// Direct CLI execution
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();

if (isMain) {
  console.log("Validating production build hosts and assets...");

  const hostCheck = validatePortalHosts();
  if (!hostCheck.valid) {
    console.error("❌ Production build gate failed host validation:");
    for (const err of hostCheck.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const distDir = path.resolve(process.cwd(), "dist");
  const scanCheck = scanDistForViolations(distDir);
  if (!scanCheck.valid) {
    console.error("❌ Production build gate found forbidden strings in dist assets:");
    for (const v of scanCheck.violations) {
      console.error(`  - In ${v.file}: "${v.forbidden}"`);
    }
    process.exit(1);
  }

  console.log("✅ Production build validation passed cleanly!");
  console.log(`   CLUB_HOST:  ${hostCheck.clubHost}`);
  console.log(`   ADMIN_HOST: ${hostCheck.adminHost}`);
}
