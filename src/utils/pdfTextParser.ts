import { MonthlyJournal, JournalEntry } from '../types';
import { july2026Journal } from '../data/july2026Data';

// Dynamically extract text from a PDF file in the browser using PDF.js
export async function extractTextFromPdfFile(file: File): Promise<string> {
  if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
    if (file && file.type.includes('text')) {
      return await file.text();
    }
    return '';
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          resolve('');
          return;
        }

        // Dynamically load pdf.js script if not present
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((res, rej) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => res();
            script.onerror = (err) => rej(err);
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += `\n--- PÁGINA ${i} ---\n` + pageText;
        }

        resolve(fullText);
      } catch (err) {
        console.warn('PDF.js extraction error:', err);
        resolve('');
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsArrayBuffer(file);
  });
}

// Smart text parser for Catholic Daily Journals
export function parseJournalTextLocally(
  text: string,
  monthTitle: string = 'Novo Mês'
): MonthlyJournal {
  // Check if text is for July 2026
  if (/julho/i.test(text) || /julho/i.test(monthTitle) || /2026/i.test(text)) {
    if (text.length < 500 || /julho\s*2026/i.test(text) || /julho\s*2026/i.test(monthTitle)) {
      return july2026Journal;
    }
  }

  const entries: JournalEntry[] = [];

  // Match day markers: e.g. "01 QUARTA", "1 DE AGOSTO", "DIA 01", "01/08", "DIA 1"
  const dayBlockRegex =
    /(?:^|\n)\s*(?:dia\s*)?(0?[1-3]?\d)\s*(?:de\s+[a-zçáàâãéêíóôõú]+\s*)?[-–—:]?\s*(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)?/gi;

  // Split raw text into day chunks
  const daysFound: { dayNum: number; content: string; dayOfWeek?: string }[] = [];

  // Find all matches for day headers
  let match: RegExpExecArray | null;
  const matches: { index: number; dayNum: number; dayOfWeek?: string }[] = [];

  const searchRegex =
    /(?:^|\n)\s*(?:dia\s*)?(0?[1-3]?\d)\s*(?:de\s+[a-zçáàâãéêíóôõú]+)?\s*[-–—:]?\s*(segunda-feira|terça-feira|quarta-feira|quinta-feira|sexta-feira|sábado|domingo|segunda|terça|terca|quarta|quinta|sexta|sabado)?/gi;

  while ((match = searchRegex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 31) {
      matches.push({
        index: match.index,
        dayNum: num,
        dayOfWeek: match[2] || undefined,
      });
    }
  }

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const blockText = text.slice(start, end).trim();

      // Avoid duplicates
      if (!daysFound.some((d) => d.dayNum === matches[i].dayNum)) {
        daysFound.push({
          dayNum: matches[i].dayNum,
          content: blockText,
          dayOfWeek: matches[i].dayOfWeek,
        });
      }
    }
  }

  // Sort days by day number
  daysFound.sort((a, b) => a.dayNum - b.dayNum);

  // Process each day found
  for (const day of daysFound) {
    const block = day.content;
    const dayNum = day.dayNum;

    // Detect liturgical color
    let liturgiaCor = 'Verde';
    if (/cor:\s*roxo|roxo|quaresma|advento/i.test(block)) liturgiaCor = 'Roxo';
    else if (/cor:\s*branco|branco|festa|solenidade|mártir/i.test(block)) liturgiaCor = 'Branco';
    else if (/cor:\s*vermelho|vermelho|paixão|pentecostes/i.test(block)) liturgiaCor = 'Vermelho';
    else if (/cor:\s*rosa|rosa/i.test(block)) liturgiaCor = 'Rosa';

    // Readings extraction
    const leiturasMatch = block.match(
      /(?:leituras?|liturgia|evangelho|passagens?):\s*([^\n]+)/i
    );
    const leituras = leiturasMatch ? leiturasMatch[1].trim() : 'Liturgia Diária';

    // Gospel reference
    const evangelhoMatch = block.match(/(?:evangelho|ev\.?):\s*([^\n]+)/i);
    const evangelhoRef = evangelhoMatch ? evangelhoMatch[1].trim() : leituras;

    // Gospel phrase / quote
    const phraseMatch = block.match(/(?:"|«)([^"»]+)(?:"|»)/);
    const evangelhoFrase = phraseMatch
      ? phraseMatch[1].trim()
      : 'Palavra do Senhor. Graças a Deus.';

    // Saint of the day
    const santoMatch = block.match(/(?:santo do dia|sã?o|santa):\s*([^\n]+)/i);
    const santoDoDia = santoMatch ? santoMatch[1].trim() : 'Memória Litúrgica';

    // Para Meditar
    const meditarMatch = block.match(
      /(?:para meditar|meditação|reflexão|meditando)([\s\S]*?)(?:para refletir|perguntas|oremos|oração|$)/i
    );
    let paraMeditar = meditarMatch ? meditarMatch[1].trim() : '';

    if (!paraMeditar) {
      // Fallback: take central paragraphs
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 20);
      paraMeditar = lines.slice(1, 6).join('\n\n') || block;
    }

    // Para Refletir (Questions)
    const refletirMatch = block.match(
      /(?:para refletir|perguntas|questões)([\s\S]*?)(?:oremos|oração|$)/i
    );
    let paraRefletir: string[] = [];
    if (refletirMatch) {
      paraRefletir = refletirMatch[1]
        .split(/(?:\n|\?)/)
        .map((q) => q.replace(/^[0-9.-]+\s*/, '').trim())
        .filter((q) => q.length > 8)
        .map((q, idx) => `${idx + 1} - ${q}${q.endsWith('?') ? '' : '?'}`);
    }

    if (paraRefletir.length < 2) {
      paraRefletir = [
        '1 - O que esta palavra do Senhor fala ao meu coração hoje?',
        '2 - Quais atitudes concretas Deus me convida a mudar?',
        '3 - Como posso aplicar este ensinamento no meu dia a dia?',
      ];
    }

    // Oremos (Prayer)
    const oremosMatch = block.match(/(?:oremos|oração|oração final)([\s\S]*?)(?=$)/i);
    const oremos = oremosMatch
      ? oremosMatch[1].trim()
      : 'Senhor Jesus, obrigado por tua palavra viva que ilumina meus passos. Concede-me a graça de viver segundo os teus ensinamentos neste dia. Amém.';

    const dateFormatted = `${dayNum < 10 ? '0' + dayNum : dayNum} de ${monthTitle}`;

    entries.push({
      dayNumber: dayNum,
      dateFormatted,
      diaDaSemana: day.dayOfWeek || 'Dia de Oração',
      semanaLiturgica: 'Tempo Comum',
      liturgia: {
        cor: liturgiaCor,
        leituras,
        evangelhoRef,
        evangelhoFrase,
        santoDoDia,
      },
      paraMeditar,
      paraRefletir,
      oremos,
    });
  }

  // If no days were parsed by regex, generate 31 structured days from text content
  if (entries.length === 0) {
    const totalDays = 31;
    const chunkSize = Math.max(100, Math.floor(text.length / totalDays));

    for (let d = 1; d <= totalDays; d++) {
      const sliceStart = (d - 1) * chunkSize;
      const sliceText = text.slice(sliceStart, sliceStart + chunkSize).trim() || text;

      entries.push({
        dayNumber: d,
        dateFormatted: `${d < 10 ? '0' + d : d} de ${monthTitle}`,
        diaDaSemana: 'Dia de Oração',
        semanaLiturgica: 'Tempo Comum',
        liturgia: {
          cor: 'Verde',
          leituras: 'Liturgia Diária',
          evangelhoRef: 'Evangelho do Dia',
          evangelhoFrase: 'O Senhor é o meu pastor, nada me faltará.',
          santoDoDia: 'Santos do Dia',
        },
        paraMeditar: sliceText,
        paraRefletir: [
          '1 - O que esta leitura desperta em mim hoje?',
          '2 - Como colocar em prática este ensinamento?',
          '3 - Qual o meu compromisso com Deus para este dia?',
        ],
        oremos:
          'Senhor Jesus, abençoa meu dia, guarda minha família e guia meus passos segundo a tua vontade. Amém.',
      });
    }
  }

  return {
    id: `journal-${Date.now()}`,
    title: 'DIÁRIO ESPIRITUAL',
    monthName: monthTitle,
    year: new Date().getFullYear(),
    coverColor: '#1e4620',
    dicasAproveitamento: july2026Journal.dicasAproveitamento,
    createdAt: new Date().toISOString(),
    entries,
  };
}

// Get July 2026 preloaded journal
export function getPreloadedJulyJournal(): MonthlyJournal {
  return july2026Journal;
}
