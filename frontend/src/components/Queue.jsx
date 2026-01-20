import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable queue item component
const SortableQueueItem = ({ track, index, onRemove, onPlayTrack }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id + '-' + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-md hover:bg-sp-gray/60 transition-colors group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-sp-text-muted hover:text-sp-text cursor-grab active:cursor-grabbing touch-none"
        title="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <span className="text-sp-text-muted text-sm w-6 text-right">{index + 1}</span>
      {track.albumArt ? (
        <img
          src={track.albumArt}
          alt={track.title}
          className="w-10 h-10 object-cover rounded shadow-md"
        />
      ) : (
        <div className="w-10 h-10 bg-sp-gray rounded flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-sp-text-muted" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </div>
      )}
      <button
        onClick={() => onPlayTrack(track)}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-sp-text text-sm font-medium truncate">{track.title}</p>
        <p className="text-sp-text-secondary text-xs truncate">{track.artist}</p>
      </button>
      <button
        onClick={() => onRemove(index)}
        className="p-2 text-sp-text-muted hover:text-sp-text opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-sp-light-gray"
        title="Remove from queue"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const Queue = ({ queue, onRemove, onClear, onPlayTrack, onReorder }) => {
  // Set up sensors for drag and drop (mouse, touch, and keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 100ms delay for touch
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = queue.findIndex((_, i) => active.id === queue[i].id + '-' + i);
      const newIndex = queue.findIndex((_, i) => over.id === queue[i].id + '-' + i);

      onReorder(oldIndex, newIndex);
    }
  };

  if (!queue || queue.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-sp-text">As negschts ({queue.length})</h2>
        <button
          onClick={onClear}
          className="text-sm text-sp-text-muted hover:text-sp-text transition-colors"
        >
          Üfrüümä
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={queue.map((track, i) => track.id + '-' + i)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {queue.map((track, index) => (
              <SortableQueueItem
                key={`${track.id}-${index}`}
                track={track}
                index={index}
                onRemove={onRemove}
                onPlayTrack={onPlayTrack}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Queue;
