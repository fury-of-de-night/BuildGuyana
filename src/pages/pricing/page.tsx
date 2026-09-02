import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { Link } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoModeContext';

const tiers = [
  {
    name: 'Trial',
    price: 'Free',
    credits: '3',
    period: '14 days',
    description: 'Try BuildGuyana.gy risk-free. Perfect for new tradespeople who want to explore the platform before committing.',
    features: [
      '3 free quote submissions',
      'Access to all job listings',
      'Basic profile page',
      'Request to quote on unlimited jobs',
      '14-day trial period',
    ],
    cta: 'Start Free Trial',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Free',
    price: 'Free',
    credits: '0',
    period: 'forever',
    description: 'Stay visible and browse jobs at no cost. You only pay per credit when you want to submit a quote.',
    features: [
      'Browse all available jobs',
      'Request to quote (free)',
      'Basic public profile',
      'Pay-as-you-go credits at GYD $500 each',
      'No monthly commitment',
    ],
    cta: 'Get Started Free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Basic',
    price: 'GYD $5,000',
    credits: '12',
    period: 'per month',
    description: 'Serious about growing your business? The Basic plan gives you a steady stream of credits each month.',
    features: [
      '12 credits per month (GYD $417/credit — save 17%)',
      'Priority listing in search results',
      'Verified badge on profile',
      'Access to premium job alerts',
      'Monthly credit rollover (up to 24)',
    ],
    cta: 'Choose Basic',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 'GYD $10,000',
    credits: '25',
    period: 'per month',
    description: 'For established contractors who want maximum visibility and a steady flow of quality leads.',
    features: [
      '25 credits per month (GYD $400/credit — save 20%)',
      'Featured placement at top of search results',
      'Verified + Pro badge on profile',
      'Priority access to new job listings',
      'Monthly credit rollover (up to 50)',
      'Dedicated support priority',
    ],
    cta: 'Choose Pro',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Elite',
    price: 'GYD $20,000',
    credits: '60',
    period: 'per month',
    description: 'Maximum exposure and the best value per credit. Built for high-volume contractors who dominate their trade.',
    features: [
      '60 credits per month (GYD $333/credit — save 33%)',
      'Top-of-page featured placement',
      'Elite verified badge on profile',
      'First access to all new job listings',
      'Monthly credit rollover (up to 120)',
      'VIP support with direct WhatsApp access',
      'Exclusive Elite contractor networking',
    ],
    cta: 'Choose Elite',
    href: '/register',
    highlighted: false,
  },
];

export default function PricingPage() {
  const { isDemo } = useDemo();

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className={`flex-1 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'}`}>
        {/* Hero */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="w-full px-4 md:px-8 lg:px-12 text-center">
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-900">
              Pricing &amp; Plans
            </h1>
            <p className="mt-4 text-base md:text-lg text-foreground-600 max-w-2xl mx-auto">
              Flexible plans for every stage of your contracting business. From just browsing to dominating your trade — we have a plan that fits.
            </p>
          </div>
        </section>

        {/* Tiers Grid */}
        <section className="py-14 md:py-20 bg-background-50">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
                {tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className={`rounded-xl p-5 md:p-6 flex flex-col border transition-shadow ${
                      tier.highlighted
                        ? 'border-primary-500 bg-primary-50/30 ring-2 ring-primary-200/60'
                        : 'border-background-200/70 bg-white'
                    }`}
                  >
                    {tier.highlighted && (
                      <div className="mb-3">
                        <span className="inline-block px-3 py-1 bg-primary-500 text-background-50 text-xs font-label font-semibold rounded-full whitespace-nowrap">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <h3 className="font-heading text-lg md:text-xl font-bold text-foreground-900">
                      {tier.name}
                    </h3>
                    <div className="mt-2 mb-1">
                      <span className="font-heading text-2xl md:text-3xl font-bold text-foreground-900">
                        {tier.price}
                      </span>
                      <span className="text-sm text-foreground-500 ml-1 font-label">
                        {tier.period}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-600 mt-3 leading-relaxed flex-1">
                      {tier.description}
                    </p>

                    <div className="mt-5 space-y-2.5 flex-1">
                      {tier.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                            <i className="ri-check-line text-primary-500 text-sm" />
                          </div>
                          <span className="text-xs text-foreground-700 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to={tier.href}
                      className={`mt-6 w-full py-2.5 px-4 text-sm font-label font-semibold rounded-md text-center transition-colors whitespace-nowrap cursor-pointer ${
                        tier.highlighted
                          ? 'bg-primary-500 text-background-50 hover:bg-primary-600'
                          : 'border border-background-200/70 text-foreground-700 hover:bg-background-100'
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <p className="text-xs text-foreground-500">
                  All prices in Guyanese Dollars (GYD). Credit rate: 1 Credit = GYD $500. Prices subject to change.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground-900 text-center mb-10">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: 'What are credits used for?',
                    a: 'Credits are used to submit detailed quotes on jobs. Browsing jobs and requesting to quote are both free. You only spend a credit when a project owner invites you to submit a formal quote.',
                  },
                  {
                    q: 'Do unused credits roll over?',
                    a: 'Yes! On paid plans, unused credits roll over to the next month up to a cap (2x your monthly credit allocation). On the Free plan, pay-as-you-go credits never expire.',
                  },
                  {
                    q: 'Can I switch plans anytime?',
                    a: 'Absolutely. You can upgrade or downgrade your plan at any time. When you upgrade, you get immediate access to the higher credit tier. When you downgrade, the change takes effect at the end of your current billing period.',
                  },
                  {
                    q: 'How does the 14-day trial work?',
                    a: 'The Trial plan gives you 3 free credits and full platform access for 14 days. No payment information is required. At the end of the trial, you can choose any plan or continue on the Free tier.',
                  },
                  {
                    q: 'Is there a commitment or contract?',
                    a: 'No long-term contracts. All paid plans are month-to-month. You can cancel anytime and your credits remain valid until the end of your billing period.',
                  },
                ].map((faq) => (
                  <div key={faq.q} className="bg-white border border-background-200/70 rounded-lg p-5">
                    <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-2">{faq.q}</h3>
                    <p className="text-sm text-foreground-600 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-20 bg-foreground-900">
          <div className="w-full px-4 md:px-8 lg:px-12 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-background-50">
              Ready to Grow Your Business?
            </h2>
            <p className="mt-3 text-sm md:text-base text-background-300 max-w-xl mx-auto">
              Join hundreds of tradespeople across Guyana who are already winning jobs on BuildGuyana.gy.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="px-6 py-3 rounded-lg font-label text-sm font-semibold bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                Start Your Free Trial
              </Link>
              <Link
                to="/how-it-works"
                className="px-6 py-3 rounded-lg font-label text-sm font-medium border border-background-50/20 text-background-50 hover:border-background-50/40 transition-colors whitespace-nowrap"
              >
                How It Works
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}