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
      contents: `From the following list of AI prompts, identify the ones that are most semantically relevant to the user's search query.
      Search Query: "${searchQuery}"
      
      Available Prompts (as JSON objects):
      ${JSON.stringify(promptObjectsForAI)}
      
      Return a JSON object with a single key "relevantPromptIds" which is an array of the IDs of the most relevant prompts, ordered from most to least relevant. Return a maximum of 10 relevant IDs.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevantPromptIds: {
              type: Type.ARRAY,
              description: "An array of relevant prompt ID strings.",
              items: { type: Type.STRING }
            }
          }
        },
      }
    });

    const jsonText = response.text;
    const parsedResponse = JSON.parse(jsonText) as { relevantPromptIds: string[] };
    return parsedResponse.relevantPromptIds;
  } catch (error) {
    console.error("Error finding relevant prompts:", error);
    throw new Error("AI search failed. Please check your query or try again.");
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
        throw new Error("Failed to run test with AI. Please try again.");
    }
};

export const evaluateTestResult = async (promptText: string, outputText: string): Promise<Evaluation> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Perform a detailed evaluation of the AI-generated output based on the original prompt.

            **Original Prompt:**
            "${promptText}"
            
            **AI Output:**
            "${outputText}"
            
            **Evaluation Rubric:**
            1.  **Fidelity (Adherence to Instructions):** How well did the output follow ALL instructions, constraints, and negative constraints in the prompt? (Weight: 40%)
            2.  **Quality & Clarity:** Is the output well-written, clear, coherent, and free of major errors? (Weight: 30%)
            3.  **Creativity & Nuance:** Does the output show originality, creativity, or a deep understanding of the prompt's intent, especially for complex or abstract requests? (Weight: 30%)
            
            **Your Task:**
            Based on the rubric above, provide a JSON response with two fields:
            1.  \`score\`: A numerical score from 1 to 10, where 1 is poor and 10 is excellent, reflecting a weighted average of the rubric.
            2.  \`feedback\`: A constructive feedback string (2-3 sentences) explaining the score. The feedback should be specific, mentioning what the AI did well and where it could improve, referencing the rubric categories.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "A score from 1 to 10." },
                        feedback: { type: Type.STRING, description: "Constructive feedback referencing the rubric." }
                    },
                    required: ["score", "feedback"]
                }
            }
        });

        const jsonText = response.text;
        const parsed = JSON.parse(jsonText) as Evaluation;
        // Clamp score to be safe
        parsed.score = Math.max(1, Math.min(10, parsed.score));
        return parsed;

    } catch (error) {
        console.error("Error evaluating test result:", error);
        throw new Error("Failed to evaluate test result with AI.");
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
            },
        });

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error('Error generating image:', error);
        throw new Error('Failed to generate image. The model may have safety restrictions.');
    }
};

export const generateVideo = async (prompt: string): Promise<string> => {
    try {
        // Re-initialize client to ensure latest API key is used, per guidelines
        const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });

        let operation = await videoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            operation = await videoAi.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }
        
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video file. Status: ${videoResponse.status}`);
        }
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);
    } catch (error) {
        console.error('Error generating video:', error);
        const errorMessage = String(error);
        if (errorMessage.includes("Requested entity was not found.")) {
             // @ts-ignore
             if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                 // @ts-ignore
                 await window.aistudio.openSelectKey();
             }
            throw new Error('API key not found or invalid. Please select a valid key and try again.');
        }
        throw new Error('Failed to generate video. Please try again later.');
    }
};

export const enhancePrompt = async (promptText: string, enhancementType: 'improve' | 'variations'): Promise<string[]> => {
  let userInstruction = '';
  if (enhancementType === 'improve') {
    userInstruction = `Analyze the following AI prompt and improve its clarity, detail, and effectiveness. The goal is to make it more likely to produce a high-quality, specific, and creative result from a generative AI model. Provide 3 improved versions.
    
    Prompt to improve: "${promptText}"
    
    Return a JSON object with a single key "suggestions" which is an array of the 3 improved prompt strings.`;
  } else { // 'variations'
    userInstruction = `Analyze the following AI prompt and generate 3 creative variations. The variations should explore different angles, styles, or subjects based on the original concept.
    
    Prompt for variations: "${promptText}"

    Return a JSON object with a single key "suggestions" which is an array of the 3 new prompt variation strings.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userInstruction,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              description: "An array of 3 prompt suggestion strings.",
              items: { type: Type.STRING }
            }
          }
        },
      }
    });

    const jsonText = response.text;
    const parsedResponse = JSON.parse(jsonText) as { suggestions: string[] };
    return parsedResponse.suggestions;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    throw new Error("Failed to get AI suggestions. Please try again.");
  }
};