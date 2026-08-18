'use client';
import { useState, useEffect } from 'react';
import { getAuthInstance, googleProvider } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Initialize auth only in browser runtime
    const auth = getAuthInstance();

    // Check mobile redirect results
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          localStorage.removeItem('isGuest');
          router.push('/dashboard');
        }
      })
      .catch((err) => setError(err.message));

    // Monitor auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.removeItem('isGuest');
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    const auth = getAuthInstance();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const googleLogin = async () => {
    setLoading(true);
    setError('');
    const auth = getAuthInstance();
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setError('Please allow popups for this site, or try using the Guest Account for local testing.');
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-700">DietAI</h1>
          <p className="text-gray-600 mt-2">AI Nutrition Tracker</p>
        </div>

        <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl relative z-50 ${isLogin ? 'bg-white shadow font-medium' : 'text-gray-600'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-xl relative z-50 ${!isLogin ? 'bg-white shadow font-medium' : 'text-gray-600'}`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-5 py-4 border border-gray-300 rounded-2xl mb-4 focus:outline-emerald-500 relative z-50"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-5 py-4 border border-gray-300 rounded-2xl mb-6 focus:outline-emerald-500 relative z-50"
        />

        <button 
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg mb-4 disabled:opacity-70 relative z-50"
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
        </button>

        <button 
          onClick={googleLogin}
          disabled={loading}
          className="w-full border-2 border-gray-300 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-70 relative z-50"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

        <Link
          href="/dashboard"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('isGuest', 'true');
            }
          }}
          className="w-full text-center block text-gray-400 hover:text-emerald-600 text-sm mt-6 transition-colors font-medium relative z-50 py-2"
        >
          Guest Account →
        </Link>
      </div>
    </div>
  );
}
