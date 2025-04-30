import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { fetch } from "undici";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "./index.ts";

type ToolResponse = {
  content: Array<{
    type: string;
    text: string;
  }>;
};

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
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
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
    const results = (await Promise.all(
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
    )) as ToolResponse[];

    // Verify all results are valid
    for (const result of results) {
      expect(result.content[0]?.text).toMatch(/^[1-6]$/);
    }

    // Verify that we got at least two different results
    const uniqueResults = new Set(results.map((r) => r.content[0]?.text));
    expect(uniqueResults.size).toBeGreaterThan(1);
  });
});

describe("askMastra", () => {
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
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    // Mock fetch
    vi.mock("undici", () => ({
      fetch: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("successfully gets response from Mastra server", async () => {
    const mockResponse = {
      text: "테스트 응답입니다.",
    };

    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.callTool({
      name: "askMastra",
      arguments: {
        question: "테스트 질문입니다.",
        agentId: "testAgent",
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4111/api/agents/testAgent/generate",
      expect.any(Object)
    );

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "테스트 응답입니다.",
        },
      ],
    });
  });

  it("handles Mastra server error gracefully", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("서버 에러 발생"),
    });

    const result = await client.callTool({
      name: "askMastra",
      arguments: {
        question: "테스트 질문입니다.",
      },
    });

    const response = result as { content: Array<{ text: string }> };
    expect(response.content[0]?.text).toContain("Error communicating with Mastra server");
  });
});
