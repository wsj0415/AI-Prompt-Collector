
import { GoogleGenAI, Type } from "@google/genai";
import type { Prompt, Evaluation } from '../types';

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
     const promptObjectsForAI = allPrompts.map(({ id, title, theme, tags, versions, currentVersion }) => {
        const activeVersion = versions.find(v => v.version === currentVersion);
        return { 
            id, 
            title, 
            theme, 
            tags,
            promptTextSnippet: activeVersion?.promptText.substring(0, 200) || ''
        };
     });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User is searching for prompts related to: "${searchQuery}".
      
      Here is a list of available prompts (with a snippet of their text for context):
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

export const runPromptTest = async (promptText: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });
    return response.text;
  } catch (error) {
    console.error("Error running prompt test:", error);
    throw new Error("Failed to get response from AI. Please try again.");
  }
};

export const evaluateTestResult = async (promptText: string, outputText: string): Promise<Evaluation> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Evaluate the quality of an AI model's output based on the original prompt.
      
      **Original Prompt:**
      "${promptText}"

      **Model's Output:**
      "${outputText}"

      **Evaluation Criteria:**
      - **Clarity:** Is the output clear and easy to understand?
      - **Creativity:** Is the output original and creative?
      - **Adherence to Instructions:** Did the output follow all instructions from the prompt?

      **Your Task:**
      Provide a quantitative score and qualitative feedback in JSON format.
      1.  **score**: An integer score from 1 (poor) to 10 (excellent).
      2.  **feedback**: A brief, one-sentence explanation for your score.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "A score from 1 to 10."
            },
            feedback: {
              type: Type.STRING,
              description: "A brief, one-sentence explanation for the score."
            }
          }
        },
      }
    });

    const jsonText = response.text;
    const parsedResponse = JSON.parse(jsonText) as Evaluation;
    return parsedResponse;
  } catch (error) {
    console.error("Error evaluating test result:", error);
    throw new Error("AI evaluation failed. Please try again.");
  }
};