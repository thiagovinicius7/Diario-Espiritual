import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  CheckCircle2,
  Check,
  Share2,
  Sparkles,
  Heart,
  BookOpen,
  Calendar as CalendarIcon,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { DailyEntry, UmPassoRespostaDeAmor } from '../types';
import { playPcmAudio, speakBrowserTTS, stopAudio } from '../utils/audio';

interface DailyJournalViewProps {
  entry: DailyEntry;
  totalDays: number;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSelectDay: (dayNum: number) => void;
  onUpdateEntry: (updated: DailyEntry) => void;
}

export const DailyJournalView: React.FC<DailyJournalViewProps> = ({
  entry,
  totalDays,
  onPrevDay,
  onNextDay,
  onSelectDay,
  onUpdateEntry,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingTts, setIsLoadingTts] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Local state for auto-saving reflections and actions
  const reflections = entry.userReflections || ['', '', ''];
  const passoAmor: UmPassoRespostaDeAmor = entry.userPassoAmor || {
    renunciar: '',
    iniciar: '',
    melhorar: '',
  };

  useEffect(() => {
    stopAudio();
    setIsPlayingAudio(false);
  }, [entry.dayNumber]);

  const handleReflectionChange = (index: number, val: string) => {
    const updatedReflections = [...reflections];
    updatedReflections[index] = val;
    onUpdateEntry({
      ...entry,
      userReflections: updatedReflections,
    });
  };

  const handlePassoAmorChange = (field: keyof UmPassoRespostaDeAmor, val: string) => {
    const updatedPasso = {
      ...passoAmor,
      [field]: val,
    };
    onUpdateEntry({
      ...entry,
      userPassoAmor: updatedPasso,
    });
  };

  const handleToggleCompleted = () => {
    const nextState = !entry.completed;
    onUpdateEntry({
      ...entry,
      completed: nextState,
      completedAt: nextState ? new Date().toISOString() : undefined,
    });
  };

  const handlePlayAudio = async (textToRead: string) => {
    if (isPlayingAudio) {
      stopAudio();
      setIsPlayingAudio(false);
      return;
    }

    setIsLoadingTts(true);
    try {
      // Call server endpoint for Gemini TTS
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToRead }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          setIsLoadingTts(false);
          setIsPlayingAudio(true);
          await playPcmAudio(data.audioBase64);
          setIsPlayingAudio(false);
          return;
        }
      }

      // Fallback to browser SpeechSynthesis
      setIsLoadingTts(false);
      setIsPlayingAudio(true);
      speakBrowserTTS(textToRead, () => setIsPlayingAudio(false));
    } catch (e) {
      console.warn('Falling back to browser TTS:', e);
      setIsLoadingTts(false);
      setIsPlayingAudio(true);
      speakBrowserTTS(textToRead, () => setIsPlayingAudio(false));
    }
  };

  const handleShareDay = () => {
    const shareText = `*${entry.dateFormatted} - ${entry.diaDaSemana}*\n\n📖 *Evangelho*: ${entry.liturgia.evangelhoRef}\n✨ *Santo do Dia*: ${entry.liturgia.santoDoDia}\n\n🙏 *Oração*: ${entry.oremos.substring(0, 180)}...\n\n_Compartilhado pelo app Diário Espiritual_`;

    if (navigator.share) {
      navigator
        .share({ title: `Diário Espiritual - ${entry.dateFormatted}`, text: shareText })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // Helper for liturgical color styles
  const getLiturgicalColorBadge = (cor: string) => {
    switch (cor) {
      case 'Vermelho':
        return 'bg-red-500/30 text-red-200 border-red-400/40';
      case 'Branco':
        return 'bg-amber-300/20 text-amber-200 border-amber-300/40';
      case 'Roxo':
        return 'bg-purple-500/30 text-purple-200 border-purple-400/40';
      case 'Rosa':
        return 'bg-pink-500/30 text-pink-200 border-pink-400/40';
      case 'Verde':
      default:
        return 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40';
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto px-3 sm:px-4 pt-3 space-y-5 animate-fadeIn">
      {/* Top Day Navigation Bar */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 sm:p-3.5 shadow-xl flex items-center justify-between gap-2">
        <button
          onClick={onPrevDay}
          disabled={entry.dayNumber <= 1}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all shrink-0"
          title="Dia Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-2">
            <select
              value={entry.dayNumber}
              onChange={(e) => onSelectDay(Number(e.target.value))}
              className="bg-white/10 text-white font-serif text-lg sm:text-xl font-bold tracking-wide border border-white/20 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer hover:bg-white/15 transition-all text-center"
            >
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white font-sans text-sm">
                  Dia {d < 10 ? '0' + d : d} - {entry.dateFormatted.replace(/^\d+\s*de\s*/i, `${d < 10 ? '0' + d : d} de `)}
                </option>
              ))}
            </select>

            {entry.completed && (
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md shrink-0">
                <Check className="w-3 h-3 mr-1" /> Feito
              </span>
            )}
          </div>
          <p className="text-xs text-white/70 font-medium mt-1">
            {entry.diaDaSemana} • {entry.semanaLiturgica}
          </p>
        </div>

        <button
          onClick={onNextDay}
          disabled={entry.dayNumber >= totalDays}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all shrink-0"
          title="Próximo Dia"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Liturgia Diária & Evangelho Card */}
      <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/30 text-white rounded-3xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/20 backdrop-blur-2xl relative overflow-hidden space-y-3.5">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <BookOpen className="w-36 h-36 text-purple-200" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
              Liturgia Diária
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${getLiturgicalColorBadge(
                entry.liturgia.cor
              )}`}
            >
              Cor: {entry.liturgia.cor}
            </span>
          </div>

          <button
            onClick={handleShareDay}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 border border-white/15 transition-all backdrop-blur-md"
            title="Compartilhar Diário do Dia"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Evangelho Header (matching page 3 of PDF) */}
        <div className="bg-amber-400/15 border border-amber-300/30 rounded-2xl p-3.5 relative z-10 space-y-1.5 backdrop-blur-md">
          <p className="font-serif font-bold text-amber-200 text-sm sm:text-base flex items-center gap-2">
            <span>📖</span> Evangelho: {entry.liturgia.evangelhoRef}{' '}
            <span className="text-xs font-normal text-amber-300/80 italic">
              (Leia em sua Bíblia)
            </span>
          </p>
          {entry.liturgia.evangelhoFrase && (
            <p className="italic text-xs text-white/90 leading-relaxed font-serif pl-6 border-l-2 border-amber-300/50">
              “{entry.liturgia.evangelhoFrase}”
            </p>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-white/90 relative z-10 pt-1">
          <p className="font-medium text-white/90 flex items-center gap-2">
            <span className="text-purple-300">📜</span> <strong className="text-amber-200">Leituras:</strong> {entry.liturgia.leituras}
          </p>
          <p className="text-xs text-white/80 flex items-center gap-2">
            <span className="text-pink-300">✨</span> <strong className="text-amber-200">Santo do Dia:</strong>{' '}
            <span className="text-white font-medium">{entry.liturgia.santoDoDia}</span>
          </p>
        </div>
      </div>

      {/* Para Meditar */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-serif font-bold text-lg text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-300" />
            Para Meditar
          </h2>

          <div className="flex items-center gap-2">
            {/* Audio Button */}
            <button
              onClick={() => handlePlayAudio(entry.paraMeditar)}
              disabled={isLoadingTts}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border transition-all shadow-md ${
                isPlayingAudio
                  ? 'bg-amber-500 text-white border-amber-400 animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-white/20 hover:brightness-110'
              }`}
            >
              {isLoadingTts ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isPlayingAudio ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>{isPlayingAudio ? 'Parar Áudio' : 'Ouvir Meditação'}</span>
            </button>
          </div>
        </div>

        {/* Text of Meditation */}
        <div className="text-white/90 text-sm sm:text-base leading-relaxed whitespace-pre-line font-serif">
          {entry.paraMeditar}
        </div>

        {/* YouTube Homily search prompt */}
        <div className="pt-2 flex justify-end">
          <a
            href={`https://www.youtube.com/results?search_query=homilia+${encodeURIComponent(
              entry.dateFormatted + ' ' + entry.liturgia.evangelhoRef
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-medium underline transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ouvir Homilia do Evangelho no YouTube
          </a>
        </div>
      </div>

      {/* Para Refletir */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-4">
        <div className="border-b border-white/10 pb-3">
          <h2 className="font-serif font-bold text-lg text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-300" />
            Para Refletir
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Use as perguntas para realmente refletir sobre sua vida e anotar suas respostas:
          </p>
        </div>

        <div className="space-y-4">
          {entry.paraRefletir.map((q, idx) => (
            <div key={idx} className="space-y-2">
              <label className="block text-sm font-semibold text-purple-200 leading-snug">
                {q}
              </label>
              <textarea
                value={reflections[idx] || ''}
                onChange={(e) => handleReflectionChange(idx, e.target.value)}
                placeholder="Escreva aqui sua reflexão pessoal para esta pergunta..."
                rows={3}
                className="w-full p-3.5 text-sm bg-white/5 border border-white/15 rounded-2xl focus:ring-2 focus:ring-purple-400/50 focus:bg-white/10 outline-none transition-all text-white placeholder-white/30 font-serif leading-relaxed backdrop-blur-md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Um Passo como Resposta de Amor */}
      <div className="bg-gradient-to-br from-white/10 via-purple-900/20 to-pink-900/20 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-4">
        <div className="border-b border-white/10 pb-3 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-purple-500/30 to-pink-500/30 rounded-2xl border border-white/20 text-pink-300 backdrop-blur-md">
            <Heart className="w-5 h-5 fill-pink-300 text-pink-300" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-white">
              Um Passo como Resposta de Amor
            </h2>
            <p className="text-xs text-amber-200/80">
              Qual resposta concreta de amor eu posso dar hoje ao que Deus me falou?
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Renunciar */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-red-300">
              🚫 O que eu devo RENUNCIAR hoje?
            </label>
            <input
              type="text"
              value={passoAmor.renunciar}
              onChange={(e) => handlePassoAmorChange('renunciar', e.target.value)}
              placeholder="Ex: A preguiça para a oração, fofoca, mau humor..."
              className="w-full p-3 text-sm bg-white/5 border border-red-400/30 rounded-xl focus:ring-2 focus:ring-red-400/50 focus:bg-white/10 text-white placeholder-white/30 outline-none transition-all backdrop-blur-md"
            />
          </div>

          {/* Iniciar */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300">
              ✨ O que eu devo INICIAR?
            </label>
            <input
              type="text"
              value={passoAmor.iniciar}
              onChange={(e) => handlePassoAmorChange('iniciar', e.target.value)}
              placeholder="Ex: Terço diário, visita ao Santíssimo, caridade..."
              className="w-full p-3 text-sm bg-white/5 border border-emerald-400/30 rounded-xl focus:ring-2 focus:ring-emerald-400/50 focus:bg-white/10 text-white placeholder-white/30 outline-none transition-all backdrop-blur-md"
            />
          </div>

          {/* Melhorar */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300">
              📈 O que eu devo MELHORAR?
            </label>
            <input
              type="text"
              value={passoAmor.melhorar}
              onChange={(e) => handlePassoAmorChange('melhorar', e.target.value)}
              placeholder="Ex: Atenção na missa, paciência com a família..."
              className="w-full p-3 text-sm bg-white/5 border border-amber-400/30 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:bg-white/10 text-white placeholder-white/30 outline-none transition-all backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Oremos */}
      <div className="bg-gradient-to-br from-purple-950/60 to-slate-900/80 backdrop-blur-2xl text-white rounded-3xl p-5 shadow-xl border border-purple-400/30 space-y-3 relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <h2 className="font-serif font-bold text-lg text-amber-300 flex items-center gap-2">
            <span>🙏</span> Oremos:
          </h2>

          <button
            onClick={() => handlePlayAudio(entry.oremos)}
            disabled={isLoadingTts}
            className="text-xs text-white/80 hover:text-white flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/15 transition-all"
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-300" />
            Ouvir Oração
          </button>
        </div>

        <p className="font-serif text-sm sm:text-base leading-relaxed text-white/90 italic">
          “{entry.oremos}”
        </p>
      </div>

      {/* Completion Button */}
      <div className="pt-2 flex flex-col items-center gap-2">
        <button
          onClick={handleToggleCompleted}
          id="btn-complete-day"
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2 border ${
            entry.completed
              ? 'bg-emerald-600/90 text-white hover:bg-emerald-500 border-emerald-400/40 backdrop-blur-md'
              : 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white hover:brightness-110 border-white/25 scale-[1.01] shadow-purple-500/25'
          }`}
        >
          <CheckCircle2 className="w-6 h-6" />
          <span>
            {entry.completed
              ? '✓ Dia Concluído com Sucesso! (Clique para reabrir)'
              : 'Amém! Concluir Diário do Dia'}
          </span>
        </button>

        {copiedShare && (
          <p className="text-xs text-emerald-300 font-semibold">
            Texto do diário copiado para a área de transferência!
          </p>
        )}
      </div>
    </div>
  );
};
