export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Only use this for admin-specific wrappers (like a context provider)
    // If you don't need anything specific for admin only, you can even delete this file.
    <>
      {children}
    </>
  );
}