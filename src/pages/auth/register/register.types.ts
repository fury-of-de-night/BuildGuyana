export type Role = 'project_owner' | 'tradesperson';
export type BusinessType = '' | 'sole_proprietor' | 'registered_company';
export type FileInput = File | null;

export interface DocumentUploadItem {
  key: string;
  label: string;
  state: FileInput;
  setState: (file: File | null) => void;
}

export interface RegisterFormData {
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  region: string;
  location: string;
  category: string;
  otherTradeDescription: string;
  secondaryTrades: string[];
  yearsExperience: string;
  businessType: BusinessType;
  companyName: string;
  tradeLicenseNumber: string;
}