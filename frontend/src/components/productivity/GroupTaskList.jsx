import React, { useEffect, useState, useMemo } from "react";
import { useProductivityStore } from "../../store/useProductivityStore";
import { useChatStore } from "../../store/useChattingStore";
import { CheckCircle2, Circle, Clock, Plus } from "lucide-react";

const GroupTaskList = () => {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const { board, tasks, isBoardLoading, fetchBoard, addTask, moveTask } = useProductivityStore();

    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [isAddingString, setIsAddingString] = useState(false);

    useEffect(() => {
        if (!selectedUser) return;
        fetchBoard(selectedUser._id);
    }, [selectedUser, fetchBoard]);

    const allTasks = useMemo(() => {
        if (!board || !board.columns) return [];
        // Flatten tasks from all columns, but keep track of their status (column)
        const flatTasks = [];
        board.columns.forEach(col => {
            const colTasks = tasks.filter(t => t.columnId === col.id).sort((a, b) => a.order - b.order);
            colTasks.forEach(task => {
                flatTasks.push({ ...task, status: col.title, columnId: col.id });
            });
        });
        return flatTasks;
    }, [board, tasks]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !board || !board.columns.length) return;

        // Default to first column (usually Todo)
        const firstColumn = board.columns[0];

        await addTask({
            boardId: board._id,
            columnId: firstColumn.id,
            title: newTaskTitle,
            assignedTo: [],
            labels: []
        });

        setNewTaskTitle("");
        setIsAddingString(false);
    };

    // Helper to toggle status (simple implementation: move to next column or toggle todo/done)
    const toggleTaskStatus = async (task) => {
        if (!board) return;
        // Find current column index
        const colIndex = board.columns.findIndex(c => c.id === task.columnId);
        if (colIndex === -1) return;

        // Move to next column, or cycle back to start? 
        // Or if it's "Done", move to "Todo". If "Todo", move to "Done"?
        // Let's assume standard Todo -> In Progress -> Done flow.
        const nextColIndex = (colIndex + 1) % board.columns.length;
        const nextColumn = board.columns[nextColIndex];

        await moveTask(task._id, nextColumn.id, 0);
    };

    if (isBoardLoading && !board) {
        return <div className="p-8 text-center text-base-content/50">Loading tasks...</div>;
    }

    if (!board) return <div className="p-8 text-center text-base-content/50">No tasks found.</div>;

    const getStatusIcon = (status) => {
        const lower = status.toLowerCase();
        if (lower.includes("done") || lower.includes("complete")) return <CheckCircle2 className="text-success" size={20} />;
        if (lower.includes("progress")) return <Clock className="text-warning" size={20} />;
        return <Circle className="text-base-content/30" size={20} />;
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-base-100">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Group Tasks</h2>
                    <button
                        onClick={() => setIsAddingString(true)}
                        className="btn btn-primary btn-sm gap-2"
                    >
                        <Plus size={16} /> New Task
                    </button>
                </div>

                {isAddingString && (
                    <form onSubmit={handleAddTask} className="mb-6 bg-base-200 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="input input-bordered w-full mb-3"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAddingString(false)} className="btn btn-ghost btn-sm">Cancel</button>
                            <button type="submit" className="btn btn-primary btn-sm">Add Task</button>
                        </div>
                    </form>
                )}

                <div className="space-y-2">
                    {allTasks.length > 0 ? (
                        allTasks.map((task) => (
                            <div key={task._id} className="group flex items-center gap-4 p-4 bg-base-100 border border-base-200 rounded-xl hover:shadow-md hover:border-base-300 transition-all">
                                <button onClick={() => toggleTaskStatus(task)} className="btn btn-ghost btn-circle btn-sm">
                                    {getStatusIcon(task.status)}
                                </button>
                                <div className="flex-1">
                                    <h3 className={`font-medium ${task.status.toLowerCase().includes('done') ? 'line-through text-base-content/50' : ''}`}>
                                        {task.title}
                                    </h3>
                                    <span className="text-xs text-base-content/50 uppercase tracking-wider font-semibold">
                                        {task.status}
                                    </span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Placeholder for more actions */}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-base-200/50 rounded-xl border-dashed border-2 border-base-300">
                            <p className="text-base-content/50">No tasks yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupTaskList;
