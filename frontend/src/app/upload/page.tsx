"use client";
import { useEffect, useState } from "react";
import axios from "axios";

type Topic = {
    id: number;
    name: string;
    priority: number;
}

type UploadResult = {
    filename: string;
    status: string;
    subtopics: string[];
    error?: string;
}


export default function UploadPage(){
    const [ topics, setTopics] = useState<Topic[]>([]);
    const[topicId, setTopicId] = useState<number|null>(null);
    const [files, setFiles] = useState<File[]>([])
    const [results, setResults] = useState<UploadResult[]>([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        const { data } = await axios.get("http://localhost:8000/topics");
        setTopics(data);
        if (data.length > 0) setTopicId(data[0].id);
    };   

    const handleUpload = async () => {
        if (!files.length || !topicId) return;
        setLoading(true);
        setResults([]);

        const formData = new FormData();
        formData.append("topic_id", String(topicId));
        files.forEach(file => formData.append("files", file));

        try {
            const { data } = await axios.post("http://localhost:8000/uploadFolder", formData);
            setResults(data.results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Upload Material</h1>

            {/* topic selector */}
            <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Select Topic</label>
                <select
                    value={topicId ?? ""}
                    onChange={e => setTopicId(Number(e.target.value))}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2 outline-none"
                >
                    {topics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {/* file picker */}
            <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Select Files or Folder</label>
                <input
                    type="file"
                    multiple
                    // @ts-ignore
                    // webkitdirectory=""
                    onChange={e => setFiles(Array.from(e.target.files || []))}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2"
                />
                {files.length > 0 && (
                    <p className="text-sm text-gray-400 mt-2">{files.length} file(s) selected</p>
                )}
            </div>

            {/* upload button */}
            <button
                onClick={handleUpload}
                disabled={loading || !files.length || !topicId}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg mb-8"
            >
                {loading ? "Uploading..." : "Upload"}
            </button>

            {/* results */}
            {results.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className="font-semibold text-lg">Results</h2>
                    {results.map((r, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{r.filename}</span>
                                <span className={`text-sm px-2 py-1 rounded-full ${
                                    r.status === "ingested" ? "bg-green-600" :
                                    r.status === "skipped" ? "bg-yellow-600" :
                                    "bg-red-600"
                                }`}>
                                    {r.status}
                                </span>
                            </div>
                            {r.subtopics?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {r.subtopics.map((s, j) => (
                                        <span key={j} className="bg-gray-700 text-sm px-2 py-1 rounded-full">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {r.error && (
                                <p className="text-red-400 text-sm mt-2">{r.error}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}