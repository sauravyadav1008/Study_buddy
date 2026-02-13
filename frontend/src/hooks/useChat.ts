import { useState, useCallback } from 'react';
import { chatService, userService, assessmentService, uploadService } from '../services/api';
import type { UserProfile, SessionHistory } from '../services/api';
import type { MCQQuestion } from '../components/MCQQuiz';
import type { QAQuestion } from '../components/QAQuiz';

export interface Message {
    role: 'user' | 'ai';
    content: string;
}

export const useChat = (userId: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<SessionHistory[]>([]);
    const [mode, setMode] = useState<'study' | 'mcq' | 'qa'>('study');
    const [quizQuestions, setQuizQuestions] = useState<(MCQQuestion | QAQuestion)[]>([]);
    const [mcqStartIndex, setMcqStartIndex] = useState<number | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            const data = await userService.getProfile(userId);
            setProfile(data);
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
    }, [userId]);

    const fetchHistory = useCallback(async () => {
        try {
            const data = await chatService.getHistory(userId);
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    }, [userId]);

    const sendMessage = async (text: string, sessionId: string = "default") => {
        const userMessage: Message = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMessage]);
        
        // Add an empty AI message that we'll fill with chunks
        const initialAiMessage: Message = { role: 'ai', content: '' };
        setMessages((prev) => [...prev, initialAiMessage]);
        
        setLoading(true);
        setError(null);

        try {
            let fullResponse = "";
            await chatService.streamMessage(userId, text, sessionId, (chunk) => {
                fullResponse += chunk;
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'ai') {
                        lastMessage.content = fullResponse;
                    }
                    return newMessages;
                });
            });
            
            // Refresh profile to see updates in knowledge level/meter
            fetchProfile();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to get response from AI Buddy.");
            console.error(err);
            // Remove the empty AI message if it exists and has no content
            setMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === 'ai' && !lastMessage.content) {
                    return prev.slice(0, -1);
                }
                return prev;
            });
        } finally {
            setLoading(false);
        }
    };

    const runAssessment = async (type: 'mcq' | 'qa', query?: string) => {
        if (!profile) return;
        
        const topics = profile.known_concepts.length > 0 
            ? profile.known_concepts 
            : ["General Study"];
        
        setLoading(true);
        setMode(type);
        setQuizQuestions([]);

        try {
            if (type === 'mcq') {
                const questions = await assessmentService.generateMCQs(userId, topics, 5, query);
                setQuizQuestions(questions);
            } else {
                const questions = await assessmentService.generateQA(userId, topics, "medium", 3, query);
                setQuizQuestions(questions);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to generate ${type.toUpperCase()}`);
            setMode('study');
        } finally {
            setLoading(false);
        }
    };
const submitMCQBatch = async (answers: Record<string, number>) => {
  try {
    const results = await assessmentService.batchSubmitMCQ(userId, answers);
    fetchProfile(); // Update mastery levels
    return results;
  } catch (err) {
    handleSubmissionError(err);
  }
};

const handleSubmissionError = (error: any) => {
  console.error("Failed to submit MCQ batch", error);
  throw error;
};


    const submitQABatch = async (answers: Record<string, string>) => {
        try {
            const results = await assessmentService.batchSubmitQA(userId, answers);
            fetchProfile(); // Update mastery levels
            return results;
        } catch (err) {
            console.error("Failed to submit QA batch", err);
            throw err;
        }
    };

    const runRevision = async () => {
        if (!profile || !profile.weak_areas.length) return;
        setLoading(true);
        try {
            const data = await assessmentService.getRevision(userId, profile.weak_areas);
            const revisionMsg: Message = { role: 'ai', content: data.revision_material };
            setMessages((prev) => [...prev, revisionMsg]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resetChat = async () => {
        try {
            await userService.resetMemory(userId);
            setMessages([]);
            setHistory([]);
            fetchProfile();
        } catch (err) {
            console.error("Failed to reset memory", err);
        }
    };

    const uploadFile = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            await uploadService.uploadFile(userId, file);
            const systemMsg: Message = { 
                role: 'ai', 
                content: `Successfully uploaded and processed **${file.name}**. I am now in "File Analysis Mode". I will answer your questions based only on this file.` 
            };
            setMessages((prev) => [...prev, systemMsg]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload file.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return { 
        messages, sendMessage, loading, error, profile, history, mode, quizQuestions,
        mcqStartIndex, fetchProfile, fetchHistory, resetChat, runAssessment, runRevision, setMode,
        setMcqStartIndex, submitMCQBatch, submitQABatch, uploadFile
    };
};
