import { describe, it, mock } from "node:test";
import assert from "node:assert";

process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/postgres";

import { safeNextPath, consumeEntraAuthFlow } from "../session";
import { getPostgresPool } from "../../postgres/pool";

describe("Entra ID session", () => {
  it("safeNextPath correctly filters paths", () => {
    assert.strictEqual(safeNextPath("/dashboard"), "/dashboard");
    assert.strictEqual(safeNextPath("/"), "/");
    assert.strictEqual(safeNextPath("//dashboard"), "/panel");
    assert.strictEqual(safeNextPath("https://evil.com"), "/panel");
    assert.strictEqual(safeNextPath(null), "/panel");
    assert.strictEqual(safeNextPath(undefined), "/panel");
  });

  describe("consumeEntraAuthFlow", () => {
    it("returns correctly mapped AuthFlow for a valid state", async () => {
      const mockConnect = mock.method(getPostgresPool(), "connect", async () => {
        return {
          query: async () => ({
            rows: [
              {
                code_verifier: "my-verifier",
                nonce: "my-nonce",
                next_path: "/my-path",
                expires_at: new Date(Date.now() + 10000), // future
              },
            ],
          }),
          release: () => {},
        };
      });

      const result = await consumeEntraAuthFlow("valid-state");

      assert.deepStrictEqual(result, {
        codeVerifier: "my-verifier",
        nonce: "my-nonce",
        nextPath: "/my-path",
      });

      mockConnect.mock.restore();
    });

    it("returns null when no matching flow is found", async () => {
      const mockConnect = mock.method(getPostgresPool(), "connect", async () => {
        return {
          query: async () => ({
            rows: [], // no rows
          }),
          release: () => {},
        };
      });

      const result = await consumeEntraAuthFlow("invalid-state");

      assert.strictEqual(result, null);

      mockConnect.mock.restore();
    });

    it("returns null when the flow is expired", async () => {
      const mockConnect = mock.method(getPostgresPool(), "connect", async () => {
        return {
          query: async () => ({
            rows: [
              {
                code_verifier: "my-verifier",
                nonce: "my-nonce",
                next_path: "/my-path",
                expires_at: new Date(Date.now() - 10000), // past
              },
            ],
          }),
          release: () => {},
        };
      });

      const result = await consumeEntraAuthFlow("expired-state");

      assert.strictEqual(result, null);

      mockConnect.mock.restore();
    });
  });
});
