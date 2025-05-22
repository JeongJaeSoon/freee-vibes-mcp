import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { indexSlackConversationsTool, searchIndexedConversationsTool } from '../tools';
import { generateText } from 'ai';
import { WebClient } from '@slack/web-api';
import { FaissStore } from 'langchain/vectorstores/faiss';
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf';
import { Document } from 'langchain/document';

// Slack API functions
// TODO: Add robust error handling for missing token
export const getSlackWebClient = (): WebClient => {
  const token = process.env.SLACK_BOT_TOKEN;
  return new WebClient(token);
};

// TODO: Add pagination for fetching all channels
export const fetchSlackChannels = async (client: WebClient) => {
  try {
    const result = await client.conversations.list();
    return result.channels?.map(channel => ({ id: channel.id, name: channel.name })) || [];
  } catch (error) {
    console.error("Error fetching Slack channels:", error);
    return [];
  }
};

// TODO: Add pagination and more complex message processing
export const fetchChannelMessages = async (client: WebClient, channelId: string, limit: number = 20) => {
  try {
    const result = await client.conversations.history({ channel: channelId, limit });
    return result.messages || [];
  } catch (error)
    {
    console.error(`Error fetching messages for channel ${channelId}:`, error);
    return [];
  }
};

// Vector Database functions

// TODO: Add robust error handling for missing HF_TOKEN
// Environment variable HF_TOKEN needs to be set for Hugging Face API.
export const getHFEmbeddings = () => {
  return new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HF_TOKEN,
    model: 'sentence-transformers/all-MiniLM-L6-v2',
  });
};

// In-memory vector store.
// TODO: Implement persistence for the vector store (saving/loading the index).
export let vectorStore: FaissStore | null = null; // Exporting for potential direct access or testing

export async function initializeVectorStore(forceNew: boolean = false, initialDocuments: Document[] = []) {
  if (vectorStore && !forceNew) {
    return vectorStore;
  }

  const embeddings = getHFEmbeddings();
  
  // FAISS requires at least one document for initialization.
  const documentsToInitializeWith = initialDocuments.length > 0 
    ? initialDocuments 
    : [new Document({ pageContent: "init", metadata: { id: "init" } })];

  try {
    vectorStore = await FaissStore.fromDocuments(documentsToInitializeWith, embeddings);
    console.log("Vector store initialized successfully.");
  } catch (error) {
    console.error("Error initializing vector store:", error);
    // Potentially re-throw or handle more gracefully
    throw error;
  }
  return vectorStore;
}

export async function indexSlackMessages(messages: Array<{text: string, id: string, user?: string, ts?: string}>) {
  if (!messages || messages.length === 0) {
    console.log("No messages to index.");
    return;
  }

  try {
    const store = await initializeVectorStore();
    // Ensure messages have 'text' and 'id' properties. Filter out any that don't.
    // Also, Langchain Document expects pageContent to be a string.
    const documents = messages
      .filter(msg => typeof msg.text === 'string' && typeof msg.id === 'string')
      .map(msg => new Document({ 
        pageContent: msg.text, 
        metadata: { 
          id: msg.id,
          user: msg.user, // Store user if available
          timestamp: msg.ts // Store timestamp if available
        } 
      }));

    if (documents.length === 0) {
        console.log("No valid messages to index after filtering.");
        return;
    }

    await store.addDocuments(documents);
    console.log(`Successfully indexed ${documents.length} messages.`);
  } catch (error) {
    console.error("Error indexing Slack messages:", error);
  }
}

export async function searchIndexedMessages(query: string, k: number = 3) {
  if (!vectorStore) {
    console.error("Vector store not initialized. Cannot perform search.");
    return [];
  }

  try {
    const results = await vectorStore.similaritySearch(query, k);
    console.log(`Found ${results.length} results for query: "${query}"`);
    return results;
  } catch (error) {
    console.error("Error searching indexed messages:", error);
    return [];
  }
}

// Agent definition
const memory = new Memory();

export const slackSearchAgent = new Agent({
  name: 'Slack Search Agent',
  instructions: `
      This agent helps you search and retrieve information from Slack conversations.
      You can ask it to index conversations or search for specific topics.
      It can also list available Slack channels.
  `,
  model: openai('gpt-4o'),
  tools: {
    indexSlackConversationsTool,
    searchIndexedConversationsTool,
  },
  memory,
});

// RAG Function
export async function answerQueryWithContext(userQuery: string): Promise<string> {
  try {
    const searchResults = await searchIndexedMessages(userQuery, 3);

    if (!searchResults || searchResults.length === 0) {
      return "No relevant information found in the indexed Slack messages to answer your query.";
    }

    const contextString = searchResults
      .map(doc => doc.pageContent)
      .join("\n---\n"); // Using a clear separator for context sections

    const prompt = `
You are a helpful assistant. Based on the following excerpts from Slack conversations, please answer the user's query.
If the provided excerpts do not contain enough information to answer the query, please state that you could not find a specific answer in the provided context.

Context from Slack conversations:
---
${contextString}
---
User Query: ${userQuery}

Answer:
    `;

    // Assuming slackSearchAgent.model is accessible here.
    // If slackSearchAgent is not directly in scope, the model instance would need to be passed.
    const { text } = await generateText({
      model: slackSearchAgent.model, 
      prompt: prompt,
      maxTokens: 500, // Limiting token output for conciseness
    });

    return text;

  } catch (error) {
    console.error("Error answering query with context:", error);
    return "Sorry, an error occurred while trying to answer your query.";
  }
}
