import { tool } from '@mastra/core';
import { z } from 'zod';
import { 
  getSlackWebClient, 
  fetchSlackChannels, 
  fetchChannelMessages, 
  indexSlackMessages, 
  answerQueryWithContext,
  initializeVectorStore // Import initializeVectorStore
} from '../agents/slackAgent'; // Adjust path as needed

export const indexSlackConversationsTool = tool({
  name: 'indexSlackConversationsTool',
  description: "Indexes Slack conversations. Can specify a channel ID to index a particular channel, otherwise it attempts to index recent messages from available public channels.",
  schema: z.object({
    channelId: z.string().optional(),
    limitPerChannel: z.number().optional().default(50),
  }),
  execute: async ({ channelId, limitPerChannel }) => {
    try {
      // Ensure vector store is initialized before indexing
      await initializeVectorStore(); 
      
      const client = getSlackWebClient();
      if (!client) {
        return "Error: Slack WebClient not available. Check SLACK_BOT_TOKEN.";
      }

      let channelsToProcess: Array<{ id: string, name?: string }> = [];
      let messagesIndexedCount = 0;
      let channelsProcessedCount = 0;

      if (channelId) {
        // Fetching info for a single channel to confirm it exists (optional, fetchChannelMessages will error if not)
        // For simplicity, we assume channelId is valid if provided.
        channelsToProcess.push({ id: channelId });
      } else {
        const fetchedChannels = await fetchSlackChannels(client);
        if (!fetchedChannels || fetchedChannels.length === 0) {
          return "No public channels found to index or unable to fetch channels.";
        }
        channelsToProcess = fetchedChannels.filter(ch => ch.id).map(ch => ({ id: ch.id!, name: ch.name }));
      }

      if (channelsToProcess.length === 0) {
        return "No channels selected for indexing.";
      }

      for (const channel of channelsToProcess) {
        const messages = await fetchChannelMessages(client, channel.id, limitPerChannel);
        if (messages && messages.length > 0) {
          const transformedMessages = messages
            .filter(msg => msg.text && msg.text.trim().length > 5 && msg.id) // Basic filter for meaningful messages
            .map(msg => ({
              text: msg.text!,
              id: msg.id!,
              user: msg.user,
              ts: msg.ts,
            }));
          
          if (transformedMessages.length > 0) {
            await indexSlackMessages(transformedMessages);
            messagesIndexedCount += transformedMessages.length;
          }
        }
        channelsProcessedCount++;
      }

      if (messagesIndexedCount > 0) {
        return `Successfully indexed ${messagesIndexedCount} messages from ${channelsProcessedCount} channel(s).`;
      } else {
        return `No new messages were indexed from the ${channelsProcessedCount} channel(s) processed.`;
      }

    } catch (error: any) {
      console.error("Error in indexSlackConversationsTool:", error);
      return `Error indexing Slack conversations: ${error.message || 'Unknown error'}`;
    }
  },
});

export const searchIndexedConversationsTool = tool({
  name: 'searchIndexedConversationsTool',
  description: "Searches the indexed Slack conversations using the provided query and returns a summarized answer based on relevant messages.",
  schema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    try {
      // Ensure vector store is initialized before searching
      await initializeVectorStore();
      const answer = await answerQueryWithContext(query);
      return answer;
    } catch (error: any) {
      console.error("Error in searchIndexedConversationsTool:", error);
      return `Error searching indexed conversations: ${error.message || 'Unknown error'}`;
    }
  },
});
