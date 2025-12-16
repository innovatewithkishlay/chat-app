import React, { useEffect, useState, useMemo, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useProductivityStore } from "../../store/useProductivityStore";
import { useChatStore } from "../../store/useChattingStore";
import KanbanColumn from "./KanbanColumn";
import { KanbanSkeleton } from "../skeletons/ProductivitySkeletons";


const KanbanBoard = () => {
    const selectedUser = useChatStore((state) => state.selectedUser);

    // Granular selectors to prevent unnecessary re-renders
    const board = useProductivityStore((state) => state.board);
    const tasks = useProductivityStore((state) => state.tasks);
    const isBoardLoading = useProductivityStore((state) => state.isBoardLoading);
    const fetchBoard = useProductivityStore((state) => state.fetchBoard);
    const moveTask = useProductivityStore((state) => state.moveTask);
    const addTask = useProductivityStore((state) => state.addTask);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskColumn, setNewTaskColumn] = useState("todo");
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const conversations = useChatStore((state) => state.conversations);

    useEffect(() => {
        if (!selectedUser) return;

        let conversationId = selectedUser._id;

        // If it's a 1-on-1 chat (not a group), we need to find the conversation ID
        // Groups usually have their own ID as the conversation ID (or we treat them as such)
        // But for 1-on-1, selectedUser._id is the USER ID, not the CONVERSATION ID.
        const isGroup = selectedUser.groupMembers !== undefined || selectedUser.admins !== undefined;

        if (!isGroup) {
            const conversation = conversations.find(c =>
                c.participants.some(p => p._id === selectedUser._id)
            );
            if (conversation) {
                conversationId = conversation._id;
            } else {
                // No conversation exists yet (e.g. new chat), so no board can exist.
                return;
            }
        }

        fetchBoard(conversationId);
    }, [selectedUser, conversations, fetchBoard]);

    const onDragEnd = useCallback((result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        moveTask(draggableId, destination.droppableId, destination.index);
    }, [moveTask]);

    const handleAddTask = useCallback((columnId) => {
        setNewTaskColumn(columnId);
        setIsModalOpen(true);
    }, []);

    const submitTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !board) return;

        await addTask({
            boardId: board._id,
            columnId: newTaskColumn,
            title: newTaskTitle,
            assignedTo: [],
            labels: []
        });

        setNewTaskTitle("");
        setIsModalOpen(false);
    };

    // Memoize tasks per column to prevent re-rendering all columns when one task changes
    const columnsWithTasks = useMemo(() => {
        if (!board || !board.columns) return [];
        return board.columns.map(column => ({
            ...column,
            tasks: tasks.filter(t => t.columnId === column.id).sort((a, b) => a.order - b.order)
        }));
    }, [board, tasks]);

    if (isBoardLoading && !board) {
        return <KanbanSkeleton />;
    }

    if (!board) return null;

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-base-100/50">
            <div className="flex h-full gap-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    {columnsWithTasks.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            tasks={column.tasks}
                            onAddTask={handleAddTask}
                            onTaskClick={(task) => console.log("Edit task", task)}
                        />
                    ))}
                </DragDropContext>
            </div>

            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-base-100 p-6 rounded-xl w-96 shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Add New Task</h3>
                        <form onSubmit={submitTask}>
                            <input
                                type="text"
                                className="input input-bordered w-full mb-4"
                                placeholder="Task title..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;
