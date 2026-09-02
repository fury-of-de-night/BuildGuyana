import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useDemo } from '@/contexts/DemoModeContext';
import { useNavigate } from 'react-router-dom';

const guardianSteps = [
  {
    icon: 'ri-file-list-3-line',
    step: 'Step 1',
    title: 'Post Your Job & Get Matched',
    description:
      'Describe your project using our guided form — it takes under 2 minutes and is completely free. We match you with up to 3 verified tradespeople in your area. The strict 3-pro cap keeps spam out and quality in, so only serious, vetted professionals ever reach your inbox.',
  },
  {
    icon: 'ri-user-star-line',
    step: 'Step 2',
    title: 'Review Quotes & Approve',
    description:
      'Tradespeople request to quote for FREE — no cost and no commitment on either side. Review their profiles, ratings, and years of experience, then approve only the ones you like. Approved pros submit detailed quotes that you compare side by side.',
  },
  {
    icon: 'ri-shield-check-line',
    step: 'Step 3',
    title: 'Project Guardian Milestones',
    description:
      "The hybrid protection flow. Work is split into clear milestones — your contractor sends photo proof of each stage via WhatsApp, you approve the milestone in-app, and a Payment Certificate is generated for direct payment. No more paying upfront for work you haven't seen.",
  },
  {
    icon: 'ri-award-line',
    step: 'Step 4',
    title: 'Build Reputation',
    description:
      'Every completed project builds your standing through our dual reputation system — project owners earn the "Reliable Payer" badge, while tradespeople earn "Trustworthy Pro". Better reputation means better matches, every single time.',
  },
];

const protectionPoints = [
  {
    icon: 'ri-user-3-line',
    title: 'Capped at 3 Verified Pros',
    description:
      'Your job is never flooded with dozens of low-quality requests. We cap the match at 3 verified tradespeople to guarantee quality over quantity — and to keep spammers off your job entirely.',
  },
  {
    icon: 'ri-whatsapp-line',
    title: 'Photo Proof via WhatsApp',
    description:
      'Your contractor documents each milestone with real photos sent straight to your WhatsApp. No ambiguity, no "trust me" — just clear, timestamped evidence of the work done.',
  },
  {
    icon: 'ri-bank-card-line',
    title: 'Payment Certificates',
    description:
      'Approve a milestone and a Payment Certificate is generated instantly. Pay your contractor directly for verified work — never for promises, never fully upfront.',
  },
];

const tradespersonSteps = [
  {
    icon: 'ri-search-line',
    title: 'Browse Matched Jobs',
    description:
      'Find construction projects that fit your trade and region. With the 3-pro cap, you compete against fewer contractors — and stand a far better chance of being selected for every job.',
  },
  {
    icon: 'ri-chat-smile-2-line',
    title: 'Request to Quote — Free',
    description:
      'See a job you like? Request to quote completely free. No credits, no commitment — just tell the project owner about your experience and why you are the right fit.',
  },
  {
    icon: 'ri-check-double-line',
    title: 'Win the Job & Build Trust',
    description:
      'Get invited to submit a detailed quote, win the job, and complete milestones with photo proof. Every approved milestone strengthens your "Trustworthy Pro" reputation.',
  },
];

