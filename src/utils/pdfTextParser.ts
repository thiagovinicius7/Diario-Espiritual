import { MonthlyJournal, JournalEntry } from '../types';
import { july2026Journal } from '../data/july2026Data';

// Fallback local text parser for Catholic Daily Journals
export function parseJournalTextLocally(
  text: string,
  monthTitle: string = 'Novo Mês'
): MonthlyJournal {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  
  const entries: JournalEntry[] = [];
  let currentDay = 1;

  // Split text by day markers (e.g. "01 de", "Dia 1", "01/", "1 -", "1 DE")
  const dayRegex = /(?:dia\s*0?(\d+)|0?(\d+)\s*de\s*([a-zçáàâãéêíóôõú]+)|^\s*0?(\d+)[\s/\.-])/i;

  // Simple heuristic block splitting
  const blocks = text.split(/(?=\b(?:dia\s*\d+|\d{1,2}\s*de\s*[a-zçáàâãéêíóôõú]+|\d{1,2}\s*[\/\.-]\s*\d{1,2})\b)/i);

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b].trim();
    if (!block || block.length < 20) continue;

    const match = block.match(dayRegex);
    const dayNum = match ? parseInt(match[1] || match[2] || match[4], 10) : currentDay;

    if (dayNum && !isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      currentDay = dayNum;

      // Extract sections
      const linesInBlock = block.split('\n').map((l) => l.trim());

      let liturgiaCor = 'Verde';
      if (/roxo|quaresma|advento/i.test(block)) liturgiaCor = 'Roxo';
      else if (/branco|festa|solenidade|mártir/i.test(block)) liturgiaCor = 'Branco';
      else if (/vermelho|paixão|pentecostes/i.test(block)) liturgiaCor = 'Vermelho';
      else if (/rosa/i.test(block)) liturgiaCor = 'Rosa';

      // Extract readings
      const readingsMatch = block.match(/(?:leituras?|evangelho|liturgia):\s*([^\n]+)/i);
      const leituras = readingsMatch ? readingsMatch[1] : 'Liturgia do Dia';

      // Extract para meditar
      const meditarMatch = block.match(/(?:para meditar|meditação|reflexão|meditando)([\s\S]*?)(?:para refletir|perguntas|oremos|$)/i);
      const paraMeditar = meditarMatch ? meditarMatch[1].trim() : linesInBlock.slice(2, 8).join('\n');

      // Extract para refletir
      const refletirMatch = block.match(/(?:para refletir|perguntas|questões)([\s\S]*?)(?:oremos|oração|$)/i);
      let paraRefletir: string[] = [];
      if (refletirMatch) {
        paraRefletir = refletirMatch[1]
          .split('\n')
          .map((q) => q.trim())
          .filter((q) => q.length > 5);
      }
      if (paraRefletir.length === 0) {
        paraRefletir = [
          '1 - O que esta palavra de hoje fala ao meu coração?',
          '2 - Quais atitudes concretas Deus está me pedindo hoje?',
          '3 - Como posso testemunhar esse ensinamento na minha vida?'
        ];
      }

      // Extract oremos
      const oremosMatch = block.match(/(?:oremos|oração|oração final)([\s\S]*?)(?=$)/i);
      const oremos = oremosMatch
        ? oremosMatch[1].trim()
        : 'Senhor Jesus, obrigado por tua palavra viva que ilumina meus passos. Concede-me a graça de viver segundo os teus ensinamentos neste dia. Amém.';

      const dateFormatted = `${dayNum < 10 ? '0' + dayNum : dayNum} de ${monthTitle}`;

      entries.push({
        dayNumber: dayNum,
        dateFormatted,
        diaDaSemana: 'Dia de Oração',
        semanaLiturgica: 'Tempo Comum',
        liturgia: {
          cor: liturgiaCor,
          leituras,
          evangelhoRef: leituras,
          evangelhoFrase: linesInBlock[1] || 'Palavra do Senhor. Graças a Deus.',
          santoDoDia: 'Santos do Dia',
        },
        paraMeditar: paraMeditar || block.slice(0, 300),
        paraRefletir,
        oremos,
      });
    }
  }

  // If no entries parsed, create a structured month with text block
  if (entries.length === 0) {
    for (let d = 1; d <= 31; d++) {
      entries.push({
        dayNumber: d,
        dateFormatted: `${d < 10 ? '0' + d : d} de ${monthTitle}`,
        diaDaSemana: 'Dia de Meditação',
        semanaLiturgica: 'Tempo Comum',
        liturgia: {
          cor: 'Verde',
          leituras: 'Liturgia Diária',
          evangelhoRef: 'Evangelho do Dia',
          evangelhoFrase: 'O Senhor é o meu pastor, nada me faltará.',
          santoDoDia: 'Santo do Dia',
        },
        paraMeditar: text.length > 100 ? text.slice((d - 1) * 200, d * 200) || text : text,
        paraRefletir: [
          '1 - O que esta leitura desperta em mim hoje?',
          '2 - Como colocar em prática este ensinamento?',
          '3 - Qual o meu compromisso com Deus para este dia?'
        ],
        oremos: 'Senhor, abençoa o meu dia e guia os meus passos na tua paz. Amém.',
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
