import type { FileInput } from '../register.types';

interface Props {
  category: string;
  tradeLicenseNumber: string;
  tradeLicenseDoc: FileInput;
  regulatedTrades: string[];
  onNumberChange: (value: string) => void;
  onDocChange: (file: File | null) => void;
}

export default function TradeLicenseStep({
  category,
  tradeLicenseNumber,
  tradeLicenseDoc,
  regulatedTrades,
  onNumberChange,
  onDocChange,
}: Props) {
  if (!regulatedTrades.includes(category)) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDocChange(e.target.files?.[0] ?? null);
  };

  return (
    <div className="pt-3 border-t border-background-200/70">
      <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
        Trade License Verification <span className="text-accent-500">*</span>
      </label>
      <p className="text-xs text-foreground-500 mb-3">
        {category} is a regulated trade in Guyana. Please provide your trade license details for verification.
      </p>

      <div className="mb-3">
        <label htmlFor="tradeLicenseNumber" className="block text-xs font-medium text-foreground-700 mb-1.5 font-label">
          Trade License Number <span className="text-accent-500">*</span>
        </label>
        <input
          id="tradeLicenseNumber"
          type="text"
          value={tradeLicenseNumber}
          onChange={(e) => onNumberChange(e.target.value)}
          required
          className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
          placeholder="e.g. TL-2024-12345"
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-background-50 border border-background-200/70 rounded-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <i className="ri-file-shield-line text-foreground-500" />
          </div>
          <span className="text-xs text-foreground-700 font-label">
            Trade License Document <span className="text-accent-500">*</span>
          </span>
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
          <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
            tradeLicenseDoc
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
          }`}>
            {tradeLicenseDoc?.name
              ? tradeLicenseDoc.name.length > 15
                ? tradeLicenseDoc.name.slice(0, 15) + '...'
                : tradeLicenseDoc.name
              : 'Upload'}
          </span>
        </label>
      </div>
    </div>
  );
}