import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoModeContext';
import { useAuth } from '@/contexts/AuthContext';
import WhatsAppPopup from '@/components/feature/WhatsAppPopup';

const DEFAULT_CONTACT = {
  address: 'Georgetown, Guyana — Serving All 10 Regions',
  phone: '+592 226-4567',
  email: 'support@buildguyana.com',
};

const DEFAULT_SOCIAL = {
  facebook: 'https://facebook.com/buildguyana',
  instagram: 'https://instagram.com/buildguyana',
  whatsapp: 'https://wa.me/5926000000',
};

export default function Footer() {
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [social, setSocial] = useState(DEFAULT_SOCIAL);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [showTncModal, setShowTncModal] = useState(false);
  const [tncText, setTncText] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [privacyText, setPrivacyText] = useState('');
  const [cookieText, setCookieText] = useState('');
  const location = useLocation();
  const { isDemo } = useDemo();
  const { activeRole } = useAuth();

  const isDemoPage = location.pathname.startsWith('/demo') || isDemo;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', [
            'contact_address', 'contact_phone', 'contact_email',
            'social_facebook', 'social_instagram', 'social_whatsapp',
            'tnc_text', 'privacy_policy_text', 'cookie_policy_text',
          ]);

        if (data && data.length > 0) {
          const map: Record<string, string> = {};
          data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
          setContact({
            address: map.contact_address || DEFAULT_CONTACT.address,
            phone: map.contact_phone || DEFAULT_CONTACT.phone,
            email: map.contact_email || DEFAULT_CONTACT.email,
          });
          setSocial({
            facebook: map.social_facebook || DEFAULT_SOCIAL.facebook,
            instagram: map.social_instagram || DEFAULT_SOCIAL.instagram,
            whatsapp: map.social_whatsapp || DEFAULT_SOCIAL.whatsapp,
          });
          setTncText(map.tnc_text || '');
          setPrivacyText(map.privacy_policy_text || '');
          setCookieText(map.cookie_policy_text || '');
        }
      } catch {
        // fall back to defaults silently
      }
    };
    fetchSettings();
  }, []);

  const socialLink = (url: string) => url || '#';

  // Format WhatsApp URL from phone number — strip spaces, dashes, plus signs
  const getWhatsAppLink = () => {
    const raw = contact.phone.replace(/[\s\-\+\(\)]/g, '');
    return raw ? `https://wa.me/${raw}` : social.whatsapp || '#';
  };

  const waLink = getWhatsAppLink();

  // "Find Jobs" routes tradespeople straight to their dashboard's Available Jobs tab,
  // and everyone else (guests + project owners) to the public jobs board.
  const findJobsHref = activeRole === 'tradesperson'
    ? '/dashboard/contractor?tab=jobs'
    : '/public-jobs';

  const tncEnabled = tncText.trim().length > 0;
  const privacyEnabled = privacyText.trim().length > 0;
  const cookieEnabled = cookieText.trim().length > 0;

  const handleFooterLink = (type: 'terms' | 'privacy' | 'cookie') => {
    if (type === 'terms') {
      setShowTncModal(true);
    } else if (type === 'privacy') {
      setShowPrivacyModal(true);
    } else if (type === 'cookie') {
      setShowCookieModal(true);
    }
  };

  return (
    <footer className="bg-secondary-900 text-background-50">
      <div className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <i className="ri-hammer-fill text-background-50 text-sm" />
              </div>
              <span className="font-heading font-bold text-lg text-background-50">BuildGuyana.gy</span>
            </div>
            <p className="text-sm text-background-400 leading-relaxed">
              Connecting homeowners across Guyana with trusted, verified contractors. Post your construction job for free and get contacted via WhatsApp — serving all 10 Administrative Regions.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={socialLink(social.facebook)}
                target={social.facebook ? '_blank' : undefined}
                rel={social.facebook ? 'noopener noreferrer' : undefined}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  social.facebook ? 'bg-secondary-800 hover:bg-primary-500 cursor-pointer' : 'bg-secondary-800 opacity-40 cursor-default'
                }`}
              >
                <i className="ri-facebook-fill text-sm" />
              </a>
              <a
                href={socialLink(social.instagram)}
                target={social.instagram ? '_blank' : undefined}
                rel={social.instagram ? 'noopener noreferrer' : undefined}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  social.instagram ? 'bg-secondary-800 hover:bg-primary-500 cursor-pointer' : 'bg-secondary-800 opacity-40 cursor-default'
                }`}
              >
                <i className="ri-instagram-fill text-sm" />
              </a>
              {isDemoPage ? (
                <button
                  onClick={() => setShowWhatsAppPopup(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-secondary-800 hover:bg-primary-500 cursor-pointer"
                >
                  <i className="ri-whatsapp-fill text-sm" />
                </button>
              ) : (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    waLink !== '#' ? 'bg-secondary-800 hover:bg-primary-500 cursor-pointer' : 'bg-secondary-800 opacity-40 cursor-default'
                  }`}
                >
                  <i className="ri-whatsapp-fill text-sm" />
                </a>
              )}
            </div>
          </div>

          {/* For Homeowners */}
          <div>
            <h4 className="font-label text-xs font-semibold uppercase tracking-wider text-background-400 mb-4">
              For Homeowners
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Post a Job', href: '/post-job' },
                { label: 'How It Works', href: '/how-it-works' },
                { label: 'Browse Contractors', href: '/contractors' },
                { label: 'Testimonials', href: '/testimonials' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-sm text-background-300 hover:text-background-50 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Contractors */}
          <div>
            <h4 className="font-label text-xs font-semibold uppercase tracking-wider text-background-400 mb-4">
              For Contractors
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Join as a Contractor', href: '/register' },
                { label: 'Find Jobs', href: findJobsHref },
                { label: 'Success Stories', href: '/success-stories' },
                { label: 'Pricing & Plans', href: '/pricing' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-sm text-background-300 hover:text-background-50 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-label text-xs font-semibold uppercase tracking-wider text-background-400 mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                  <i className="ri-map-pin-line text-background-400 text-sm" />
                </div>
                <span className="text-sm text-background-300">
                  {contact.address}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                  <i className="ri-phone-line text-background-400 text-sm" />
                </div>
                <span className="text-sm text-background-300">
                  {contact.phone}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                  <i className="ri-mail-line text-background-400 text-sm" />
                </div>
                <div>
                  <span className="text-sm text-background-300">
                    {contact.email}
                  </span>
                  <p className="text-xs text-background-500 mt-1">
                    Any questions, queries, advice, or requests can be sent to our email.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-secondary-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background-500">
            &copy; 2026 BuildGuyana.gy. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleFooterLink('privacy')}
              className="text-xs text-background-500 hover:text-background-300 transition-colors cursor-pointer"
            >
              Privacy Notice
            </button>
            <button
              onClick={() => handleFooterLink('terms')}
              className="text-xs text-background-500 hover:text-background-300 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => handleFooterLink('cookie')}
              className="text-xs text-background-500 hover:text-background-300 transition-colors cursor-pointer"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </div>

      <WhatsAppPopup
        isOpen={showWhatsAppPopup}
        onClose={() => setShowWhatsAppPopup(false)}
        targetName="BuildGuyana.gy support"
      />

      {/* Terms of Service Modal */}
      {showTncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-background-200/70 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-background-200/70 shrink-0">
              <h2 className="font-heading text-lg text-foreground-900">Terms of Service</h2>
              <button
                onClick={() => setShowTncModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-foreground-600 text-lg" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {tncEnabled ? (
                <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap">
                  {tncText}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-foreground-100 flex items-center justify-center">
                    <i className="ri-time-line text-2xl text-foreground-500" />
                  </div>
                  <h3 className="font-heading text-base text-foreground-900 mb-2">Terms Being Updated</h3>
                  <p className="text-sm text-foreground-500 max-w-md mx-auto">
                    Our Terms of Service are currently being updated. Please check back soon or contact support if you have any questions.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-background-200/70 shrink-0 flex justify-end">
              <button
                onClick={() => setShowTncModal(false)}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-background-200/70 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-background-200/70 shrink-0">
              <h2 className="font-heading text-lg text-foreground-900">Privacy Notice</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-foreground-600 text-lg" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {privacyEnabled ? (
                <div>
                  <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap">
                    {privacyText}
                  </div>
                  <button
                    onClick={() => { setShowPrivacyModal(false); setShowTncModal(true); }}
                    className="mt-5 text-sm font-medium text-primary-600 hover:text-primary-700 underline cursor-pointer"
                  >
                    Read our Terms and Conditions
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-foreground-100 flex items-center justify-center">
                    <i className="ri-file-text-line text-2xl text-foreground-500" />
                  </div>
                  <h3 className="font-heading text-base text-foreground-900 mb-2">Privacy Notice Being Updated</h3>
                  <p className="text-sm text-foreground-500 max-w-md mx-auto">
                    Our Privacy Notice is currently being updated. Please check back soon or contact support with any concerns.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-background-200/70 shrink-0 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Policy Modal */}
      {showCookieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-background-200/70 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-background-200/70 shrink-0">
              <h2 className="font-heading text-lg text-foreground-900">Cookie Policy</h2>
              <button
                onClick={() => setShowCookieModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-foreground-600 text-lg" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {cookieEnabled ? (
                <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap">
                  {cookieText}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-foreground-100 flex items-center justify-center">
                    <i className="ri-shield-check-line text-2xl text-foreground-500" />
                  </div>
                  <h3 className="font-heading text-base text-foreground-900 mb-2">Cookie Policy Being Updated</h3>
                  <p className="text-sm text-foreground-500 max-w-md mx-auto">
                    Our Cookie Policy is currently being updated. We use essential cookies to ensure the site functions properly. Please check back soon for the full policy.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-background-200/70 shrink-0 flex justify-end">
              <button
                onClick={() => setShowCookieModal(false)}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}