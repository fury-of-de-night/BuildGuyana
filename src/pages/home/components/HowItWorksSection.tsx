import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoModeContext';

const ownerSteps = [
  {
    icon: 'ri-file-list-3-line',
    title: 'Post Your Job',
    description: 'Describe your project with our guided form. Set your budget, add photos, and choose your location in Guyana. Takes under 2 minutes, and it is completely free.',
  },
  {
    icon: 'ri-user-voice-line',
    title: 'Review Contractor Requests',
    description: 'Interested tradespeople request to quote — at no cost to them. Review their profiles, ratings, years of experience, and why they want your project.',
  },
  {
    icon: 'ri-user-star-line',
    title: 'Invite the Best to Quote',
    description: 'Select 3-5 top candidates and invite them to submit detailed quotes with pricing and timelines. Only approved contractors can submit quotes.',
  },
  {
    icon: 'ri-check-double-line',
    title: 'Hire With Confidence',
    description: 'Compare submitted quotes side by side. Accept the best one, get the contractor\'s contact info, and start your project. Leave a review when it\'s done.',
  },
];

const contractorSteps = [
  {
    icon: 'ri-search-line',
    title: 'Browse Jobs',
    description: 'Find construction projects in your trade and region across all 10 Administrative Regions of Guyana. Filter by category, budget, and location.',
  },
  {
    icon: 'ri-chat-smile-2-line',
    title: 'Request to Quote',
    description: 'Express interest in jobs that match your skills — completely free, no commitment. Tell the owner why you\'re the right fit for their project.',
  },
  {
    icon: 'ri-file-text-line',
    title: 'Submit Your Quote',
    description: 'If the project owner selects you, submit your detailed quote with pricing, timeline, and portfolio. A small credit fee applies only at this stage.',
  },
  {
    icon: 'ri-award-line',
    title: 'Win the Job',
    description: 'When the owner accepts your quote, you\'ll get their direct contact info. Connect, discuss details, and get to work. Build your reputation with reviews.',
  },
];

export default function HowItWorksSection() {
  const navigate = useNavigate();
  const { startDemo } = useDemo();
  const [activeView, setActiveView] = useState<'owner' | 'contractor'>('owner');

  const steps = activeView === 'owner' ? ownerSteps : contractorSteps;
  const accentColor = activeView === 'owner' ? 'primary' : 'accent';

  return (
    <section className="py-14 md:py-20 bg-background-100">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground-900 leading-tight">
            How It Works
          </h2>
          <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-xl mx-auto">
            Post a job, review contractor requests, and hire the best — a professional bidding platform for Guyanese construction
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-background-200/50 rounded-full p-1">
            <button
              onClick={() => setActiveView('owner')}
              className={`px-5 py-2.5 rounded-full text-sm font-label font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'owner'
                  ? 'bg-white text-foreground-900 shadow-sm'
                  : 'text-foreground-600 hover:text-foreground-800'
              }`}
            >
              <i className="ri-home-line mr-1.5" />
              For Project Owners
            </button>
            <button
              onClick={() => setActiveView('contractor')}
              className={`px-5 py-2.5 rounded-full text-sm font-label font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'contractor'
                  ? 'bg-white text-foreground-900 shadow-sm'
                  : 'text-foreground-600 hover:text-foreground-800'
              }`}
            >
              <i className="ri-tools-line mr-1.5" />
              For Tradespeople
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image Side */}
          <div className="relative">
            <div className={`absolute -top-3 -left-3 text-background-50 font-label text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-wider ${
              activeView === 'owner' ? 'bg-primary-500' : 'bg-accent-500'
            }`}>
              {activeView === 'owner' ? 'For Project Owners' : 'For Tradespeople'}
            </div>
            <div className="rounded-xl overflow-hidden">
              {activeView === 'owner' ? (
                <img
                  src="https://readdy.ai/api/search-image?query=Happy%20Caribbean%20homeowner%20shaking%20hands%20with%20smiling%20builder%20contractor%20in%20front%20of%20newly%20renovated%20home%2C%20warm%20natural%20lighting%2C%20tropical%20setting%20with%20palm%20trees%2C%20professional%20yet%20friendly%20atmosphere%2C%20editorial%20photography%20with%20warm%20earthy%20tones%20and%20soft%20shadows&width=700&height=800&seq=hiw-owner-01&orientation=portrait"
                  alt="Project Owner and tradesperson shaking hands"
                  className="w-full h-[400px] md:h-[500px] object-cover"
                />
              ) : (
                <img
                  src="https://readdy.ai/api/search-image?query=Professional%20Guyanese%20tradesperson%20reviewing%20construction%20plans%20on%20tablet%20at%20a%20modern%20Caribbean%20building%20site%2C%20warm%20golden%20hour%20sun%2C%20hard%20hat%20and%20tools%20visible%2C%20palms%20in%20background%2C%20professional%20documentary%20photography%20with%20rich%20warm%20earthy%20orange%20tones%20and%20competent%20atmosphere&width=700&height=800&seq=hiw-contractor-01&orientation=portrait"
                  alt="Tradesperson reviewing job on tablet"
                  className="w-full h-[400px] md:h-[500px] object-cover"
                />
              )}
            </div>

            {/* Value prop badge */}
            <div className="mt-6 bg-white border border-background-200/70 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  activeView === 'owner' ? 'bg-primary-100' : 'bg-accent-100'
                }`}>
                  <i className={`${activeView === 'owner' ? 'ri-shield-check-line text-primary-600' : 'ri-lightbulb-line text-accent-600'} text-sm`} />
                </div>
                <div>
                  <p className="text-sm text-foreground-900 font-label font-medium mb-0.5">
                    {activeView === 'owner'
                      ? 'Review contractor profiles before they quote. Hire with confidence.'
                      : 'No wasted time. Only submit detailed quotes when you\'re selected.'
                    }
                  </p>
                  <p className="text-xs text-foreground-500">
                    Professional bidding process. Transparent. Fair. Verified.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Steps Side */}
          <div>
            <p className="text-sm text-foreground-500 font-label uppercase tracking-wider mb-2">
              {activeView === 'owner' ? 'The 4-Step Process' : 'The 4-Step Process'}
            </p>
            <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-6">
              {activeView === 'owner' ? 'Find and hire the best tradespeople in Guyana' : 'Get hired for construction projects across Guyana'}
            </h3>

            <div className="space-y-5 md:space-y-7">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                      activeView === 'owner' ? 'bg-primary-500' : 'bg-accent-500'
                    }`}>
                      <span className="font-label font-bold text-sm md:text-base text-background-50">{index + 1}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-px h-6 md:h-8 bg-background-300/60 mx-auto mt-2" />
                    )}
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <i className={`${step.icon} ${activeView === 'owner' ? 'text-primary-500' : 'text-accent-500'} text-sm`} />
                      </div>
                      <h3 className="font-heading text-base md:text-lg font-semibold text-foreground-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-foreground-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { startDemo(); navigate('/dashboard/project-owner'); }}
                className={`font-label font-semibold text-sm px-6 py-3 rounded-md transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2 cursor-pointer ${
                  activeView === 'owner'
                    ? 'bg-primary-500 text-background-50 hover:bg-primary-600'
                    : 'bg-accent-500 text-background-50 hover:bg-accent-600'
                }`}
              >
                <i className="ri-play-circle-line" />
                Try Demo (No Sign-up)
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className="font-label font-semibold text-sm px-6 py-3 border border-background-300/60 text-foreground-700 rounded-md hover:bg-background-200/50 transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                Learn More
                <i className="ri-arrow-right-line" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}