import { useNavigate } from 'react-router-dom';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[400px] md:min-h-[500px] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=Guyana%20nationwide%20construction%20scene%20with%20diverse%20workers%20building%20modern%20concrete%20house%2C%20warm%20golden%20hour%20sunset%20lighting%2C%20tropical%20setting%2C%20dramatic%20sky%20with%20orange%20clouds%2C%20inspiring%20atmosphere%20of%20national%20progress%20and%20development%2C%20editorial%20photography%20with%20warm%20earthy%20color%20palette&width=1600&height=700&seq=cta-bg-nationwide&orientation=landscape"
          alt="Construction across Guyana"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground-950/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 py-14 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-heading text-2xl md:text-4xl lg:text-5xl font-bold text-background-50 leading-tight">
            Ready to Start Your Project?
          </h2>
          <p className="mt-4 text-sm md:text-base lg:text-lg text-background-200 leading-relaxed">
            Join hundreds of project owners across Guyana who trust BuildGuyana.gy to find reliable tradespeople. Post your first construction job in under 2 minutes — it&apos;s free, nationwide.
          </p>
          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4">
            <button
              onClick={() => navigate('/post-job')}
              className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-primary-500 text-background-50 rounded-md hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="ri-add-circle-line" />
              Post a Job — It&apos;s Free
            </button>
            <button
              onClick={() => navigate('/register')}
              className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-background-50 text-foreground-900 rounded-md hover:bg-background-100 transition-colors whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="ri-user-add-line" />
              Join as a Tradesperson
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}