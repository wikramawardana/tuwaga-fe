import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTuwagaRole, workspaceForRole } from "../src/lib/roles.ts";

test("EO enters verification and players retain public access", () => {
  assert.equal(workspaceForRole("eo"), "/verification");
  assert.equal(workspaceForRole("user"), "/tournaments");
  assert.equal(workspaceForRole("panitia"), "/admin");
});
test("unrecognized upstream claims do not grant privileges", () => {
  for (const role of ["EO", "admin,eo", "referee", null, 1]) {
    assert.equal(normalizeTuwagaRole(role), "user");
    assert.equal(workspaceForRole(role), "/tournaments");
  }
});
