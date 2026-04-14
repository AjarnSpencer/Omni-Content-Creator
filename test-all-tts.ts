import { GoogleGenAI, Modality } from "@google/genai";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API key");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const models = [
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-flash-tts',
    'gemini-2.5-flash-lite-preview-tts',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3.0-flash-preview',
    'gemini-3.1-flash-preview',
  ];

  for (const model of models) {
    try {
      console.log(`Testing ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: 'Hello' }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });
      console.log(`Success with ${model}!`);
      return;
    } catch (e: any) {
      console.log(`Failed with ${model}: ${e.message}`);
    }
  }
}

test();
