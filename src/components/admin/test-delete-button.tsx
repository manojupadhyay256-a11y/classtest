"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import toast from "react-hot-toast"

interface TestDeleteButtonProps {
  id: string
  title: string
  questionsCount: number
  resultsCount: number
}

export default function TestDeleteButton({ id, title, questionsCount, resultsCount }: TestDeleteButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/tests/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete test")
      }
      toast.success("Test deleted successfully")
      setShowConfirm(false)
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-colors"
        title="Delete Test"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-rose-50 px-6 pt-6 pb-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Delete Test?</h3>
              <p className="text-sm text-slate-500 mt-1">This action cannot be undone</p>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-3">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
              </div>
              
              <div className="text-xs text-slate-500 space-y-1.5">
                <p className="font-bold text-rose-600">The following will be permanently deleted:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>{questionsCount} question{questionsCount !== 1 ? "s" : ""}</li>
                  <li>{resultsCount} student result{resultsCount !== 1 ? "s" : ""}</li>
                  <li>The test itself</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Test"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
