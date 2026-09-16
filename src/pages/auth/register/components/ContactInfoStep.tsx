import { REGIONS } from '@/mocks/locations';

interface Props {
  phone: string;
  region: string;
  location: string;
  onPhoneChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  regions?: { value: string; label: string }[];
}

export default function ContactInfoStep({
  phone,
  region,
  location,
  onPhoneChange,
  onRegionChange,
  onLocationChange,
}: Props) {
  return (
    <>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
          WhatsApp Number <span className="text-accent-500">*</span>
        </label>
        <p className="text-xs text-foreground-500 mb-1.5">
          Please provide the number linked to your WhatsApp account. This is how tradespeople will contact you.
        </p>
        <div className="flex">
          <span className="inline-flex items-center px-3 text-sm text-foreground-500 bg-background-100 border border-background-200/70 border-r-0 rounded-l-md">
            +592
          </span>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
            required
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-r-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
            placeholder="6123456"
          />
        </div>
      </div>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
          Region in Guyana
        </label>
        <select
          id="region"
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          required
          className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer"
        >
          <option value="">Select your region</option>
          {(regions || REGIONS).map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
          City / Town
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
          placeholder="e.g. Georgetown, New Amsterdam"
        />
      </div>
    </>
  );
}