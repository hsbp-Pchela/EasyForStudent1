export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎓 EfS
          </h1>
          <p className="text-gray-600">
            EasyforStudent • HUSBP
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {children}
        </div>
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>AI-конспекты лекций для вашей группы</p>
        </div>
      </div>
    </div>
  );
}