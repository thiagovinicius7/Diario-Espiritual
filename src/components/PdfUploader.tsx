import React, { useState } from 'react';
import { Upload, FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight, Calendar, Key, HelpCircle } from 'lucide-react';
import { MonthlyJournal } from '../types';
import { parseJournalTextLocally, getPreloadedJulyJournal } from '../utils/pdfTextParser';

interface PdfUploaderProps {
  onJournalImported: (newJournal: MonthlyJournal) => void;
  onCancel?: () => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onJournalImported,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [customMonthName, setCustomMonthName] = useState('');
  const [pastedText, setTextContent] = useState('');
  const [userApiKey, setUserApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setErrorMessage('');

      const name = selected.name.replace(/\.[^/.]+$/, '');
      if (!customMonthName) {
        setCustomMonthName(name);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setErrorMessage('');
      const name = selected.name.replace(/\.[^/.]+$/, '');
      if (!customMonthName) {
        setCustomMonthName(name);
      }
    }
  };

  // Quick action: Load July 2026 preloaded journal instantly
  const handleLoadJulyJournal = () => {
    setIsProcessing(true);
    setStatusMessage('Carregando Diário de Julho 2026 pré-configurado...');
    setTimeout(() => {
      const journal = getPreloadedJulyJournal();
      setIsProcessing(false);
      onJournalImported(journal);
    }, 500);
  };

