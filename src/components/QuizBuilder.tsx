import React, { useState } from 'react';
import { Quiz, QuizQuestion, RadiographData, QuizSettings } from '../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Upload, Copy, Settings, X } from 'lucide-react';

interface QuizBuilderProps {
  data: RadiographData;
  baseUrl: string;
  onExit: () => void;
}

const defaultSettings: QuizSettings = {
  shuffleQuestions: true,
  shuffleAnswers: true,
  questionCount: 0, // 0 means all
  studentNameRequired: true,
};

export default function QuizBuilder({ data, baseUrl, onExit }: QuizBuilderProps) {
  const [title, setTitle] = useState('New Radiology Quiz');
  const [questions, setQuestions] = useState<QuizQuestion[]>([createEmptyQuestion()]);
  const [settings, setSettings] = useState<QuizSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(questions[0].id);

  function createEmptyQuestion(): QuizQuestion {
    const defaultBp = Object.keys(data)[0] || '';
    const defaultVw = defaultBp ? Object.keys(data[defaultBp])[0] || '' : '';

    return {
      id: crypto.randomUUID(),
      bodyPart: defaultBp,
      view: defaultVw,
      question: 'What is the most likely diagnosis or structure shown?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswerIndex: 0,
    };
  }

  const addQuestion = () => {
    const q = createEmptyQuestion();
    setQuestions([...questions, q]);
    setActiveQuestionId(q.id);
  };

  const duplicateQuestion = (q: QuizQuestion) => {
    const newQ = { ...q, id: crypto.randomUUID() };
    setQuestions([...questions, newQ]);
    setActiveQuestionId(newQ.id);
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) return;
    const filtered = questions.filter(q => q.id !== id);
    setQuestions(filtered);
    if (activeQuestionId === id) {
      setActiveQuestionId(filtered[0].id);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    } else if (direction === 'down' && index < newQuestions.length - 1) {
      [newQuestions[index + 1], newQuestions[index]] = [newQuestions[index], newQuestions[index + 1]];
    }
    setQuestions(newQuestions);
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, ...updates } : q)));
  };

  const handleCustomImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateQuestion(id, { customImage: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const activeQuestion = questions.find(q => q.id === activeQuestionId);
  const activeQuestionIndex = questions.findIndex(q => q.id === activeQuestionId);

  const resolveUrl = (bp: string, vw: string) => {
    const url = data[bp]?.[vw]?.xray;
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url}`;
  };

  const downloadQuiz = () => {
    const quizData: Quiz = {
      id: crypto.randomUUID(),
      title,
      questions,
      settings: {
        ...settings,
        questionCount: settings.questionCount === 0 ? questions.length : settings.questionCount
      }
    };
    const blob = new Blob([JSON.stringify(quizData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0B0D] text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#111317] border-b border-[#2D3139]">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-lg font-serif italic border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none transition-colors px-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1C1E] border border-[#2D3139] hover:bg-[#2D3139] text-xs font-bold tracking-widest uppercase rounded transition text-gray-300"
          >
            <Settings size={14} />
            Settings
          </button>
          <button
            onClick={downloadQuiz}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold uppercase tracking-widest rounded transition text-white shadow-sm"
          >
            <Save size={14} />
            Export JSON
          </button>
          <button onClick={onExit} className="p-1.5 hover:bg-[#2D3139] rounded ml-2 transition text-gray-500 hover:text-white">
             <X size={18} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="p-4 bg-[#111317] border-b border-[#2D3139] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 animate-in fade-in slide-in-from-top-2">
           <label className="flex items-center gap-2 cursor-pointer">
             <input type="checkbox" checked={settings.shuffleQuestions} onChange={e => setSettings({...settings, shuffleQuestions: e.target.checked})} className="accent-blue-500 w-4 h-4"/>
             Shuffle Questions
           </label>
           <label className="flex items-center gap-2 cursor-pointer">
             <input type="checkbox" checked={settings.shuffleAnswers} onChange={e => setSettings({...settings, shuffleAnswers: e.target.checked})} className="accent-blue-500 w-4 h-4"/>
             Shuffle Answers
           </label>
           <label className="flex items-center gap-2 cursor-pointer">
             <input type="checkbox" checked={settings.studentNameRequired} onChange={e => setSettings({...settings, studentNameRequired: e.target.checked})} className="accent-blue-500 w-4 h-4"/>
             Require Name
           </label>
           <div className="flex items-center gap-2">
             <label className="text-gray-500">Per Session</label>
             <input 
                type="number" 
                min="0" 
                max={questions.length} 
                className="bg-[#1A1C1E] border border-[#2D3139] rounded px-2 py-1 w-16"
                value={settings.questionCount}
                onChange={e => setSettings({...settings, questionCount: parseInt(e.target.value) || 0})}
             />
             <span className="text-[9px] text-gray-600">(0 = all)</span>
           </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Questions List */}
        <div className="w-64 bg-[#111317] border-r border-[#2D3139] flex flex-col">
          <div className="p-3 border-b border-[#2D3139] flex justify-between items-center bg-[#111317]">
            <span className="font-bold text-[10px] uppercase tracking-widest text-blue-500">Active Questions</span>
            <button onClick={addQuestion} className="p-1 hover:bg-[#2D3139] rounded text-blue-400 transition" title="Add Question">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setActiveQuestionId(q.id)}
                className={`w-full text-left p-2 rounded text-[11px] truncate transition border ${activeQuestionId === q.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#1A1C1E] border-[#2D3139] hover:bg-[#2D3139] text-gray-400'}`}
              >
                Q{i + 1}: {q.question || 'Untitled Question'}
              </button>
            ))}
          </div>
        </div>

        {/* Right Area: Question Editor */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0A0B0D]">
          {activeQuestion && (
             <div className="max-w-4xl mx-auto space-y-8 pb-12">
                <div className="flex justify-between items-center bg-[#111317] p-2 rounded border border-[#2D3139]">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-2">Editing Q{activeQuestionIndex + 1}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => moveQuestion(activeQuestionIndex, 'up')} disabled={activeQuestionIndex === 0} className="p-2 bg-[#1A1C1E] border border-[#2D3139] disabled:opacity-30 rounded hover:bg-[#2D3139] transition text-gray-300">
                            <ArrowUp size={14} />
                        </button>
                        <button onClick={() => moveQuestion(activeQuestionIndex, 'down')} disabled={activeQuestionIndex === questions.length - 1} className="p-2 bg-[#1A1C1E] border border-[#2D3139] disabled:opacity-30 rounded hover:bg-[#2D3139] transition text-gray-300">
                            <ArrowDown size={14} />
                        </button>
                        <button onClick={() => duplicateQuestion(activeQuestion)} className="p-2 bg-[#1A1C1E] border border-[#2D3139] rounded hover:bg-[#2D3139] transition text-blue-400">
                            <Copy size={14} />
                        </button>
                        <button onClick={() => deleteQuestion(activeQuestion.id)} disabled={questions.length === 1} className="p-2 bg-[#1A1C1E] border border-[#2D3139] rounded disabled:opacity-30 hover:bg-red-900/30 hover:text-red-400 transition text-gray-400">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Editor Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Settings */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Question Text...</label>
                            <textarea 
                               className="w-full bg-[#1A1C1E] border border-[#2D3139] rounded p-3 text-gray-200 focus:border-blue-500 outline-none resize-none h-24 text-sm"
                               value={activeQuestion.question}
                               onChange={(e) => updateQuestion(activeQuestion.id, { question: e.target.value })}
                               placeholder="Enter your question..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Answers</label>
                                {activeQuestion.options.length < 6 && (
                                    <button 
                                       className="text-[9px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 border border-blue-500/30 px-2 py-1 rounded"
                                       onClick={() => {
                                         const newOpts = [...activeQuestion.options, `Option ${String.fromCharCode(65 + activeQuestion.options.length)}`];
                                         updateQuestion(activeQuestion.id, { options: newOpts });
                                       }}
                                    >
                                        + Add Option
                                    </button>
                                )}
                            </div>
                            
                            <div className="grid gap-2">
                                {activeQuestion.options.map((opt, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-2 rounded border ${activeQuestion.correctAnswerIndex === i ? 'bg-[#1A1C1E] border-green-500/30' : 'bg-[#1A1C1E] border-[#2D3139]'}`}>
                                        <div 
                                           className={`w-3 h-3 rounded-full flex-shrink-0 cursor-pointer ${activeQuestion.correctAnswerIndex === i ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-700'}`}
                                           onClick={() => updateQuestion(activeQuestion.id, { correctAnswerIndex: i })}
                                           title="Mark as correct answer"
                                        />
                                        <input 
                                           type="text"
                                           value={opt}
                                           onChange={(e) => {
                                             const newOpts = [...activeQuestion.options];
                                             newOpts[i] = e.target.value;
                                             updateQuestion(activeQuestion.id, { options: newOpts });
                                           }}
                                           className="flex-1 bg-transparent border-none text-[11px] text-gray-300 focus:outline-none"
                                        />
                                        {activeQuestion.options.length > 2 && (
                                            <button 
                                              onClick={() => {
                                                  const newOpts = activeQuestion.options.filter((_, idx) => idx !== i);
                                                  let newCorrect = activeQuestion.correctAnswerIndex;
                                                  if (newCorrect === i) newCorrect = 0;
                                                  else if (newCorrect > i) newCorrect--;
                                                  updateQuestion(activeQuestion.id, { options: newOpts, correctAnswerIndex: newCorrect });
                                              }}
                                              className="p-1 text-gray-600 hover:text-red-400 transition"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block mb-2">Explanation / Feedback (Optional)</label>
                            <textarea 
                               className="w-full bg-[#1A1C1E] border border-[#2D3139] rounded p-3 text-gray-200 focus:border-blue-500 outline-none resize-none h-20 text-sm"
                               value={activeQuestion.explanation || ''}
                               onChange={(e) => updateQuestion(activeQuestion.id, { explanation: e.target.value })}
                               placeholder="Provide feedback or explanation to show after answering..."
                            />
                        </div>

                    </div>

                    {/* Right: Image Selection */}
                    <div className="space-y-4">
                        <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Radiograph Image</label>
                        
                        {!activeQuestion.customImage ? (
                            <div className="space-y-3 bg-[#111317] p-4 rounded border border-[#2D3139]">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] uppercase text-gray-500 font-bold mb-1 block">Body Part</label>
                                        <select 
                                           className="w-full bg-[#1A1C1E] border border-[#2D3139] rounded px-2 py-1.5 text-xs outline-none"
                                           value={activeQuestion.bodyPart}
                                           onChange={(e) => {
                                               const bp = e.target.value;
                                               const firstVw = Object.keys(data[bp] || {})[0] || '';
                                               updateQuestion(activeQuestion.id, { bodyPart: bp, view: firstVw });
                                           }}
                                        >
                                            {Object.keys(data).map(bp => (
                                                <option key={bp} value={bp}>{bp.replace(/_/g, ' ').toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase text-gray-500 font-bold mb-1 block">View</label>
                                        <select 
                                           className="w-full bg-[#1A1C1E] border border-[#2D3139] rounded px-2 py-1.5 text-xs outline-none"
                                           value={activeQuestion.view}
                                           onChange={(e) => updateQuestion(activeQuestion.id, { view: e.target.value })}
                                        >
                                            {Object.keys(data[activeQuestion.bodyPart] || {}).map(v => (
                                                <option key={v} value={v}>{v.replace(/_/g, ' ').toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="mt-4 aspect-square bg-black rounded border border-[#2D3139] flex items-center justify-center overflow-hidden">
                                     {resolveUrl(activeQuestion.bodyPart, activeQuestion.view) ? (
                                         <img src={resolveUrl(activeQuestion.bodyPart, activeQuestion.view)} alt="Preview" className="max-w-full max-h-full object-contain filter blur-[1px] opacity-70" />
                                     ) : (
                                         <span className="text-[9px] uppercase tracking-widest text-gray-600">No Image Found</span>
                                     )}
                                </div>

                                <div className="pt-2 text-center flex flex-col items-center">
                                    <label className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 cursor-pointer border border-blue-500/30 px-3 py-1.5 rounded">
                                        <Upload size={14} /> Upload Custom Image
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCustomImageUpload(activeQuestion.id, e)} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 bg-[#111317] p-4 rounded border border-[#2D3139]">
                                <div className="flex justify-between items-center mb-2">
                                     <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-500">Custom Uploaded</span>
                                     <button 
                                        onClick={() => updateQuestion(activeQuestion.id, { customImage: undefined })}
                                        className="text-[9px] tracking-widest uppercase text-red-500 hover:text-red-400 border border-red-500/30 px-2 flex items-center gap-1 rounded"
                                     >
                                         <X size={10}/> Remove
                                     </button>
                                </div>
                                <div className="aspect-square bg-black rounded border border-[#2D3139] flex items-center justify-center overflow-hidden">
                                    <img src={activeQuestion.customImage} alt="Custom Preview" className="max-w-full max-h-full object-contain opacity-80" />
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
