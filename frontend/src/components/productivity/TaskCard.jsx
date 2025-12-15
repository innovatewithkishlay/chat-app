import React, { memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Calendar, User, Tag } from "lucide-react";

const TaskCard = memo(({ task, index, onClick }) => {
    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(task)}
                    className={`
            bg-base-100 p-3 rounded-lg shadow-sm mb-2 border border-base-200 
            hover:shadow-md transition-all cursor-pointer select-none
            ${snapshot.isDragging ? "shadow-lg rotate-2 scale-105 z-50" : ""}
          `}
                    style={{ ...provided.draggableProps.style }}
                >
                    {/* Labels */}
                    {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {task.labels.map((label, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: label.color + "20", color: label.color }}
                                >
                                    {label.text}
                                </span>
                            ))}
                        </div>
                    )}

                    <h4 className="font-medium text-sm mb-1 line-clamp-2">{task.title}</h4>

                    <div className="flex items-center justify-between mt-3 text-xs opacity-60">
                        {task.dueDate && (
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                        )}

                        {task.assignedTo && task.assignedTo.length > 0 && (
                            <div className="flex -space-x-1">
                                {task.assignedTo.slice(0, 3).map((userId, i) => (
                                    <div key={i} className="size-5 rounded-full bg-primary/20 border border-base-100 flex items-center justify-center text-[8px]">
                                        <User size={10} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default TaskCard;