  const processUpload = async () => {
    if (!file && !pastedText.trim()) {
      setErrorMessage('Por favor, selecione um arquivo PDF/texto ou cole o texto do diário.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setStatusMessage('Iniciando processamento do libreto mensal...');

    try {
      let fileBase64 = '';
      let mimeType = 'application/pdf';

      if (file) {
        mimeType = file.type || 'application/pdf';
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      // Try server endpoint first
      let parsedJournal: MonthlyJournal | null = null;

      try {
        setStatusMessage('Enviando para o servidor de Inteligência Artificial...');
        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64,
            mimeType,
            textPrompt: pastedText,
            customMonthName: customMonthName || 'Novo Mês',
            userApiKey: userApiKey.trim() || undefined,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            parsedJournal = result.data;
          }
        }
      } catch (fetchErr: any) {
        console.warn('Backend server unreachable (e.g. static GitHub Pages hosting). Using client-side fallback:', fetchErr);
      }

      // FALLBACK: If server was unreachable (e.g. GitHub Pages) or returned error, use client-side text parser!
      if (!parsedJournal) {
        setStatusMessage('Processando conteúdo localmente via leitor inteligente...');
        
        // If file text can be read or pastedText exists
        let rawContent = pastedText;
        if (file && file.type.includes('text')) {
          rawContent = await file.text();
        }

        parsedJournal = parseJournalTextLocally(
          rawContent || `Diário Espiritual - ${customMonthName || 'Julho'}`,
          customMonthName || file?.name.replace(/\.[^/.]+$/, '') || 'Novo Mês'
        );
      }

      if (!parsedJournal.id) {
        parsedJournal.id = `journal-${Date.now()}`;
      }
      if (!parsedJournal.entries || !Array.isArray(parsedJournal.entries)) {
        parsedJournal.entries = [];
      }

      setStatusMessage('Sucesso! Diário mensal importado e pronto para oração.');

      setTimeout(() => {
        setIsProcessing(false);
        onJournalImported(parsedJournal!);
      }, 800);
    } catch (err: any) {
      console.error('Import error:', err);
      setIsProcessing(false);
      setErrorMessage(
        err?.message || 'Não foi possível converter o arquivo. Tente colar o texto das reflexões abaixo.'
      );
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto px-3 sm:px-4 pt-3 space-y-5 animate-fadeIn text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/30 text-white rounded-3xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/20 backdrop-blur-2xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-500/30 to-pink-500/30 rounded-2xl border border-white/20 text-purple-200 backdrop-blur-md">
            <Upload className="w-6 h-6 text-pink-300" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-white">
              Importar Novo Mês (PDF ou Texto)
            </h2>
            <p className="text-xs text-white/70">
              Suba o PDF do libreto mensal ou cole o texto do seu Diário Espiritual
            </p>
          </div>
        </div>
      </div>

      {/* Quick Option: Load July 2026 */}
      <div className="bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-400/30 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 text-left">
          <Calendar className="w-6 h-6 text-amber-300 shrink-0" />
          <div>
            <h4 className="font-serif font-bold text-sm text-white">
              Quer carregar o Diário de Julho 2026?
            </h4>
            <p className="text-xs text-white/70">
              O mês de Julho com todos os 31 dias já está pré-formatado.
            </p>
          </div>
        </div>
        <button
          onClick={handleLoadJulyJournal}
          disabled={isProcessing}
          className="w-full sm:w-auto px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-2xl text-xs transition-all shadow-md shrink-0 whitespace-nowrap"
        >
          Carregar Julho 2026 Agora
        </button>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-lg space-y-5">
        {/* Month Name Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-200">
            Nome do Mês / Título (Opcional):
          </label>
          <input
            type="text"
            value={customMonthName}
            onChange={(e) => setCustomMonthName(e.target.value)}
            placeholder="Ex: Agosto 2026 ou Setembro 2026"
            className="w-full p-3 text-sm bg-white/5 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400/50 outline-none text-white placeholder-white/30 backdrop-blur-md transition-all"
          />
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all backdrop-blur-md ${
            file
              ? 'border-emerald-400/60 bg-emerald-500/10'
              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
          }`}
        >
          <input
            type="file"
            accept=".pdf,image/*,.txt"
            onChange={handleFileChange}
            id="pdf-file-input"
            className="hidden"
          />

          <label
            htmlFor="pdf-file-input"
            className="cursor-pointer flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-3 bg-white/10 rounded-2xl text-purple-300 border border-white/15">
              <FileText className="w-8 h-8" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {file.name}
                </p>
                <p className="text-xs text-white/60">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Clique para alterar o arquivo
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  Clique para selecionar o arquivo do mês (PDF ou TXT)
                </p>
                <p className="text-xs text-white/60">
                  ou arraste e solte o libreto do Diário Espiritual aqui
                </p>
              </div>
            )}
          </label>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-white/40 uppercase">
            ou cole o texto das meditações
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Text Area fallback */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-200">
            Cole o texto das meditações e perguntas do mês:
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="01 de Julho - Liturgia: Verde - Evangelho: Mt 8,28-34... Para meditar: ..."
            rows={5}
            className="w-full p-3 text-xs bg-white/5 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400/50 outline-none text-white placeholder-white/30 font-mono backdrop-blur-md"
          />
        </div>

        {/* Info Note for GitHub Pages */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] text-white/70 space-y-1 font-serif">
          <p className="font-bold text-amber-200 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Dica de Importação no GitHub Pages:
          </p>
          <p className="leading-relaxed">
            Se você estiver usando o aplicativo no GitHub Pages (site estático), o leitor inteligente converte automaticamente o texto colado ou arquivo em dias organizados!
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-red-500/20 border border-red-400/30 text-red-200 rounded-2xl text-xs flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-4 bg-purple-900/30 border border-purple-400/30 rounded-2xl space-y-2 text-center backdrop-blur-md">
            <Loader2 className="w-6 h-6 animate-spin text-pink-300 mx-auto" />
            <p className="text-xs font-bold text-white">{statusMessage}</p>
            <p className="text-[11px] text-purple-200">
              Aguarde alguns segundos enquanto estruturamos todas as meditações do mês...
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={processUpload}
          disabled={isProcessing || (!file && !pastedText.trim())}
          id="btn-import-journal"
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white font-bold rounded-2xl shadow-xl hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm border border-white/25"
        >
          <Sparkles className="w-5 h-5 text-amber-200" />
          <span>
            {isProcessing ? 'Processando Arquivo...' : 'Transformar em Diário Interativo'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-2 text-xs text-white/60 hover:text-white font-medium transition-colors"
          >
            Voltar ao Diário do Mês
          </button>
        )}
      </div>
    </div>
  );
};
