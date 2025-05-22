import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebClient } from '@slack/web-api';
// Using 'langchain/embeddings/hf' as per prior setup. Adjust if 'bun test' shows issues with @langchain/
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf'; 
import { FaissStore } from 'langchain/vectorstores/faiss';
import { generateText } from 'ai';
import { Document } from 'langchain/document';

// Import actual logic for core tests
import * as actualAgentLogic from './slackAgent'; 

// Tools to test (imports from tools/index.ts which should export from slackTools.ts)
import { indexSlackConversationsTool, searchIndexedConversationsTool } from '../tools';

// Mock environment variables
process.env.SLACK_BOT_TOKEN = 'test-slack-token';
process.env.HF_TOKEN = 'test-hf-token';

// --- Global Mocks ---
vi.mock('@slack/web-api');
vi.mock('langchain/embeddings/hf'); 
vi.mock('langchain/vectorstores/faiss');
vi.mock('ai'); // For generateText

// This vi.mock provides mocked versions of slackAgent's functions for the *tools* to use.
// Core logic tests will use `actualAgentLogic` imported above.
vi.mock('./slackAgent', async (importOriginal) => {
  const originalModule = await importOriginal<typeof actualAgentLogic>();
  return {
    ...originalModule, // Spread original module to keep non-mocked parts (like actual initializeVectorStore)
    getSlackWebClient: vi.fn(),      // Mocked for tools
    fetchSlackChannels: vi.fn(),     // Mocked for tools
    fetchChannelMessages: vi.fn(),   // Mocked for tools
    indexSlackMessages: vi.fn(),     // Mocked for tools (if tool calls a wrapper)
    answerQueryWithContext: vi.fn(), // Mocked for tools
    searchIndexedMessages: vi.fn(),  // Mocked for tools (if tool calls this instead of answerQueryWithContext)
    // initializeVectorStore is NOT mocked here, so tools use the real one from originalModule.
    // The real one will then use the globally mocked FaissStore.fromDocuments.
  };
});

// --- Test Suites ---

describe('Slack Agent Core Logic', () => {
  let mockWebClientInstance: any;
  let mockFaissStoreInstance: any;
  // mockHFEmbeddingsInstance is implicitly created by the mocked HuggingFaceInferenceEmbeddings constructor

  beforeEach(async () => {
    vi.resetAllMocks(); // Reset all global mocks to ensure test isolation

    // Setup for WebClient
    mockWebClientInstance = {
      conversations: { list: vi.fn(), history: vi.fn() },
    };
    (WebClient as any).mockImplementation(() => mockWebClientInstance);

    // Setup for FaissStore
    mockFaissStoreInstance = {
      addDocuments: vi.fn().mockResolvedValue(undefined),
      similaritySearch: vi.fn().mockResolvedValue([]),
    };
    (FaissStore.fromDocuments as any).mockResolvedValue(mockFaissStoreInstance);
    // (FaissStore.load as any).mockResolvedValue(mockFaissStoreInstance); // If testing loading

    // Setup for HuggingFaceInferenceEmbeddings (constructor is mocked globally)
    (HuggingFaceInferenceEmbeddings as any).mockImplementation(() => ({})); // Returns a dummy object

    // Setup for generateText (mocked globally)
    (generateText as any).mockResolvedValue({ text: 'Mocked LLM response' });

    // Initialize vector store with mocks for each test using the *actual* initializeVectorStore
    // This ensures it uses the globally mocked FaissStore.fromDocuments.
    // It also resets the module-level 'vectorStore' variable in slackAgent.ts.
    await actualAgentLogic.initializeVectorStore(true, [new Document({ pageContent: "init_doc_core_logic" })]);
  });

  // No afterEach needed as beforeEach resets mocks and initializeVectorStore(true,...) resets the store state.

  describe('fetchSlackChannels', () => {
    it('should return channels on successful API call', async () => {
      const mockChannels = [{ id: 'C1', name: 'general' }, { id: 'C2', name: 'random' }];
      mockWebClientInstance.conversations.list.mockResolvedValue({ ok: true, channels: mockChannels });
      
      // Use actual getSlackWebClient which is mocked to return mockWebClientInstance for core tests
      const client = actualAgentLogic.getSlackWebClient(); 
      const channels = await actualAgentLogic.fetchSlackChannels(client);
      
      expect(channels).toEqual(mockChannels.map(c => ({ id: c.id, name: c.name })));
      expect(mockWebClientInstance.conversations.list).toHaveBeenCalled();
    });
  });

  describe('indexSlackMessages', () => {
    it('should call addDocuments on FaissStore instance', async () => {
      // initializeVectorStore in beforeEach has already set up the mockFaissStoreInstance
      const messages = [{ text: 'Hello', id: 'M1', user: 'U1', ts: 'ts1' }];
      await actualAgentLogic.indexSlackMessages(messages); // Uses actual indexSlackMessages
      
      expect(mockFaissStoreInstance.addDocuments).toHaveBeenCalledWith(
        messages.map(m => new Document({ 
          pageContent: m.text, 
          metadata: { id: m.id, user: m.user, timestamp: m.ts } 
        }))
      );
    });
  });

  describe('answerQueryWithContext', () => {
    it('should call generateText with correct prompt when documents are found', async () => {
      const query = 'test query';
      const documents = [
        new Document({ pageContent: 'doc1 content', metadata: { id: 'd1' } }),
        new Document({ pageContent: 'doc2 content', metadata: { id: 'd2' } })
      ];
      // The actual searchIndexedMessages (called by actual answerQueryWithContext) 
      // uses vectorStore.similaritySearch. We mock what vectorStore.similaritySearch returns.
      mockFaissStoreInstance.similaritySearch.mockResolvedValue(documents);

      // Call actual answerQueryWithContext
      await actualAgentLogic.answerQueryWithContext(query);

      const expectedContext = "doc1 content\n---\ndoc2 content";
      expect(generateText as any).toHaveBeenCalledWith(expect.objectContaining({
        model: expect.anything(), // actualAgentLogic.slackSearchAgent.model (or however it's accessed)
        prompt: expect.stringContaining(expectedContext) && expect.stringContaining(query),
      }));
    });
  });
});


