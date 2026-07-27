export interface LiturgiaDiaria {
  cor: 'Verde' | 'Vermelho' | 'Branco' | 'Roxo' | 'Rosa';
  leituras: string; // e.g. "Am 5,14-15.21-24 | Sl 49(50) | Mt 8,28-34"
  evangelhoRef: string; // e.g. "Mt 8,28-34"
  evangelhoFrase?: string;
  santoDoDia: string;
}

export interface UmPassoRespostaDeAmor {
  renunciar: string;
  iniciar: string;
  melhorar: string;
}

export interface DailyEntry {
  dayNumber: number; // 1 to 31
  dateFormatted: string; // "01 de Julho"
  diaDaSemana: string; // "Quarta-feira"
  semanaLiturgica: string; // "13° Semana do tempo comum"
  liturgia: LiturgiaDiaria;
  paraMeditar: string;
  paraRefletir: string[]; // array of 3 reflection questions
  oremos: string;
  
  // User personal data (persisted)
  userReflections?: string[]; // answers to reflection questions
  userPassoAmor?: UmPassoRespostaDeAmor;
  userNotes?: string;
  completed?: boolean;
  completedAt?: string;
}

export interface MonthlyJournal {
  id: string; // e.g. "julho-2026"
  title: string; // "DIÁRIO ESPIRITUAL"
  monthName: string; // "Julho"
  year: number; // 2026
  coverColor?: string;
  dicasAproveitamento?: string[];
  entries: DailyEntry[];
  createdAt: string;
}

export interface UserStats {
  streak: number;
  totalCompletedDays: number;
  lastCompletedDate?: string;
}
