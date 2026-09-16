import type { DocumentUploadItem } from '../register.types';

interface Props {
  title: string;
  description: string;
  documents: DocumentUploadItem[];
}

export default function ComplianceDocsStep({ title, description, documents }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
        {title}
      </label>
      <p className="text-xs text-foreground-500 mb-3">
        {description}
      </p>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.key} className="flex items-center justify-between p-2.5 bg-background-50 border border-background-200/70 rounded-md">
            <span className="text-xs text-foreground-700 font-label">{doc.label}</span>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => doc.setState(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
                doc.state
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
              }`}>
                {doc.state ? (
                  <span className="flex items-center gap-1">
                    <i className="ri-check-line text-xs" />
                    {doc.state.name.length > 15 ? doc.state.name.slice(0, 15) + '...' : doc.state.name}
                  </span>
                ) : 'Upload'}
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}