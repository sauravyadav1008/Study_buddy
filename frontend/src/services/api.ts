import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export interface TopicState {
    topic_id: string;
    name: string;
    mastery: number;
    attempted: number;
    correct: number;
    status: string;
    last_assessed: string | null;
}

export interface UserProfile {
    knowledge_level: string;
    known_concepts: string[];
    weak_areas: string[];
    confidence_score: number;
    explanation_preference: string;
    topic_mastery: Record<string, number>;
    topics: Record<string, TopicState>;
    current_session_id?: string;
}

export interface ChatMessage {
    role: string;
    content: string;
    timestamp: string;
}

export interface SessionHistory {
    session_id: string;
    user_id: string;
    messages: ChatMessage[];
    mastered_concepts: string[];
    weak_areas: string[];
    topic_mastery: Record<string, number>;
    created_at: string;
}

export const chatService = {
    sendMessage: async (userId: string, message: string, sessionId: string = "default") => {
        const response = await api.post<{ response: string, mastery_updates: Record<string, number> }>('/chat', { 
            user_id: userId, 
            message,
            session_id: sessionId,
            stream: false
        });
        return response.data;
    },
    streamMessage: async (userId: string, message: string, sessionId: string = "default", onChunk: (chunk: string) => void) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    message,
                    session_id: sessionId,
                    stream: true
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            }

            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                onChunk(chunk);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error("AI took too long to respond. Please retry.");
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    },
    getHistory: async (userId: string) => {
        const response = await api.get<SessionHistory[]>(`/history/${userId}`);
        return response.data;
    }
};

export const assessmentService = {
    generateMCQs: async (userId: string, topics: string[], count: number = 5, query?: string) => {
        const response = await api.post('/assessment/mcq/generate', { user_id: userId, topics, count, query });
        return response.data;
    },
    submitMCQ: async (userId: string, questionId: string, selectedOption: number) => {
        const response = await api.post('/assessment/mcq/submit', { 
            user_id: userId, 
            question_id: questionId, 
            selected_option: selectedOption 
        });
        return response.data;
    },
    batchSubmitMCQ: async (userId: string, answers: Record<string, number>) => {
        const response = await api.post('/assessment/mcq/batch-submit', { 
            user_id: userId, 
            answers 
        });
        return response.data;
    },
    generateQA: async (userId: string, topics: string[], size: string = "medium", count: number = 3, query?: string) => {
        const response = await api.post('/assessment/qa/generate', { user_id: userId, topics, size, count, query });
        return response.data;
    },
    batchSubmitQA: async (userId: string, answers: Record<string, string>) => {
        const response = await api.post('/assessment/qa/batch-submit', { 
            user_id: userId, 
            answers 
        });
        return response.data;
    },
    gradeAnswer: async (userId: string, topic: string, question: string, keyPoints: string, userAnswer: string) => {
        const response = await api.post('/assessment/grade', { 
            user_id: userId, 
            topic, 
            question, 
            key_points: keyPoints, 
            user_answer: userAnswer 
        });
        return response.data;
    },
    getRevision: async (userId: string, topics: string[]) => {
        const response = await api.post('/assessment/revision', { user_id: userId, topics });
        return response.data;
    }
};

export const userService = {
    getProfile: async (userId: string) => {
        const response = await api.get<UserProfile>(`/user/${userId}/profile`);
        return response.data;
    },
    resetMemory: async (userId: string) => {
        const response = await api.post<{ status: string, message: string }>(`/user/${userId}/reset`);
        return response.data;
    },
};

export const uploadService = {
    uploadFile: async (userId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/upload?user_id=${userId}`, formData);
        return response.data;
    }
};

export default api;
