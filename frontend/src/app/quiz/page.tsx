"use client";
import { useState, useEffect } from "react";
import axios from "axios";

type Topic = {
    id: number;
    name: string;
}

type Subtopic = {
    id: number;
    name: string;
}

type Question = {
    type: "mcq" | "open";
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
}

export default function QuizPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
    const [topicId, setTopicId] = useState<number | null>(null);
    const [subtopicId, setSubtopicId] = useState<number | null>(null);
    const [numQuestions, setNumQuestions] = useState("5");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        if (topicId) fetchSubtopics(topicId);
    }, [topicId]);

    const fetchTopics = async () => {
        const { data } = await axios.get("http://localhost:8000/topics");
        setTopics(data);
        if (data.length > 0) setTopicId(data[0].id);
    };

    const fetchSubtopics = async (id: number) => {
        const { data } = await axios.get(`http://localhost:8000/subtopics/${id}`);
        setSubtopics(data.subtopics);
        if (data.subtopics.length > 0) setSubtopicId(data.subtopics[0].id);
    };

    const questionCount = Number(numQuestions);

    const invalidQuestionCount =
        !numQuestions.trim() ||
        !/^\d+$/.test(numQuestions.trim()) ||
        questionCount < 1 ||
        questionCount > 10;

    const handleGenerate = async () => {
        if (!subtopicId || invalidQuestionCount) return;
        setLoading(true);
        setQuestions([]);
        setAnswers({});
        setSubmitted(false);

        try {
            const { data } = await axios.post("http://localhost:8000/quiz", {
                subtopic_id: subtopicId,
                num_questions: questionCount
            });
            console.log(data.quiz);
            setQuestions(data.quiz);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        let correct = 0;
        questions.forEach((q, i) => {
            if (answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
                correct++;
            }
        });
        setScore(correct);
        setSubmitted(true);
    };

    const isCorrect = (i: number) => {
        return answers[i]?.toLowerCase().trim() === questions[i].answer.toLowerCase().trim();
    };

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">Quiz</h1>

            {/* controls */}
            <div className="flex gap-3 mb-8 flex-wrap">
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-400">Topic</label>
                    <select
                        value={topicId ?? ""}
                        onChange={e => setTopicId(Number(e.target.value))}
                        className="bg-gray-800 rounded-lg px-4 py-2 outline-none"
                    >
                        {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-400">Subtopic</label>
                    <select
                        value={subtopicId ?? ""}
                        onChange={e => setSubtopicId(Number(e.target.value))}
                        className="bg-gray-800 rounded-lg px-4 py-2 outline-none"
                    >
                        {subtopics.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-400">Questions</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={numQuestions}
                        onChange={e => setNumQuestions(e.target.value)}
                        placeholder="5"
                        className="bg-gray-800 rounded-lg px-4 py-2 outline-none w-24"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !subtopicId || invalidQuestionCount}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg"
                    >
                        {loading ? "Generating..." : "Generate Quiz"}
                    </button>
                </div>
            </div>

            {/* questions */}
            {questions.length > 0 && (
                <div className="flex flex-col gap-6">
                    {questions.map((q, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-5">
                            <p className="font-medium mb-4">{i + 1}. {q.question}</p>

                            {q.options && q.options.length>0 ? (
                                <div className="flex flex-col gap-2">
                                    {q.options.map((opt, j) => (
                                        <button
                                            key={j}
                                            onClick={() => !submitted && setAnswers(prev => ({ ...prev, [i]: opt }))}
                                            className={`text-left px-4 py-2 rounded-lg transition-colors ${
                                                submitted
                                                    ? opt === q.answer
                                                        ? "bg-green-600"
                                                        : answers[i] === opt
                                                        ? "bg-red-600"
                                                        : "bg-gray-700"
                                                    : answers[i] === opt
                                                    ? "bg-blue-600"
                                                    : "bg-gray-700 hover:bg-gray-600"
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    value={answers[i] ?? ""}
                                    onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                                    disabled={submitted}
                                    placeholder="Type your answer..."
                                    rows={3}
                                    className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none resize-none text-sm"
                                />
                            )}

                            {submitted && (
                                <div className={`mt-3 text-sm p-3 rounded-lg ${isCorrect(i) ? "bg-green-900" : "bg-red-900"}`}>
                                    <p className="font-medium">{isCorrect(i) ? "✓ Correct" : "✗ Incorrect"}</p>
                                    <p className="text-gray-300 mt-1">Answer: {q.answer}</p>
                                    <p className="text-gray-400 mt-1">{q.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {!submitted ? (
                        <button
                            onClick={handleSubmit}
                            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg"
                        >
                            Submit
                        </button>
                    ) : (
                        <div className="bg-gray-800 rounded-lg p-5 text-center">
                            <p className="text-2xl font-bold">{score}/{questions.length}</p>
                            <p className="text-gray-400 mt-1">
                                {score === questions.length ? "Perfect! 🎉" :
                                 score >= questions.length / 2 ? "Good job! 👍" :
                                 "Keep studying! 💪"}
                            </p>
                            <button
                                onClick={handleGenerate}
                                className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}