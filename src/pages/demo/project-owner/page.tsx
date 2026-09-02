import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoModeContext';
import WhatsAppPopup from '@/components/feature/WhatsAppPopup';
import type { DemoMilestone } from '@/mocks/demoData';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

export default function DemoProjectOwnerPage() {
  const navigate = useNavigate();
  const { demoProfile, demoJobs, demoLeads, switchDemoRole, demoMilestones, approveDemoMilestone } = useDemo();

  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState('');

  const formatBudget = (min: number, max: number) => {
    if (!min && !max) return 'Not specified';
    return `GYD ${min.toLocaleString()} — ${max.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getMilestoneStatusBadge = (ms: DemoMilestone) => {
    switch (ms.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">
            <div className="w-3 h-3 flex items-center justify-center">
              <i className="ri-check-double-line text-xs" />
            </div>
            Approved · Certificate Issued
          </span>
        );
      case 'photo_submitted':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">
            <div className="w-3 h-3 flex items-center justify-center">
              <i className="ri-camera-line text-xs" />
            </div>
            Photo Proof Received — Awaiting Approval
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-500 rounded-full font-label whitespace-nowrap">
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 px-4 md:px-6 pt-[110px] md:pt-[126px] pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
                Welcome, {demoProfile.full_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">DEMO</span>
                <span className="text-foreground-600 text-sm">Project Owner View</span>
                <button
                  onClick={() => { switchDemoRole(); navigate('/demo-tradesperson'); }}
                  className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-label hover:bg-amber-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Switch to Tradesperson View
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate('/demo-post-job')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-add-line" />
              </div>
              Post a Demo Job
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white border border-background-200/70 rounded-lg p-5 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <i className="ri-user-3-line text-2xl text-primary-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-lg text-foreground-900">{demoProfile.full_name}</h2>
                <p className="text-sm text-foreground-600 mt-0.5">{demoProfile.region} · {demoProfile.location}</p>
                <p className="text-xs text-foreground-500 mt-1">
                  As a project owner, you can post construction jobs for free. Verified tradespeople across
                  all 10 regions of Guyana will request to quote. You review their profiles, invite the best
                  ones to submit detailed quotes, compare, and hire with confidence.
                </p>
              </div>
            </div>
          </div>

          {/* My Demo Jobs */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-foreground-900">Available Demo Jobs ({demoJobs.length})</h2>
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">DEMO DATA</span>
            </div>

            <div className="space-y-3">
              {demoJobs.map((job) => (
                <div key={job.id} className="bg-white border border-background-200/70 rounded-lg p-4 md:p-5 hover:border-amber-300/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">{job.category}</span>
                        <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">{job.region}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-label whitespace-nowrap ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {job.status === 'open' ? 'Open' : job.status}
                        </span>
                      </div>
                      <h3 className="font-heading text-base text-foreground-900 mb-1">{job.title}</h3>
                      <p className="text-sm text-foreground-600 line-clamp-2 mb-2">{job.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-500">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 flex items-center justify-center"><i className="ri-map-pin-line" /></div>{job.location}</span>
                        <span className="font-medium text-foreground-700">{formatBudget(job.budget_min, job.budget_max)}</span>
                        <span>{formatDate(job.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* My Leads / Requests */}
          <section>
            <h2 className="font-heading text-lg text-foreground-900 mb-4">
              Quote Requests Received ({demoLeads.length})
            </h2>

            {demoLeads.length === 0 ? (
              <div className="text-center py-16 bg-white border border-background-200/70 rounded-lg">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                  <i className="ri-user-voice-line text-3xl text-foreground-400" />
                </div>
                <p className="text-foreground-600 text-sm font-label">No quote requests yet.</p>
                <p className="text-foreground-500 text-xs mt-1">
                  Switch to the Tradesperson View to request a quote on a demo job, then come back here to see it appear!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {demoLeads.map((lead) => (
                  <div key={lead.id} className="bg-white border border-background-200/70 rounded-lg p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-label whitespace-nowrap ${
                            lead.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                            lead.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            lead.status === 'quote_submitted' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {lead.status === 'requested' ? 'Requested' :
                             lead.status === 'approved' ? 'Approved' :
                             lead.status === 'quote_submitted' ? 'Quote Submitted' : 'Hired'}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">DEMO</span>
                        </div>
                        <h3 className="font-heading text-base text-foreground-900 mb-1">{lead.job_title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-500">
                          <span className="flex items-center gap-1"><div className="w-3 h-3 flex items-center justify-center"><i className="ri-folder-line" /></div>{lead.job_category}</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 flex items-center justify-center"><i className="ri-map-pin-line" /></div>{lead.job_region}</span>
                          <span>{formatDate(lead.unlocked_at)}</span>
                        </div>
                      </div>
                      {lead.status === 'hired' && lead.homeowner_phone && (
                        <button
                          onClick={() => { setWhatsAppTarget(`${lead.job_title} contractor`); setShowWhatsAppPopup(true); }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0"
                        >
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-whatsapp-line" />
                          </div>
                          Contact
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Project Guardian — Milestone Tracking */}
          <section className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg text-foreground-900">Project Guardian — Milestones</h2>
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">DEMO</span>
              </div>
              <span className="text-xs text-foreground-500 font-label">New House Build · 2 Bedroom Concrete</span>
            </div>

            <div className="bg-white border border-amber-300/60 rounded-lg p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <i className="ri-shield-check-line text-amber-500 text-lg" />
                </div>
                <div>
                  <h3 className="font-heading text-sm text-foreground-900">Milestone protection is active</h3>
                  <p className="text-xs text-foreground-500 mt-0.5">
                    Your contractor sends photo proof for each stage via WhatsApp. Approve the milestone to release a
                    Payment Certificate — you pay directly, never upfront.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {demoMilestones.map((ms, idx) => (
                  <div key={ms.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label text-xs font-bold shrink-0 ${
                        ms.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : ms.status === 'photo_submitted'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-background-100 text-foreground-400'
                      }`}>
                        {ms.status === 'approved' ? <i className="ri-check-line" /> : idx + 1}
                      </div>
                      {idx < demoMilestones.length - 1 && <div className="w-px flex-1 bg-background-200 my-1" />}
                    </div>
                    <div className="flex-1 pb-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-heading text-sm text-foreground-900">{ms.title}</h4>
                          {getMilestoneStatusBadge(ms)}
                        </div>
                        {ms.status === 'photo_submitted' && (
                          <button
                            onClick={() => approveDemoMilestone(ms.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0"
                          >
                            <div className="w-3 h-3 flex items-center justify-center">
                              <i className="ri-check-double-line" />
                            </div>
                            Approve & Issue Certificate
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-foreground-600 mt-1">{ms.description}</p>
                      {ms.status === 'approved' && ms.payment_certificate && (
                        <p className="inline-flex items-center gap-1 text-xs text-green-700 mt-1.5 font-label whitespace-nowrap">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-bank-card-line text-xs" />
                          </div>
                          Payment Certificate generated — pay contractor directly
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="mt-12">
            <h2 className="font-heading text-lg text-foreground-900 mb-4">The Project Guardian Flow</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { step: 1, icon: 'ri-file-list-3-line', title: 'Post Job', desc: 'Free, guided project form' },
                { step: 2, icon: 'ri-user-3-line', title: 'Get Matched', desc: 'Up to 3 verified pros — no spam' },
                { step: 3, icon: 'ri-user-star-line', title: 'Approve Quotes', desc: 'Pros request to quote for free' },
                { step: 4, icon: 'ri-shield-check-line', title: 'Milestones', desc: 'Photo proof via WhatsApp' },
                { step: 5, icon: 'ri-bank-card-line', title: 'Pay Safely', desc: 'Payment Certificate per stage' },
              ].map((s) => (
                <div key={s.step} className="bg-white border border-background-200/70 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-label font-bold text-sm text-primary-600">{s.step}</span>
                  </div>
                  <h3 className="font-heading text-sm text-foreground-900 mb-0.5">{s.title}</h3>
                  <p className="text-xs text-foreground-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <WhatsAppPopup
        isOpen={showWhatsAppPopup}
        onClose={() => setShowWhatsAppPopup(false)}
        targetName={whatsAppTarget}
      />
      <Footer />
    </div>
  );
}