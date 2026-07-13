import { useEffect } from 'react'
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
  startPeriod: string
  endPeriod: string
}

const CLASS_PERIODS = [
  { number: '1', start: '09:00', end: '09:50' },
  { number: '2', start: '10:00', end: '10:50' },
  { number: '3', start: '11:00', end: '11:50' },
  { number: '4', start: '12:00', end: '12:50' },
  { number: '5', start: '13:00', end: '13:50' },
  { number: '6', start: '14:00', end: '14:50' },
  { number: '7', start: '15:00', end: '15:50' },
  { number: '8', start: '16:00', end: '16:50' },
  { number: '9', start: '17:00', end: '17:50' },
  { number: '10', start: '18:00', end: '18:50' },
] as const

function periodForStart(time: string | undefined): string {
  return CLASS_PERIODS.find((period) => period.start === time)?.number ?? ''
}

function periodForEnd(time: string | undefined): string {
  return CLASS_PERIODS.find((period) => period.end === time)?.number ?? ''
}

function periodByNumber(number: string) {
  return CLASS_PERIODS.find((period) => period.number === number)
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
    startPeriod: periodForStart(cls?.timeBlock?.start),
    endPeriod: periodForEnd(cls?.timeBlock?.end),
  }
}

function toClass(values: ClassFormValues): Omit<Class, 'id'> {
  const startPeriod = periodByNumber(values.startPeriod)!
  const endPeriod = periodByNumber(values.endPeriod)!
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
    timeBlock: { days: values.days, start: startPeriod.start, end: endPeriod.end },
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
  } = useForm<ClassFormValues>({ defaultValues: toFormValues(editingClass) })

  // Reset on every open: RHF keeps dirty values otherwise, leaking the
  // previously saved class into the next "Add Class" session
  useEffect(() => {
    if (isOpen) reset(toFormValues(editingClass))
  }, [isOpen, editingClass, reset])

  const startPeriod = watch('startPeriod')

  const saveAndClose = handleSubmit((values) => {
    onSave(toClass(values))
    onClose()
  })

  const saveAndAddAnother = handleSubmit((values) => {
    onSave(toClass(values))
    reset(toFormValues(null))
  })

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
                Meeting details *
              </legend>
              <p className="mb-2 text-xs text-gray-500">Select at least one day and enter the first and last class period.</p>
              <p className="mb-1 text-xs font-medium text-gray-600">Meeting days *</p>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      value={day}
                      {...register('days', { validate: (value) => value.length > 0 || 'Select at least one meeting day.' })}
                    />
                    {day}
                  </label>
                ))}
              </div>
              {errors.days && <p className="mt-1 text-xs text-red-600">{errors.days.message}</p>}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-600">First period *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    inputMode="numeric"
                    placeholder="1–10"
                    aria-describedby="period-reference"
                    {...register('startPeriod', {
                      required: 'Enter a first period from 1 to 10.',
                      validate: (value) => Boolean(periodByNumber(value)) || 'Enter a number from 1 to 10.',
                    })}
                    className={inputClass}
                  />
                  {errors.startPeriod && <p className="mt-1 text-xs text-red-600">{errors.startPeriod.message}</p>}
                </div>
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-600">Last period *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    inputMode="numeric"
                    placeholder="1–10"
                    aria-describedby="period-reference"
                    {...register('endPeriod', {
                      required: 'Enter a last period from 1 to 10.',
                      validate: (value) => {
                        if (!periodByNumber(value)) return 'Enter a number from 1 to 10.'
                        return Number(value) >= Number(startPeriod) || 'Last period must be the same as or after the first period.'
                      },
                    })}
                    className={inputClass}
                  />
                  {errors.endPeriod && <p className="mt-1 text-xs text-red-600">{errors.endPeriod.message}</p>}
                </div>
              </div>
              <p id="period-reference" className="mt-2 text-xs text-gray-500">
                Periods: {CLASS_PERIODS.map((period) => `(${period.number}) ${period.start}–${period.end}`).join(' · ')}
              </p>
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
                  className="rounded border border-gray-900 px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-100"
                >
                  Save & add another
                </button>
              )}
              <button
                type="button"
                onClick={saveAndClose}
                className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
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
