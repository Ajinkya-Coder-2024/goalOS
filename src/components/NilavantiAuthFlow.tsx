import { useState } from 'react';
import { NilavantiLoginForm } from './NilavantiLoginForm';
import { NilavantiRegisterForm } from './NilavantiRegisterForm';
import { NilavantiVideo } from './NilavantiVideo';

export function NilavantiAuthFlow() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const toggleRegisterForm = () => {
    setShowRegisterForm(prev => !prev);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowVideo(true);
  };

  const handleVideoEnd = () => {
    setShowVideo(false);
  };

  if (showRegisterForm) {
    return <NilavantiRegisterForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (showVideo) {
    return <NilavantiVideo onVideoEnd={handleVideoEnd} />;
  }

  if (isAuthenticated) {
    return null; // This will be handled by the router
  }

  if (showRegisterForm) {
    return <NilavantiRegisterForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <NilavantiLoginForm 
      onLoginSuccess={handleLoginSuccess} 
      onShowRegister={() => setShowRegisterForm(true)} 
    />
  );
}
