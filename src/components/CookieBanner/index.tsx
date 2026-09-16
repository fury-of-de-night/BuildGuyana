import { useState, useEffect } from 'react';
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (!localStorage.getItem('cookies-accepted')) setVisible(true); }, []);
  return visible ? (
    <div className="fixed bottom-0 left-0 w-full bg-zinc-900 text-white p-4 z-50 flex gap-4 items-center">
      <p className="text-sm">We use cookies to improve experience. See our <a href="/privacy-policy" className="underline">Privacy Policy</a>.</p>
      <button onClick={() => { localStorage.setItem('cookies-accepted','true'); setVisible(false); }} className="bg-amber-600 px-3 py-1 rounded text-sm">Accept</button>
    </div>
  ) : null;
}
