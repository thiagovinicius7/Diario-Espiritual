import React from 'react';
import { BookOpen, Calendar, HelpCircle, Flame, PlusCircle, Cross, Cloud } from 'lucide-react';
import { MonthlyJournal, UserStats } from '../types';

interface HeaderProps {
  journals: MonthlyJournal[];
  activeJournal: MonthlyJournal;
  onSelectJournal: (id: string) => void;
  onOpenUpload: () => void;
  onOpenTips: () => void;
  onOpenSync: () => void;
  stats: UserStats;
}

export const Header: React.FC<HeaderProps> = ({
  journals,
  activeJournal,
  onSelectJournal,
  onOpenUpload,
  onOpenTips,
  onOpenSync,
  stats,
}) => {
  return (
    <header className="bg-white/10 backdrop-blur-2xl text-white shadow-xl border-b border-white/15 sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-white/20 flex items-center justify-center text-purple-200 shadow-inner backdrop-blur-md">
            <Cross className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-tight tracking-wide text-white flex items-center gap-1">
              Diário Espiritual
            </h1>
            <p className="text-[10px] text-white/60 tracking-wider uppercase font-semibold">
              Caminhada de Fé
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              value={activeJournal.id}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  onOpenUpload();
                } else {
                  onSelectJournal(e.target.value);
                }
              }}
              className="bg-white/10 hover:bg-white/15 text-white font-medium text-xs py-2 px-2.5 sm:px-3 pr-7 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-400/50 appearance-none cursor-pointer transition-all max-w-[120px] sm:max-w-none truncate"
            >
              {journals.map((j) => (
                <option key={j.id} value={j.id} className="bg-slate-900 text-white">
                  {j.monthName} {j.year}
                </option>
              ))}
              <option value="__new__" className="bg-slate-900 text-amber-300">
                + Importar PDF
              </option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-purple-300 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Cloud Sync Button */}
          <button
            onClick={onOpenSync}
            className="p-2 rounded-xl bg-gradient-to-tr from-purple-500/30 to-pink-500/30 hover:brightness-110 text-pink-200 border border-white/20 backdrop-blur-md transition-all flex items-center gap-1 shadow-sm"
            title="Sincronização & Backup no Google Drive"
          >
            <Cloud className="w-4 h-4 text-pink-300" />
          </button>

          {/* Streak badge */}
          <div
            className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-amber-400/30 backdrop-blur-md shadow-sm"
            title="Sequência de Dias Meditados"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{stats.streak}</span>
          </div>

          {/* Tips Button */}
          <button
            onClick={onOpenTips}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-all"
            title="Dicas do Diário Espiritual"
          >
            <HelpCircle className="w-4 h-4 text-purple-200" />
          </button>
        </div>
      </div>
    </header>
  );
};

