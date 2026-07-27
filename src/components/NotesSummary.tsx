import React, { useState } from 'react';
import { Heart, Copy, Check, BookOpen, Calendar, Share2, FileText } from 'lucide-react';
import { MonthlyJournal } from '../types';

interface NotesSummaryProps {
  journal: MonthlyJournal;
  onSelectDay: (dayNum: number) => void;
}

export const NotesSummary: React.FC<NotesSummaryProps> = ({ journal, onSelectDay }) => {
  const [copied, setCopied] = useState(false);

  // Entries where user wrote any reflection or action
  const annotatedEntries = journal.entries.filter((entry) => {
    const hasReflections = entry.userReflections?.some((r) => r.trim().length > 0);
    const hasPasso =
      entry.userPassoAmor?.renunciar?.trim() ||
      entry.userPassoAmor?.iniciar?.trim() ||
      entry.userPassoAmor?.melhorar?.trim();
    return hasReflections || hasPasso;
  });

  const handleCopySummary = () => {
    let summaryText = `*MINHAS RESPOSTAS DE AMOR - ${journal.monthName.toUpperCase()} ${journal.year}*\n\n`;

    annotatedEntries.forEach((entry) => {
      summaryText += `📌 *${entry.dateFormatted} (${entry.diaDaSemana})*\n`;

      if (entry.userPassoAmor?.renunciar) {
        summaryText += `  • Renunciar: ${entry.userPassoAmor.renunciar}\n`;
      }
      if (entry.userPassoAmor?.iniciar) {
        summaryText += `  • Iniciar: ${entry.userPassoAmor.iniciar}\n`;
      }
      if (entry.userPassoAmor?.melhorar) {
        summaryText += `  • Melhorar: ${entry.userPassoAmor.melhorar}\n`;
      }

      if (entry.userReflections) {
        entry.userReflections.forEach((ref, idx) => {
          if (ref.trim()) {
            summaryText += `  Reflexão ${idx + 1}: ${ref}\n`;
          }
        });
      }
      summaryText += `\n`;
    });

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto px-3 sm:px-4 pt-3 space-y-5 animate-fadeIn text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/30 text-white rounded-3xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/20 backdrop-blur-2xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-500/30 to-pink-500/30 rounded-2xl border border-white/20 text-pink-300 backdrop-blur-md">
              <Heart className="w-6 h-6 fill-pink-300" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-white">
                Minhas Respostas de Amor
              </h2>
              <p className="text-xs text-white/70">
                Resumo dos seus compromissos e anotações ({journal.monthName} {journal.year})
              </p>
            </div>
          </div>

          {annotatedEntries.length > 0 && (
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-300 border border-white/20 text-xs font-semibold transition-all backdrop-blur-md"
              title="Copiar Resumo"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          )}
        </div>
      </div>

      {/* List of Annotated Entries */}
      {annotatedEntries.length > 0 ? (
        <div className="space-y-4">
          {annotatedEntries.map((entry) => (
            <div
              key={entry.dayNumber}
              className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    {entry.dateFormatted} • {entry.diaDaSemana}
                  </h3>
                  <p className="text-xs text-white/60">{entry.liturgia.santoDoDia}</p>
                </div>

                <button
                  onClick={() => onSelectDay(entry.dayNumber)}
                  className="text-xs font-bold text-pink-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/15 transition-all backdrop-blur-md"
                >
                  Ver no Diário →
                </button>
              </div>

              {/* Passo de Amor */}
              {entry.userPassoAmor && (
                <div className="space-y-1.5 text-xs bg-white/5 p-3.5 rounded-2xl border border-white/15 backdrop-blur-md">
                  <p className="font-bold text-purple-200 text-[11px] uppercase tracking-wider">
                    Um Passo como Resposta de Amor:
                  </p>
                  {entry.userPassoAmor.renunciar && (
                    <p className="text-red-200">
                      <strong className="text-red-300">Renunciar:</strong> {entry.userPassoAmor.renunciar}
                    </p>
                  )}
                  {entry.userPassoAmor.iniciar && (
                    <p className="text-emerald-200">
                      <strong className="text-emerald-300">Iniciar:</strong> {entry.userPassoAmor.iniciar}
                    </p>
                  )}
                  {entry.userPassoAmor.melhorar && (
                    <p className="text-amber-200">
                      <strong className="text-amber-300">Melhorar:</strong> {entry.userPassoAmor.melhorar}
                    </p>
                  )}
                </div>
              )}

              {/* User Reflections */}
              {entry.userReflections && entry.userReflections.some((r) => r.trim().length > 0) && (
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-purple-200 text-[11px] uppercase tracking-wider">
                    Minhas Reflexões:
                  </p>
                  {entry.userReflections.map((ref, idx) => {
                    if (!ref.trim()) return null;
                    return (
                      <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                        <span className="font-semibold text-white/80 block mb-0.5">
                          {entry.paraRefletir[idx]}
                        </span>
                        <p className="text-white font-serif italic">{ref}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 backdrop-blur-md rounded-3xl border border-dashed border-white/20 p-6 space-y-2">
          <FileText className="w-10 h-10 text-white/40 mx-auto" />
          <p className="text-white font-bold text-sm">
            Nenhuma anotação registrada ainda este mês.
          </p>
          <p className="text-xs text-white/60 max-w-sm mx-auto">
            Acesse o diário de hoje para responder às perguntas de reflexão e registrar seus passos de amor!
          </p>
        </div>
      )}
    </div>
  );
};
