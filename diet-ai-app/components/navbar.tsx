'use client';
import { LogOut } from 'lucide-react';
import { getAuthInstance } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    localStorage.removeItem('isGuest');
    const auth = getAuthInstance();
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    router.push('/');
  };

  return (
    <nav className="bg-white shadow border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emerald-600">DietAI</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
    </nav>
  );
}