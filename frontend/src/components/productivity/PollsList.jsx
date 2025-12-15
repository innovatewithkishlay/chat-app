import React, { useEffect, useState, memo } from "react";
import { useProductivityStore } from "../../store/useProductivityStore";
import { useChatStore } from "../../store/useChattingStore";
import { Plus, BarChart2, CheckCircle } from "lucide-react";
import { PollsSkeleton } from "../skeletons/ProductivitySkeletons";

const PollItem = memo(({ poll, currentUserId, onVote }) => {
    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.voteCount, 0);

    return (
        <div className="card bg-base-200 shadow-sm border border-base-300">
            <div className="card-body p-5">
                <h3 className="font-bold text-lg mb-4">{poll.question}</h3>

                <div className="space-y-3">
                    {poll.options.map((option, idx) => {
                        const percentage = totalVotes === 0 ? 0 : Math.round((option.voteCount / totalVotes) * 100);
                        const isVoted = poll.votes.some(v => v.userId === currentUserId && v.optionIndex === idx);

                        return (
                            <div
                                key={idx}
                                onClick={() => onVote(poll._id, idx)}
                                className={`
            relative p-3 rounded-lg cursor-pointer border transition-all overflow-hidden
            ${isVoted ? "border-primary bg-primary/5" : "border-base-300 hover:bg-base-300/50"}
          `}
                            >
                                {/* Progress Bar Background */}
                                <div
                                    className="absolute inset-0 bg-primary/10 transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />

                                <div className="relative flex items-center justify-between z-10">
                                    <span className="font-medium flex items-center gap-2">
                                        {option.text}
                                        {isVoted && <CheckCircle size={14} className="text-primary" />}
                                    </span>
                                    <span className="text-sm opacity-70 font-mono">
                                        {percentage}% ({option.voteCount})
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 text-xs opacity-50 text-right">
                    Total votes: {totalVotes}
                </div>
            </div>
        </div>
    );
});

const PollsList = () => {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const authUser = useChatStore((state) => state.authUser);

    const polls = useProductivityStore((state) => state.polls);
    const fetchPolls = useProductivityStore((state) => state.fetchPolls);
    const createPoll = useProductivityStore((state) => state.createPoll);
    const votePoll = useProductivityStore((state) => state.votePoll);
    const isPollsLoading = useProductivityStore((state) => state.isPollsLoading);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);

    useEffect(() => {
        if (selectedUser?._id) {
            fetchPolls(selectedUser._id);
        }
    }, [selectedUser?._id, fetchPolls]);

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        const validOptions = options.filter(o => o.trim());
        if (!question.trim() || validOptions.length < 2) return;

        await createPoll({
            conversationId: selectedUser._id,
            question,
            options: validOptions
        });

        setIsModalOpen(false);
        setQuestion("");
        setOptions(["", ""]);
    };

    const addOption = () => setOptions([...options, ""]);
    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    if (isPollsLoading && polls.length === 0) {
        return <PollsSkeleton />;
    }

    return (
        <div className="flex-1 bg-base-100 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart2 /> Polls
                    </h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary btn-sm gap-2"
                    >
                        <Plus size={16} /> Create Poll
                    </button>
                </div>

                <div className="space-y-6">
                    {polls.map((poll) => (
                        <PollItem
                            key={poll._id}
                            poll={poll}
                            currentUserId={authUser._id}
                            onVote={votePoll}
                        />
                    ))}

                    {polls.length === 0 && (
                        <div className="text-center py-12 opacity-50">
                            <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No polls yet. Create one to ask the group!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Poll Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-base-100 p-6 rounded-xl w-96 shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Create New Poll</h3>
                        <form onSubmit={handleCreatePoll}>
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Question</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Ask something..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Options</span>
                                </label>
                                {options.map((opt, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        className="input input-bordered w-full mb-2 input-sm"
                                        placeholder={`Option ${idx + 1}`}
                                        value={opt}
                                        onChange={(e) => updateOption(idx, e.target.value)}
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="btn btn-ghost btn-xs w-full mt-1"
                                >
                                    + Add Option
                                </button>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Poll
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PollsList;
