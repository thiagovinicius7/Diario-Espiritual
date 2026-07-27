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

      // Always attach PDF inlineData if fileBase64 is provided
      if (fileBase64) {
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'application/pdf',
            data: cleanBase64,
          },
        });
      }

      const promptText = `
Você é um assistente especialista na leitura e estruturação de Diários Espiritual Católicos.
Analise este documento (PDF/Imagem/Texto) de um libreto mensal do Diário Espiritual.

Observe que cada dia do mês possui uma estrutura rica composta por:
1. Cabeçalho do Dia: Ex: "01 de Julho", "Quarta-feira", "13° Semana do tempo comum".
2. Caixas de Liturgia Diária: Cor litúrgica ("Verde", "Branco", "Vermelho", "Roxo", "Rosa"), Leituras bíblicas (ex: "Am 5,14-15.21-24 | Sl 49(50) | Mt 8,28-34"), Santo do dia (ex: "Santo Aarão").
3. Evangelho do Dia: Referência (ex: "Mt 8,28-34 (Leia em sua Bíblia)") e Frase destacada (ex: "Agarraram o filho querido, o mataram, e o jogaram fora da vinha.").
4. "Para meditar:": Texto completo e integral da meditação bíblica do dia.
5. "Para refletir:": As 3 perguntas numeradas de reflexão pessoal do fiel (ex: ["1 - Pergunta 1...", "2 - Pergunta 2...", "3 - Pergunta 3..."]).
6. "Um passo como resposta de amor": orientações para Ação Concreta (Renunciar, Iniciar, Melhorar).
7. "Oremos:": A oração inspirada e guiada de encerramento do dia.

Extraia com extrema fidelidade TODOS os dias presentes no documento (dia 01 até o dia 30 ou 31).
Se o nome do mês não estiver explícito, utilize: "${customMonthName || 'Julho'}".

Retorne um JSON estritamente no seguinte formato:
{
  "id": "diario-espiritual-mes",
  "title": "DIÁRIO ESPIRITUAL",
  "monthName": "${customMonthName || 'Julho'}",
  "year": 2026,
  "coverColor": "#1e4620",
  "dicasAproveitamento": [
    "Tenha um local e horário fixos para oração;",
    "Invoque o Espírito Santo...",
    "Leia o evangelho do dia em sua Bíblia...",
    "Use as perguntas para realmente refletir...",
    "É interessante você anotar suas respostas...",
    "Tente investir alguns minutos do seu dia...",
    "Procure o sacramento da confissão..."
  ],
  "entries": [
    {
      "dayNumber": 1,
      "dateFormatted": "01 de Julho",
      "diaDaSemana": "Quarta-feira",
      "semanaLiturgica": "13° Semana do tempo comum",
      "liturgia": {
        "cor": "Verde",
        "leituras": "Am 5,14-15.21-24 | Sl 49(50) | Mt 8,28-34",
        "evangelhoRef": "Mt 8,28-34",
        "evangelhoFrase": "Agarraram o filho querido, o mataram, e o jogaram fora da vinha.",
        "santoDoDia": "Santo Aarão"
      },
      "paraMeditar": "Texto completo do Para Meditar...",
      "paraRefletir": [
        "1 - Pergunta de reflexão 1",
        "2 - Pergunta de reflexão 2",
        "3 - Pergunta de reflexão 3"
      ],
      "oremos": "Texto completo da Oração Oremos..."
    }
  ]
}
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
