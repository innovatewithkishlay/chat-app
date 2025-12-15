import React, { memo } from "react";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";

const KanbanColumn = memo(({ column, tasks, onAddTask, onTaskClick }) => {
    return (
        <div className="flex flex-col w-72 min-w-[288px] bg-base-200/50 rounded-xl max-h-full">
            {/* Header */}
            <div className="p-3 flex items-center justify-between font-bold text-sm opacity-70">
                <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    <span className="bg-base-300 px-1.5 py-0.5 rounded-full text-xs">{tasks.length}</span>
                </div>
                <button
                    onClick={() => onAddTask(column.id)}
                    className="btn btn-ghost btn-xs btn-circle hover:bg-base-300"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
              flex-1 overflow-y-auto p-2 min-h-[100px] transition-colors
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
