"use client";
import { useState, useEffect } from "react";
import axios from "axios";

type Topic = {
    id: number;
    name: string;
}

type Prerequisite = {
    id: number;
    name: string;
    description: string;
    category: string;
    completed: boolean;
}

const categoryColor = (cat: string) => {
    switch (cat) {
        case "maths": return "bg-blue-600";
        case "programming": return "bg-green-600";
        case "ml": return "bg-purple-600";
        default: return "bg-gray-600";
    }
}

export default function PrerequisitesPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [prereqs, setPrereqs] = useState<Prerequisite[]>([]);

    // extract form
    const [extractText, setExtractText] = useState("");
    const [extractTopicIds, setExtractTopicIds] = useState<number[]>([]);
    const [extracting, setExtracting] = useState(false);

    // manual form
    const [manualName, setManualName] = useState("");
    const [manualDesc, setManualDesc] = useState("");
    const [manualCategory, setManualCategory] = useState("other");
    const [manualTopicIds, setManualTopicIds] = useState<number[]>([]);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchTopics();
        fetchPrereqs();
    }, []);

    const fetchTopics = async () => {
        const { data } = await axios.get("http://localhost:8000/topics");
        setTopics(data);
    };

    const fetchPrereqs = async () => {
        const { data } = await axios.get("http://localhost:8000/prerequisites");
        setPrereqs(data.prerequisites);
    };

    const handleExtract = async () => {
        if (!extractText.trim()) return;
        setExtracting(true);
        try {
            await axios.post("http://localhost:8000/prerequisites/extract", {
                text: extractText,
            });
            setExtractText("");
            setExtractTopicIds([]);
            await fetchPrereqs();
        } catch (e) {
            console.error(e);
        } finally {
            setExtracting(false);
        }
    };

    const handleAddManual = async () => {
        if (!manualName.trim()) return;
        setAdding(true);
        try {
            await axios.post("http://localhost:8000/prerequisites", {
                name: manualName,
                description: manualDesc,
                category: manualCategory,
            });
            setManualName("");
            setManualDesc("");
            setManualCategory("other");
            setManualTopicIds([]);
            await fetchPrereqs();
        } catch (e) {
            console.error(e);
        } finally {
            setAdding(false);
        }
    };

    const toggleComplete = async (id: number) => {
        await axios.patch(`http://localhost:8000/prerequisites/${id}/complete`);
        await fetchPrereqs();
    };

    const handleDelete = async (id: number) => {
        await axios.delete(`http://localhost:8000/prerequisites/${id}`);
        await fetchPrereqs();
    };

    const toggleTopicId = (id: number, current: number[], setter: (v: number[]) => void) => {
        setter(current.includes(id) ? current.filter(t => t !== id) : [...current, id]);
    };

    // group prereqs by category
    const grouped = prereqs.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
    }, {} as Record<string, Prerequisite[]>);

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">Prerequisites</h1>

            {/* extract via LLM */}
            <div className="bg-gray-800 rounded-xl p-5 mb-6">
                <h2 className="font-semibold mb-3">Extract from Course Description</h2>
                <textarea
                    value={extractText}
                    onChange={e => setExtractText(e.target.value)}
                    placeholder="Paste your course description here..."
                    rows={5}
                    className="w-full bg-gray-700 rounded-lg px-4 py-3 outline-none resize-none text-sm mb-3"
                />
                <button
                    onClick={handleExtract}
                    disabled={extracting || !extractText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg"
                >
                    {extracting ? "Extracting..." : "Extract Prerequisites"}
                </button>
            </div>

            {/* manual entry */}
            <div className="bg-gray-800 rounded-xl p-5 mb-8">
                <h2 className="font-semibold mb-3">Add Manually</h2>
                <div className="flex flex-col gap-3">
                    <input
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        placeholder="Name (e.g. Linear Algebra)"
                        className="bg-gray-700 rounded-lg px-4 py-2 outline-none text-sm"
                    />
                    <input
                        value={manualDesc}
                        onChange={e => setManualDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="bg-gray-700 rounded-lg px-4 py-2 outline-none text-sm"
                    />
                    <select
                        value={manualCategory}
                        onChange={e => setManualCategory(e.target.value)}
                        className="bg-gray-700 rounded-lg px-4 py-2 outline-none text-sm"
                    >
                        <option value="maths">Maths</option>
                        <option value="programming">Programming</option>
                        <option value="ml">Machine Learning</option>
                        <option value="other">Other</option>
                    </select>
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Link to courses:</p>
                        <div className="flex flex-wrap gap-2">
                            {topics.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => toggleTopicId(t.id, manualTopicIds, setManualTopicIds)}
                                    className={`text-sm px-3 py-1 rounded-full transition-colors ${
                                        manualTopicIds.includes(t.id) ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                                    }`}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleAddManual}
                        disabled={adding || !manualName.trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-2 rounded-lg"
                    >
                        {adding ? "Adding..." : "Add"}
                    </button>
                </div>
            </div>

            {/* prerequisites list grouped by category */}
            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-6">
                    <h2 className="font-semibold mb-3 capitalize flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${categoryColor(category)}`}/>
                        {category === "ml" ? "Machine Learning" : category}
                    </h2>
                    <div className="flex flex-col gap-2">
                        {items.map(p => (
                            <div
                                key={p.id}
                                className={`bg-gray-800 rounded-xl p-4 flex items-start gap-4 ${p.completed ? "opacity-60" : ""}`}
                            >
                                <button
                                    onClick={() => toggleComplete(p.id)}
                                    className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                                        p.completed ? "bg-green-600 border-green-600" : "border-gray-500 hover:border-green-500"
                                    }`}
                                />
                                <div className="flex-1">
                                    <p className={`font-medium ${p.completed ? "line-through text-gray-500" : ""}`}>
                                        {p.name}
                                    </p>
                                    {p.description && (
                                        <p className="text-sm text-gray-400 mt-1">{p.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="text-gray-500 hover:text-red-400 text-lg"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {prereqs.length === 0 && (
                <p className="text-gray-500 text-center mt-20">No prerequisites yet — extract or add one above.</p>
            )}
        </div>
    );
}