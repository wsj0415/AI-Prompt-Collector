
import { GoogleGenAI, Type } from "@google/genai";
import type { Prompt } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

interface AutoCategorizeResponse {
  theme: string;
  tags: string[];
}

export const generateTagsAndTheme = async (promptText: string): Promise<AutoCategorizeResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following AI prompt and categorize it.
      Prompt: "${promptText}"
      
      Based on the prompt, provide:
      1. A single, concise theme (e.g., "Creative Writing", "Marketing Copy", "Software Development", "Logo Design").
      2. An array of up to 3 specific, relevant tags (e.g., ["sci-fi", "e-commerce", "python", "minimalist"]).
      
      Return the response in JSON format.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: {
              type: Type.STRING,
              description: "A single, concise theme for the prompt."
            },
            tags: {
              type: Type.ARRAY,
              description: "An array of up to 3 specific tags.",
              items: { type: Type.STRING }
            }
          }
        },
      }
    });

    const jsonText = response.text;
    const parsedResponse = JSON.parse(jsonText) as AutoCategorizeResponse;
    return parsedResponse;
  } catch (error) {
    console.error("Error generating tags and theme:", error);
    throw new Error("Failed to categorize prompt with AI. Please try again.");
  }
};

export const findRelevantPrompts = async (allPrompts: Prompt[], searchQuery: string): Promise<string[]> => {
  if (allPrompts.length === 0) {
    return [];
  }

  try {
     const promptObjectsForAI = allPrompts.map(({ id, title, theme, tags }) => ({ id, title, theme, tags }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User is searching for prompts related to: "${searchQuery}".
      
      Here is a list of available prompts:
      ${JSON.stringify(promptObjectsForAI)}
      
      Analyze the user's search query and the list of prompts. Return a JSON array containing the IDs of the prompts that are most semantically relevant to the user's search. Order the IDs from most to least relevant.`,
       config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            description: "An array of prompt IDs that are most relevant to the user's search query.",
            items: { type: Type.STRING }
        }
      }
    });

    const jsonText = response.text;
    const relevantIds = JSON.parse(jsonText) as string[];
    return relevantIds;
  } catch (error) {
    console.error("Error with AI-powered search:", error);
    throw new Error("AI search failed. Please try a different query.");
  }
};
