import type { Day } from '../types'

export interface ImportedMeetingBlock {
  days: Day[]
  startPeriod: number
  endPeriod: number
}

export interface ImportedCourseCandidate {
  courseCode: string | null
  name: string
  credits: string | null
  school: string | null
  instructor: string | null
  location: string | null
  meetingBlocks: ImportedMeetingBlock[]
  warnings: string[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function parseCourseImages(images: File[]): Promise<ImportedCourseCandidate[]> {
  const formData = new FormData()
  images.forEach((image) => formData.append('images', image))
  const response = await fetch(`${API_BASE_URL}/api/v1/course-imports/parse`, { method: 'POST', body: formData })
  const body: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = formatImportError(body)
    throw new Error(message)
  }
  if (!isImportResponse(body)) throw new Error('The import service returned an unexpected response.')
  return body.courses
}

function formatImportError(body: unknown): string {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return 'Unable to parse the image. Please try again.'
  }
  const error = String(body.error)
  const details = 'details' in body && typeof body.details === 'string' ? body.details : null
  return details ? `${error}\n\n${details}` : error
}

function isImportResponse(value: unknown): value is { courses: ImportedCourseCandidate[] } {
  return typeof value === 'object' && value !== null && Array.isArray((value as { courses?: unknown }).courses)
}
