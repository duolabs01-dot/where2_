
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Create instance inside function to ensure fresh API key as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateTextExpansion = async (context: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Expand on this idea poetically and deeply. Keep it concise (under 100 words). Context: ${context}`,
    config: {
      temperature: 0.8,
      topP: 0.95,
    }
  });
  return response.text || "The muse is silent. Try again.";
};

export const brainstormIdea = async (): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: "Give me one profound, abstract creative prompt for a writer or artist. Something that starts with 'What if...' or 'Imagine...'",
    config: {
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });
  return response.text || "Imagine a world without colors.";
};

export const visualizeIdea = async (prompt: string): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A minimalist, cinematic visual representation of: ${prompt}. Artistic, high resolution, soft lighting.` }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const animateBlock = async (prompt: string, imageBase64?: string): Promise<string | null> => {
  const ai = getAI();
  
  const videoConfig: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt: `An ethereal animated version of: ${prompt}`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  };

  if (imageBase64) {
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
    videoConfig.image = {
      imageBytes: cleanBase64,
      mimeType: 'image/png'
    };
  }

  let operation = await ai.models.generateVideos(videoConfig);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) return null;

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
