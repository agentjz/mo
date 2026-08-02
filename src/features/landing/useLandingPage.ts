import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageActions {
  showQRCode: boolean;
  openQRCode: () => void;
  closeQRCode: () => void;
  openEditor: () => void;
  openStatement: () => void;
}

export function useLandingPage(): LandingPageActions {
  const navigate = useNavigate();
  const [showQRCode, setShowQRCode] = useState(false);

  return {
    showQRCode,
    openQRCode: () => setShowQRCode(true),
    closeQRCode: () => setShowQRCode(false),
    openEditor: () => navigate('/app'),
    openStatement: () => navigate('/statement'),
  };
}
