/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RadiographData, Quiz } from './types';
import ViewerSystem from './components/ViewerSystem';
import QuizBuilder from './components/QuizBuilder';
import QuizPlayer from './components/QuizPlayer';
import { Activity, PlusCircle, BookOpen, UploadCloud, Loader2 } from 'lucide-react';

const DATA_URL = 'https://raw.githubusercontent.com/xray-blue/xrayfordrrafal/refs/heads/main/xray-orgin.json';
const BASE_URL = 'https://raw.githubusercontent.com/xray-blue/xrayfordrrafal/main/'; // Used for resolving relative image paths

type AppState = 'viewer' | 'builder' | 'player';

export default function App() {
  const [data, setData] = useState<RadiographData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [appState, setAppState] = useState<AppState>('viewer');
  const [loadedQuiz, setLoadedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Failed to fetch radiograph data');
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleQuizUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
             if (event.target?.result && typeof event.target.result === 'string') {
                 const parsed = JSON.parse(event.target.result) as Quiz;
                 if (parsed && parsed.questions) {
                     setLoadedQuiz(parsed);
                     setAppState('player');
                 } else {
                     alert("Invalid quiz file.");
                 }
             }
          } catch(err) {
              alert("Error parsing JSON file.");
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex flex-col items-center justify-center text-gray-300">
         <Loader2 size={32} className="animate-spin mb-4 text-blue-600" />
         <p className="tracking-widest text-[#2D3139] uppercase text-xs font-bold">Loading Radiological Database...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 max-w-lg w-full text-center">
              <h2 className="text-red-400 font-bold tracking-widest uppercase mb-2">System Error</h2>
              <p className="text-red-200/80 text-sm">{error || 'Failed to load data.'}</p>
          </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#0A0B0D] font-sans antialiased text-gray-200 selection:bg-blue-500/30 overflow-hidden border-4 border-[#1A1C1E]">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-[#111317] border-b border-[#2D3139] flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setAppState('viewer')}>
              <div className="bg-blue-600 text-white p-1 rounded">
                  <Activity size={24} />
              </div>
              <div>
                  <h1 className="text-xl font-bold tracking-tight text-white italic font-serif">RAD-LEARN <span className="text-blue-500 font-sans text-xs not-italic border border-blue-500/30 px-1 ml-1 rounded">PRO</span></h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mt-1">Clinical Anatomy Education v2.4</p>
              </div>
          </div>

          <div className="flex items-center gap-6">
             <button 
                onClick={() => setAppState('viewer')}
                className={`transition hover:text-white uppercase text-xs font-bold tracking-widest ${appState === 'viewer' ? 'text-blue-500' : 'text-gray-500'}`}
             >
                Viewer
             </button>
             
             <div className="w-px h-6 bg-[#2D3139]"></div>
             
             <button 
                onClick={() => setAppState('builder')}
                className={`transition hover:text-white uppercase text-xs font-bold tracking-widest flex items-center gap-2 ${appState === 'builder' ? 'text-amber-500' : 'text-gray-500'}`}
             >
                <PlusCircle size={14} />
                <span className="hidden sm:inline">Create Quiz</span>
             </button>

             <label className={`transition hover:text-white cursor-pointer flex items-center gap-2 uppercase text-xs font-bold tracking-widest ${appState === 'player' ? 'text-emerald-500' : 'text-gray-500'}`}>
                <UploadCloud size={14} />
                <span className="hidden sm:inline">Load Quiz</span>
                <input type="file" accept=".json" className="hidden" onChange={handleQuizUpload} />
             </label>
          </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
         {appState === 'viewer' && (
             <ViewerSystem data={data} baseUrl={BASE_URL} />
         )}
         {appState === 'builder' && (
             <QuizBuilder data={data} baseUrl={BASE_URL} onExit={() => setAppState('viewer')} />
         )}
         {appState === 'player' && loadedQuiz && (
             <QuizPlayer quiz={loadedQuiz} data={data} baseUrl={BASE_URL} onExit={() => {
                 setAppState('viewer');
                 setLoadedQuiz(null);
             }} />
         )}
      </main>
    </div>
  );
}
