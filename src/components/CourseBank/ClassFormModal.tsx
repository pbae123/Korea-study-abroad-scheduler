import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import type { Class, Day } from '../../types'
import { ALL_DAYS } from '../../types'

interface ClassFormValues {
  name: string
  courseCode: string
  school: string
  credits: string
  instructor: string
  location: string
  link: string
  notes: string
  tagsText: string
  days: Day[]
  start: string
  end: string
}

interface ClassFormModalProps {
  isOpen: boolean
  editingClass: Class | null
  onClose: () => void
  onSave: (cls: Omit<Class, 'id'>) => void
}

function toFormValues(cls: Class | null): ClassFormValues {
  return {
    name: cls?.name ?? '',
    courseCode: cls?.courseCode ?? '',
    school: cls?.school ?? '',
    credits: cls?.credits ?? '',
    instructor: cls?.instructor ?? '',
    location: cls?.location ?? '',
    link: cls?.link ?? '',
    notes: cls?.notes ?? '',
    tagsText: cls?.tags.join(', ') ?? '',
    days: cls?.timeBlock?.days ?? [],
    start: cls?.timeBlock?.start ?? '',
    end: cls?.timeBlock?.end ?? '',
  }
}

function toClass(values: ClassFormValues): Omit<Class, 'id'> {
  const hasTimeBlock = values.days.length > 0 && values.start !== '' && values.end !== ''
  const tags = [...new Set(values.tagsText.split(',').map((t) => t.trim()).filter(Boolean))]
  return {
    name: values.name.trim(),
    courseCode: values.courseCode.trim() || undefined,
    school: values.school.trim() || undefined,
    credits: values.credits.trim() || undefined,
    instructor: values.instructor.trim() || undefined,
    location: values.location.trim() || undefined,
    link: values.link.trim() || undefined,
    notes: values.notes.trim() || undefined,
    tags,
    timeBlock: hasTimeBlock
      ? { days: values.days, start: values.start, end: values.end }
      : undefined,
  }
}

const inputClass =
  'w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none'

export function ClassFormModal({ isOpen, editingClass, onClose, onSave }: ClassFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ClassFormValues>({ values: toFormValues(editingClass) })

  const days = watch('days')
  const start = watch('start')
  const end = watch('end')

  // All-or-nothing rule: days, start, and end must all be set or all be empty
  const timeFieldsFilled = [days.length > 0, start !== '', end !== ''].filter(Boolean).length
  const isTimeBlockPartial = timeFieldsFilled > 0 && timeFieldsFilled < 3
  const isTimeOrderInvalid = start !== '' && end !== '' && end <= start

  const saveAndClose = handleSubmit((values) => {
    onSave(toClass(values))
    onClose()
  })

  const saveAndAddAnother = handleSubmit((values) => {
    onSave(toClass(values))
    reset(toFormValues(null))
  })

  const isBlocked = isTimeBlockPartial || isTimeOrderInvalid

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
          <DialogTitle className="text-base font-semibold text-gray-900">
            {editingClass ? 'Edit Class' : 'Add Class'}
          </DialogTitle>

          <form className="mt-4 space-y-3">
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">Name *</label>
              <input
                {...register('name', { required: 'Name is required' })}
                className={inputClass}
                placeholder="e.g. Intro to Korean History"
              />
              {errors.name && <p className="mt-0.5 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-600">Course code</label>
                <input {...register('courseCode')} className={inputClass} placeholder="HIS2001" />
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-600">Credits</label>
                <input {...register('credits')} className={inputClass} placeholder="3" />
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-600">School</label>
                <input {...register('school')} className={inputClass} placeholder="Yonsei" />
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-600">Instructor</label>
                <input {...register('instructor')} className={inputClass} />
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-600">Location</label>
                <input {...register('location')} className={inputClass} />
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-600">Link</label>
                <input {...register('link')} className={inputClass} placeholder="https://…" />
              </div>
            </div>

            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">
                Tags <span className="font-normal text-gray-400">(comma-separated)</span>
              </label>
              <input {...register('tagsText')} className={inputClass} placeholder="Economics, Korean" />
            </div>

            <fieldset className="rounded border border-gray-200 p-3">
              <legend className="px-1 text-xs font-medium text-gray-600">
                Meeting time <span className="font-normal text-gray-400">(optional — leave empty for async)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1 text-xs text-gray-700">
                    <input type="checkbox" value={day} {...register('days')} />
                    {day}
                  </label>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input type="time" {...register('start')} className={inputClass} />
                <span className="text-gray-400">–</span>
                <input type="time" {...register('end')} className={inputClass} />
              </div>
              {isTimeBlockPartial && (
                <p className="mt-1 text-xs text-red-600">
                  Days, start, and end must all be filled in — or all left empty.
                </p>
              )}
              {isTimeOrderInvalid && (
                <p className="mt-1 text-xs text-red-600">End time must be after start time.</p>
              )}
            </fieldset>

            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">Notes</label>
              <textarea {...register('notes')} rows={2} className={inputClass} />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              {!editingClass && (
                <button
                  type="button"
                  onClick={saveAndAddAnother}
                  disabled={isBlocked}
                  className="rounded border border-gray-900 px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-100 disabled:opacity-40"
                >
                  Save & add another
                </button>
              )}
              <button
                type="button"
                onClick={saveAndClose}
                disabled={isBlocked}
                className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
