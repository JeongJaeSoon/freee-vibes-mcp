import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { server } from "./index.ts";

describe("MCP 서버 테스트", () => {
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeEach(async () => {
    // 테스트용 클라이언트 생성
    client = new Client({
      name: "test client",
      version: "0.1.0",
    });

    // 인메모리 통신 채널 생성
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    // 클라이언트와 서버 연결
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  describe("getDiceRoll", () => {
    it("주사위를 굴려 1-6 사이의 결과를 반환한다", async () => {
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
  });

  describe("add", () => {
    it("두 숫자를 더한 결과를 반환한다", async () => {
      const result = await client.callTool({
        name: "add",
        arguments: {
          a: 5,
          b: 3,
        },
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "8",
          },
        ],
      });
    });

    it("음수도 정상적으로 계산한다", async () => {
      const result = await client.callTool({
        name: "add",
        arguments: {
          a: -5,
          b: 3,
        },
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "-2",
          },
        ],
      });
    });
  });

  describe("greeting", () => {
    it("이름을 받아 인사말을 반환한다", async () => {
      const result = await client.callTool({
        name: "greeting",
        arguments: {
          name: "John",
        },
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Hello, John!",
          },
        ],
      });
    });

    it("다른 이름으로도 정상 동작한다", async () => {
      const result = await client.callTool({
        name: "greeting",
        arguments: {
          name: "Alice",
        },
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Hello, Alice!",
          },
        ],
      });
    });
  });
});
