"use client"

import { useState } from "react"
import toast from "react-hot-toast"

interface TestStatusToggleProps {
  id: string
  isActive: boolean
}

export default function TestStatusToggle({ id, isActive: initialIsActive }: TestStatusToggleProps) {
  const [isActive, setIsActive] = useState(initialIsActive)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/tests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !isActive }),
        headers: { "Content-Type": "application/json" }
      })
      if (res.ok) {
        setIsActive(!isActive)
        toast.success(`Test ${!isActive ? "activated" : "deactivated"}`)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update status")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isLoading}
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ring-1 ${
        isActive 
          ? "bg-green-600 text-white ring-green-700 hover:bg-green-700 font-black shadow-lg shadow-green-500/20" 
          : "bg-gray-100 text-gray-500 ring-gray-200 hover:bg-gray-200 font-bold"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isLoading ? "..." : (isActive ? "Active" : "Inactive")}
    </button>
  )
}
