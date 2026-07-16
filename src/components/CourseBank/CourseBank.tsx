import { useMemo, useState } from 'react'
import type { Class } from '../../types'
import { useAppDispatch, useAppState } from '../../state/AppContext'
import { TagFilterBar } from './TagFilterBar'
import { ClassCard } from './ClassCard'
import { ClassFormModal } from './ClassFormModal'
import { DeleteClassDialog } from './DeleteClassDialog'
import { ImportCoursesModal } from './ImportCoursesModal'

interface CourseBankProps {
  width: number
}

export function CourseBank({ width }: CourseBankProps) {
  const { classes, schedules, activeScheduleId } = useAppState()
  const dispatch = useAppDispatch()

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [deletingClass, setDeletingClass] = useState<Class | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const activeSchedule = schedules.find((s) => s.id === activeScheduleId)

  const allTags = useMemo(
    () => [...new Set(classes.flatMap((c) => c.tags))].sort((a, b) => a.localeCompare(b)),
    [classes],
  )

  // OR logic: show a class if it matches any selected tag (CONTEXT.md "Tag")
  const visibleClasses =
    selectedTags.length === 0
      ? classes
      : classes.filter((c) => c.tags.some((tag) => selectedTags.includes(tag)))

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )

  const handleSave = (data: Omit<Class, 'id'>) => {
    if (editingClass) {
      dispatch({ type: 'UPDATE_CLASS', class: { ...data, id: editingClass.id } })
    } else {
      dispatch({ type: 'ADD_CLASS', class: { ...data, id: crypto.randomUUID() } })
    }
  }

  const deletingPlacementCount = deletingClass
    ? schedules.filter((s) => s.classIds.includes(deletingClass.id)).length
    : 0

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-gray-200 bg-gray-50"
      style={{ width }}
    >
      <div className="space-y-2 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Course Bank</h2>
          <div className="flex gap-1">
            <button type="button" onClick={() => setIsImportOpen(true)} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100">Import image</button>
            <button
              type="button"
              onClick={() => {
                setEditingClass(null)
                setIsFormOpen(true)
              }}
              className="rounded bg-gray-900 px-2.5 py-1 text-xs text-white hover:bg-gray-700"
            >
              + Add Class
            </button>
          </div>
        </div>
        <TagFilterBar
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClear={() => setSelectedTags([])}
        />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {visibleClasses.length === 0 && (
          <p className="pt-8 text-center text-xs text-gray-400">
            {classes.length === 0
              ? 'No classes yet. Add one to get started.'
              : 'No classes match the selected tags.'}
          </p>
        )}
        {visibleClasses.map((cls) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            isPlacedOnActiveSchedule={activeSchedule?.classIds.includes(cls.id) ?? false}
            onAdd={() => dispatch({ type: 'PLACE_CLASS', scheduleId: activeScheduleId, classId: cls.id })}
            onRemove={() =>
              dispatch({ type: 'REMOVE_PLACEMENT', scheduleId: activeScheduleId, classId: cls.id })
            }
            onEdit={() => {
              setEditingClass(cls)
              setIsFormOpen(true)
            }}
            onDelete={() => setDeletingClass(cls)}
          />
        ))}
      </div>

      <ClassFormModal
        isOpen={isFormOpen}
        editingClass={editingClass}
        onClose={() => {
          setIsFormOpen(false)
          setEditingClass(null)
        }}
        onSave={handleSave}
      />

      <DeleteClassDialog
        cls={deletingClass}
        placementCount={deletingPlacementCount}
        onCancel={() => setDeletingClass(null)}
        onConfirm={() => {
          if (deletingClass) dispatch({ type: 'DELETE_CLASS', classId: deletingClass.id })
          setDeletingClass(null)
        }}
      />

      <ImportCoursesModal
        isOpen={isImportOpen}
        existingClasses={classes}
        onClose={() => setIsImportOpen(false)}
        onAddClasses={(newClasses) =>
          dispatch({ type: 'ADD_CLASSES', classes: newClasses.map((cls) => ({ ...cls, id: crypto.randomUUID() })) })
        }
      />
    </aside>
  )
}
