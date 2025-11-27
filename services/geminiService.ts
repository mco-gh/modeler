
import { GoogleGenAI } from "@google/genai";

const getPromptForStage = (userDescription: string, stageId: number, hasReference: boolean, isInitialGeneration: boolean): string => {
  const baseDescription = userDescription ? `of ${userDescription}` : "based on the provided image";
  
  // If we have a reference image (Stages 1-3 AND Stage 4 if uploaded by user), the prompt is an instruction to transform that image.
  
  // CASE A: Transformation (Stages 1-3 using Stage 4 as ref) OR (Stage 4 using User Upload as ref)
  if (hasReference) {
    if (stageId === 4 && isInitialGeneration) {
        // Special case: Initial generation using a user uploaded image
        return `Create a finished, highly detailed masterpiece wet grey clay sculpture based on this reference image. Interpret the subject in the image as a sculpture. Intricate textures, lifelike details, perfect proportions. The clay looks wet and malleable. Dramatic studio lighting. Photorealistic studio photography.`;
    }

    switch (stageId) {
      case 1:
        // Stage 1: One ball of clay / General shape / No detail
        return `Transform this reference image of a sculpture into the very first stage of its creation: A single, smooth, amorphous lump of wet grey clay. It should capture the approximate volume and silhouette of the subject but must have ABSOLUTELY NO INTERNAL DETAIL. No face, no limbs defined, no texture. It should look like a smooth potato-shaped mass or a river stone in the vague shape of the subject. Keep the exact same camera angle and lighting as the reference.`;
      
      case 2:
        // Stage 2: Sub-blocks / Configuration / No details
        return `Transform this reference image of a sculpture into the blocking stage: The subject is constructed from distinct, crude geometric masses of clay (spheres, cylinders, blocks) pressed together. It shows the correct configuration, pose, and orientation of the final product, but the forms are simple and facetted. NO fine details, NO eyes, NO hair texture. It looks like a low-resolution structural study. Keep the exact same camera angle as the reference.`;
      
      case 3:
        // Stage 3: Details begin to emerge
        return `Transform this reference image of a sculpture into a work-in-progress stage: The geometric blocks have been smoothed together and the primary anatomy is defined. Details are just beginning to emerge—eyes and features are faintly marked or sketched. The surface is rough, covered in rake marks, thumb prints, and clay pellets. It looks like an expressive, unfinished bozzetto. Keep the exact same camera angle as the reference.`;
      
      default:
        // Should not happen for stages 1-3 if reference is provided
        return `A clay sculpture ${baseDescription}`;
    }
  }

  // CASE B: Generation from Scratch (Stage 4 only, no user image)
  if (stageId === 4) {
      return `A finished, highly detailed masterpiece wet grey clay sculpture ${baseDescription}. Intricate textures, lifelike details, perfect proportions. The clay looks wet and malleable. Dramatic studio lighting. Photorealistic studio photography.`;
  }

  // Fallback
  return `A clay sculpture ${baseDescription}`;
};

/**
 * Generates an image for a specific stage.
 * 
 * @param userPrompt The text description of the sculpture.
 * @param stageId The stage number (1-4).
 * @param referenceImageBase64 The base64 string of the image to transform (used for stages 1-3, derived from stage 4).
 * @param initialInputImageBase64 The base64 string of a user-uploaded image (used for stage 4 ONLY).
 */
export const generateStageImage = async (
    userPrompt: string, 
    stageId: number, 
    referenceImageBase64?: string,
    initialInputImageBase64?: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Determine which image is the active reference for this call
    // For Stage 4: Use user uploaded image if present.
    // For Stage 1-3: Use the previously generated Stage 4 image.
    const activeReferenceImage = stageId === 4 ? initialInputImageBase64 : referenceImageBase64;
    const hasReference = !!activeReferenceImage;
    const isInitialGeneration = stageId === 4 && !!initialInputImageBase64;

    const stagePrompt = getPromptForStage(userPrompt, stageId, hasReference, isInitialGeneration);

    const parts: any[] = [];

    // If we have a reference image, add it to the parts
    if (activeReferenceImage) {
        // Strip the data URL prefix if present to get just the base64 string
        // Handles standard png/jpeg/jpg prefixes
        const base64Data = activeReferenceImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        
        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: 'image/png' // The API is generally flexible, but defining it is good practice. 
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
