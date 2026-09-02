export default function TrustSection() {
  const guarantees = [
    {
      icon: 'ri-price-tag-3-line',
      title: 'Upfront Pricing',
      description: 'Exact credit costs are always shown before you commit. You will never be surprised by a hidden fee — what you see is exactly what you pay.',
      accent: 'bg-primary-100',
      iconColor: 'text-primary-500',
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Fair Shortlisting',
      description: 'Shortlists are capped at 3 to 5 tradespersons per job so leads are never oversold. Every contractor gets a genuine opportunity — no mass-bidding chaos.',
      accent: 'bg-accent-100',
      iconColor: 'text-accent-500',
    },
    {
      icon: 'ri-refund-2-line',
      title: 'Lead Protection',
      description: 'Credits are fully refunded for fake, duplicated, or unreachable leads after documented checks. Your investment in leads is always protected.',
      accent: 'bg-secondary-100',
      iconColor: 'text-secondary-500',
    },
    {
      icon: 'ri-award-line',
      title: 'Transparent Placement',
      description: 'Paid directory placement is clearly labeled as Featured or Sponsored. You always know who earned their ranking and who paid for visibility.',
      accent: 'bg-primary-100',
      iconColor: 'text-primary-500',
    },
  ];

  return (
    <section className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground-900 leading-tight">
            Platform Trust &amp; Guarantees
          </h2>
          <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-2xl mx-auto">
            We built BuildGuyana.gy with fairness at its core. Every feature is designed to protect both project owners and tradespeople — because trust is the foundation of every great build.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {guarantees.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-background-200/70 rounded-lg p-6 text-center hover:border-background-300/60 transition-colors"
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full ${item.accent} flex items-center justify-center`}>
                <i className={`${item.icon} text-xl ${item.iconColor}`} />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground-900 mb-3">
                {item.title}
              </h3>
              <p className="text-sm text-foreground-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 md:mt-12 text-center">
          <p className="text-xs text-foreground-400 max-w-lg mx-auto leading-relaxed">
            These guarantees are core to our marketplace. If you ever encounter an issue with a lead, contact our support team with documentation and we will review your case within 48 hours.
          </p>
        </div>
      </div>
    </section>
  );
}