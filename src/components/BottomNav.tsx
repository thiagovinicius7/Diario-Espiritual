import React from 'react';
import { BookOpen, Calendar, Heart, ShieldCheck, Upload } from 'lucide-react';

export type TabType = 'diario' | 'calendario' | 'respostas' | 'exame' | 'importar';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'diario' as TabType, label: 'Hoje', icon: BookOpen },
    { id: 'calendario' as TabType, label: 'Mês', icon: Calendar },
    { id: 'respostas' as TabType, label: 'Ações', icon: Heart },
    { id: 'exame' as TabType, label: 'Confissão', icon: ShieldCheck },
    { id: 'importar' as TabType, label: 'Novo Mês', icon: Upload },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-2xl border-t border-white/10 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-3xl mx-auto flex items-center justify-around py-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-white/25 text-white shadow-lg shadow-purple-500/10 scale-105 backdrop-blur-xl'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2] text-pink-300' : 'stroke-[1.6]'}`} />
              <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
