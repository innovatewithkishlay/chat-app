import React, { memo } from "react";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";

const KanbanColumn = memo(({ column, tasks, onAddTask, onTaskClick }) => {
    return (
        <div className="flex flex-col w-80 min-w-[320px] bg-base-100/40 backdrop-blur-xl border border-base-200/50 rounded-2xl max-h-full shadow-sm">
            {/* Header */}
            <div className="p-4 flex items-center justify-between font-bold text-sm border-b border-base-200/50">
                <div className="flex items-center gap-2">
                    <span className="text-base tracking-tight">{column.title}</span>
                    <span className="bg-base-200 px-2 py-0.5 rounded-full text-xs font-medium opacity-70">{tasks.length}</span>
                </div>
                <button
                    onClick={() => onAddTask(column.id)}
                    className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
              flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px] transition-colors scrollbar-thin
              ${snapshot.isDraggingOver ? "bg-primary/5" : ""}
            `}
                    >
                        {tasks.map((task, index) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                index={index}
                                onClick={onTaskClick}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
});

export default KanbanColumn;
