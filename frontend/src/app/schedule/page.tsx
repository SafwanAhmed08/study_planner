"use client";
import { useState, useEffect } from "react";
import axios from "axios";

type ScheduleItem = {
    week: number;
    day: string;
    topic: string;
    hours: number;
    session_type: string;
}

export default function SchedulePage() {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [hoursPerDay, setHoursPerDay] = useState(2);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    const handleGenerate = async () => {
        if (!startDate || !endDate) return;
        
        if (schedule.length > 0) {
            const confirm = window.confirm("A schedule already exists. Do you want to overwrite it?");
            if (!confirm) return;
        }
        setLoading(true);
        setSchedule([]);

        try {
            const { data } = await axios.post("http://localhost:8000/schedule", {
                hours_per_day: hoursPerDay,
                start: startDate,
                end: endDate
            });
            setSchedule(data.schedule);
            setGenerated(true);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // group by week
    const weeks = schedule.reduce((acc, item) => {
        const week = item.week ?? 1;
        if (!acc[week]) acc[week] = [];
        acc[week].push(item);
        return acc;
    }, {} as Record<number, ScheduleItem[]>);

    const sessionColor = (type: string) => {
        switch (type) {
            case "study": return "bg-blue-600";
            case "review": return "bg-yellow-600";
            case "quiz": return "bg-purple-600";
            default: return "bg-gray-600";
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Study Schedule</h1>

            {/* controls */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
                <div className="flex gap-6 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-400">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-gray-700 rounded-lg px-4 py-2 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-400">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-gray-700 rounded-lg px-4 py-2 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-400">Hours per Day</label>
                        <input
                            type="number"
                            value={hoursPerDay}
                            onChange={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) setHoursPerDay(val);
                            }}
                            min={0.5}
                            max={12}
                            step={0.5}
                            className="bg-gray-700 rounded-lg px-4 py-2 outline-none w-24"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !startDate || !endDate}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg"
                        >
                            {loading ? "Generating..." : "Generate Schedule"}
                        </button>
                    </div>
                </div>
            </div>

            {/* legend */}
            {generated && schedule.length > 0 && (
                <div className="flex gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-600"/>
                        <span className="text-sm text-gray-400">Study</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-600"/>
                        <span className="text-sm text-gray-400">Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-600"/>
                        <span className="text-sm text-gray-400">Quiz</span>
                    </div>
                </div>
            )}

            {/* schedule by week */}
            {Object.entries(weeks).map(([week, items]) => (
                <div key={week} className="mb-8">
                    <h2 className="text-lg font-semibold mb-3 text-gray-300">Week {week}</h2>
                    <div className="flex flex-col gap-2">
                        {items.map((item, i) => (
                            <div key={i} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                                <div className="w-24 text-sm text-gray-400 shrink-0">
                                    {item.day}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{item.topic}</p>
                                    <p className="text-sm text-gray-400">{item.hours} hrs</p>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full ${sessionColor(item.session_type)}`}>
                                    {item.session_type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {generated && schedule.length === 0 && (
                <p className="text-gray-500 text-center mt-20">No schedule generated. Make sure you have topics added.</p>
            )}
        </div>
    );
}