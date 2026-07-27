import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limits for uploading PDF files as base64
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS for API routes
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Initialize Gemini client lazily
  function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API to parse uploaded monthly PDF document or text into structured MonthlyJournal
  app.post('/api/parse-pdf', async (req, res) => {
    try {
      const { fileBase64, mimeType = 'application/pdf', textPrompt, customMonthName } = req.body;

      if (!fileBase64 && !textPrompt) {
        return res.status(400).json({ error: 'Nenhum arquivo ou texto foi fornecido.' });
      }

      const ai = getGenAI();

      const parts: any[] = [];

      // If textPrompt contains extracted PDF text, use text-based processing to avoid large base64 payload overhead
      if (fileBase64 && (!textPrompt || textPrompt.length < 100)) {
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        });
      }

      const promptText = `
Você é um assistente especialista em Diários Espirituais Católicos.
Analise este documento (PDF/Imagem/Texto) de um libreto mensal de Diário Espiritual.
Extraia todas as informações organizadas por cada dia do mês.

Se o mês e ano não estiverem explícitos, deduza ou use o nome informado: "${customMonthName || 'Próximo Mês'}".

Retorne um JSON estritamente no seguinte formato:
{
  "id": "slug-do-mes",
  "title": "DIÁRIO ESPIRITUAL",
  "monthName": "Nome do Mês (ex: Agosto)",
  "year": 2026,
  "coverColor": "#1e4620",
  "dicasAproveitamento": [
    "Dica 1...",
    "Dica 2..."
  ],
  "entries": [
    {
      "dayNumber": 1,
      "dateFormatted": "01 de Agosto",
      "diaDaSemana": "Quinta-feira",
      "semanaLiturgica": "18° Semana do Tempo Comum",
      "liturgia": {
        "cor": "Verde",
        "leituras": "Jr 18,1-6 | Sl 145 | Mt 13,47-53",
        "evangelhoRef": "Mt 13,47-53",
        "evangelhoFrase": "Frase destacada do Evangelho",
        "santoDoDia": "Nome do Santo do dia"
      },
      "paraMeditar": "Texto completo da meditação espiritual do dia...",
      "paraRefletir": [
        "1 - Pergunta de reflexão 1?",
        "2 - Pergunta de reflexão 2?",
        "3 - Pergunta de reflexão 3?"
      ],
      "oremos": "Oração guiada de encerramento do dia..."
    }
  ]
}

Atenção:
1. Extraia o máximo de dias encontrados (ex: todos os 30 ou 31 dias).
2. Se a cor litúrgica não constar, coloque "Verde". As cores possíveis são "Verde", "Vermelho", "Branco", "Roxo", "Rosa".
3. Mantenha os textos fiéis ao conteúdo católico do documento.
`;

      parts.push({ text: promptText + (textPrompt ? `\n\nConteúdo adicional:\n${textPrompt}` : '') });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonOutput = response.text;
      if (!jsonOutput) {
        throw new Error('Não foi possível extrair conteúdo do documento.');
      }

      const parsedData = JSON.parse(jsonOutput);
      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Error parsing PDF:', err);
      return res.status(500).json({
        error: 'Erro ao processar o arquivo.',
        details: err?.message || 'Falha na comunicação com o serviço de IA.',
      });
    }
  });

  // API endpoint for Text-to-Speech (reading meditation/prayer aloud)
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice = 'Kore' } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Texto não fornecido.' });
      }

      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Leia com voz devocional, calma e serena em português do Brasil: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('Nenhum áudio foi gerado.');
      }

      return res.json({ success: true, audioBase64: base64Audio, mimeType: 'audio/pcm;rate=24000' });
    } catch (err: any) {
      console.error('TTS Error:', err);
      return res.status(500).json({
        error: 'Não foi possível gerar a leitura em áudio.',
        details: err?.message,
      });
    }
  });

  // Vite middleware in dev, static server in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Diário Espiritual Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
