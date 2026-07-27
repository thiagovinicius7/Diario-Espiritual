import React, { useState } from 'react';
import { Upload, FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { MonthlyJournal } from '../types';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setErrorMessage('');

      // Try to auto-guess month name from file name
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

  const processUpload = async () => {
    if (!file && !pastedText.trim()) {
      setErrorMessage('Por favor, selecione um arquivo PDF ou cole o texto do diário.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setStatusMessage('Lendo o arquivo e ativando a Inteligência Artificial...');

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

      setStatusMessage('Extraindo liturgia, meditações e orações diárias do mês...');

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          mimeType,
          textPrompt: pastedText,
          customMonthName: customMonthName || 'Novo Mês',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Falha ao processar o libreto.');
      }

      const parsedJournal: MonthlyJournal = result.data;

      // Ensure valid ID and fallbacks
      if (!parsedJournal.id) {
        parsedJournal.id = `journal-${Date.now()}`;
      }
      if (!parsedJournal.entries || !Array.isArray(parsedJournal.entries)) {
        parsedJournal.entries = [];
      }

      setStatusMessage('Sucesso! Diário mensal gerado e pronto para oração.');

      setTimeout(() => {
        setIsProcessing(false);
        onJournalImported(parsedJournal);
      }, 1000);
    } catch (err: any) {
      console.error('Import error:', err);
      setIsProcessing(false);
      setErrorMessage(
        err?.message || 'Não foi possível converter o arquivo. Tente novamente ou cole o texto.'
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
              Importar Novo Mês (PDF)
            </h2>
            <p className="text-xs text-white/70">
              Suba o PDF do libreto mensal do seu Diário Espiritual
            </p>
          </div>
        </div>
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
                  Clique para selecionar o PDF do mês
                </p>
                <p className="text-xs text-white/60">
                  ou arraste e solte o arquivo do Diário Espiritual aqui
                </p>
              </div>
            )}
          </label>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-white/40 uppercase">
            ou cole o texto
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Text Area fallback */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-200">
            Cole o conteúdo textual das reflexões (se preferir):
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="01 de Agosto - Liturgia: Verde - Evangelho: Mt 13... Para meditar: ..."
            rows={4}
            className="w-full p-3 text-xs bg-white/5 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400/50 outline-none text-white placeholder-white/30 font-mono backdrop-blur-md"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded-2xl text-xs flex items-center gap-2 backdrop-blur-md">
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
              A Inteligência Artificial está estruturando cada dia do mês...
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
