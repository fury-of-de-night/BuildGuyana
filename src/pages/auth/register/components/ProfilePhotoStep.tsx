import { useCallback } from 'react';

interface Props {
  preview: string;
  onFileChange: (file: File | null) => void;
  previewUrl?: string;
}

export default function ProfilePhotoStep({ preview, onFileChange, previewUrl }: Props) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      onFileChange(file);
    },
    [onFileChange]
  );

  return (
    <div>
      <label htmlFor="profile-photo" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
        Profile Photo (Optional)
      </label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-background-100 border-2 border-background-200/70 flex-shrink-0">
          {preview || previewUrl ? (
            <img
              src={preview || previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <i className="ri-user-line text-xl text-foreground-400" />
            </div>
          )}
        </div>
        <div>
          <input
            id="profile-photo"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="w-full text-sm text-foreground-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary-100 file:text-secondary-900 hover:file:bg-secondary-200 file:cursor-pointer cursor-pointer"
          />
          <p className="text-xs text-foreground-400 mt-1">
            You can also add or change your photo later in your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}
