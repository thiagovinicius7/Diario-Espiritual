import React from 'react';
import { X, CheckCircle2, Heart, BookOpen, Cross } from 'lucide-react';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dicas?: string[];
}

export const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose, dicas }) => {
  if (!isOpen) return null;

  const defaultDicas = [
    'Tenha um local e horário fixos para oração;',
    'Invoque o Espírito Santo e faça outras orações que te ajudem a se acalmar e estar na presença de Deus;',
    'Leia o evangelho do dia em sua Bíblia, depois a reflexão e as perguntas sem pressa. No canal do YouTube você encontra a homilia do mesmo evangelho, um pouco mais aprofundada;',
    'Use as perguntas para realmente refletir sobre sua vida;',
    'É interessante você anotar suas respostas e reflexões no aplicativo;',
    'Tente investir alguns minutos do seu dia para fazer isso de forma orante;',
    'Procure o sacramento da confissão e use dos ensinamentos deste mês para fazer seu exame de consciência.'
  ];

  const tipsList = dicas || defaultDicas;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-[#1e1b2e]/95 via-[#2d1b28]/95 to-[#18121f]/95 border border-white/20 backdrop-blur-2xl rounded-3xl max-w-lg w-full overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)] space-y-0 text-white">
        {/* Header */}
        <div className="bg-white/10 p-5 flex items-center justify-between border-b border-white/15 relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-white/20 flex items-center justify-center text-pink-300">
              <Cross className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">
                Dicas para Maior Aproveito
              </h3>
              <p className="text-[11px] text-white/70">
                Como viver intensamente o seu Diário Espiritual
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="space-y-2.5">
            {tipsList.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md"
              >
                <div className="w-5 h-5 rounded-full bg-pink-500/30 border border-pink-400/40 flex items-center justify-center text-pink-200 shrink-0 mt-0.5 text-xs font-bold">
                  {idx + 1}
                </div>
                <p className="text-xs text-white/90 leading-relaxed font-serif">{tip}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-amber-900/30 p-4 rounded-2xl border border-white/15 text-center space-y-1 backdrop-blur-md">
            <p className="font-serif italic text-xs font-semibold text-amber-200">
              “Coloque suas intenções e reze com fé. Deus está com você nesta caminhada, creia! Vamos juntos nessa jornada?”
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs rounded-2xl shadow-lg hover:brightness-110 border border-white/20 transition-all"
          >
            Compreendido, Vamos Começar!
          </button>
        </div>
      </div>
    </div>
  );
};
