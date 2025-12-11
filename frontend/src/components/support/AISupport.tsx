import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { MessageSquare, X, Send, Minimize2, Maximize2, AlertCircle, Loader2 } from 'lucide-react';
import { aiSupportService, ChatMessage } from '../../services/aiSupportService';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AISupport: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showEscalation, setShowEscalation] = useState(false);
    const [escalationReason, setEscalationReason] = useState('');
    const [isEscalating, setIsEscalating] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { user } = useAuth();
    const location = useLocation();
    const { schoolCode } = useParams<{ schoolCode: string }>();

    // Reset chat state when school context changes
    // This ensures no data mixing between different schools
    useEffect(() => {
        console.log('🔄 AISupport: School context changed, resetting chat state');
        setMessages([]);
        setInput('');
        setShowEscalation(false);
        setEscalationReason('');
        setIsOpen(false);
        setIsMinimized(false);
    }, [schoolCode]);

    // Scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, isMinimized]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Use fetch directly for streaming since axios/interceptor handling of streams can be tricky
            const baseUrl = apiService.api.defaults.baseURL || '';
            const endpoint = schoolCode
                ? `/api/v1/school/${schoolCode}/support/chat/stream`
                : '/api/v1/support/chat/stream';

            const token = localStorage.getItem('access_token');

            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages, // Send previous history
                    context: `Page: ${location.pathname}`
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            // Add placeholder for AI response
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            const decoder = new TextDecoder();
            let aiResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                aiResponse += chunk;

                // Update the last message with the accumulating response
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', content: aiResponse };
                    return newMessages;
                });
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'model',
                content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEscalation = async () => {
        if (!escalationReason.trim()) return;

        setIsEscalating(true);
        try {
            await aiSupportService.escalateIssue({
                issue_description: escalationReason,
                chat_history: messages
            }, schoolCode);

            setMessages(prev => [...prev, {
                role: 'model',
                content: 'I have escalated your issue to our human support team. They will contact you shortly via email.'
            }]);
            setShowEscalation(false);
            setEscalationReason('');
        } catch (error) {
            console.error('Escalation error:', error);
            // Show error in chat
            setMessages(prev => [...prev, {
                role: 'model',
                content: 'Failed to escalate the issue. Please try again later.'
            }]);
        } finally {
            setIsEscalating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!user) return null;

    return (
        <div
            className={`
                z-50 flex flex-col items-end
                ${isOpen && !isMinimized
                    ? 'fixed inset-0 pointer-events-none'
                    : 'fixed bottom-6 right-6 pointer-events-auto'}
            `}
        >
            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`
            bg-white dark:bg-gray-800 shadow-2xl border-gray-200 dark:border-gray-700
            transition-all duration-300 ease-in-out overflow-hidden pointer-events-auto
            ${isMinimized
                            ? 'w-72 h-14 rounded-lg border mb-4'
                            : 'w-full h-full md:w-[45vw] md:max-w-[600px] rounded-none md:rounded-l-2xl border-l'}
          `}
                >
                    {/* Header */}
                    <div
                        className="bg-primary-600 p-3 flex items-center justify-between cursor-pointer"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        <div className="flex items-center space-x-2 text-white">
                            <MessageSquare size={18} />
                            <span className="font-medium">AI Support Assistant</span>
                        </div>
                        <div className="flex items-center space-x-1 text-white/80">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMinimized(!isMinimized);
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                            >
                                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Content (only visible when not minimized) */}
                    {!isMinimized && (
                        <div className="flex flex-col h-[calc(100%-3.5rem)]">
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                        <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                            <MessageSquare className="text-primary-600 dark:text-primary-400" size={24} />
                                        </div>
                                        <p className="text-sm">
                                            Hi {user.first_name}! I'm your AI assistant.
                                            <br />
                                            How can I help you today?
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`
                        max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap
                        ${msg.role === 'user'
                                                    ? 'bg-primary-600 text-white rounded-br-none'
                                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}
                      `}
                                        >
                                            <div className={`prose prose-sm max-w-none ${msg.role === 'user'
                                                ? 'prose-invert text-white'
                                                : 'dark:prose-invert text-gray-800 dark:text-gray-200'
                                                }`}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                                        a: ({ node, ...props }) => <a className="underline hover:text-blue-300" target="_blank" rel="noopener noreferrer" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                        li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                                        code: ({ node, ...props }) => <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5" {...props} />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-bl-none shadow-sm border border-gray-200 dark:border-gray-700">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Escalation Form */}
                            {showEscalation ? (
                                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Contact Support</h4>
                                        <button onClick={() => setShowEscalation(false)} className="text-gray-400 hover:text-gray-600">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <textarea
                                        value={escalationReason}
                                        onChange={(e) => setEscalationReason(e.target.value)}
                                        placeholder="Describe your issue..."
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        rows={3}
                                    />
                                    <button
                                        onClick={handleEscalation}
                                        disabled={isEscalating || !escalationReason.trim()}
                                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isEscalating ? <Loader2 className="animate-spin mr-2" size={14} /> : 'Submit Ticket'}
                                    </button>
                                </div>
                            ) : (
                                /* Input Area */
                                <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-end space-x-2">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Type your question..."
                                            className="flex-1 max-h-32 min-h-[40px] p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                            rows={1}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!input.trim() || isLoading}
                                            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                        <button
                                            onClick={() => setShowEscalation(true)}
                                            className="text-xs text-gray-500 hover:text-red-600 flex items-center space-x-1 transition-colors"
                                        >
                                            <AlertCircle size={12} />
                                            <span>Contact Human Support</span>
                                        </button>
                                        <span className="text-[10px] text-gray-400">AI can make mistakes.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="
            group flex items-center justify-center w-14 h-14 
            bg-primary-600 hover:bg-primary-700 text-white 
            rounded-full shadow-lg hover:shadow-xl 
            transition-all duration-300 transform hover:scale-110
            pointer-events-auto
          "
                    aria-label="Open Support Chat"
                >
                    <MessageSquare size={24} />
                    <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Need Help?
                    </span>
                </button>
            )}
        </div>
    );
};

export default AISupport;
