// Google Drive Sync Service for Diario Espiritual

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export interface SyncStatus {
  lastSyncedAt?: string;
  isSyncing: boolean;
  error?: string;
  user?: GoogleUser;
}

const TOKEN_KEY = 'de_google_drive_token';
const USER_KEY = 'de_google_drive_user';
const LAST_SYNC_KEY = 'de_google_drive_last_sync';
const CLIENT_ID_KEY = 'de_google_client_id';

const BACKUP_FILE_NAME = 'diario_espiritual_backup.json';

// Default Client ID or custom configured ID
export function getStoredClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

export function saveStoredClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
}

export function getStoredGoogleUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredLastSync(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function clearGoogleSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

// Load Google Identity Services script
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existingScript = document.getElementById('gsi-client-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

// Request Access Token using GIS
export async function requestGoogleAccessToken(customClientId?: string): Promise<{ token: string; user: GoogleUser }> {
  await loadGsiScript();

  const clientId = customClientId || getStoredClientId();
  if (!clientId) {
    throw new Error('Google Client ID não configurado. Por favor insira um Client ID ou configure o OAuth.');
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            const token = response.access_token;
            localStorage.setItem(TOKEN_KEY, token);

            try {
              // Fetch user info
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!userRes.ok) throw new Error('Falha ao obter perfil do usuário Google');
              const userData = await userRes.json();
              const user: GoogleUser = {
                name: userData.name || userData.given_name || 'Usuário Google',
                email: userData.email || '',
                picture: userData.picture || '',
              };

              localStorage.setItem(USER_KEY, JSON.stringify(user));
              resolve({ token, user });
            } catch (err: any) {
              reject(err);
            }
          } else {
            reject(new Error('Nenhum token retornado pelo Google.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Search for backup file on Drive
async function findDriveFileId(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearGoogleSession();
      throw new Error('Sessão do Google expirada. Faça login novamente.');
    }
    throw new Error('Erro ao buscar arquivos no Google Drive.');
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

// Upload backup to Google Drive
export async function uploadBackupToDrive(token: string, jsonContent: string): Promise<string> {
  const fileId = await findDriveFileId(token);

  const fileMetadata = {
    name: BACKUP_FILE_NAME,
    mimeType: 'application/json',
  };

  const boundary = 'foo_bar_baz';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (fileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearGoogleSession();
      throw new Error('Sessão do Google expirada. Faça login novamente.');
    }
    const errData = await res.text();
    throw new Error(`Falha no upload para o Google Drive: ${res.statusText}`);
  }

  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('pt-BR');
  localStorage.setItem(LAST_SYNC_KEY, now);
  return now;
}

// Download backup from Google Drive
export async function downloadBackupFromDrive(token: string): Promise<string> {
  const fileId = await findDriveFileId(token);
  if (!fileId) {
    throw new Error('Nenhum backup ("diario_espiritual_backup.json") foi encontrado no seu Google Drive.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearGoogleSession();
      throw new Error('Sessão do Google expirada. Faça login novamente.');
    }
    throw new Error('Falha ao baixar backup do Google Drive.');
  }

  const content = await res.text();
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('pt-BR');
  localStorage.setItem(LAST_SYNC_KEY, now);
  return content;
}
