import { CATEGORY_NAMES } from '@/mocks/categories';

interface Props {
  category: string;
  otherTradeDescription: string;
  onCategoryChange: (value: string) => void;
  onOtherTradeDescriptionChange: (value: string) => void;
}

export default function TradeCategoryStep({
  category,
  otherTradeDescription,
  onCategoryChange,
  onOtherTradeDescriptionChange,
}: Props) {
  return (
    <>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
          Primary Trade Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => {
            onCategoryChange(e.target.value);
            onOtherTradeDescriptionChange('');
          }}
          required
          className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer"
        >
          <option value="">Select your trade</option>
          {CATEGORY_NAMES.filter((n) => n !== 'Other Trade').map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="Other Trade">Other Trade</option>
        </select>
      </div>

      {category === 'Other Trade' && (
        <div>
          <label htmlFor="otherTradeDesc" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Describe Your Trade <span className="text-accent-500">*</span>
          </label>
          <textarea
            id="otherTradeDesc"
            value={otherTradeDescription}
            onChange={(e) => onOtherTradeDescriptionChange(e.target.value)}
            required
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
            placeholder="Please describe your trade in detail. This will be reviewed by our admin team during verification. (e.g. Solar panel installation, pest control, floor polishing...)"
          />
          <p className="text-xs text-foreground-400 mt-1">
            Trade descriptions will be reviewed by the admin team before your profile is verified.
          </p>
        </div>
      )}
    </>
  );
}