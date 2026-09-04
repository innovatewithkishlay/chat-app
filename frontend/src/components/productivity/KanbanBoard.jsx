import { useEffect, useState, useMemo, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useProductivityStore } from "../../store/useProductivityStore";
import { useChatStore } from "../../store/useChattingStore";
import { useAuthStore } from "../../store/useAuthStore";
import KanbanColumn from "./KanbanColumn";
import TaskDetailModal from "./TaskDetailModal";
import { KanbanSkeleton } from "../skeletons/ProductivitySkeletons";


const KanbanBoard = () => {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const authUser = useAuthStore((state) => state.authUser);

    // Granular selectors to prevent unnecessary re-renders
    const board = useProductivityStore((state) => state.board);
    const tasks = useProductivityStore((state) => state.tasks);
    const isBoardLoading = useProductivityStore((state) => state.isBoardLoading);
    const fetchBoard = useProductivityStore((state) => state.fetchBoard);
    const moveTask = useProductivityStore((state) => state.moveTask);
    const addTask = useProductivityStore((state) => state.addTask);
    const updateTask = useProductivityStore((state) => state.updateTask);
    const deleteTask = useProductivityStore((state) => state.deleteTask);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskColumn, setNewTaskColumn] = useState("todo");
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const conversations = useChatStore((state) => state.conversations);

    const isGroup = selectedUser?.groupMembers !== undefined || selectedUser?.admins !== undefined;

    // Everyone who can be assigned a task in the current chat.
    const members = useMemo(() => {
        if (!selectedUser) return [];
        if (isGroup) return selectedUser.members || [];
        return [authUser, selectedUser].filter(Boolean);
    }, [selectedUser, isGroup, authUser]);

    useEffect(() => {
        if (!selectedUser) return;

        let conversationId = selectedUser._id;

        if (!isGroup) {
            const conversation = conversations.find(c =>
                c.participants.some(p => p._id === selectedUser._id)
            );
            if (conversation) {
                conversationId = conversation._id;
            } else {
                return;
            }
        }

        fetchBoard(conversationId);
    }, [selectedUser, isGroup, conversations, fetchBoard]);

    const onDragEnd = useCallback((result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
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

    const columnsWithTasks = useMemo(() => {
        if (!board || !board.columns) return [];
        return board.columns.map(column => ({
            ...column,
            tasks: tasks.filter(t => t.columnId === column.id).sort((a, b) => a.order - b.order)
        }));
    }, [board, tasks]);

    const selectedTask = useMemo(
        () => tasks.find((t) => t._id === selectedTaskId) || null,
        [tasks, selectedTaskId]
    );

    const handleDeleteTask = async (taskId) => {
        await deleteTask(taskId);
        setSelectedTaskId(null);
    };

    if (isBoardLoading && !board) {
        return <KanbanSkeleton />;
    }

    if (!board) return null;

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6 bg-gradient-to-br from-base-100 to-base-200/50">
            <div className="flex h-full gap-6 min-w-fit pb-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    {columnsWithTasks.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            tasks={column.tasks}
                            onAddTask={handleAddTask}
                            onTaskClick={(task) => setSelectedTaskId(task._id)}
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

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    members={members}
                    onClose={() => setSelectedTaskId(null)}
                    onSave={updateTask}
                    onDelete={handleDeleteTask}
                />
            )}
        </div>
    );
};

export default KanbanBoard;
