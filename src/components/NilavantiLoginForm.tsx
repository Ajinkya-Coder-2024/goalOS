import { useState } from 'react';
import { useNilavantiAuth } from '@/contexts/NilavantiAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, UserPlus } from 'lucide-react';
import { NilavantiRegisterForm } from './NilavantiRegisterForm';

interface NilavantiLoginFormProps {
  onLoginSuccess: () => void;
  onShowRegister?: () => void;
}

export const NilavantiLoginForm = ({ onLoginSuccess, onShowRegister }: NilavantiLoginFormProps) => {
  const [password, setPassword] = useState('');
  const [secretClicks, setSecretClicks] = useState(0);
  const [showSecretButton, setShowSecretButton] = useState(false);
  const { 
    login, 
    error, 
    loading
  } = useNilavantiAuth();

  // Handle secret click sequence (click 3 times on the lock icon)
  const handleLockClick = () => {
    const newCount = secretClicks + 1;
    setSecretClicks(newCount);
    
    // Reset counter after 2 seconds if no further clicks
    const timer = setTimeout(() => {
      setSecretClicks(0);
    }, 2000);

    // Show secret button after 3 clicks
    if (newCount >= 3) {
      setShowSecretButton(true);
      setSecretClicks(0);
      // Hide the button after 5 seconds
      setTimeout(() => setShowSecretButton(false), 5000);
    }

    return () => clearTimeout(timer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(password);
    if (success) {
      onLoginSuccess();
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-8 relative">
        {/* Secret admin button */}
        {showSecretButton && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <Button
              variant="outline"
              size="sm"
              className="animate-bounce bg-white/90 backdrop-blur-sm"
              onClick={onShowRegister}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Register New Account
            </Button>
          </div>
        )}
        
        <div className="text-center">
          <button 
            onClick={handleLockClick}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            type="button"
            aria-label="Click multiple times for admin access"
          >
            <Lock className="h-8 w-8 text-primary" />
          </button>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Welcome to Nilavanti
          </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the password to continue
            </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </Label>
              <div className="relative rounded-md shadow-sm">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                  placeholder="Enter the password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
