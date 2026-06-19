"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
    role: "user" | "assistant";
    content: string;
}

type Topic = {
    id: number;
    name: string;
    priority: number;
}

export default function AskPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [topicId, setTopicId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchTopics = async () => {
        const { data } = await axios.get("http://localhost:8000/topics");
        setTopics(data);
        if (data.length > 0) setTopicId(data[0].id);
    };

    const handleSend = async () => {
        if (!question.trim() || !topicId || loading) return;

        const userMessage: Message = { role: "user", content: question };
        setMessages(prev => [...prev, userMessage]);
        setQuestion("");
        setLoading(true);

        try {
            const { data } = await axios.post("http://localhost:8000/ask", {
                question,
                topic_id: topicId
            });

            const assistantMessage: Message = { role: "assistant", content: data.answer };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (e) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Something went wrong. Make sure LM Studio is running."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[90vh]">
            <h1 className="text-2xl font-bold mb-4">Ask</h1>

            {/* topic selector */}
            <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Choose Topic</label>
                <select
                    value={topicId ?? ""}
                    onChange={e => setTopicId(Number(e.target.value))}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2 outline-none">
                    {topics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4">
                {messages.length === 0 && (
                    <p className="text-gray-500 text-center mt-20">Ask anything about your study material</p>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                            msg.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-800 text-gray-100"
                        }`}>
                            {msg.role === "assistant" ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => (
                                            <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
                                        ),
                                        h2: ({ children }) => (
                                            <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>
                                        ),
                                        h3: ({ children }) => (
                                            <h3 className="text-base font-semibold mt-4 mb-2 text-blue-300">{children}</h3>
                                        ),
                                        p: ({ children }) => (
                                            <p className="mb-3 leading-relaxed">{children}</p>
                                        ),
                                        ul: ({ children }) => (
                                            <ul className="list-disc ml-5 mb-3 space-y-1">{children}</ul>
                                        ),
                                        ol: ({ children }) => (
                                            <ol className="list-decimal ml-5 mb-3 space-y-1">{children}</ol>
                                        ),
                                        li: ({ children }) => (
                                            <li className="leading-relaxed">{children}</li>
                                        ),
                                        strong: ({ children }) => (
                                            <strong className="font-semibold text-white">{children}</strong>
                                        ),
                                        code: ({ children }) => (
                                            <code className="bg-gray-900 px-1 py-0.5 rounded text-sm">{children}</code>
                                        ),
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 px-4 py-3 rounded-2xl text-sm text-gray-400">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* input */}
            <div className="flex gap-3">
                <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question... (Enter to send)"
                    rows={2}
                    className="flex-1 bg-gray-800 rounded-lg px-4 py-3 outline-none resize-none text-sm"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !question.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 rounded-lg"
                >
                    Send
                </button>
            </div>
        </div>
    );
}