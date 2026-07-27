import React, { useState } from 'react';
import { ShieldCheck, HeartHandshake, CheckSquare, Square, Cross, Sparkles, BookOpen } from 'lucide-react';
import { MonthlyJournal } from '../types';

interface ConscienceExaminationProps {
  journal: MonthlyJournal;
}

export const ConscienceExamination: React.FC<ConscienceExaminationProps> = ({ journal }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Toggle item check
  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Collect user's recorded "Renúncias" and "Faltas" from the current month
  const userRenuncias = journal.entries
    .filter((e) => e.userPassoAmor?.renunciar && e.userPassoAmor.renunciar.trim().length > 0)
    .map((e) => ({
      date: e.dateFormatted,
      renunciar: e.userPassoAmor!.renunciar,
      melhorar: e.userPassoAmor?.melhorar,
    }));

  const mandamentosDeDeus = [
    { id: 'm1', text: '1° Amar a Deus sobre todas as coisas (Deixei a oração de lado? Busquei superstições?)' },
    { id: 'm2', text: '2° Não tomar seu santo nome em vão (Falei o nome de Deus sem respeito ou murmurei?)' },
    { id: 'm3', text: '3° Guardar domingos e festas (Faltei à Santa Missa aos domingos por preguiça?)' },
    { id: 'm4', text: '4° Honrar pai e mãe (Fui desrespeitoso, impaciente ou agressivo com a família?)' },
    { id: 'm5', text: '5° Não matar (Guardei rancor, raiva, mágoa ou desejei o mal a alguém?)' },
    { id: 'm6', text: '6° Não pecar contra a castidade (Alimentei pensamentos ou olhares impuros?)' },
    { id: 'm7', text: '7° Não furtar (Causuei prejuízo aos outros ou peguei algo que não era meu?)' },
    { id: 'm8', text: '8° Não levantar falso testemunho (Fiz fofoca, menti ou julguei o próximo?)' },
    { id: 'm9', text: '9° Não desejar a mulher do próximo (Cultei cobiça ou inveja nos relacionamentos?)' },
    { id: 'm10', text: '10° Não cobiçar as coisas alheias (Tive inveja das conquistas alheias?)' },
  ];

  const mandamentosIgreja = [
    { id: 'i1', text: 'Ouvir missa inteira nos domingos e festas de guarda' },
    { id: 'i2', text: 'Confessar-se ao menos uma vez cada ano' },
    { id: 'i3', text: 'Comungar ao menos pela Páscoa da Ressurreição' },
    { id: 'i4', text: 'Jejuar e abstor-se de carne quando manda a Santa Mãe Igreja' },
    { id: 'i5', text: 'Ajudar a Igreja em suas necessidades (dízimo e ofertas)' },
  ];

  return (
    <div className="pb-24 max-w-2xl mx-auto px-3 sm:px-4 pt-3 space-y-5 animate-fadeIn text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/30 text-white rounded-3xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/20 backdrop-blur-2xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-500/30 to-pink-500/30 rounded-2xl border border-white/20 text-purple-200 backdrop-blur-md">
            <ShieldCheck className="w-6 h-6 text-pink-300" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-white">
              Exame de Consciência & Confissão
            </h2>
            <p className="text-xs text-white/70">
              Preparação pessoal para o Sacramento da Reconciliação
            </p>
          </div>
        </div>
      </div>

      {/* Intro Box */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-lg space-y-3">
        <h3 className="font-serif font-bold text-base text-purple-200 flex items-center gap-2">
          <Cross className="w-4 h-4 text-amber-300" />
          Como fazer um bom Exame de Consciência?
        </h3>
        <p className="text-xs text-white/80 leading-relaxed font-serif">
          Antes de se aproximar do sacerdote no confessionário, recolha-se em oração, peça a luz do Espírito Santo e examine com sinceridade onde você falhou no amor a Deus e ao próximo.
        </p>
      </div>

      {/* User's Month Notes as Examination Points */}
      {userRenuncias.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 via-purple-900/20 to-pink-900/20 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="border-b border-white/10 pb-2.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-300" />
            <h3 className="font-serif font-bold text-sm text-white">
              Pontos Identificados no Seu Diário ({journal.monthName}):
            </h3>
          </div>

          <p className="text-xs text-amber-200/90">
            Estes foram os pontos de renúncia e melhoria que você anotou durante suas meditações diárias este mês:
          </p>

          <div className="space-y-2">
            {userRenuncias.map((item, idx) => {
              const id = `user-renuncia-${idx}`;
              const isChecked = checkedItems[id];
              return (
                <button
                  key={idx}
                  onClick={() => toggleCheck(id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 backdrop-blur-md ${
                    isChecked
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-100 font-medium'
                      : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-purple-200 mr-1.5">
                      [{item.date}]:
                    </span>
                    <span>Renunciar: {item.renunciar}</span>
                    {item.melhorar && (
                      <p className="text-[11px] text-white/60">Melhorar: {item.melhorar}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ten Commandments Section */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-lg space-y-3">
        <h3 className="font-serif font-bold text-base text-purple-200">
          Os 10 Mandamentos da Lei de Deus
        </h3>

        <div className="space-y-2">
          {mandamentosDeDeus.map((m) => {
            const isChecked = checkedItems[m.id];
            return (
              <button
                key={m.id}
                onClick={() => toggleCheck(m.id)}
                className={`w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-start gap-3 backdrop-blur-md ${
                  isChecked
                    ? 'bg-red-500/20 border-red-400/40 text-red-200 font-medium'
                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{m.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Five Commandments of the Church */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-lg space-y-3">
        <h3 className="font-serif font-bold text-base text-purple-200">
          Os 5 Mandamentos da Igreja
        </h3>

        <div className="space-y-2">
          {mandamentosIgreja.map((m) => {
            const isChecked = checkedItems[m.id];
            return (
              <button
                key={m.id}
                onClick={() => toggleCheck(m.id)}
                className={`w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-start gap-3 backdrop-blur-md ${
                  isChecked
                    ? 'bg-red-500/20 border-red-400/40 text-red-200 font-medium'
                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{m.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Act of Contrition Prayer Card */}
      <div className="bg-gradient-to-br from-purple-950/60 to-slate-900/80 backdrop-blur-2xl text-white rounded-3xl p-5 shadow-xl border border-purple-400/30 space-y-2">
        <h3 className="font-serif font-bold text-base text-amber-300 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-pink-300" />
          Ato de Contrição (Para rezar na confissão):
        </h3>
        <p className="font-serif text-xs sm:text-sm leading-relaxed text-white/90 italic">
          “Meu Deus, eu me arrependo de todo o coração de vos ter ofendido, porque sois infinitamente bom e digno de ser amado sobre todas as coisas. Proponho firmemente, com a ajuda da vossa graça, não mais vos ofender e fugir das ocasiões de pecar. Amém.”
        </p>
      </div>
    </div>
  );
};
