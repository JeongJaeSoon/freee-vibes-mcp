import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { server } from "./index.ts";
import type { Transport } from "@modelcontextprotocol/sdk/transport.js";

describe("getDiceRoll", () => {
  let client: Client;
  let clientTransport: Transport;
  let serverTransport: Transport;

  beforeEach(async () => {
    // Create test client
    client = new Client({
      name: "test client",
      version: "0.1.0",
    });

    // Create in-memory communication channel
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    // Connect client and server
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  it("returns a random dice roll result for 6-sided dice", async () => {
    const result = await client.callTool({
      name: "getDiceRoll",
      arguments: {
        sides: 6,
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringMatching(/^[1-6]$/),
        },
      ],
    });
  });

  it("returns a random dice roll result for 4-sided dice", async () => {
    const result = await client.callTool({
      name: "getDiceRoll",
      arguments: {
        sides: 4,
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringMatching(/^[1-4]$/),
        },
      ],
    });
  });

  it("returns a random dice roll result for 8-sided dice", async () => {
    const result = await client.callTool({
      name: "getDiceRoll",
      arguments: {
        sides: 8,
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringMatching(/^[1-8]$/),
        },
      ],
    });
  });

  it("throws error when sides is less than 1", async () => {
    await expect(
      client.callTool({
        name: "getDiceRoll",
        arguments: {
          sides: 0,
        },
      })
    ).rejects.toThrow();
  });

  it("throws error when sides is not a number", async () => {
    await expect(
      client.callTool({
        name: "getDiceRoll",
        arguments: {
          sides: "invalid",
        },
      })
    ).rejects.toThrow();
  });

  it("returns different results for multiple rolls", async () => {
    const results = await Promise.all(
      Array(10)
        .fill(null)
        .map(() =>
          client.callTool({
            name: "getDiceRoll",
            arguments: {
              sides: 6,
            },
          })
        )
    );

    // Verify all results are valid
    for (const result of results) {
      expect(result.content[0].text).toMatch(/^[1-6]$/);
    }

    // Verify that we got at least two different results
    const uniqueResults = new Set(results.map((r) => r.content[0].text));
    expect(uniqueResults.size).toBeGreaterThan(1);
  });
});
