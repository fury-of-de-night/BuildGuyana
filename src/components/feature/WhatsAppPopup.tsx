import { useState, useEffect, useCallback } from 'react';

interface WhatsAppPopupProps {
  isOpen: boolean;
  onClose: () => void;
  targetName?: string;
}

export default function WhatsAppPopup({ isOpen, onClose, targetName = 'the contractor' }: WhatsAppPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 transition-opacity duration-200"
      style={{ opacity: isOpen ? 1 : 0 }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="WhatsApp demo message"
    >
      <div
        className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full mx-4 shadow-lg transform transition-all duration-200"
        style={{ scale: isOpen ? '1' : '0.95' }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <i className="ri-whatsapp-fill text-2xl text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg text-foreground-900 mb-2">
              Demo Mode — WhatsApp Link
            </h3>
            <p className="text-sm text-foreground-600 leading-relaxed">
              In the live version, this would open a WhatsApp chat with {targetName}.
            </p>
            <p className="text-xs text-foreground-400 mt-2">
              You are viewing a demo — no real messages will be sent.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
        >
          OK, Got It
        </button>
      </div>
    </div>
  );
}

export function useWhatsAppPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [targetName, setTargetName] = useState('');

  const openPopup = useCallback((name?: string) => {
    setTargetName(name || 'the contact');
    setIsOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, targetName, openPopup, closePopup };
}