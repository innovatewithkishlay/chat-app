import { memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Calendar } from "lucide-react";
import Avatar from "../Avatar";

const TaskCard = memo(({ task, index, onClick }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(task)}
                    className={`
            bg-base-100 p-4 rounded-xl shadow-sm mb-3 border border-base-200/60 
            hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-grab active:cursor-grabbing select-none
            ${snapshot.isDragging ? "shadow-xl rotate-2 scale-105 z-50 ring-2 ring-primary/20" : ""}
          `}
                    style={{ ...provided.draggableProps.style }}
                >
                    {/* Labels */}
                    {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {task.labels.map((label, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] px-2 py-1 rounded-md font-semibold tracking-wide uppercase"
                                    style={{ backgroundColor: label.color + "15", color: label.color, border: `1px solid ${label.color}30` }}
                                >
                                    {label.text}
                                </span>
                            ))}
                        </div>
                    )}

                    <h4 className="font-medium text-sm mb-1 break-all whitespace-normal">{task.title}</h4>

                    <div className="flex items-center justify-between mt-3 text-xs">
                        {task.dueDate && (
                            <div className={`flex items-center gap-1 ${isOverdue ? "text-error font-medium" : "opacity-60"}`}>
                                <Calendar size={12} />
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                        )}

                        {task.assignedTo && task.assignedTo.length > 0 && (
                            <div className="flex -space-x-1.5 ml-auto">
                                {task.assignedTo.slice(0, 3).map((member) => (
                                    <div key={member._id || member} className="ring-2 ring-base-100 rounded-full">
                                        <Avatar user={typeof member === "object" ? member : { fullname: "?" }} size="size-5" />
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
TaskCard.displayName = "TaskCard";

export default TaskCard;
