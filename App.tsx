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
      <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-400/30 selection:text-amber-200">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/relationships" element={<Relationships />} />
            {/* Placeholders for other routes */}
            <Route path="/reminders" element={<div className="p-8 text-slate-500">Reminders View Placeholder</div>} />
            <Route path="/calendar" element={<div className="p-8 text-slate-500">Calendar View Placeholder</div>} />
            <Route path="/meetings" element={<div className="p-8 text-slate-500">Meetings View Placeholder</div>} />
            <Route path="/knowledge" element={<div className="p-8 text-slate-500">Knowledge View Placeholder</div>} />
            <Route path="/sparkfile" element={<div className="p-8 text-slate-500">Sparkfile View Placeholder</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Chat Overlay */}
          <ChatInterface />
        </main>
      </div>
    </Router>
  );
};

export default App;
