import { useState, useEffect } from 'react';

import Authentication from './components/Authentication';
import FileUpload from './components/FileUpload';


function App() {
  // Remove unused user variable
  // const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 transition-colors duration-300">
      {/* Header */}
      <header className="w-full bg-transparent pt-8 pb-2">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-lg">Simple File Manager</h1>
              <p className="text-base text-gray-600 text-centerfont-medium mt-1">Effortless cloud storage !.</p>
            </div>
            <div className="w-full sm:w-auto flex justify-end">
              <Authentication />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex flex-col items-center px-2 pb-8">
        <div className="w-full max-w-5xl">
          <div className="rounded-2xl shadow-2xl bg-white/80 p-4 sm:p-8 mt-2 backdrop-blur-md">
            <FileUpload />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-transparent pt-8 pb-4">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} File Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;