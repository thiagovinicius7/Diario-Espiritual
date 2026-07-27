import React, { useState } from 'react';
import { Search, CheckCircle2, Circle, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { MonthlyJournal } from '../types';

interface CalendarViewProps {
  journal: MonthlyJournal;
  activeDayNumber: number;
  onSelectDay: (dayNum: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  journal,
  activeDayNumber,
  onSelectDay,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const completedCount = journal.entries.filter((e) => e.completed).length;
  const progressPercent = Math.round((completedCount / journal.entries.length) * 100);

  // Filter entries
  const filteredEntries = journal.entries.filter((entry) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.dateFormatted.toLowerCase().includes(term) ||
      entry.liturgia.santoDoDia.toLowerCase().includes(term) ||
      entry.liturgia.leituras.toLowerCase().includes(term) ||
      entry.paraMeditar.toLowerCase().includes(term) ||
      (entry.userNotes && entry.userNotes.toLowerCase().includes(term))
    );
  });

  const getLiturgicalColorDot = (cor: string) => {
    switch (cor) {
      case 'Vermelho':
        return 'bg-red-600';
      case 'Branco':
        return 'bg-amber-300 border border-amber-500';
      case 'Roxo':
        return 'bg-purple-700';
      case 'Rosa':
        return 'bg-pink-500';
      case 'Verde':
      default:
        return 'bg-emerald-600';
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto px-3 sm:px-4 pt-3 space-y-5 animate-fadeIn text-white">
      {/* Month Title & Progress Header */}
      <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/30 text-white rounded-3xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/20 backdrop-blur-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-purple-300" />
              {journal.monthName} {journal.year}
            </h2>
            <p className="text-xs text-white/70 mt-0.5 font-medium">
              Diário Espiritual Mensal • {journal.entries.length} Dias
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold text-amber-300">
              {completedCount}/{journal.entries.length}
            </span>
            <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
              Dias Meditados
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-md">
            <div
              className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/70">
            <span>Progresso da caminhada</span>
            <span className="font-semibold text-amber-300">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar santo do dia, evangelho ou palavra..."
          className="w-full py-3 pl-10 pr-4 text-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 outline-none shadow-md font-sans text-white placeholder-white/40"
        />
        <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
        {filteredEntries.map((entry) => {
          const isSelected = entry.dayNumber === activeDayNumber;
          const isDone = entry.completed;

          return (
            <button
              key={entry.dayNumber}
              onClick={() => onSelectDay(entry.dayNumber)}
              className={`p-2.5 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between h-24 relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-tr from-purple-600/50 to-pink-600/50 text-white border-white/40 shadow-lg ring-2 ring-purple-400/50 scale-[1.03] backdrop-blur-xl'
                  : isDone
                  ? 'bg-emerald-500/15 text-white border-emerald-400/30 hover:bg-emerald-500/25 backdrop-blur-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10 backdrop-blur-md'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`font-bold text-sm ${
                    isSelected ? 'text-amber-300' : 'text-white'
                  }`}
                >
                  Dia {entry.dayNumber}
                </span>

                {/* Liturgical color indicator dot */}
                <span
                  className={`w-2.5 h-2.5 rounded-full ${getLiturgicalColorDot(
                    entry.liturgia.cor
                  )}`}
                  title={`Liturgia: ${entry.liturgia.cor}`}
                />
              </div>

              <div className="my-auto">
                <p
                  className={`text-[10px] font-medium line-clamp-1 leading-tight ${
                    isSelected ? 'text-purple-100' : 'text-white/70'
                  }`}
                >
                  {entry.liturgia.santoDoDia}
                </p>
                <p
                  className={`text-[9px] line-clamp-1 ${
                    isSelected ? 'text-amber-200' : 'text-white/50'
                  }`}
                >
                  {entry.liturgia.evangelhoRef}
                </p>
              </div>

              {/* Check indicator */}
              <div className="flex items-center justify-between w-full text-[10px] pt-1 border-t border-white/10">
                <span className={isSelected ? 'text-purple-200' : 'text-white/50'}>
                  {entry.diaDaSemana.substring(0, 3)}
                </span>
                {isDone ? (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-amber-300' : 'text-emerald-400'
                    }`}
                  />
                ) : (
                  <Circle className="w-3 h-3 text-white/20" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/20 p-6 backdrop-blur-md">
          <p className="text-white/60 text-sm">
            Nenhum dia encontrado para "<strong>{searchTerm}</strong>".
          </p>
        </div>
      )}
    </div>
  );
};
