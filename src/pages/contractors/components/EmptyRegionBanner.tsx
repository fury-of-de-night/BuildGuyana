import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRegionById } from '@/mocks/locations';
import { tradespeople } from '@/mocks/tradespeople';

export default function EmptyRegionBanner({ regionId }: { regionId: string }) {
  const navigate = useNavigate();
  const region = getRegionById(regionId);
  const [email, setEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  if (!region) return null;

  const handleNotifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    const honeypot = formData.get('phone_alt');
    if (honeypot && String(honeypot).trim() !== '') {
      setFormStatus('success');
      setEmail('');
      return;
    }

    setFormStatus('submitting');
    setFormError('');

    try {
      const body = new URLSearchParams();
      formData.forEach((value, key) => {
        if (key !== 'phone_alt') {
          body.append(key, String(value));
        }
      });

      const res = await fetch('https://readdy.ai/api/form/d93cti5568obap8davu0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const responseText = await res.text();
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        // JSON parse failed, use empty object
      }

      if (res.ok && parsed?.code === 'OK') {
        setFormStatus('success');
        setEmail('');
      } else {
        const serverMsg = parsed?.meta?.message || parsed?.message || '';
        if (serverMsg.includes('spam')) {
          setFormError('Something went wrong. Please try again.');
        } else {
          setFormError(serverMsg || 'Something went wrong. Please try again.');
        }
        setFormStatus('error');
      }
    } catch {
      setFormError('Network error. Please try again.');
      setFormStatus('error');
    }
  };

  const regionName = region.name.split(' — ')[1] || region.name;
  const regionDisplay = region.name;

  // Get top-rated contractors from active regions as fallback (Elite tier first, then rating)
  const tierRank = (t: string | null | undefined) => {
    switch (t) {
      case 'elite': return 1;
      case 'pro': return 2;
      case 'basic': return 3;
      case 'free': return 4;
      default: return 5;
    }
  };
  const fallbackContractors = tradespeople
    .filter((t) => t.verified && t.rating >= 4.7)
    .sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || b.rating - a.rating)
    .slice(0, 4);

  return (
    <div>
      {/* Empty Region Banner */}
      <div className="bg-gradient-to-r from-primary-100 via-background-100 to-primary-100 border border-primary-200/50 rounded-xl p-6 md:p-10 text-center">
        <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full bg-primary-500 flex items-center justify-center mb-4">
          <i className="ri-building-2-line text-background-50 text-xl md:text-2xl" />
        </div>
        <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-3">
          We are currently expanding to {regionDisplay}!
        </h2>
        <p className="text-sm md:text-base text-foreground-600 max-w-xl mx-auto leading-relaxed">
          We don't have contractors in {regionName} just yet, but we're actively recruiting. BuildGuyana.gy is growing fast — {regionName} is next on our expansion roadmap.
        </p>

        {/* CTAs */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
          <button
            onClick={() => navigate('/register')}
            className="font-label font-semibold text-sm md:text-base px-5 md:px-6 py-2.5 md:py-3 bg-primary-500 text-background-50 rounded-md hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <i className="ri-user-add-line" />
            Are you a tradesperson in this area? Sign up here
          </button>

          {/* Divider on mobile */}
          <span className="text-xs text-foreground-400 font-label hidden sm:block">or</span>

          {/* Notify Me Form */}
          <form
            data-readdy-form="true"
            onSubmit={handleNotifySubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email for updates..."
              required
              className="font-label text-sm px-4 py-2.5 rounded-md border border-background-300/60 bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 min-w-[220px]"
            />
            <input
              type="text"
              name="phone_alt"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              readOnly
              className="honeypot"
            />
            <button
              type="submit"
              disabled={formStatus === 'submitting' || formStatus === 'success'}
              className="font-label font-semibold text-sm px-5 py-2.5 rounded-md bg-foreground-900 text-background-50 hover:bg-foreground-800 transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {formStatus === 'submitting' ? 'Sending...' : formStatus === 'success' ? 'Subscribed!' : 'Notify Me'}
            </button>
          </form>
        </div>

        {formStatus === 'success' && (
          <p className="mt-3 text-sm text-primary-600 font-label font-medium">
            Thanks! We'll let you know when contractors arrive in {regionName}.
          </p>
        )}
        {formStatus === 'error' && (
          <p className="mt-3 text-sm text-amber-600 font-label">{formError}</p>
        )}
      </div>

      {/* Fallback: Top-Rated Contractors from active regions */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <div className="font-label text-xs font-semibold uppercase tracking-wider text-primary-500 mb-2">
            The Platform Is Active
          </div>
          <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground-900">
            Meanwhile, check out these Top-Rated Contractors available nationwide:
          </h3>
          <p className="mt-2 text-sm text-foreground-600 max-w-xl mx-auto">
            BuildGuyana.gy already has verified contractors serving other regions. Here are some of our highest-rated pros.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-5xl mx-auto">
          {fallbackContractors.map((tp) => (
            <button
              key={tp.id}
              onClick={() => navigate(`/contractors/${tp.id}`)}
              className="group text-left bg-background-50 border border-background-200/70 rounded-lg overflow-hidden hover:shadow-lg hover:border-background-300 transition-all cursor-pointer"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={tp.image}
                  alt={tp.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {tp.verified && (
                  <div className="absolute top-3 right-3 bg-accent-500 text-background-50 font-label text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <i className="ri-shield-check-line text-xs" />
                    Verified
                  </div>
                )}
              </div>
              <div className="p-3 md:p-4">
                <h4 className="font-heading text-sm md:text-base font-semibold text-foreground-900">
                  {tp.name}
                </h4>
                <p className="text-xs text-foreground-500 mt-0.5">{tp.trade} &middot; {tp.location}</p>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex items-center gap-0.5">
                    <i className="ri-star-fill text-amber-500 text-xs" />
                    <span className="font-label text-xs font-semibold text-foreground-800">{tp.rating}</span>
                  </div>
                  <span className="text-xs text-foreground-400">({tp.reviewCount} reviews)</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}