const valueProps = [
  {
    icon: 'ri-shield-check-line',
    title: 'Verified Tradespeople',
    description:
      'Every pro passes the 3-Tier verification system — Verified ID, Business Registration, and Trade Licenses for regulated trades like Electrical Work and Plumbing.',
  },
  {
    icon: 'ri-scales-line',
    title: 'Fair & Transparent',
    description:
      'Free quote requests, capped matching, and milestone-based payments. Nobody pays for work they have not approved, and nobody wastes time on spam.',
  },
  {
    icon: 'ri-star-smile-line',
    title: 'Dual Reputation System',
    description:
      'Reliable Payer for project owners, Trustworthy Pro for tradespeople. Honest ratings drawn from real, verified projects across all 10 Administrative Regions.',
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();
  const { isDemo, startDemo } = useDemo();

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main className={`${isDemo ? 'pt-24 md:pt-28' : 'pt-16 md:pt-20'}`}>
        {/* Hero */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="w-full px-4 md:px-8 lg:px-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-100 text-accent-900 font-label text-xs font-semibold mb-4 whitespace-nowrap">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-shield-check-line" />
              </div>
              The Project Guardian Way
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-900">
              How <span className="text-primary-500">BuildGuyana.gy</span> Works
            </h1>
            <p className="mt-4 text-base md:text-lg text-foreground-600 max-w-2xl mx-auto">
              A construction marketplace with a guardian mindset — capped matches, free quote requests,
              milestone-based payments, and a dual reputation system serving all 10 Administrative Regions of Guyana.
            </p>
          </div>
        </section>

        {/* Project Guardian Flow */}
        <section className="py-14 md:py-20 bg-background-50">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="text-center mb-10 md:mb-12">
              <div className="font-label text-xs font-semibold uppercase tracking-wider text-primary-500 mb-2">
                The 4-Step Flow
              </div>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground-900">
                From First Post to Verified Payment
              </h2>
              <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-xl mx-auto">
                Whether you are building your dream home or growing your trade, every project follows the same protected path.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {guardianSteps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="bg-background-100 rounded-lg p-5 md:p-6 h-full border border-background-200/70">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                        <div className="w-6 h-6 flex items-center justify-center">
                          <i className={`${step.icon} text-background-50 text-lg`} />
                        </div>
                      </div>
                      <span className="font-label text-xs font-bold text-primary-500 uppercase tracking-wider">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="font-heading text-base md:text-lg font-semibold text-foreground-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-foreground-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  {index < guardianSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="ri-arrow-right-line text-background-300" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 md:mt-10 text-center">
              <button
                onClick={() => { startDemo(); navigate('/dashboard/project-owner'); }}
                className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-primary-500 text-background-50 rounded-md hover:bg-primary-600 transition-colors whitespace-nowrap inline-flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-play-circle-line" />
                Try the Demo (No Sign-up)
              </button>
            </div>
          </div>
        </section>

        {/* Protection Band */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="text-center mb-10 md:mb-12">
              <div className="font-label text-xs font-semibold uppercase tracking-wider text-accent-500 mb-2">
                Built-In Protection
              </div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground-900">
                Why Project Guardian Is Different
              </h2>
              <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-xl mx-auto">
                Three safeguards on every project — from the first match to the final payment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {protectionPoints.map((item) => (
                <div key={item.title} className="bg-background-50 rounded-lg p-6 border border-background-200/70 h-full">
                  <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center mb-4">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <i className={`${item.icon} text-accent-500 text-lg`} />
                    </div>
                  </div>
                  <h3 className="font-heading text-base md:text-lg font-semibold text-foreground-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-foreground-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Tradespeople */}
        <section className="py-14 md:py-20 bg-background-50">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="flex items-center gap-3 mb-8 md:mb-12">
              <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-tools-line text-background-50" />
                </div>
              </div>
              <div>
                <h2 className="font-heading text-xl md:text-3xl font-bold text-foreground-900">
                  For Tradespeople
                </h2>
                <p className="text-sm text-foreground-600 mt-1">
                  Less competition, free quote requests, and a reputation that compounds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {tradespersonSteps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="bg-background-100 rounded-lg p-5 md:p-6 h-full border border-background-200/70">
                    <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center mb-4">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <i className={`${step.icon} text-accent-500 text-lg`} />
                      </div>
                    </div>
                    <div className="font-label text-xs font-bold text-accent-500 uppercase tracking-wider mb-2">
                      Step {index + 1}
                    </div>
                    <h3 className="font-heading text-base md:text-lg font-semibold text-foreground-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-foreground-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 md:mt-10 text-center">
              <button
                onClick={() => { startDemo(); navigate('/dashboard/tradesperson'); }}
                className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-accent-500 text-background-50 rounded-md hover:bg-accent-600 transition-colors whitespace-nowrap inline-flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-play-circle-line" />
                Try the Tradesperson Demo
              </button>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="text-center mb-10">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground-900">
                Why Choose BuildGuyana.gy?
              </h2>
              <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-xl mx-auto">
                Professional bidding. Transparent payments. Verified reputations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
              {valueProps.map((item) => (
                <div key={item.title} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary-100 flex items-center justify-center mb-4">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <i className={`${item.icon} text-primary-500 text-lg`} />
                    </div>
                  </div>
                  <h3 className="font-heading text-base md:text-lg font-semibold text-foreground-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-foreground-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}