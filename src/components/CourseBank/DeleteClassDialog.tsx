import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { Class } from '../../types'

interface DeleteClassDialogProps {
  cls: Class | null
  placementCount: number
  onCancel: () => void
  onConfirm: () => void
}

// Deleting a placed class cascade-removes it from every schedule (ADR-0001);
// this warning is the only safeguard — there is no undo
export function DeleteClassDialog({ cls, placementCount, onCancel, onConfirm }: DeleteClassDialogProps) {
  return (
    <Dialog open={cls !== null} onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
          <DialogTitle className="text-base font-semibold text-gray-900">
            Delete “{cls?.name}”?
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-600">
            {placementCount > 0
              ? `This class is placed on ${placementCount} schedule${placementCount === 1 ? '' : 's'}. Deleting it will remove it from all of them. This cannot be undone.`
              : 'This cannot be undone.'}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500"
            >
              Delete
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
