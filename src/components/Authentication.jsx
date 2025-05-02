import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Authentication = () => {
  const [user] = useAuthState(auth);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLogin: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="w-full max-w-xs mx-auto bg-[#e0e5ec] rounded-2xl shadow-[8px_8px_24px_#a3b1c6,-8px_-8px_24px_#ffffff] p-6 flex flex-col items-center">
      {user ? (
        <div className="w-full flex flex-col items-center space-y-4">
          <img 
            src={user.photoURL} 
            alt={user.displayName} 
            className="w-16 h-16 rounded-full border-4 border-blue-100 object-cover shadow-[4px_4px_12px_#bfc9d9,-4px_-4px_12px_#ffffff]"
          />
          <div className="w-full text-center">
            <h2 className="text-lg font-semibold text-gray-800 truncate" title={user.displayName}>{user.displayName}</h2>
            <p className="text-sm text-gray-500 truncate" title={user.email}>{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-2 px-4 rounded-xl font-medium bg-[#e0e5ec] shadow-[4px_4px_12px_#bfc9d9,-4px_-4px_12px_#ffffff] text-red-600 flex items-center justify-center space-x-2 hover:shadow-[inset_4px_4px_12px_#bfc9d9,inset_-4px_-4px_12px_#ffffff] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Sign in to access your files</p>
          </div>
          <button
            onClick={signInWithGoogle}
            className="w-full py-2 px-4 rounded-xl font-medium bg-[#e0e5ec] shadow-[4px_4px_12px_#bfc9d9,-4px_-4px_12px_#ffffff] flex items-center justify-center space-x-3 hover:shadow-[inset_4px_4px_12px_#bfc9d9,inset_-4px_-4px_12px_#ffffff] transition"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Authentication;