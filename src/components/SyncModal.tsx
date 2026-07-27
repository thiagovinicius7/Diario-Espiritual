import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Download,
  Upload,
  LogOut,
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  Globe,
  HelpCircle,
} from 'lucide-react';
import {
  GoogleUser,
  getStoredGoogleUser,
  getStoredToken,
  getStoredLastSync,
  getStoredClientId,
  saveStoredClientId,
  clearGoogleSession,
  requestGoogleAccessToken,
  uploadBackupToDrive,
  downloadBackupFromDrive,
} from '../utils/googleDriveSync';
import { exportBackupData, importBackupData } from '../utils/storage';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onDataRestored }) => {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => getStoredGoogleUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [lastSync, setLastSync] = useState<string | null>(() => getStoredLastSync());
  const [clientId, setClientId] = useState<string>(() => getStoredClientId());
  
  const [showConfig, setShowConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGoogleUser(getStoredGoogleUser());
      setToken(getStoredToken());
      setLastSync(getStoredLastSync());
      setClientId(getStoredClientId());
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      if (clientId) {
        saveStoredClientId(clientId);
      }
      const result = await requestGoogleAccessToken(clientId);
      setToken(result.token);
      setGoogleUser(result.user);
      setMessage({
        type: 'success',
        text: `Conectado com sucesso como ${result.user.name}!`,
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'Erro ao conectar ao Google Drive.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Google Drive Upload (Backup)
  const handleUploadToDrive = async () => {
    if (!token) return;
    setIsProcessing(true);
    setMessage(null);
    try {
      const backupJson = exportBackupData();
      const syncTime = await uploadBackupToDrive(token, backupJson);
      setLastSync(syncTime);
      setMessage({
        type: 'success',
        text: 'Seu Diário Espiritual foi salvo no seu Google Drive com sucesso!',
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'Erro ao salvar no Google Drive.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Google Drive Download (Restore)
  const handleDownloadFromDrive = async () => {
    if (!token) return;
    if (!window.confirm('Atenção: A restauração irá substituir os dados locais pelo backup do Google Drive. Deseja continuar?')) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    try {
      const jsonContent = await downloadBackupFromDrive(token);
      const res = importBackupData(jsonContent);
      if (res.success) {
        setLastSync(getStoredLastSync());
        setMessage({
          type: 'success',
          text: 'Dados restaurados com sucesso do Google Drive!',
        });
        onDataRestored();
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'Erro ao carregar do Google Drive.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Google Logout
  const handleLogout = () => {
    clearGoogleSession();
    setGoogleUser(null);
    setToken(null);
    setLastSync(null);
    setMessage({ type: 'info', text: 'Você desconectou da sua conta Google.' });
  };

  // Local JSON Export
  const handleLocalExport = () => {
    try {
      const jsonStr = exportBackupData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diario_espiritual_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Arquivo de backup baixado no seu dispositivo!',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao gerar arquivo de backup.' });
    }
  };

  // Local JSON Import
  const handleLocalImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importBackupData(content);
        if (res.success) {
          setMessage({ type: 'success', text: res.message });
          onDataRestored();
        } else {
          setMessage({ type: 'error', text: res.message });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-[#1e1b2e]/95 via-[#2d1b28]/95 to-[#18121f]/95 border border-white/20 backdrop-blur-2xl rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-[0_16px_48px_rgba(0,0,0,0.6)] text-white p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-white/20 flex items-center justify-center text-pink-300 backdrop-blur-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">
                Sincronização & Multidispositivos
              </h3>
              <p className="text-xs text-white/70">
                Acesse seu Diário de qualquer celular ou computador
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Status Message */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2.5 backdrop-blur-md ${
              message.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                : message.type === 'error'
                ? 'bg-red-500/20 border-red-400/30 text-red-200'
                : 'bg-blue-500/20 border-blue-400/30 text-blue-200'
            }`}
          >
            {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {message.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
            {message.type === 'info' && <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* SECTION 1: GOOGLE DRIVE INTEGRATION */}
        <div className="bg-white/10 border border-white/15 rounded-3xl p-5 space-y-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-300" />
              Nuvem Google Drive
            </h4>
            {googleUser && (
              <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Conectado
              </span>
            )}
          </div>

          {!googleUser ? (
            /* Logged Out State */
            <div className="space-y-3">
              <p className="text-xs text-white/80 leading-relaxed font-serif">
                Conecte sua conta do Google para sincronizar suas meditações e reflexões automaticamente no seu próprio Google Drive.
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-xs flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.01]"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Entrar com o Google</span>
              </button>
            </div>
          ) : (
            /* Logged In State */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  {googleUser.picture ? (
                    <img
                      src={googleUser.picture}
                      alt={googleUser.name}
                      className="w-9 h-9 rounded-full border border-white/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center text-white font-bold text-sm">
                      {googleUser.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">{googleUser.name}</p>
                    <p className="text-[11px] text-white/60">{googleUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-xs text-white/60 hover:text-red-300 hover:bg-white/10 rounded-xl transition-all"
                  title="Sair da Conta Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {lastSync && (
                <p className="text-[11px] text-amber-300/90 flex items-center gap-1.5 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                  Última sincronização com Drive: <strong>{lastSync}</strong>
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleUploadToDrive}
                  disabled={isProcessing}
                  className="py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all border border-white/20 shadow-md"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <CloudUpload className="w-4 h-4 text-white" />
                  )}
                  <span>Salvar no Google Drive</span>
                </button>

                <button
                  onClick={handleDownloadFromDrive}
                  disabled={isProcessing}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-white/15 backdrop-blur-md"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <CloudDownload className="w-4 h-4 text-amber-300" />
                  )}
                  <span>Carregar do Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Client ID Configuration Collapsible */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-white/60 hover:text-amber-300 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              {showConfig ? 'Ocultar Configuração de OAuth Client ID' : 'Configurar Client ID do Google (Para GitHub Pages)'}
            </button>

            {showConfig && (
              <div className="mt-3 p-3 bg-black/20 rounded-2xl border border-white/10 space-y-2 text-xs">
                <label className="block text-[11px] font-semibold text-purple-200">
                  Google OAuth Client ID:
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    saveStoredClientId(e.target.value);
                  }}
                  placeholder="xxxx-xxxx.apps.googleusercontent.com"
                  className="w-full p-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-400 font-mono"
                />
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Insira aqui o Client ID gerado no Google Cloud Console para o seu domínio no GitHub Pages.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: LOCAL BACKUP & RESTORE (.JSON FILE) */}
        <div className="bg-white/10 border border-white/15 rounded-3xl p-5 space-y-3.5 backdrop-blur-2xl">
          <h4 className="font-serif font-bold text-base text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-pink-300" />
            Backup Direto sem Login (Arquivo .json)
          </h4>
          <p className="text-xs text-white/80 leading-relaxed font-serif">
            Método 100% instantâneo e offline. Baixe um arquivo de cópia de segurança para transferir manualmente entre seu computador e celular.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleLocalExport}
              className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-white/15"
            >
              <Download className="w-4 h-4 text-purple-300" />
              <span>Baixar Backup (.json)</span>
            </button>

            <label className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-white/15 cursor-pointer text-center">
              <Upload className="w-4 h-4 text-pink-300" />
              <span>Restaurar Arquivo (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleLocalImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-amber-900/30 p-4 rounded-2xl border border-white/15 text-xs text-white/80 space-y-1 font-serif">
          <p className="font-bold text-amber-200 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" /> Dica para usar em vários aparelhos:
          </p>
          <p className="leading-relaxed">
            Ao conectar o Google Drive ou baixar seu backup (.json), todas as suas anotações, status de dias concluídos e respostas de amor serão preservadas em qualquer dispositivo!
          </p>
        </div>

        {/* Footer Close */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
