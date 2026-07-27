import React, { useState, useEffect } from 'react';
import { MonthlyJournal, DailyEntry } from './types';
import {
  getStoredJournals,
  saveJournals,
  getActiveMonthId,
  setActiveMonthId,
  saveJournal,
  calculateStats,
} from './utils/storage';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { DailyJournalView } from './components/DailyJournalView';
import { CalendarView } from './components/CalendarView';
import { PdfUploader } from './components/PdfUploader';
import { ConscienceExamination } from './components/ConscienceExamination';
import { NotesSummary } from './components/NotesSummary';
import { TipsModal } from './components/TipsModal';
import { SyncModal } from './components/SyncModal';

export default function App() {
  const [journals, setJournals] = useState<MonthlyJournal[]>(() => getStoredJournals());
  const [activeJournalId, setActiveId] = useState<string>(() => getActiveMonthId());
  const [activeTab, setActiveTab] = useState<TabType>('diario');
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);

  // Active journal object
  const activeJournal =
    journals.find((j) => j.id === activeJournalId) || journals[0] || getStoredJournals()[0];

  // Default active day number to current day of month if within month limits, else day 27 (current date context: July 27)
  const [activeDayNumber, setActiveDayNumber] = useState<number>(() => {
    const todayNum = new Date().getDate(); // e.g. 27
    if (activeJournal && activeJournal.entries.some((e) => e.dayNumber === todayNum)) {
      return todayNum;
    }
    return 1;
  });

  // Calculate user stats
  const stats = calculateStats(journals);

  const reloadDataFromStorage = () => {
    const freshJournals = getStoredJournals();
    const freshActiveId = getActiveMonthId();
    setJournals(freshJournals);
    setActiveId(freshActiveId);
  };

  // Sync active journal selection
  const handleSelectJournal = (id: string) => {
    setActiveId(id);
    setActiveMonthId(id);
    const selected = journals.find((j) => j.id === id);
    if (selected && selected.entries.length > 0) {
      setActiveDayNumber(1);
    }
  };

  // Update a daily entry in the current journal
  const handleUpdateEntry = (updatedEntry: DailyEntry) => {
    if (!activeJournal) return;

    const updatedEntries = activeJournal.entries.map((e) =>
      e.dayNumber === updatedEntry.dayNumber ? updatedEntry : e
    );

    const updatedJournal: MonthlyJournal = {
      ...activeJournal,
      entries: updatedEntries,
    };

    saveJournal(updatedJournal);

    setJournals((prev) =>
      prev.map((j) => (j.id === updatedJournal.id ? updatedJournal : j))
    );
  };

  // When a new PDF is imported
  const handleJournalImported = (newJournal: MonthlyJournal) => {
    saveJournal(newJournal);
    const updatedList = getStoredJournals();
    setJournals(updatedList);
    setActiveId(newJournal.id);
    setActiveMonthId(newJournal.id);
    setActiveDayNumber(1);
    setActiveTab('diario');
  };

  // Find active daily entry
  const currentEntry =
    activeJournal?.entries.find((e) => e.dayNumber === activeDayNumber) ||
    activeJournal?.entries[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#121212] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-500/30">
      {/* Subtle Ambient Background Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[20%] w-[350px] h-[350px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Header Bar */}
      <div className="relative z-20">
        <Header
          journals={journals}
          activeJournal={activeJournal}
          onSelectJournal={handleSelectJournal}
          onOpenUpload={() => setActiveTab('importar')}
          onOpenTips={() => setIsTipsOpen(true)}
          onOpenSync={() => setIsSyncOpen(true)}
          stats={stats}
        />
      </div>

      {/* Main Container */}
      <main className="flex-1 pb-24 relative z-10">
        {activeTab === 'diario' && currentEntry && (
          <DailyJournalView
            entry={currentEntry}
            totalDays={activeJournal.entries.length}
            onPrevDay={() => setActiveDayNumber((prev) => Math.max(1, prev - 1))}
            onNextDay={() =>
              setActiveDayNumber((prev) => Math.min(activeJournal.entries.length, prev + 1))
            }
            onSelectDay={(num) => setActiveDayNumber(num)}
            onUpdateEntry={handleUpdateEntry}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarView
            journal={activeJournal}
            activeDayNumber={activeDayNumber}
            onSelectDay={(dayNum) => {
              setActiveDayNumber(dayNum);
              setActiveTab('diario');
            }}
          />
        )}

        {activeTab === 'respostas' && (
          <NotesSummary
            journal={activeJournal}
            onSelectDay={(dayNum) => {
              setActiveDayNumber(dayNum);
              setActiveTab('diario');
            }}
          />
        )}

        {activeTab === 'exame' && <ConscienceExamination journal={activeJournal} />}

        {activeTab === 'importar' && (
          <PdfUploader
            onJournalImported={handleJournalImported}
            onCancel={() => setActiveTab('diario')}
          />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* Spiritual Tips Modal */}
      <TipsModal
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        dicas={activeJournal.dicasAproveitamento}
      />

      {/* Cloud & Device Sync Modal */}
      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onDataRestored={reloadDataFromStorage}
      />
    </div>
  );
}

