import { useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { Class, Day } from '../../types'
import { ALL_DAYS } from '../../types'
import { parseCourseImages } from '../../services/courseImport'
import type { ImportedCourseCandidate } from '../../services/courseImport'

const PERIODS = [
  { number: 1, start: '09:00', end: '09:50' }, { number: 2, start: '10:00', end: '10:50' },
  { number: 3, start: '11:00', end: '11:50' }, { number: 4, start: '12:00', end: '12:50' },
  { number: 5, start: '13:00', end: '13:50' }, { number: 6, start: '14:00', end: '14:50' },
  { number: 7, start: '15:00', end: '15:50' }, { number: 8, start: '16:00', end: '16:50' },
  { number: 9, start: '17:00', end: '17:50' }, { number: 10, start: '18:00', end: '18:50' },
] as const

interface ReviewCandidate extends ImportedCourseCandidate {
  selected: boolean
}

interface ImportCoursesModalProps {
  isOpen: boolean
  existingClasses: Class[]
  onClose: () => void
  onAddClasses: (classes: Omit<Class, 'id'>[]) => void
}

const inputClass = 'w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none'

export function ImportCoursesModal({ isOpen, existingClasses, onClose, onAddClasses }: ImportCoursesModalProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<File[]>([])
  const [candidates, setCandidates] = useState<ReviewCandidate[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setImages([])
    setCandidates([])
    setIsParsing(false)
    setError(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  const close = () => {
    reset()
    onClose()
  }

  const parse = async () => {
    if (images.length === 0) return
    setIsParsing(true)
    setError(null)
    try {
      const parsed = await parseCourseImages(images)
      setCandidates(parsed.map((candidate) => ({ ...candidate, selected: true })))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to parse the image.')
    } finally {
      setIsParsing(false)
    }
  }

  const updateCandidate = (index: number, update: Partial<ReviewCandidate>) => {
    setCandidates((current) => current.map((candidate, candidateIndex) =>
      candidateIndex === index ? { ...candidate, ...update } : candidate,
    ))
  }

  const toggleDay = (candidateIndex: number, blockIndex: number, day: Day) => {
    setCandidates((current) => current.map((candidate, index) => {
      if (index !== candidateIndex) return candidate
      const meetingBlocks = candidate.meetingBlocks.map((block, currentBlockIndex) => {
        if (currentBlockIndex !== blockIndex) return block
        return { ...block, days: block.days.includes(day) ? block.days.filter((item) => item !== day) : [...block.days, day] }
      })
      return { ...candidate, meetingBlocks }
    }))
  }

  const addMeetingBlock = (candidateIndex: number) => {
    setCandidates((current) => current.map((candidate, index) => index !== candidateIndex ? candidate : {
      ...candidate,
      meetingBlocks: [...candidate.meetingBlocks, { days: [], startPeriod: 1, endPeriod: 1 }],
    }))
  }

  const addSelected = () => {
    const selected = candidates.filter((candidate) => candidate.selected)
    const valid = selected.filter((candidate) => candidate.name.trim() && candidate.meetingBlocks.every((block) => block.days.length > 0))
    if (valid.length !== selected.length) {
      setError('Each selected course needs a name and at least one meeting day per block.')
      return
    }
    onAddClasses(valid.map(toClass))
    close()
  }

  return (
    <Dialog open={isOpen} onClose={close} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
          <DialogTitle className="text-base font-semibold text-gray-900">Import courses from image</DialogTitle>
          {candidates.length === 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600">Upload one or more course-list screenshots. You will review every course before it is added to Course Bank.</p>
              <input ref={fileInput} type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => setImages(Array.from(event.target.files ?? []))} className="block w-full text-sm text-gray-600" />
              {images.length > 0 && <p className="text-xs text-gray-500">{images.length} image{images.length === 1 ? '' : 's'} selected · {images.map((image) => image.name).join(', ')}</p>}
              {error && <p className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-red-50 p-2 font-mono text-xs text-red-700">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={close} className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="button" disabled={images.length === 0 || isParsing} onClick={parse} className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-700">
                  {isParsing ? 'Parsing…' : `Parse ${images.length === 1 ? 'image' : 'images'}`}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600">Review the extracted courses. Uncheck anything you do not want to add.</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {candidates.map((candidate, candidateIndex) => {
                const duplicate = existingClasses.some((existing) =>
                  Boolean(candidate.courseCode) && existing.courseCode?.toLowerCase() === candidate.courseCode?.toLowerCase(),
                )
                return (
                  <section key={candidateIndex} className="rounded border border-gray-200 p-3">
                    <div className="flex items-start gap-2">
                      <input aria-label={`Add ${candidate.name}`} type="checkbox" checked={candidate.selected} onChange={() => updateCandidate(candidateIndex, { selected: !candidate.selected })} className="mt-1" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input value={candidate.name} onChange={(event) => updateCandidate(candidateIndex, { name: event.target.value })} className={inputClass} aria-label="Course name" />
                          <input value={candidate.courseCode ?? ''} onChange={(event) => updateCandidate(candidateIndex, { courseCode: event.target.value || null })} className={inputClass} placeholder="Course code" aria-label="Course code" />
                          <input value={candidate.credits ?? ''} onChange={(event) => updateCandidate(candidateIndex, { credits: event.target.value || null })} className={inputClass} placeholder="Credits" aria-label="Credits" />
                          <input value={candidate.instructor ?? ''} onChange={(event) => updateCandidate(candidateIndex, { instructor: event.target.value || null })} className={inputClass} placeholder="Instructor" aria-label="Instructor" />
                          <input value={candidate.location ?? ''} onChange={(event) => updateCandidate(candidateIndex, { location: event.target.value || null })} className={inputClass} placeholder="Location" aria-label="Location" />
                          <input value={candidate.school ?? ''} onChange={(event) => updateCandidate(candidateIndex, { school: event.target.value || null })} className={inputClass} placeholder="School" aria-label="School" />
                        </div>
                        {candidate.meetingBlocks.map((block, blockIndex) => (
                          <div key={blockIndex} className="rounded bg-gray-50 p-2">
                            <div className="flex flex-wrap gap-2">
                              {ALL_DAYS.map((day) => <label key={day} className="flex items-center gap-1 text-xs text-gray-700"><input type="checkbox" checked={block.days.includes(day)} onChange={() => toggleDay(candidateIndex, blockIndex, day)} />{day}</label>)}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                              <label>First <input type="number" min="1" max="10" value={block.startPeriod} onChange={(event) => updatePeriod(candidateIndex, blockIndex, 'startPeriod', Number(event.target.value), setCandidates)} className="ml-1 w-12 rounded border border-gray-300 px-1 py-0.5" /></label>
                              <label>Last <input type="number" min="1" max="10" value={block.endPeriod} onChange={(event) => updatePeriod(candidateIndex, blockIndex, 'endPeriod', Number(event.target.value), setCandidates)} className="ml-1 w-12 rounded border border-gray-300 px-1 py-0.5" /></label>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => addMeetingBlock(candidateIndex)} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">Add meeting time</button>
                        {(duplicate || !candidate.courseCode || candidate.warnings.length > 0) && <p className="text-xs text-amber-700">{[
                          duplicate ? 'Possible duplicate course code.' : '',
                          !candidate.courseCode ? 'Course code could not be extracted; verify it against the source image.' : '',
                          ...candidate.warnings,
                        ].filter(Boolean).join(' ')}</p>}
                      </div>
                    </div>
                  </section>
                )
              })}
              <div className="flex justify-between gap-2 pt-1"><button type="button" onClick={reset} className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Choose another image</button><div className="flex gap-2"><button type="button" onClick={close} className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="button" onClick={addSelected} className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Add selected to Course Bank</button></div></div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function updatePeriod(index: number, blockIndex: number, field: 'startPeriod' | 'endPeriod', value: number, setCandidates: Dispatch<SetStateAction<ReviewCandidate[]>>) {
  setCandidates((current) => current.map((candidate, candidateIndex) => candidateIndex !== index ? candidate : {
    ...candidate,
    meetingBlocks: candidate.meetingBlocks.map((block, currentBlockIndex) => currentBlockIndex !== blockIndex ? block : { ...block, [field]: value }),
  }))
}

function toClass(candidate: ReviewCandidate): Omit<Class, 'id'> {
  return {
    name: candidate.name.trim(), courseCode: candidate.courseCode?.trim() || undefined, credits: candidate.credits?.trim() || undefined,
    school: candidate.school?.trim() || undefined, instructor: candidate.instructor?.trim() || undefined, location: candidate.location?.trim() || undefined,
    tags: [],
    meetingBlocks: candidate.meetingBlocks.map((block) => ({
      days: block.days,
      start: PERIODS.find((period) => period.number === block.startPeriod)?.start ?? '09:00',
      end: PERIODS.find((period) => period.number === block.endPeriod)?.end ?? '09:50',
    })),
  }
}
