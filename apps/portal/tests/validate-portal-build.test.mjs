import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { validatePortalHosts, scanDistForViolations } from "../scripts/validate_portal_build.mjs";

console.log("Running portal build validation test suite...");

// 1. Valid hosts
{
  const res = validatePortalHosts({
    CLUB_HOST: "club.padelghana.com",
    ADMIN_HOST: "admin.padelghana.com",
  });
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.errors.length, 0);
  console.log("  ✔ Valid production hosts accepted");
}

// 2. Missing CLUB_HOST
{
  const res = validatePortalHosts({
    CLUB_HOST: "",
    ADMIN_HOST: "admin.padelghana.com",
  });
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /CLUB_HOST.*missing/i);
  console.log("  ✔ Empty CLUB_HOST rejected");
}

// 3. Localhost in CLUB_HOST
{
  const res = validatePortalHosts({
    CLUB_HOST: "localhost:3000",
    ADMIN_HOST: "admin.padelghana.com",
  });
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /cannot be localhost/i);
  console.log("  ✔ Localhost CLUB_HOST rejected");
}

// 4. stitch.google.com in ADMIN_HOST
{
  const res = validatePortalHosts({
    CLUB_HOST: "club.padelghana.com",
    ADMIN_HOST: "stitch.google.com/admin",
  });
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /cannot contain stitch\.google\.com/i);
  console.log("  ✔ Stitch URL in ADMIN_HOST rejected");
}

// 5. Scan fixture with violations
{
  const tmpDir = path.resolve(process.cwd(), "tmp_test_dist");
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "index.html"), "<html>Bank of Ghana compliant</html>");

  const scanRes = scanDistForViolations(tmpDir);
  assert.strictEqual(scanRes.valid, false);
  assert.strictEqual(scanRes.violations.length, 1);
  assert.strictEqual(scanRes.violations[0].forbidden, "Bank of Ghana compliant");

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("  ✔ Asset scanner catches forbidden text");
}

// 6. Scan fixture with Disciplinary Council
{
  const tmpDir = path.resolve(process.cwd(), "tmp_test_dist_2");
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "bundle.js"), "const role = 'Disciplinary Council';");

  const scanRes = scanDistForViolations(tmpDir);
  assert.strictEqual(scanRes.valid, false);
  assert.strictEqual(scanRes.violations[0].forbidden, "Disciplinary Council");

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("  ✔ Asset scanner catches Disciplinary Council");
}

console.log("✅ All portal build validation tests passed!");
