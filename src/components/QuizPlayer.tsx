import React, { useState } from 'react';
import { Quiz, QuizQuestion } from '../types';
import { CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface QuizPlayerProps {
  quiz: Quiz;
  baseUrl: string;
  data: any;
  onExit: () => void;
}

export default function QuizPlayer({ quiz, baseUrl, data, onExit }: QuizPlayerProps) {
  const [studentName, setStudentName] = useState('');
  const [hasStarted, setHasStarted] = useState(!quiz.settings.studentNameRequired);
  
  // State for quiz progress
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const resolveUrl = (bp: string, vw: string) => {
    const url = data[bp]?.[vw]?.xray;
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url}`;
  };

  const handleStart = () => {
    if (quiz.settings.studentNameRequired && !studentName.trim()) return;
    
    let processedQuestions = [...quiz.questions];
    
    if (quiz.settings.shuffleQuestions) {
        processedQuestions.sort(() => Math.random() - 0.5);
    }
    
    if (quiz.settings.shuffleAnswers) {
        processedQuestions = processedQuestions.map(q => {
            const correctAnswer = q.options[q.correctAnswerIndex];
            const newOptions = [...q.options].sort(() => Math.random() - 0.5);
            return {
                ...q,
                options: newOptions,
                correctAnswerIndex: newOptions.indexOf(correctAnswer)
            };
        });
    }

    if (quiz.settings.questionCount > 0 && quiz.settings.questionCount < processedQuestions.length) {
        processedQuestions = processedQuestions.slice(0, quiz.settings.questionCount);
    }

    setActiveQuestions(processedQuestions);
    setHasStarted(true);
  };

  const currentQuestion = activeQuestions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswerRevealed) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswerRevealed(true);
    if (selectedOption === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      setIsFinished(true);
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0B0D] text-gray-200">
         <div className="bg-[#111317] p-8 rounded-lg border border-[#2D3139] max-w-md w-full shadow-2xl">
            <h1 className="text-xl font-serif italic mb-2 text-center text-gray-100">{quiz.title}</h1>
            <p className="text-gray-500 text-center text-[10px] uppercase font-bold tracking-widest mb-8">{quiz.questions.length} Questions</p>
            
            {quiz.settings.studentNameRequired && (
                <div className="space-y-4 mb-6">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400">Enter your name</label>
                    <input 
                       type="text" 
                       value={studentName}
                       onChange={e => setStudentName(e.target.value)}
                       className="w-full bg-[#1A1C1E] border border-[#2D3139] rounded p-3 text-gray-200 focus:border-blue-500 outline-none transition text-sm"
                       placeholder="Student Name"
                    />
                </div>
            )}
            
            <button 
               onClick={handleStart}
               disabled={quiz.settings.studentNameRequired && !studentName.trim()}
               className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-xs py-3 rounded transition"
            >
               Start Quiz
            </button>
            <button onClick={onExit} className="w-full mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition">
               Cancel
            </button>
         </div>
      </div>
    );
  }

  if (isFinished) {
      const percentage = Math.round((score / activeQuestions.length) * 100);
      return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0B0D] text-gray-200">
             <div className="bg-[#111317] p-8 rounded-lg border border-[#2D3139] max-w-md w-full shadow-2xl text-center">
                 <h2 className="text-2xl font-serif italic mb-2">Quiz Complete!</h2>
                 {studentName && <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">{studentName}</p>}
                 
                 <div className="my-8">
                     <div className="text-6xl font-light mb-2 text-blue-500">{percentage}%</div>
                     <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">{score} out of {activeQuestions.length} correct</div>
                 </div>

                 <button onClick={onExit} className="w-full bg-[#1A1C1E] border border-[#2D3139] hover:bg-[#2D3139] text-gray-300 font-bold uppercase tracking-widest text-xs py-3 rounded transition">
                    Return to Home
                 </button>
             </div>
          </div>
      );
  }

  const imageUrl = currentQuestion.customImage || resolveUrl(currentQuestion.bodyPart, currentQuestion.view);

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0A0B0D] text-gray-200">
       {/* Left side: Image */}
       <div className="flex-1 bg-black flex items-center justify-center relative p-8">
           {imageUrl ? (
               <img src={imageUrl} alt="Question Radiograph" className="max-w-full max-h-full object-contain pointer-events-none" />
           ) : (
               <div className="text-[10px] uppercase font-bold tracking-widest text-gray-600">No Image Found</div>
           )}
           <div className="absolute top-4 left-4 bg-[#111317]/80 px-3 py-1.5 rounded text-[9px] uppercase font-bold tracking-widest backdrop-blur border border-[#2D3139] text-gray-400">
               Question {currentQuestionIndex + 1} of {activeQuestions.length}
           </div>
       </div>

       {/* Right side: Interaction */}
       <div className="w-full md:w-96 lg:w-[32rem] bg-[#111317] border-l border-[#2D3139] flex flex-col overflow-y-auto">
          <div className="p-6 md:p-8 flex-1 flex flex-col">
              <h3 className="text-lg leading-relaxed text-gray-200 mb-8 font-serif italic">
                  {currentQuestion.question}
              </h3>

              <div className="space-y-3 flex-1">
                  {currentQuestion.options.map((opt, i) => {
                      let btnState = 'bg-[#1A1C1E] border-[#2D3139] hover:border-gray-500 text-gray-300';
                      let Icon = null;
                      
                      if (selectedOption === i) {
                          btnState = 'bg-blue-900/30 border-blue-500 text-blue-300';
                      }

                      if (isAnswerRevealed) {
                          if (i === currentQuestion.correctAnswerIndex) {
                              btnState = 'bg-green-900/40 border-green-500 text-green-300';
                              Icon = <CheckCircle size={16} className="text-green-500" />;
                          } else if (selectedOption === i) {
                              btnState = 'bg-red-900/40 border-red-500 text-red-300';
                              Icon = <XCircle size={16} className="text-red-500" />;
                          } else {
                              btnState = 'bg-[#1A1C1E] border-[#2D3139] text-gray-600 opacity-50';
                          }
                      }

                      return (
                          <button
                              key={i}
                              onClick={() => handleOptionSelect(i)}
                              disabled={isAnswerRevealed}
                              className={`w-full text-left p-4 rounded border transition flex items-center justify-between text-sm ${btnState}`}
                          >
                              <span>{opt}</span>
                              {Icon}
                          </button>
                      );
                  })}
              </div>

              {isAnswerRevealed && currentQuestion.explanation && (
                  <div className="mt-6 p-4 bg-[#1A1C1E] border border-[#2D3139] shadow-inner rounded-sm animate-in fade-in slide-in-from-bottom-2">
                      <h4 className="text-[9px] uppercase font-bold text-blue-500 tracking-widest mb-2">Explanation</h4>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{currentQuestion.explanation}</p>
                  </div>
              )}

              <div className="mt-8 pt-6 border-t border-[#2D3139]">
                  {!isAnswerRevealed ? (
                      <button 
                         onClick={handleSubmit} 
                         disabled={selectedOption === null}
                         className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition"
                      >
                         Submit Answer
                      </button>
                  ) : (
                      <button 
                         onClick={handleNext}
                         className="w-full bg-[#1A1C1E] border border-[#2D3139] hover:bg-[#2D3139] py-3 rounded text-[10px] font-bold uppercase tracking-widest text-gray-200 flex items-center justify-center gap-2 transition"
                      >
                          {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                          <ArrowRight size={14} />
                      </button>
                  )}
              </div>
          </div>
       </div>
    </div>
  );
}
