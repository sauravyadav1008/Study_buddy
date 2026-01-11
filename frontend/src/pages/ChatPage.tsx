import React, { useEffect, useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import Sidebar from '../components/Sidebar';
import HistoryModal from '../components/HistoryModal';
import { useChat } from '../hooks/useChat';

const ChatPage: React.FC = () => {
    const userId = "user123"; 
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { 
        messages, sendMessage, loading, error, profile, fetchProfile, fetchHistory, 
        resetChat, runAssessment, runRevision, history, mode, mcqStartIndex, setMode,
        quizQuestions, submitMCQBatch, submitQABatch, uploadFile
    } = useChat(userId);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleHistoryClick = () => {
        fetchHistory();
        setIsHistoryOpen(true);
    };

    const displayMessages = mode === 'mcq' && mcqStartIndex !== null
        ? messages.slice(mcqStartIndex)
        : messages.filter(m => !m.content.startsWith("Start an MCQ quiz on:") && !m.content.startsWith("Start a Q&A test on:"));

    const handleAssessmentClick = (type: 'mcq' | 'qa') => {
        // Find the last user message to use as a query for better relevance
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        runAssessment(type, lastUserMessage?.content);
    };

    return (
        <div className="flex h-screen bg-transparent text-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vibrant-blue/5 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-vibrant-coral/5 rounded-full blur-[120px] -ml-48 -mb-48 animate-pulse-slow" />
            
            <Sidebar 
                profile={profile} 
                onReset={resetChat} 
                onAssessmentClick={handleAssessmentClick}
                onRevisionClick={runRevision}
                onHistoryClick={handleHistoryClick}
            />
            
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {mode !== 'study' && (
                    <div className="absolute top-10 left-10 z-30">
                        <button 
                            onClick={() => setMode('study')}
                            className="glass-card-vibrant px-8 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.25em] text-vibrant-blue transition-all flex items-center gap-4 hover:scale-[1.05] active:scale-[0.95] shadow-2xl border-white group"
                        >
                            <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> 
                            Exit Assessment
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-hidden relative z-10">
                    <ChatWindow 
                        messages={displayMessages} 
                        onSendMessage={sendMessage} 
                        loading={loading} 
                        error={error}
                        mode={mode}
                        quizQuestions={quizQuestions}
                        onSubmitMCQ={submitMCQBatch}
                        onSubmitQA={submitQABatch}
                        onCloseQuiz={() => setMode('study')}
                        onUploadFile={uploadFile}
                    />
                </div>
            </main>

            <HistoryModal 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
                history={history} 
            />
        </div>
    );
};

export default ChatPage;
