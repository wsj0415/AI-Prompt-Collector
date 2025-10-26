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

export const generateImage = async (promptText: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: promptText,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image was generated by the API.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image with AI. Please try again.");
  }
};

export const generateVideo = async (promptText: string): Promise<string> => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it uses the latest key.
  const aiForVideo = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  try {
    let operation = await aiForVideo.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: promptText,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        // @ts-ignore
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download the generated video. Status: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return videoUrl;

  } catch (error) {
    console.error("Error generating video:", error);
    
    // Convert the whole error object to a string to reliably check for the key error message.
    const errorString = JSON.stringify(error);
    if (errorString.includes("Requested entity was not found.")) {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
           // @ts-ignore
           await window.aistudio.openSelectKey();
           // Re-throw a user-friendly message to guide the user.
           throw new Error("API key is invalid. Please select a valid key in the dialog and try again.");
        }
    }
    
    // @ts-ignore
    const errorMessage = error?.message || "An unknown error occurred during video generation.";
    throw new Error(errorMessage);
  }
};
