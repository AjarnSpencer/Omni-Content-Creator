import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post('/api/gemini/generateContent', async (req, res) => {
    try {
      // The AI Studio environment automatically injects API_KEY
      // When deployed, you will provide your own paid API key in the environment variables
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API_KEY is not set on the server.' });
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const { model, contents, config } = req.body;
      
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      
      res.json(response);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(error.status || 500).json({ 
        error: error.message || 'An error occurred during generation',
        status: error.status
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
