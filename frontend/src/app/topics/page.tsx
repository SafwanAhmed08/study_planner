"use client";
import {useState, useEffect} from "react";
import axios from "axios";

//overall when page loads, fetch topics from fastapi backend, show them in a list
// when user types topic, selects priority and clicks add = send topic to fastapi backend, clear form, fetch updated topics again

//tells type script, a topic has an id, namer and priority and defines their types 
type Topic = {
    id: number;
    name: string;
    priority: number;
}

type Subtopic = {
    id: number;
    name: string;
}

export default  function TopicsPage(){
    const [topics, setTopics] = useState<Topic[]>([]);
    // creates state for the list of topics, initiially empty. Topic[] => array of Topic objects, setTopics will update the list
    const [name, setName] = useState("");
    //stores the value currently types in the topic name input
    const [priority, setPriority] = useState(1);
    //stores selected priority, 1 = low, 2 = medium, 3 = high
    useEffect(() => {
        fetchTopics();
    },[]);
    //fetch topics when page loads, async because http takes time
    const fetchTopics = async() =>{
        const {data} = await axios.get("http://localhost:8000/topics");
        setTopics(data);
    }

    //runs when the user clicks on add. name.trim() prevents empty topics
    const handleAdd = async() =>{
        if(!name.trim()) return;
        //send post to fastapi
        await axios.post("http://localhost:8000/topics",{
            name,
            priority
        });
        //reset to default values
        setName("");
        setPriority(1);
        await fetchTopics();
    };

    const [newSubtopic, setNewSubtopic] = useState<Record<number, string>>({});
    const [subtopics, setSubtopics] = useState<Record<number, Subtopic[]>>({});

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchSubtopics = async (topicId: number) => {
        const { data } = await axios.get(`http://localhost:8000/subtopics/${topicId}`);
        setSubtopics(prev => ({ ...prev, [topicId]: data.subtopics }));
    };

    const handleAddSubtopic = async (topicId: number) => {
        const name = newSubtopic[topicId]?.trim();
        if (!name) return;
        await axios.post("http://localhost:8000/subtopics", {
            name,
            topic_id: topicId
        });
        setNewSubtopic(prev => ({ ...prev, [topicId]: "" }));
        await fetchSubtopics(topicId);
        // refresh subtopics
    };
    
    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Topics</h1>

            {/* add topic form */}
            <div className="flex gap-3 mb-8">
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Topic name"
                    className="flex-1 bg-gray-800 rounded-lg px-4 py-2 outline-none"
                />
                <select
                    value={priority}
                    onChange={e => setPriority(Number(e.target.value))}
                    className="bg-gray-800 rounded-lg px-4 py-2 outline-none"
                >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                </select>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                    Add
                </button>
            </div>

            {/* topics list */}
            <div className="flex flex-col gap-3">
                {topics.map(topic => (
                    <div key={topic.id} className="bg-gray-800 rounded-lg p-4">
                        {/* topic header */}
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-semibold">{topic.name}</h2>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                                topic.priority === 3 ? "bg-red-600" :
                                topic.priority === 2 ? "bg-yellow-600" :
                                "bg-green-600"
                            }`}>
                                {topic.priority === 3 ? "High" :
                                 topic.priority === 2 ? "Medium" : "Low"}
                            </span>
                        </div>

                        {/* existing subtopics */}
                        {(subtopics[topic.id] ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(subtopics[topic.id] ?? []).map(s => (
                                    <span key={s.id} className="bg-gray-700 text-sm px-2 py-1 rounded-full">
                                        {s.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* add subtopic */}
                        <div className="flex gap-2">
                            <input
                                value={newSubtopic[topic.id] ?? ""}
                                onChange={e => setNewSubtopic(prev => ({ ...prev, [topic.id]: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && handleAddSubtopic(topic.id)}
                                placeholder="Add subtopic..."
                                className="flex-1 bg-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none"
                            />
                            <button
                                onClick={() => handleAddSubtopic(topic.id)}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}