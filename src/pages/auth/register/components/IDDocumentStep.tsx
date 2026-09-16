import type { FileInput } from '../register.types';

interface Props {
  docIdFront: FileInput;
  docIdBack: FileInput;
  docPassport: FileInput;
  onDocIdFrontChange: (file: File | null) => void;
  onDocIdBackChange: (file: File | null) => void;
  onDocPassportChange: (file: File | null) => void;
}

function FileUploadRow({
  icon,
  label,
  file,
  onChange,
  required,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  file: FileInput;
  onChange: (file: File | null) => void;
  required?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files?.[0] ?? null);
  };

  const displayName = file?.name && file.name.length > 15
    ? file.name.slice(0, 15) + '...'
    : file?.name;

  return (
    <div className="flex items-center justify-between p-3 bg-background-50 border border-background-200/70 rounded-md">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs text-foreground-700 font-label">
          {label}
          {required && <span className="text-accent-500"> *</span>}
        </span>
      </div>
      <label className="cursor-pointer">
        <input type="file" accept="image/*,.pdf" onChange={handleChange} className="hidden" />
        <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
          file
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
        }`}>
          {file ? (
            <span className="flex items-center gap-1">
              <i className="ri-check-line text-xs" />
              {displayName}
            </span>
          ) : 'Upload'}
        </span>
      </label>
    </div>
  );
}

export default function IDDocumentStep({
  docIdFront,
  docIdBack,
  docPassport,
  onDocIdFrontChange,
  onDocIdBackChange,
  onDocPassportChange,
}: Props) {
  return (
    <div className="pt-3 border-t border-background-200/70">
      <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
        ID Verification (Required)
      </label>
      <p className="text-xs text-foreground-500 mb-3">
        Upload both the front and back of your National ID card, or your Passport, for identity verification.
      </p>

      <div className="space-y-3">
        <FileUploadRow
          icon={<i className="ri-id-card-line text-foreground-500" />}
          label="National ID (Front)"
          file={docIdFront}
          onChange={onDocIdFrontChange}
          required
        />
        <FileUploadRow
          icon={<i className="ri-id-card-line text-foreground-500" style={{ transform: 'rotate(180deg)' }} />}
          label="National ID (Back)"
          file={docIdBack}
          onChange={onDocIdBackChange}
          required
        />
        <FileUploadRow
          icon={<i className="ri-passport-line text-foreground-500" />}
          label="Passport (Optional)"
          file={docPassport}
          onChange={onDocPassportChange}
        />
      </div>
    </div>
  );
}