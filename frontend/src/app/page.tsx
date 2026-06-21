"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { BookOpen, Upload, MessageSquare, Brain, CreditCard, Calendar } from "lucide-react";

type Topic = {
    id: number;
    name: string;
    priority: number;
}

type Subtopic = {
    id: number;
    name: string;
    topic_id: number;
}

type ScheduleItem = {
    id: number;
    week: number;
    day: string;
    topic: string;
    hours: number;
    session_type: string;
    completed: boolean;
}


export default function Dashboard() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [subtopicCounts, setSubtopicCounts] = useState<Record<number, number>>({});
    const [chunkCounts, setChunkCounts] = useState<Record<number, number>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: topicsData } = await axios.get("http://localhost:8000/topics");
        setTopics(topicsData);

        const { data: scheduleData } = await axios.get("http://localhost:8000/schedule");
        setSchedule(scheduleData.schedule);

        // fetch subtopic counts per topic
        const counts: Record<number, number> = {};
        const chunks: Record<number, number> = {};

        await Promise.all(topicsData.map(async (t: Topic) => {
            const { data: sub } = await axios.get(`http://localhost:8000/subtopics/${t.id}`);
            counts[t.id] = sub.subtopics.length;

            // const { data: chunkData } = await axios.get(`http://localhost:8000/chunks/${t.id}`);
            // chunks[t.id] = chunkData.chunk_count;
        }));

        setSubtopicCounts(counts);
        setChunkCounts(chunks);
    };

    const priorityLabel = (p: number) => p === 3 ? "High" : p === 2 ? "Medium" : "Low";
    const priorityColor = (p: number) => p === 3 ? "bg-red-600" : p === 2 ? "bg-yellow-600" : "bg-green-600";

    const quickLinks = [
        { href: "/topics", label: "Manage Topics", icon: BookOpen, color: "bg-blue-600" },
        { href: "/upload", label: "Upload Material", icon: Upload, color: "bg-green-600" },
        { href: "/chat", label: "Ask a Question", icon: MessageSquare, color: "bg-purple-600" },
        { href: "/quiz", label: "Take a Quiz", icon: Brain, color: "bg-yellow-600" },
        { href: "/flashcards", label: "Flashcards", icon: CreditCard, color: "bg-pink-600" },
        { href: "/schedule", label: "Study Schedule", icon: Calendar, color: "bg-orange-600" },
    ];

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400 mb-8">MSc AI — University of Edinburgh, September 2026</p>

            {/* quick links */}
            <div className="grid grid-cols-3 gap-4 mb-10">
                {quickLinks.map(({ href, label, icon: Icon, color }) => (
                    <Link
                        key={href}
                        href={href}
                        className="bg-gray-800 hover:bg-gray-750 rounded-xl p-5 flex items-center gap-4 transition-colors"
                    >
                        <div className={`${color} p-3 rounded-lg`}>
                            <Icon size={20} />
                        </div>
                        <span className="font-medium">{label}</span>
                    </Link>
                ))}
            </div>

            {/* topics overview */}
            <h2 className="text-lg font-semibold mb-4">Your Topics</h2>
            {topics.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-8 text-center">
                    <p className="text-gray-400 mb-4">No topics yet</p>
                    <Link href="/topics" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                        Add a Topic
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {topics.map(t => (
                        <div key={t.id} className="bg-gray-800 rounded-xl p-5 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-semibold">{t.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(t.priority)}`}>
                                        {priorityLabel(t.priority)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    {subtopicCounts[t.id] ?? 0} subtopics · {chunkCounts[t.id] ?? 0} chunks indexed
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Link href="/chat" className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm">
                                    Ask
                                </Link>
                                <Link href="/quiz" className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm">
                                    Quiz
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        <h2 className="text-lg font-semibold mb-4 mt-10">Upcoming Sessions</h2>
            {schedule.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-8 text-center">
                    <p className="text-gray-400 mb-4">No schedule yet</p>
                    <Link href="/schedule" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                        Generate Schedule
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {schedule.slice(0, 7).map(item => (
                        <div key={item.id} className={`bg-gray-800 rounded-xl p-4 flex items-center gap-4 ${item.completed ? "opacity-50" : ""}`}>
                            <div className="w-24 text-sm text-gray-400 shrink-0">
                                Week {item.week} · {item.day}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{item.topic}</p>
                                <p className="text-sm text-gray-400">{item.hours} hrs</p>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full ${
                                item.session_type === "study" ? "bg-blue-600" :
                                item.session_type === "review" ? "bg-yellow-600" :
                                "bg-purple-600"
                            }`}>
                                {item.session_type}
                            </span>
                            {!item.completed && (
                                <button
                                    onClick={async () => {
                                        await axios.patch(`http://localhost:8000/schedule/${item.id}/complete`);
                                        fetchData();
                                    }}
                                    className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm"
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    ))}
                    {schedule.length > 7 && (
                        <Link href="/schedule" className="text-center text-gray-400 hover:text-white text-sm py-2">
                            View all {schedule.length} sessions →
                        </Link>
                    )}
                </div>
            )}   
        </div>
    );
}