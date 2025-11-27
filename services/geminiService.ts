import { GoogleGenAI } from "@google/genai";

const getPromptForStage = (userDescription: string, stageId: number, hasReference: boolean): string => {
  const baseObject = `a sculpture of '${userDescription}'`;
  
  // If we have a reference image (Stages 1-3), the prompt is an instruction to transform that image.
  // If we don't (Stage 4), it's a generation prompt.
  
  if (hasReference) {
    switch (stageId) {
      case 1:
        // Stage 1: One ball of clay / General shape / No detail
        return `Transform this reference image of ${userDescription} into the very first stage of sculpting: A single, smooth, amorphous lump of wet grey clay. It should capture the approximate volume and silhouette of the subject but must have ABSOLUTELY NO INTERNAL DETAIL. No face, no limbs defined, no texture. It should look like a smooth potato-shaped mass or a river stone in the vague shape of the subject. Keep the exact same camera angle and lighting.`;
      
      case 2:
        // Stage 2: Sub-blocks / Configuration / No details
        return `Transform this reference image of ${userDescription} into the blocking stage: The subject is constructed from distinct, crude geometric masses of clay (spheres, cylinders, blocks) pressed together. It shows the correct configuration, pose, and orientation of the final product, but the forms are simple and facetted. NO fine details, NO eyes, NO hair texture. It looks like a low-resolution structural study. Keep the exact same camera angle.`;
      
      case 3:
        // Stage 3: Details begin to emerge
        return `Transform this reference image of ${userDescription} into a work-in-progress stage: The geometric blocks have been smoothed together and the primary anatomy is defined. Details are just beginning to emerge—eyes and features are faintly marked or sketched. The surface is rough, covered in rake marks, thumb prints, and clay pellets. It looks like an expressive, unfinished bozzetto. Keep the exact same camera angle.`;
      
      default:
        return `A clay sculpture of ${userDescription}`;
    }
  }

  // Initial generation (Stage 4)
  if (stageId === 4) {
      return `A finished, highly detailed masterpiece wet grey clay sculpture of ${userDescription}. Intricate textures, lifelike details, perfect proportions. The clay looks wet and malleable. Dramatic studio lighting. Photorealistic studio photography.`;
  }

  // Fallback
  return `A clay sculpture of ${userDescription}`;
};

export const generateStageImage = async (userPrompt: string, stageId: number, referenceImageBase64?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const hasReference = !!referenceImageBase64;
    const stagePrompt = getPromptForStage(userPrompt, stageId, hasReference);

    const parts: any[] = [];

    // If we have a reference image, add it to the parts
    if (referenceImageBase64) {
        // Strip the data URL prefix if present to get just the base64 string
        const base64Data = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        
        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: 'image/png' // We assume PNG based on previous output
            }
        });
    }

    // Add the text prompt
    parts.push({ text: stagePrompt });

    // Using the requested High-Quality model (Gemini 3 Pro Image)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error(`Error generating stage ${stageId}:`, error);
    throw error;
  }
};