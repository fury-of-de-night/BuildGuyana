import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { REGIONS } from '@/mocks/locations';
import { CATEGORY_NAMES } from '@/mocks/categories';
import type { DemoJob } from '@/mocks/demoData';

type BudgetSize = 'small' | 'medium' | 'large';

const BUDGET_OPTIONS: { value: BudgetSize; label: string; range: string; minGyd: number; maxGyd: number }[] = [
  { value: 'small', label: 'Small', range: 'Up to GYD $299,999', minGyd: 10000, maxGyd: 299999 },
  { value: 'medium', label: 'Medium', range: 'GYD $300,000 — $1,999,999', minGyd: 300000, maxGyd: 1999999 },
  { value: 'large', label: 'Large', range: 'GYD $2,000,000 and above', minGyd: 2000000, maxGyd: 500000000 },
];

const TIMELINE_OPTIONS = [
  'Within 1 week',
  'Within 2 weeks',
  'Within 1 month',
  'Within 3 months',
  'Flexible / Not urgent',
];

export default function PostJobPage() {
  return (
    <AuthGuard requiredRole="project_owner">
      <PostJobForm />
    </AuthGuard>
  );
}

function PostJobForm() {
  const { user, profile } = useAuth();
  const { isDemo, addDemoJob } = useDemo();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [budgetSize, setBudgetSize] = useState<BudgetSize | ''>('');
  const [timeline, setTimeline] = useState('');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Demo auto-fill on mount
  useEffect(() => {
    if (isDemo) {
      setTitle('Leaky Faucet Repair');
      setCategory('Plumbing');
      setRegion('Region 4');
      setLocation('Georgetown');
      setDescription('Need a plumber to fix a leaky kitchen faucet.');
      setBudgetSize('small');
      setTimeline('Within 1 week');
      setPhone('5926123456');
    }
  }, [isDemo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed.');
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    setError('');
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !category || !region || !description || !budgetSize || !timeline || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    // === DEMO MODE — use addDemoJob ===
    if (isDemo) {
      const budget = BUDGET_OPTIONS.find((b) => b.value === budgetSize);
      const demoJob: DemoJob = {
        id: `demo-job-${Date.now()}`,
        homeowner_id: 'demo-owner-001',
        title: title.trim(),
        category,
        description: description.trim(),
        region,
        location: location.trim() || region,
        budget_min: budget?.minGyd || 10000,
        budget_max: budget?.maxGyd || 100000,
        status: 'open',
        created_at: new Date().toISOString(),
      };
      addDemoJob(demoJob);
      setSuccess('Demo job posted! Navigating to My Jobs...');
      setTimeout(() => navigate('/dashboard/project-owner'), 1000);
      return;
    }

    // === LIVE MODE ===
    setSubmitting(true);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of photos) {
        try {
          const result = await uploadToCloudinary(file);
          uploadedUrls.push(result.secure_url);
        } catch {
          setError('Failed to upload photos. Please try again.');
          setSubmitting(false);
          setUploading(false);
          return;
        }
      }

      const budget = BUDGET_OPTIONS.find((b) => b.value === budgetSize);

      const insertResult = await supabase
        .from('jobs')
        .insert({
          homeowner_id: user!.id,
          title: title.trim(),
          category,
          description: description.trim(),
          region,
          location: location.trim() || null,
          budget_min: budget?.minGyd || 10000,
          budget_max: budget?.maxGyd || 100000,
          status: 'open',
        })
        .select('id')
        .maybeSingle();

      if (insertResult.error) {
        setError('Failed to post job: ' + insertResult.error.message);
        setSubmitting(false);
        setUploading(false);
        return;
      }

      setSuccess('Job posted successfully! Tradespeople can now view and unlock your job.');
      setTitle('');
      setCategory('');
      setRegion('');
      setLocation('');
      setDescription('');
      setBudgetSize('');
      setTimeline('');
      setPhone(profile?.phone || '');
      setPhotos([]);
      setPhotoUrls([]);

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className={`flex-1 px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-8`}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
                Post a Job
              </h1>
              {isDemo && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-foreground-600 text-sm mt-1">
              Describe your project and get contacted by qualified tradespeople across Guyana.
            </p>
          </div>

          <div className="bg-white border border-background-200/70 rounded-lg p-6 md:p-8">
            {error && (
              <div className="mb-6 p-3 bg-accent-100/80 border border-accent-300/60 rounded-md">
                <p className="text-accent-900 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Job Title <span className="text-accent-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                  placeholder="e.g. New House Build — 2 Bedroom Concrete"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Category <span className="text-accent-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {CATEGORY_NAMES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Region <span className="text-accent-500">*</span>
                  </label>
                  <select
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer"
                  >
                    <option value="">Select region</option>
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
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
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                  placeholder="e.g. Georgetown, New Amsterdam"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Description <span className="text-accent-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={2000}
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
                  placeholder="Describe your project in detail — materials needed, scope of work, any specific requirements..."
                />
                <p className="text-xs text-foreground-400 mt-1">{description.length}/2000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-2 font-label">
                  Budget Range <span className="text-accent-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBudgetSize(opt.value)}
                      className={`p-4 border rounded-md text-left transition-colors cursor-pointer ${
                        budgetSize === opt.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-background-200/70 hover:border-background-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${budgetSize === opt.value ? 'border-primary-500' : 'border-background-300'}">
                          {budgetSize === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                        </div>
                        <span className="text-sm font-medium text-foreground-800 font-label whitespace-nowrap">{opt.label}</span>
                      </div>
                      <p className="text-xs text-foreground-500 ml-7">{opt.range}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="timeline" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Preferred Timeline <span className="text-accent-500">*</span>
                </label>
                <select
                  id="timeline"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer"
                >
                  <option value="">Select timeline</option>
                  {TIMELINE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Client WhatsApp Number <span className="text-accent-500">*</span>
                </label>
                <p className="text-xs text-foreground-500 mb-1.5">
                  Please provide the number linked to your WhatsApp account. This is how tradespeople will contact you.
                </p>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-foreground-500 bg-background-100 border border-background-200/70 border-r-0 rounded-l-md">+592</span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-r-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                    placeholder="6123456"
                  />
                </div>
                <p className="text-xs text-foreground-400 mt-1">This number will be shared with tradespeople who unlock your job.</p>
              </div>

              {!isDemo && (
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Photos (Optional — max 5)
                  </label>
                  <p className="text-xs text-foreground-500 mb-2">
                    Upload photos of the site or project area to help tradespeople understand the scope.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full text-sm text-foreground-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary-100 file:text-secondary-900 hover:file:bg-secondary-200 file:cursor-pointer cursor-pointer"
                  />
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {photos.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <div className="w-16 h-16 rounded-md bg-background-100 border border-background-200/70 flex items-center justify-center overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent-500 text-background-50 rounded-full flex items-center justify-center text-xs hover:bg-accent-600 transition-colors cursor-pointer"
                          >
                            <i className="ri-close-line" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {isDemo
                    ? 'Post Demo Job'
                    : uploading
                      ? 'Uploading Photos...'
                      : submitting
                        ? 'Posting Job...'
                        : "Post Job — It's Free"
                  }
                </button>
                <p className="text-xs text-foreground-400 text-center mt-2">
                  {isDemo
                    ? 'This is a demo — no real data is saved.'
                    : 'Posting is free. Tradespeople can request to quote on your job for free, and submit detailed quotes if you approve them.'
                  }
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}