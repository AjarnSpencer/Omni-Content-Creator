import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: 'Hello world' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    console.log("Success with gemini-2.5-flash");
  } catch (e: any) {
    console.error("Failed with gemini-2.5-flash:", e.message);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-tts",
      contents: [{ parts: [{ text: 'Hello world' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    console.log("Success with gemini-2.5-flash-tts");
  } catch (e: any) {
    console.error("Failed with gemini-2.5-flash-tts:", e.message);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: 'Hello world' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    console.log("Success with gemini-2.5-flash-preview-tts");
  } catch (e: any) {
    console.error("Failed with gemini-2.5-flash-preview-tts:", e.message);
  }
}

test();
