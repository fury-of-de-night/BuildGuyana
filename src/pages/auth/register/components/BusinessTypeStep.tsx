import type { BusinessType } from '../register.types';

interface Props {
  businessType: BusinessType;
  companyName: string;
  onBusinessTypeChange: (type: BusinessType) => void;
  onCompanyNameChange: (name: string) => void;
}

export default function BusinessTypeStep({
  businessType,
  companyName,
  onBusinessTypeChange,
  onCompanyNameChange,
}: Props) {
  return (
    <div className="pt-4 border-t border-background-200/70">
      <label className="block text-sm font-medium text-foreground-700 mb-2 font-label">
        Business Type
      </label>
      <div className="grid grid-cols-2 gap-3 mb-1">
        <button
          type="button"
          onClick={() => onBusinessTypeChange('sole_proprietor')}
          className={`p-4 border-2 rounded-md text-center transition-colors cursor-pointer ${
            businessType === 'sole_proprietor'
              ? 'border-primary-500 bg-primary-50'
              : 'border-background-200/70 hover:border-background-300'
          }`}
        >
          <div className="w-9 h-9 mx-auto mb-2 flex items-center justify-center">
            <i className="ri-user-line text-lg text-foreground-700" />
          </div>
          <span className="block text-sm font-medium text-foreground-800 whitespace-nowrap">Sole Proprietor</span>
          <span className="block text-xs text-foreground-500 mt-1">Independent tradesperson</span>
        </button>
        <button
          type="button"
          onClick={() => onBusinessTypeChange('registered_company')}
          className={`p-4 border-2 rounded-md text-center transition-colors cursor-pointer ${
            businessType === 'registered_company'
              ? 'border-primary-500 bg-primary-50'
              : 'border-background-200/70 hover:border-background-300'
          }`}
        >
          <div className="w-9 h-9 mx-auto mb-2 flex items-center justify-center">
            <i className="ri-building-line text-lg text-foreground-700" />
          </div>
          <span className="block text-sm font-medium text-foreground-800 whitespace-nowrap">Registered Company</span>
          <span className="block text-xs text-foreground-500 mt-1">Organization / business entity</span>
        </button>
      </div>
      {!businessType && (
        <p className="text-xs text-foreground-400 mt-2">
          Please select your business type to continue. This determines what documents are required.
        </p>
      )}

      {businessType === 'registered_company' && (
        <div className="pl-4 border-l-2 border-primary-200 space-y-3 mt-3">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
              Company / Organization Name <span className="text-accent-500">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
              placeholder="e.g. Singh Construction Services Ltd."
            />
          </div>
        </div>
      )}
    </div>
  );
}