describe('Slack Agent Tools', () => {
  let mockSlackClientForTools: any;
  let mockedAgentModuleForTools: typeof actualAgentLogic; // To access the vi.fn() mocks

  beforeEach(async () => {
    // Gets the module with functions replaced by vi.fn() as per vi.mock('./slackAgent', ...)
    mockedAgentModuleForTools = await import('./slackAgent'); 

    // Reset call history for the vi.fn() mocks
    vi.mocked(mockedAgentModuleForTools.getSlackWebClient).mockClear();
    vi.mocked(mockedAgentModuleForTools.fetchSlackChannels).mockClear();
    vi.mocked(mockedAgentModuleForTools.fetchChannelMessages).mockClear();
    vi.mocked(mockedAgentModuleForTools.indexSlackMessages).mockClear();
    vi.mocked(mockedAgentModuleForTools.answerQueryWithContext).mockClear();
    vi.mocked(mockedAgentModuleForTools.searchIndexedMessages).mockClear();


    // Setup default return values for these mocks for tool tests
    mockSlackClientForTools = { conversations: { list: vi.fn(), history: vi.fn() } }; // Dummy client
    vi.mocked(mockedAgentModuleForTools.getSlackWebClient).mockReturnValue(mockSlackClientForTools as any);
    vi.mocked(mockedAgentModuleForTools.answerQueryWithContext).mockResolvedValue('Mocked RAG response for tool');
    vi.mocked(mockedAgentModuleForTools.fetchSlackChannels).mockResolvedValue([{ id: 'TC1', name: 'ToolTestChannel' }]);
    vi.mocked(mockedAgentModuleForTools.fetchChannelMessages).mockResolvedValue([{ text: 'Tool Test Message', id: 'TTM1' }]);
    vi.mocked(mockedAgentModuleForTools.indexSlackMessages).mockResolvedValue(undefined); // It's void

    // Ensure that if tools call initializeVectorStore, it uses a mocked FaissStore.
    // The global mock for FaissStore.fromDocuments should handle this.
    // No need to call initializeVectorStore here; tools should do it.
    // (FaissStore.fromDocuments as any).mockResolvedValue({ addDocuments: vi.fn(), similaritySearch: vi.fn() });
    // The above line is already handled by the global mock setup and beforeEach in the outer scope if not reset.
    // To be safe, ensure it's configured for tool tests if any global mock changes.
     const mockFaissStoreForTools = { addDocuments: vi.fn().mockResolvedValue(undefined), similaritySearch: vi.fn().mockResolvedValue([]) };
    (FaissStore.fromDocuments as any).mockResolvedValue(mockFaissStoreForTools);
  });

  describe('searchIndexedConversationsTool', () => {
    it('should call the mocked answerQueryWithContext and return its result', async () => {
      const query = 'search query via tool';
      
      // The tool calls initializeVectorStore, which will use the mocked FaissStore.fromDocuments
      // then it calls answerQueryWithContext, which is mocked for tools.
      const result = await searchIndexedConversationsTool.execute({ query });
      
      expect(mockedAgentModuleForTools.answerQueryWithContext).toHaveBeenCalledWith(query);
      expect(result).toBe('Mocked RAG response for tool');
    });
  });

  describe('indexSlackConversationsTool', () => {
    it('should call mocked getSlackWebClient, fetchChannels, fetchMessages, and indexMessages', async () => {
      const limit = 15;
      await indexSlackConversationsTool.execute({ limitPerChannel: limit });

      expect(mockedAgentModuleForTools.getSlackWebClient).toHaveBeenCalled();
      expect(mockedAgentModuleForTools.fetchSlackChannels).toHaveBeenCalledWith(mockSlackClientForTools);
      expect(mockedAgentModuleForTools.fetchChannelMessages).toHaveBeenCalledWith(mockSlackClientForTools, 'TC1', limit);
      expect(mockedAgentModuleForTools.indexSlackMessages).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ text: 'Tool Test Message', id: 'TTM1' })
        ])
      );
    });
  });
});

// Assumption: agent-server/package.json contains "test": "bun test"
// Manual verification of package.json is outside the scope of this automated process.
