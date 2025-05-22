import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { weatherTool } from '../tools';
import { slackSearchAgent } from './slackAgent';

const memory = new Memory();

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative
      - Remember user preferences and frequently asked locations
      - Use the memory to provide personalized weather information

      Use the weatherTool to fetch current weather data.
  `,
  model: openai('gpt-4o'),
  tools: { weatherTool },
  memory,
});

export { slackSearchAgent };
