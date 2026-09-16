import { CATEGORY_NAMES } from '@/mocks/categories';

interface Props {
  secondaryTrades: string[];
  secondaryDropdownOpen: boolean;
  selectedCategory: string;
  maxSecondaryTrades: number;
  onToggleTrade: (trade: string) => void;
  onDropdownToggle: () => void;
}

export default function SecondaryTradesStep({
  secondaryTrades,
  secondaryDropdownOpen,
  selectedCategory,
  maxSecondaryTrades,
  onToggleTrade,
  onDropdownToggle,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
        Secondary Trades (Optional — up to {maxSecondaryTrades})
      </label>
      <p className="text-xs text-foreground-500 mb-2">
        Select additional skills you offer. This helps you appear in more search results.
      </p>

      {secondaryTrades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {secondaryTrades.map((trade) => (
            <span
              key={trade}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-label rounded-full border border-primary-200/70"
            >
              {trade}
              <button
                type="button"
                onClick={() => onToggleTrade(trade)}
                className="w-3.5 h-3.5 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-close-line text-xs" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={onDropdownToggle}
          className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 text-left focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer flex items-center justify-between"
        >
          <span className={secondaryTrades.length === 0 ? 'text-foreground-400' : 'text-foreground-900'}>
            {secondaryTrades.length === 0 ? 'Select additional trades...' : `${secondaryTrades.length} selected`}
          </span>
          <i className={`ri-arrow-down-s-line text-foreground-400 transition-transform ${secondaryDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {secondaryDropdownOpen && (
          <div className="fixed inset-0 z-0" onClick={onDropdownToggle} />
        )}
        {secondaryDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-background-200/70 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {CATEGORY_NAMES.filter((n) => n !== selectedCategory).map((tradeName) => {
              const isSelected = secondaryTrades.includes(tradeName);
              const isDisabled = !isSelected && secondaryTrades.length >= maxSecondaryTrades;
              return (
                <button
                  key={tradeName}
                  type="button"
                  onClick={() => !isDisabled && onToggleTrade(tradeName)}
                  disabled={isDisabled}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-primary-50 text-primary-700'
                      : isDisabled
                        ? 'text-foreground-300 cursor-not-allowed'
                        : 'text-foreground-700 hover:bg-background-50'
                  }`}
                >
                  <span>{tradeName}</span>
                  {isSelected && (
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-check-line text-primary-500 text-sm" />
                    </span>
                  )}
                  {isDisabled && (
                    <span className="text-xs text-foreground-400">max reached</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}