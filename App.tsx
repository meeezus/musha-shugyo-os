import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Relationships from './pages/Relationships';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-[#050505] text-[#E5E5E5] font-sans relative">
        <div className="noise-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-mist-gradient pointer-events-none z-0"></div>
        
        {/* Content wrapper with z-index to sit above mist/noise */}
        <div className="flex w-full h-full relative z-10">
            <Sidebar />
            
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/relationships" element={<Relationships />} />
                {/* Placeholders for other routes */}
                <Route path="/reminders" element={<div className="p-8 text-white/40 font-mono">Reminders View Placeholder</div>} />
                <Route path="/calendar" element={<div className="p-8 text-white/40 font-mono">Calendar View Placeholder</div>} />
                <Route path="/meetings" element={<div className="p-8 text-white/40 font-mono">Training View Placeholder</div>} />
                <Route path="/knowledge" element={<div className="p-8 text-white/40 font-mono">Knowledge View Placeholder</div>} />
                <Route path="/sparkfile" element={<div className="p-8 text-white/40 font-mono">Sparkfile View Placeholder</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Chat Overlay */}
            <ChatInterface />
            </main>
        </div>
      </div>
    </Router>
  );
};

export default App;