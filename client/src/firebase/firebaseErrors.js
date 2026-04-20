/** Map Firebase Auth error codes to user-friendly messages */
export const firebaseMsg = (code) =>
  ({
    'auth/user-not-found':        'No account found with this email.',
    'auth/wrong-password':        'Incorrect password.',
    'auth/email-already-in-use':  'Email already registered.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/invalid-email':         'Invalid email address.',
    'auth/too-many-requests':     'Too many attempts. Please try again later.',
    'auth/invalid-credential':    'Incorrect email or password.',
    'auth/network-request-failed':'Network error. Check your connection.',
  })[code] || 'Authentication failed. Please try again.';
