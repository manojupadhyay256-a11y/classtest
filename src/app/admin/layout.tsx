import AdminSidebar from "@/components/ui/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  )
}
