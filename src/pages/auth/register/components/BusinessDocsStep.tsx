import type { FileInput } from '../register.types';

interface Props {
  docBusinessReg: FileInput;
  directorIdFiles: File[];
  onDocBusinessRegChange: (file: File | null) => void;
  onDirectorFileChange: (index: number, file: File | null) => void;
}

export default function BusinessDocsStep({
  docBusinessReg,
  directorIdFiles,
  onDocBusinessRegChange,
  onDirectorFileChange,
}: Props) {
  return (
    <>
      <div className="pt-3 border-t border-background-200/70">
        <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
          Business Registration Document <span className="text-accent-500">*</span>
        </label>
        <p className="text-xs text-foreground-500 mb-3">
          Upload your official business registration certificate. This is required for company verification.
        </p>
        <div className="flex items-center justify-between p-3 bg-background-50 border-2 border-dashed border-background-200/70 rounded-md hover:border-primary-400/60 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <i className="ri-file-text-line text-foreground-500" />
            </div>
            <span className="text-xs text-foreground-700 font-label">
              {docBusinessReg ? docBusinessReg.name : 'Upload your registration document'}
            </span>
          </div>
          <label className="cursor-pointer">
            <input
              aria-label="Business Registration Document"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => onDocBusinessRegChange(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
              docBusinessReg
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
            }`}>
              {docBusinessReg ? (
                <span className="flex items-center gap-1">
                  <i className="ri-check-line text-xs" />
                  Change
                </span>
              ) : 'Upload'}
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
          Directors / Owners IDs (Optional — up to 3)
        </label>
        <p className="text-xs text-foreground-500 mb-3">
          Upload identification documents for directors or owners of the company. Each director&apos;s ID helps speed up verification.
        </p>
        <div className="space-y-3">
          {[0, 1, 2].map((index) => {
            const directorFile = directorIdFiles[index] || null;
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-background-50 border border-background-200/70 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-user-star-line text-foreground-500" />
                  </div>
                  <span className="text-xs text-foreground-700 font-label">
                    Director {index + 1} ID {index === 0 ? '' : '(Optional)'}
                  </span>
                </div>
                <label className="cursor-pointer">
                  <input
                    aria-label={`Director ${index + 1} ID`}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => onDirectorFileChange(index, e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
                    directorFile
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
                  }`}>
                    {directorFile ? (
                      <span className="flex items-center gap-1">
                        <i className="ri-check-line text-xs" />
                        {directorFile.name.length > 15 ? directorFile.name.slice(0, 15) + '...' : directorFile.name}
                      </span>
                    ) : 'Upload'}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
