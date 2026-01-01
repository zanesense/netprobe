// Authentication hook for Firebase Auth
import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultScanType: string;
    notifications: boolean;
    autoSave: boolean;
  };
  usage: {
    scansPerformed: number;
    lastScanAt?: Date;
    totalScanTime: number;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  failedAttempts: number;
  resetFailedAttempts: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Load or create user profile
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          ...data,
          createdAt: data.createdAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          usage: {
            ...data.usage,
            lastScanAt: data.usage?.lastScanAt?.toDate()
          }
        } as UserProfile);
        
        // Update last login time (only when online)
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            lastLoginAt: serverTimestamp()
          });
        } catch (updateError) {
          // Ignore update errors when offline
          console.log('Could not update last login time (offline)');
        }
      } else {
        // Create new user profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'NetProbe User',
          photoURL: user.photoURL,
          role: 'user',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          preferences: {
            theme: 'dark',
            defaultScanType: 'tcp-connect',
            notifications: true,
            autoSave: true
          },
          usage: {
            scansPerformed: 0,
            totalScanTime: 0
          }
        };
        
        try {
          await setDoc(doc(db, 'users', user.uid), {
            ...newProfile,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          });
        } catch (createError) {
          // Use local profile if can't create in Firestore
          console.log('Could not create user profile (offline), using local data');
        }
        
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Create a basic local profile when offline
      if (error instanceof Error && error.message.includes('offline')) {
        const localProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'NetProbe User',
          photoURL: user.photoURL,
          role: 'user',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          preferences: {
            theme: 'dark',
            defaultScanType: 'tcp-connect',
            notifications: true,
            autoSave: true
          },
          usage: {
            scansPerformed: 0,
            totalScanTime: 0
          }
        };
        setUserProfile(localProfile);
      } else {
        toast.error('Failed to load user profile');
      }
    }
  };

  const signIn = async (email: string, password: string, recaptchaToken?: string) => {
    try {
      // Check if reCAPTCHA is required (after 3 failed attempts)
      if (failedAttempts >= 3 && !recaptchaToken) {
        throw new Error('reCAPTCHA verification required');
      }

      await signInWithEmailAndPassword(auth, email, password);

      // Reset failed attempts on successful sign in
      setFailedAttempts(0);
      localStorage.removeItem('auth_failed_attempts');
      
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Increment failed attempts
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      localStorage.setItem('auth_failed_attempts', newFailedAttempts.toString());
      
      if (error.message.includes('reCAPTCHA')) {
        toast.error('Please complete the reCAPTCHA verification');
      } else {
        toast.error(getAuthErrorMessage(error.code));
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      
      // Send email verification with custom action URL
      const actionCodeSettings = {
        url: window.location.origin + '/app',
        handleCodeInApp: false,
      };
      
      await sendEmailVerification(user, actionCodeSettings);
      
      // Don't sign out the user - let them stay signed in but show verification notice
      toast.success('Account created! Please check your email and verify your account to access all features.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      await signInWithPopup(auth, provider);
      
      // Google accounts are automatically verified
      // Reset failed attempts on successful sign in
      setFailedAttempts(0);
      localStorage.removeItem('auth_failed_attempts');
      
      toast.success('Successfully signed in with Google!');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');
      await signInWithPopup(auth, provider);
      
      // GitHub accounts are automatically verified
      // Reset failed attempts on successful sign in
      setFailedAttempts(0);
      localStorage.removeItem('auth_failed_attempts');
      
      toast.success('Successfully signed in with GitHub!');
    } catch (error: any) {
      console.error('GitHub sign in error:', error);
      toast.error(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserProfile({ ...userProfile, ...updates });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      if (error.message?.includes('offline')) {
        // Update locally when offline
        setUserProfile({ ...userProfile, ...updates });
        toast.success('Profile updated locally (will sync when online)');
      } else {
        toast.error('Failed to update profile');
        throw error;
      }
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) return;

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      toast.success('Password changed successfully!');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  const deleteAccount = async (password: string) => {
    if (!user || !user.email) return;

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user document
      await updateDoc(doc(db, 'users', user.uid), {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      // Delete user account
      await user.delete();
      toast.success('Account deleted successfully');
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast.error(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (!user) {
      toast.error('No user signed in');
      return;
    }

    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error('Failed to send verification email');
      throw error;
    }
  };

  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    localStorage.removeItem('auth_failed_attempts');
  };

  // Load failed attempts from localStorage on mount
  useEffect(() => {
    const savedFailedAttempts = localStorage.getItem('auth_failed_attempts');
    if (savedFailedAttempts) {
      setFailedAttempts(parseInt(savedFailedAttempts, 10));
    }
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
    logout,
    resetPassword,
    updateUserProfile,
    changePassword,
    deleteAccount,
    resendVerificationEmail,
    failedAttempts,
    resetFailedAttempts
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled';
    default:
      return 'An error occurred during authentication';
  }
}