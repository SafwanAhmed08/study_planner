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

type Flashcard = {
    front: string;
    back: string;
}

export default function FlashcardsPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
    const [topicId, setTopicId] = useState<number | null>(null);
    const [subtopicId, setSubtopicId] = useState<number | null>(null);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState("10");

    useEffect(() => { fetchTopics(); }, []);
    useEffect(() => { if (topicId) fetchSubtopics(topicId); }, [topicId]);

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

    const cardCount = Number(count);

    const invalidCardCount =
        !count.trim() ||
        !/^\d+$/.test(count.trim()) ||
        cardCount < 1 ||
        cardCount > 20;

    const handleGenerate = async () => {
        if (!subtopicId || invalidCardCount) return;

        setLoading(true);
        setCards([]);
        setCurrent(0);
        setFlipped(false);

        try {
            const { data } = await axios.post("http://localhost:8000/flashcards", {
                subtopic_id: subtopicId,
                count: cardCount
            });

            setCards(data.flashcards);
        } catch (e: any) {
            console.error(e.response?.data || e);
        } finally {
            setLoading(false);
        }
    };

    const next = () => {
        setFlipped(false);
        setTimeout(() => setCurrent(i => Math.min(i + 1, cards.length - 1)), 150);
    };

    const prev = () => {
        setFlipped(false);
        setTimeout(() => setCurrent(i => Math.max(i - 1, 0)), 150);
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Flashcards</h1>

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
                    <label className="text-sm text-gray-400">Cards</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={count}
                        onChange={e => setCount(e.target.value)}
                        placeholder="10"
                        className="bg-gray-800 rounded-lg px-4 py-2 outline-none w-24"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !subtopicId||invalidCardCount}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg"
                    >
                        {loading ? "Generating..." : "Generate"}
                    </button>
                </div>
            </div>

            {/* flashcard */}
            {cards.length > 0 && (
                <div>
                    {/* progress */}
                    <p className="text-gray-400 text-sm mb-4 text-center">
                        {current + 1} / {cards.length}
                    </p>

                    {/* card */}
                    <div
                        onClick={() => setFlipped(f => !f)}
                        className="cursor-pointer bg-gray-800 rounded-2xl p-10 text-center min-h-48 flex items-center justify-center mb-6 select-none hover:bg-gray-750 transition-colors"
                    >
                        <div>
                            <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">
                                {flipped ? "Answer" : "Question"}
                            </p>
                            <p className="text-lg">
                                {flipped ? cards[current].back : cards[current].front}
                            </p>
                        </div>
                    </div>

                    {/* navigation */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={prev}
                            disabled={current === 0}
                            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-30 px-6 py-2 rounded-lg"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setFlipped(f => !f)}
                            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg"
                        >
                            Flip
                        </button>
                        <button
                            onClick={next}
                            disabled={current === cards.length - 1}
                            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-30 px-6 py-2 rounded-lg"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}