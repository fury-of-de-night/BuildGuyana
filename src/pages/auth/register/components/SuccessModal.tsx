import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

interface Props {
  email: string;
  role: 'project_owner' | 'tradesperson';
  resending: boolean;
  resentMessage: string;
  onResendEmail: () => void;
}

export default function SuccessModal({
  email,
  role,
  resending,
  resentMessage,
  onResendEmail,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-28 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-background-200/70 rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-100 flex items-center justify-center">
              <i className="ri-mail-send-line text-2xl text-primary-600" />
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">Check Your Email</h2>
            <p className="text-sm text-foreground-600 mb-1">
              We sent a confirmation email to
            </p>
            <p className="text-sm font-medium text-foreground-900 mb-4 break-all">
              {email}
            </p>
            <p className="text-sm text-foreground-500 mb-6">
              Click the link in the email to verify your account, then sign in to get started.
            </p>

            {role === 'tradesperson' && (
              <div className="mb-6 p-4 bg-background-100 rounded-md text-left">
                <p className="text-sm font-medium text-foreground-800 mb-1">
                  <i className="ri-information-line mr-1.5 text-foreground-500" />
                  About Verification
                </p>
                <p className="text-xs text-foreground-600">
                  After confirming your email, our team will review your documents. You can browse jobs right away, but your <strong>Verified</strong> badge will show as pending until approved — usually within a few days.
                </p>
              </div>
            )}

            {resentMessage && (
              <div className={`mb-5 p-3 rounded-md text-sm ${
                resentMessage.includes('resent') || resentMessage.includes('Confirmation email')
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-accent-100/80 border border-accent-300/60 text-accent-900'
              }`}>
                {resentMessage}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={onResendEmail}
                disabled={resending}
                className="w-full py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {resending ? 'Sending...' : 'Resend Confirmation Email'}
              </button>
              <Link
                to="/login"
                className="block w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer text-center"
              >
                Go to Sign In
              </Link>
            </div>

            <p className="mt-5 text-xs text-foreground-400">
              Didn&apos;t receive the email? Check your spam folder or try a different email address.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}