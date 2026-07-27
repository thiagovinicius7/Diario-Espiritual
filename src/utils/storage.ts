import { MonthlyJournal, UserStats } from '../types';
import { july2026Journal } from '../data/july2026Data';

const JOURNALS_KEY = 'diario_espiritual_journals_v1';
const ACTIVE_MONTH_KEY = 'diario_espiritual_active_month_v1';

export function getStoredJournals(): MonthlyJournal[] {
  try {
    const raw = localStorage.getItem(JOURNALS_KEY);
    if (!raw) {
      // Seed with July 2026
      const initial = [july2026Journal];
      localStorage.setItem(JOURNALS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load journals:', e);
    return [july2026Journal];
  }
}

export function saveJournals(journals: MonthlyJournal[]): void {
  try {
    localStorage.setItem(JOURNALS_KEY, JSON.stringify(journals));
  } catch (e) {
    console.error('Failed to save journals:', e);
  }
}

export function getActiveMonthId(): string {
  return localStorage.getItem(ACTIVE_MONTH_KEY) || july2026Journal.id;
}

export function setActiveMonthId(id: string): void {
  localStorage.setItem(ACTIVE_MONTH_KEY, id);
}

export function saveJournal(updatedJournal: MonthlyJournal): void {
  const journals = getStoredJournals();
  const index = journals.findIndex((j) => j.id === updatedJournal.id);
  if (index >= 0) {
    journals[index] = updatedJournal;
  } else {
    journals.unshift(updatedJournal);
  }
  saveJournals(journals);
}

export function calculateStats(journals: MonthlyJournal[]): UserStats {
  let totalCompleted = 0;
  let lastCompletedDate: string | undefined;

  for (const journal of journals) {
    for (const entry of journal.entries) {
      if (entry.completed) {
        totalCompleted++;
        if (!lastCompletedDate || (entry.completedAt && entry.completedAt > lastCompletedDate)) {
          lastCompletedDate = entry.completedAt;
        }
      }
    }
  }

  // Calculate approximate streak
  const streak = totalCompleted;

  return {
    streak,
    totalCompletedDays: totalCompleted,
    lastCompletedDate,
  };
}

export function exportBackupData(): string {
  const journals = getStoredJournals();
  const activeMonthId = getActiveMonthId();
  const backupObj = {
    appName: 'DiarioEspiritual',
    version: 1,
    exportDate: new Date().toISOString(),
    activeMonthId,
    journals,
  };
  return JSON.stringify(backupObj, null, 2);
}

export function importBackupData(jsonString: string): { success: boolean; message: string; count?: number } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.journals)) {
      return { success: false, message: 'Formato de arquivo inválido. Lista de diários não encontrada.' };
    }
    
    // Save imported journals
    saveJournals(data.journals);
    if (data.activeMonthId) {
      setActiveMonthId(data.activeMonthId);
    } else if (data.journals.length > 0) {
      setActiveMonthId(data.journals[0].id);
    }
    return {
      success: true,
      message: `Sucesso! ${data.journals.length} mês(es) restaurado(s).`,
      count: data.journals.length,
    };
  } catch (err: any) {
    console.error('Error importing backup:', err);
    return { success: false, message: 'Erro ao ler arquivo JSON: ' + (err.message || 'Formato incorreto.') };
  }
}

