// GoogleLoginButton.js
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../../firebase';

export default function GoogleLoginButton({ onLogin }) {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Logged in as:', user.displayName, user.email);

      if (onLogin) {
        onLogin(user); // Pass user to parent component or context
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <div className='px-7'>
    <button
      onClick={handleGoogleLogin}
      className="bg-blue-500 text-white font-semibold px-1 py-1 w-full rounded flex items-center gap-16 text-md hover:bg-blue-600"
    >
      <div className='bg-white w-10 h-10 flex justify-center items-center'><img src="/google.png" className='w-2/3 h-2/3' alt='Google logo' /></div>Sign in with Google
    </button>
    </div>
  );
}
