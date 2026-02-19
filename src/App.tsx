import React, { useState } from 'react';
import { Loader2, MessageSquare, Settings } from 'lucide-react';
import { cn } from './utils';
import { useAuth } from './hooks/useAuth';
import { useDebate } from './hooks/useDebate';
import { AppStateProvider, useAppState } from './contexts/AppStateContext';
import { DebateProvider } from './contexts/DebateContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatFeed } from './components/ChatFeed';
import { LoginScreen } from './components/LoginScreen';

// Inner component that consumes Contexts
function AppContent() {
  const { user, idToken, authLoading, isAllowed } = useAuth();
  
  // AppStateContext から設定の現状を取得 (useDebateに渡すため)
  const appState = useAppState();

  const debate = useDebate({
    japanModel: appState.japanModel,
    globalModel: appState.globalModel,
    maxTurns: appState.maxTurns,
    language: appState.language,
    responseLength: appState.responseLength,
    reportContext: appState.reportContext,
    additionalContext: appState.additionalContext,
    personas: appState.personas,
  }, idToken);

  const [showSidebar, setShowSidebar] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen isAllowed={isAllowed} />;
  }

  return (
    <DebateProvider value={debate}>
      <div className="min-h-screen bg-[#141414] text-[#E4E3E0] font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 flex overflow-hidden relative">
          <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] w-full">
            <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            <ChatFeed />

            {/* Mobile Tab/Action Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#1A1A1A]/95 backdrop-blur-md border-t border-[#2A2A2A] z-40 flex items-center justify-around px-6">
              <button 
                onClick={() => setShowSidebar(true)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all",
                  showSidebar ? "text-emerald-500" : "opacity-40"
                )}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Config</span>
              </button>
              <button 
                onClick={() => setShowSidebar(false)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all",
                  !showSidebar ? "text-emerald-500" : "opacity-40"
                )}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Chat</span>
              </button>
            </div>
          </main>
        </div>

        {/* Status Bar */}
        <footer className="h-8 border-t border-[#2A2A2A] bg-[#1A1A1A] hidden md:flex items-center px-6 justify-between text-[10px] font-mono opacity-40 shrink-0">
          <div className="flex items-center gap-4">
            <span>STRATEGY LAB</span>
            <span>v2.0</span>
          </div>
          <div>AI DEBATE SIMULATOR · {new Date().getFullYear()}</div>
        </footer>
      </div>
    </DebateProvider>
  );
}

// Ensure AppStateProvider wraps the components that use it
export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
