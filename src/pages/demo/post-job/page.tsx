import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { CATEGORY_NAMES } from '@/mocks/categories';
import { REGIONS } from '@/mocks/locations';
import { DEMO_POST_JOB_FORM } from '@/mocks/demoData';

const PRE_FILLED_FORM = DEMO_POST_JOB_FORM;

type BudgetSize = 'small' | 'medium' | 'large';

const BUDGET_OPTIONS: { value: BudgetSize; label: string; range: string }[] = [
  { value: 'small', label: 'Small', range: 'Up to GYD $100,000' },
  { value: 'medium', label: 'Medium', range: 'GYD $100,000 — $500,000' },
  { value: 'large', label: 'Large', range: 'Above GYD $500,000' },
];

const TIMELINE_OPTIONS = [
  'Within 1 week',
  'Within 2 weeks',
  'Within 1 month',
  'Within 3 months',
  'Flexible / Not urgent',
];

export default function DemoPostJobPage() {
  const navigate = useNavigate();

  const [title] = useState(PRE_FILLED_FORM.title);
  const [category] = useState(PRE_FILLED_FORM.category);
  const [region] = useState(PRE_FILLED_FORM.region);
  const [location] = useState('New Amsterdam');
  const [description] = useState(PRE_FILLED_FORM.description);
  const [budgetSize] = useState<BudgetSize>(PRE_FILLED_FORM.budgetSize);
  const [timeline] = useState('Within 2 weeks');
  const [whatsapp] = useState(PRE_FILLED_FORM.whatsapp);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      sessionStorage.setItem('demo-job-posted', 'true');
      sessionStorage.setItem('demo-posted-job-data', JSON.stringify({
        id: 'demo-job-' + Date.now(),
        homeowner_id: 'demo-owner-001',
        title,
        category,
        description,
        region,
        location,
        budget_min: 100000,
        budget_max: 500000,
        status: 'open',
        created_at: new Date().toISOString(),
      }));

      setTimeout(() => {
        navigate('/demo-project-owner');
      }, 1800);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />

      {submitted && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-50 border border-green-300 rounded-md px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-check-line text-green-600 text-lg" />
            </div>
            <p className="text-green-800 text-sm font-label">Job Posted Successfully!</p>
          </div>
        </div>
      )}

      <main className="flex-1 px-4 md:px-6 pt-[110px] md:pt-[126px] pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-label text-amber-600 font-medium px-3 py-1 bg-amber-50 border border-amber-200 rounded-full whitespace-nowrap">
                Demo Mode — Pre-filled
              </span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
              Post a Job
            </h1>
            <p className="text-foreground-600 text-sm mt-1">
              This form is pre-filled with sample data so you can see how posting works. Just review and click submit!
            </p>
          </div>

          <div className="bg-white border border-background-200/70 rounded-lg p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Job Title <span className="text-accent-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  readOnly
                  className="w-full px-4 py-2.5 text-sm border border-amber-200/70 rounded-md bg-amber-50/50 text-foreground-900 focus:outline-none cursor-default"
                />
                <p className="text-xs text-amber-600 mt-1">Pre-filled for demo</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Category <span className="text-accent-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    disabled
                    className="w-full px-4 py-2.5 text-sm border border-amber-200/70 rounded-md bg-amber-50/50 text-foreground-900 focus:outline-none cursor-default appearance-none"
                  >
                    <option value={category}>{category}</option>
                  </select>
                  <p className="text-xs text-amber-600 mt-1">Pre-filled for demo</p>
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Region <span className="text-accent-500">*</span>
                  </label>
                  <select
                    id="region"
                    value={region}
                    disabled
                    className="w-full px-4 py-2.5 text-sm border border-amber-200/70 rounded-md bg-amber-50/50 text-foreground-900 focus:outline-none cursor-default appearance-none"
                  >
                    <option value={region}>{region}</option>
                  </select>
                  <p className="text-xs text-amber-600 mt-1">Pre-filled for demo</p>
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  City / Town
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  readOnly
                  className="w-full px-4 py-2.5 text-sm border border-amber-200/70 rounded-md bg-amber-50/50 text-foreground-900 focus:outline-none cursor-default"
                />
                <p className="text-xs text-amber-600 mt-1">Pre-filled for demo</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Description <span className="text-accent-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  readOnly
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm border border-amber-200/70 rounded-md bg-amber-50/50 text-foreground-900 focus:outline-none resize-vertical cursor-default"
                />
                <p className="text-xs text-amber-600 mt-1">Pre-filled for demo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-2 font-label">
                  Budget Range <span className="text-accent-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BUDGET_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={`p-4 border rounded-md text-left ${
                        budgetSize === opt.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-background-200/70 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground-800 font-label whitespace-nowrap">{opt.label}</span>
                        <span className="text-xs text-foreground-500">{opt.range}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-1">Pre-filled for demo</p>
              </div>

              <div>
                <label htmlFor="timeline" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Preferred Timeline <span className="text-accent-500">*</span>
                </label>
                <select
                  id="timeline"
                  value={timeline}
                  disabled
                  className="w-full px-4 py-2.5 text-sm border border-amber-200/70 rounded-md bg-amber-50/50 text-foreground-900 focus:outline-none cursor-default appearance-none"
                >
                  <option value={timeline}>{timeline}</option>
                </select>
                <p className="text-xs text-amber-600 mt-1">Pre-filled for demo</p>
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Client WhatsApp Number <span className="text-accent-500">*</span>
                </label>
                <p className="text-xs text-foreground-500 mb-1.5">
                  Please provide the number linked to your WhatsApp account. This is how tradespeople will contact you.
                </p>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-foreground-500 bg-amber-50/50 border border-amber-200/70 border-r-0 rounded-l-md">+592</span>
                  <input
                    id="whatsapp"
                    type="text"
                    value={whatsapp}
                    readOnly
                    className="w-full px-4 py-2.5 text-sm border border-amber-200/70 rounded-r-md bg-amber-50/50 text-foreground-900 focus:outline-none cursor-default"
                  />
                </div>
                <p className="text-xs text-amber-600 mt-1">Pre-filled for demo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Photos (Optional — max 5)
                </label>
                <p className="text-xs text-foreground-500 mb-2">
                  Upload photos of the site or project area to help tradespeople understand the scope.
                </p>
                <div className="flex gap-2 mt-2">
                  <div className="w-20 h-20 rounded-md overflow-hidden border-2 border-amber-300/60 bg-background-100">
                    <img
                      src={PRE_FILLED_FORM.placeholderImage}
                      alt="Sample fence construction photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-amber-600 font-label">Sample photo attached for demo</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {submitting ? 'Posting Job...' : 'Post Job — See How It Works'}
                </button>
                <p className="text-xs text-foreground-400 text-center mt-2">
                  Demo: No real job will be posted. Just see the flow in action! Your job goes live, tradespeople request to quote for free, you review their profiles, invite the best, and hire.
                </p>
              </div>
            </form>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200/70 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-information-line text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-800 font-label font-medium mb-1">What happens after posting?</p>
                <p className="text-xs text-amber-700">
                  Your job goes live immediately across all 10 regions of Guyana. Tradespeople will see your listing and request to quote — at no cost to them. You review each contractor's profile, ratings, and experience, then invite 3-5 of the best to submit detailed quotes. Compare quotes side by side, accept the best one, and get their contact info to start your project.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}