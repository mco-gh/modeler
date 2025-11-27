import { GoogleGenAI } from "@google/genai";

const getPromptForStage = (basePrompt: string, stageId: number, isReference: boolean): string => {
  if (isReference) {
    // Prompts when converting the reference (Stage 4) to other stages
    switch (stageId) {
      case 1:
        return `Transform this reference image of ${basePrompt} into the very first stage of sculpting: A single, smooth, amorphous lump of wet grey clay. It should capture the approximate volume and silhouette of the subject but must have ABSOLUTELY NO INTERNAL DETAIL. No face, no limbs defined, no texture. It should look like a smooth potato-shaped mass or a river stone in the vague shape of the subject. Keep the exact same camera angle and lighting.`;
      case 2:
        return `Transform this reference image of ${basePrompt} into the blocking stage: The subject is constructed from distinct, crude geometric masses of clay (spheres, cylinders, blocks) pressed together. It shows the correct configuration, pose, and orientation of the final product, but the forms are simple and facetted. NO fine details, NO eyes, NO hair texture. It looks like a low-resolution structural study. Keep the exact same camera angle.`;
      case 3:
        return `Transform this reference image of ${basePrompt} into a work-in-progress stage: The geometric blocks have been smoothed together and the primary anatomy is defined. Details are just beginning to emerge—eyes and features are faintly marked or sketched. The surface is rough, covered in rake marks, thumb prints, and clay pellets. It looks like an expressive, unfinished bozzetto. Keep the exact same camera angle.`;
      default:
        return `A clay sculpture of ${basePrompt}`;
    }
  }

  // Initial generation for Stage 4
  if (stageId === 4) {
    return `A finished, highly detailed masterpiece wet grey clay sculpture of ${basePrompt}. Intricate textures, lifelike details, perfect proportions. The clay looks wet and malleable. Dramatic studio lighting. Photorealistic studio photography.`;
  }
  return `A clay sculpture of ${basePrompt}`;
};

export const generateStageImage = async (
  prompt: string,
  stageId: number,
  referenceImageBase64?: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const effectivePrompt = getPromptForStage(prompt, stageId, !!referenceImageBase64);

    const parts: any[] = [];
    
    if (referenceImageBase64) {
      // Clean base64 string if it has prefix
      const base64Data = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/png'
        }
      });
    }
    
    parts.push({ text: effectivePrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error(`Error generating stage ${stageId}:`, error);
    throw error;
  }
};
