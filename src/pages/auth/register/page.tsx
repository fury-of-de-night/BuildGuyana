import { useState, useRef, useEffect } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { uploadDocumentForVerification } from '@/services/verificationApi';

import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { REGIONS } from '@/mocks/locations';
import { CATEGORY_NAMES } from '@/mocks/categories';

type BusinessType = '' | 'sole_proprietor' | 'registered_company';

const REGULATED_TRADES = ['Electrical Work', 'Plumbing'];

export default function RegisterPage() {
  const { user, profile, activeRole, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'project_owner' | 'tradesperson'>(
    searchParams.get('role') === 'tradesperson' ? 'tradesperson' : 'project_owner'
  );
  const [region, setRegion] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [otherTradeDescription, setOtherTradeDescription] = useState('');
  const [secondaryTrades, setSecondaryTrades] = useState<string[]>([]);
  const [secondaryDropdownOpen, setSecondaryDropdownOpen] = useState(false);
  const [yearsExperience, setYearsExperience] = useState('');
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [docBusinessReg, setDocBusinessReg] = useState<File | null>(null);
  const [docGra, setDocGra] = useState<File | null>(null);
  const [docNis, setDocNis] = useState<File | null>(null);
  const [docProfile, setDocProfile] = useState<File | null>(null);
  const [docIdFront, setDocIdFront] = useState<File | null>(null);
  const [docIdBack, setDocIdBack] = useState<File | null>(null);
  const [docPassport, setDocPassport] = useState<File | null>(null);
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('');
  const [tradeLicenseDoc, setTradeLicenseDoc] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Policy modal state (Privacy Notice + Cookie Policy forced on register)
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyVersion, setPolicyVersion] = useState(1);
  const [policyTexts, setPolicyTexts] = useState<{ privacy: string; cookie: string }>({ privacy: '', cookie: '' });
  const [policyActive, setPolicyActive] = useState<{ privacy: boolean; cookie: boolean }>({ privacy: false, cookie: false });
  const [policyAccepting, setPolicyAccepting] = useState(false);

  // Business type: Sole Proprietor vs Registered Company
  const [businessType, setBusinessType] = useState<BusinessType>('');
  const [companyName, setCompanyName] = useState('');
  const [docBusinessRegForCompany, setDocBusinessRegForCompany] = useState<File | null>(null);
  const [directorIdFiles, setDirectorIdFiles] = useState<File[]>([null as unknown as File, null as unknown as File, null as unknown as File]);

  // Pre-fill form for already logged-in users adding a second role
  useEffect(() => {
    if (user && profile) {
      setFullName(profile.full_name || '');
      setEmail(user.email || '');
      if (profile.phone) setPhone(profile.phone);
      if (profile.region) setRegion(profile.region);
      if (profile.location) setLocation(profile.location || '');
      if (profile.avatar_url) setProfilePhotoPreview(profile.avatar_url);
      setStep(2);
    }
  }, [user, profile]);

  // Fetch policy settings and force the Policy modal when the admin has enabled
  // the switches and the user hasn't accepted the current version yet.
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', ['show_privacy_on_login', 'show_cookie_on_login', 'privacy_policy_text', 'cookie_policy_text', 'policy_version']);

        if (!data || data.length === 0) return;

        const settingsMap: Record<string, string> = {};
        data.forEach((row: { key: string; value: string }) => { settingsMap[row.key] = row.value; });

        const privacyOn = settingsMap.show_privacy_on_login === 'true';
        const cookieOn = settingsMap.show_cookie_on_login === 'true';
        if (!privacyOn && !cookieOn) return;

        const pv = parseInt(settingsMap.policy_version, 10) || 1;
        setPolicyVersion(pv);
        setPolicyTexts({ privacy: settingsMap.privacy_policy_text || '', cookie: settingsMap.cookie_policy_text || '' });
        setPolicyActive({ privacy: privacyOn, cookie: cookieOn });

        const stored = localStorage.getItem('accepted_policy_version');
        const storedVersion = stored ? parseInt(stored, 10) : 0;

        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;

        if (sessionUser?.id) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('accepted_policy_version')
            .eq('id', sessionUser.id)
            .maybeSingle();
          const accepted = profData?.accepted_policy_version || 0;
          if (pv > accepted) setShowPolicyModal(true);
        } else if (storedVersion < pv) {
          setShowPolicyModal(true);
        }
      } catch {
        // silently fail
      }
    };
    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && profile && activeRole === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationFile(file);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleSecondaryTrade = (tradeName: string) => {
    setSecondaryTrades((prev) => {
      if (prev.includes(tradeName)) return prev.filter((t) => t !== tradeName);
      const maxTrades = businessType === 'registered_company' ? 50 : 3;
      if (prev.length >= maxTrades) return prev;
      return [...prev, tradeName];
    });
  };

  const handleDirectorFileChange = (index: number, file: File | null) => {
    setDirectorIdFiles((prev) => {
      const next = [...prev] as File[];
      next[index] = file as unknown as File;
      if (file === null) {
        // Remove null entries beyond the last real file
        return next.filter((f, i) => f !== null || i <= index);
      }
      return next;
    });
  };

  const handleBusinessTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    // Reset fields when switching types
    if (type === 'sole_proprietor') {
      setCompanyName('');
      setDocBusinessRegForCompany(null);
      setDirectorIdFiles([null as unknown as File, null as unknown as File, null as unknown as File]);
    } else if (type === 'registered_company') {
      setDocIdFront(null);
      setDocIdBack(null);
      setDocPassport(null);
    }
    // Adjust secondary trades if over the new limit
    if (type === 'sole_proprietor' && secondaryTrades.length > 3) {
      setSecondaryTrades(secondaryTrades.slice(0, 3));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        console.log('[Register] Dual-role flow for existing user:', currentUser.id);

        const updates: any = {};
        if (role === 'tradesperson') updates.is_tradesperson = true;
        updates.is_project_owner = true;

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUser.id);
        if (profileError) throw profileError;

        if (profilePhotoFile) {
          try {
            const result = await uploadToCloudinary(profilePhotoFile);
            await supabase.from('profiles').update({ avatar_url: result.secure_url }).eq('id', currentUser.id);
          } catch (uploadErr) {
            console.error('[Register] Profile photo upload failed:', uploadErr);
          }
        }

        if (role === 'tradesperson') {
          const tradeCategory = category || 'Other Trade';
          const contractorUpsert: Record<string, any> = {
            profile_id: currentUser.id,
            category: tradeCategory,
            region: region || 'Demerara-Mahaica',
            years_experience: yearsExperience ? parseInt(yearsExperience) : null,
            secondary_trades: secondaryTrades.length > 0 ? secondaryTrades : null,
            id_verification_status: 'pending',
            business_type: businessType || null,
          };

          if (businessType === 'registered_company' && companyName.trim()) {
            contractorUpsert.business_name = companyName.trim();
            contractorUpsert.is_business = true;
          }

          const { error: contractorError } = await supabase
            .from('contractors')
            .upsert(contractorUpsert, { onConflict: 'profile_id' });
          if (contractorError) throw contractorError;

          // Upload docs for new contractor profile
          const docUpdates: Record<string, string> = {};
          const uploadDoc = async (label: string, file: File | null, field: string) => {
            if (!file) return;
            try {
              const result = await uploadToCloudinary(file);
              docUpdates[field] = result.secure_url;
            } catch (uploadErr) {
              console.error(`[Register] ${label} upload failed:`, uploadErr);
            }
          };
          await uploadDoc('Business Reg', docBusinessReg, 'doc_business_reg');
          await uploadDoc('GRA', docGra, 'doc_gra');
          await uploadDoc('NIS', docNis, 'doc_nis');
          await uploadDoc('Company Profile', docProfile, 'doc_profile');

          if (Object.keys(docUpdates).length > 0) {
            await supabase.from('contractors').update(docUpdates).eq('profile_id', currentUser.id);
          }

          // Upload ID docs
          if (docIdFront) {
            try {
              const result = await uploadToCloudinary(docIdFront);
              await supabase.from('contractors').update({ doc_id_front: result.secure_url, id_verification_status: 'pending' }).eq('profile_id', currentUser.id);
            } catch (uploadErr) { console.error('[Register] ID Front upload failed:', uploadErr); }
          }
          if (docIdBack) {
            try {
              const result = await uploadToCloudinary(docIdBack);
              await supabase.from('contractors').update({ doc_id_back: result.secure_url, id_verification_status: 'pending' }).eq('profile_id', currentUser.id);
            } catch (uploadErr) { console.error('[Register] ID Back upload failed:', uploadErr); }
          }
          if (docPassport) {
            try {
              const result = await uploadToCloudinary(docPassport);
              await supabase.from('contractors').update({ doc_passport: result.secure_url, id_verification_status: 'pending' }).eq('profile_id', currentUser.id);
            } catch (uploadErr) { console.error('[Register] Passport upload failed:', uploadErr); }
          }

          // Company-specific uploads: Business Registration + Director IDs
          if (businessType === 'registered_company') {
            if (docBusinessRegForCompany) {
              try {
                const result = await uploadToCloudinary(docBusinessRegForCompany);
                await supabase.from('contractors').update({ doc_business_reg: result.secure_url }).eq('profile_id', currentUser.id);
                // Insert verification record
                await supabase.from('verifications').insert({
                  user_id: currentUser.id,
                  filename: `biz-reg-${Date.now()}`,
                  original_filename: docBusinessRegForCompany.name,
                  document_type: 'Business Registration',
                  document_url: result.secure_url,
                  status: 'PENDING',
                  confidence: 0,
                  source: 'manual_upload',
                });

                // Also notify Python verification backend
                uploadDocumentForVerification({
                  file: docBusinessRegForCompany,
                  userId: currentUser.id,
                  documentType: 'Business Registration',
                  documentUrl: result.secure_url,
                }).catch((apiErr) => console.error('[Register] Verification API call failed:', apiErr));
              } catch (uploadErr) { console.error('[Register] Company Biz Reg upload failed:', uploadErr); }
            }

            const directorUrls: string[] = [];
            const validDirectorFiles = (directorIdFiles as unknown as (File | null)[]).filter((f): f is File => f !== null);
            for (let i = 0; i < validDirectorFiles.length; i++) {
              try {
                const result = await uploadToCloudinary(validDirectorFiles[i]);
                directorUrls.push(result.secure_url);
              } catch (uploadErr) { console.error(`[Register] Director ${i + 1} ID upload failed:`, uploadErr); }
            }
            if (directorUrls.length > 0) {
              await supabase.from('contractors').update({ director_ids: directorUrls }).eq('profile_id', currentUser.id);
            }
          }

          // Sole proprietor ID docs trigger verification
          if (businessType === 'sole_proprietor' && docIdFront) {
            try {
              const result = await uploadToCloudinary(docIdFront);
              await supabase.from('verifications').insert({
                user_id: currentUser.id,
                filename: `id-front-${Date.now()}`,
                original_filename: docIdFront.name,
                document_type: 'National ID (Front)',
                document_url: result.secure_url,
                status: 'PENDING',
                confidence: 0,
                source: 'manual_upload',
              });

              // Also notify Python verification backend
              uploadDocumentForVerification({
                file: docIdFront,
                userId: currentUser.id,
                documentType: 'National ID (Front)',
                documentUrl: result.secure_url,
              }).catch((apiErr) => console.error('[Register] Verification API call failed:', apiErr));
            } catch (uploadErr) { console.error('[Register] Verification insert failed:', uploadErr); }
          }
        }

        // Trade license verification for regulated trades
        if (role === 'tradesperson' && REGULATED_TRADES.includes(category) && tradeLicenseNumber.trim()) {
          const tradeUpdates: Record<string, any> = {
            trade_license_number: tradeLicenseNumber.trim(),
            trade_license_status: 'pending',
          };
          if (tradeLicenseDoc) {
            try {
              const tradeDocResult = await uploadToCloudinary(tradeLicenseDoc);
              tradeUpdates.trade_license_doc_url = tradeDocResult.secure_url;
            } catch (uploadErr) {
              console.error('[Register] Trade license upload failed:', uploadErr);
            }
          }
          await supabase.from('contractors').update(tradeUpdates).eq('profile_id', currentUser.id);
        }

        await refreshProfile();
        setSuccessMessage('Role added successfully! Redirecting...');
        setTimeout(() => {
          navigate(role === 'tradesperson' ? '/dashboard/tradesperson' : '/dashboard/project-owner');
        }, 1000);
        setSubmitting(false);
        return;
      }

      // --- NEW USER FLOW ---
      console.log('[Register] Starting signup for:', email.trim());

      const signUpResult = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            region: region || 'Demerara-Mahaica',
            phone: phone.trim(),
            location: location.trim(),
            category: category || '',
            years_experience: yearsExperience || '0',
            secondary_trades: secondaryTrades,
            is_project_owner: true,
            is_tradesperson: role === 'tradesperson',
          },
        },
      });

      if (signUpResult?.error) {
        console.error('[Register] Signup error:', signUpResult.error);
        const isAlreadyRegistered =
          signUpResult.error.message?.toLowerCase().includes('already') ||
          signUpResult.error.message?.toLowerCase().includes('registered') ||
          signUpResult.error.message?.toLowerCase().includes('exists') ||
          signUpResult.error.status === 422;

        if (isAlreadyRegistered) {
          setError('An account with this email already exists. Please sign in instead, or use a different email address.');
        } else {
          setError(signUpResult.error.message);
        }
        setSubmitting(false);
        return;
      }

      const userId = signUpResult?.data?.user?.id;
      if (!userId) {
        console.error('[Register] No userId returned from signup');
        setError('Failed to create account. Please try again.');
        setSubmitting(false);
        return;
      }

      console.log('[Register] Signup successful for userId:', userId);

      if (profilePhotoFile) {
        try {
          const result = await uploadToCloudinary(profilePhotoFile);
          await supabase.from('profiles').update({ avatar_url: result.secure_url }).eq('id', userId);
        } catch (uploadErr) {
          console.error('[Register] Profile photo upload failed:', uploadErr);
        }
      }

      if (role === 'tradesperson') {
        const { data: contractorData, error: contractorFetchErr } = await supabase
          .from('contractors')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle();

        if (contractorFetchErr) {
          console.error('[Register] Failed to fetch contractor record:', contractorFetchErr);
          setError('Account created but failed to link documents. Please upload them from your profile page.');
          setRegisteredEmail(email.trim());
          setShowSuccessModal(true);
          setSubmitting(false);
          return;
        }

        if (!contractorData) {
          console.error('[Register] No contractor record found for profile_id:', userId);
          setError('Account created but contractor profile was not generated. Please contact support.');
          setRegisteredEmail(email.trim());
          setShowSuccessModal(true);
          setSubmitting(false);
          return;
        }

        const contractorId = contractorData.id;
        console.log('[Register] Found contractor_id:', contractorId);

        const baseUpdates: Record<string, any> = {
          business_type: businessType || null,
        };
        if (businessType === 'registered_company' && companyName.trim()) {
          baseUpdates.business_name = companyName.trim();
          baseUpdates.is_business = true;
        }
        if (secondaryTrades.length > 0) {
          baseUpdates.secondary_trades = secondaryTrades;
        }

        await supabase.from('contractors').update(baseUpdates).eq('id', contractorId);

        const updates: Record<string, string> = {};
        const uploadDoc = async (label: string, file: File | null, field: string) => {
          if (!file) return;
          try {
            const result = await uploadToCloudinary(file);
            updates[field] = result.secure_url;
          } catch (uploadErr) {
            console.error(`[Register] ${label} upload failed:`, uploadErr);
          }
        };

        await uploadDoc('Business Reg', docBusinessReg, 'doc_business_reg');
        await uploadDoc('GRA', docGra, 'doc_gra');
        await uploadDoc('NIS', docNis, 'doc_nis');
        await uploadDoc('Company Profile', docProfile, 'doc_profile');

        if (verificationFile) {
          try {
            const result = await uploadToCloudinary(verificationFile);
            updates.verification_doc_url = result.secure_url;
          } catch (uploadErr) {
            console.error('[Register] Verification doc upload failed:', uploadErr);
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from('contractors').update(updates).eq('id', contractorId);
        }

        // ID docs
        if (docIdFront) {
          try {
            const result = await uploadToCloudinary(docIdFront);
            await supabase.from('contractors').update({ doc_id_front: result.secure_url, id_verification_status: 'pending' }).eq('id', contractorId);
          } catch (uploadErr) { console.error('[Register] ID Front upload failed:', uploadErr); }
        }
        if (docIdBack) {
          try {
            const result = await uploadToCloudinary(docIdBack);
            await supabase.from('contractors').update({ doc_id_back: result.secure_url, id_verification_status: 'pending' }).eq('id', contractorId);
          } catch (uploadErr) { console.error('[Register] ID Back upload failed:', uploadErr); }
        }
        if (docPassport) {
          try {
            const result = await uploadToCloudinary(docPassport);
            await supabase.from('contractors').update({ doc_passport: result.secure_url, id_verification_status: 'pending' }).eq('id', contractorId);
          } catch (uploadErr) { console.error('[Register] Passport upload failed:', uploadErr); }
        }

        // Company docs
        if (businessType === 'registered_company') {
          if (docBusinessRegForCompany) {
            try {
              const result = await uploadToCloudinary(docBusinessRegForCompany);
              await supabase.from('contractors').update({ doc_business_reg: result.secure_url }).eq('id', contractorId);
              await supabase.from('verifications').insert({
                user_id: userId,
                filename: `biz-reg-${Date.now()}`,
                original_filename: docBusinessRegForCompany.name,
                document_type: 'Business Registration',
                document_url: result.secure_url,
                status: 'PENDING',
                confidence: 0,
                source: 'manual_upload',
              });

              // Also notify Python verification backend
              uploadDocumentForVerification({
                file: docBusinessRegForCompany,
                userId,
                documentType: 'Business Registration',
                documentUrl: result.secure_url,
              }).catch((apiErr) => console.error('[Register] Verification API call failed:', apiErr));
            } catch (uploadErr) { console.error('[Register] Company Biz Reg upload failed:', uploadErr); }
          }

          const directorUrls: string[] = [];
          const validDirectorFiles = (directorIdFiles as unknown as (File | null)[]).filter((f): f is File => f !== null);
          for (let i = 0; i < validDirectorFiles.length; i++) {
            try {
              const result = await uploadToCloudinary(validDirectorFiles[i]);
              directorUrls.push(result.secure_url);
            } catch (uploadErr) { console.error(`[Register] Director ${i + 1} ID upload failed:`, uploadErr); }
          }
          if (directorUrls.length > 0) {
            await supabase.from('contractors').update({ director_ids: directorUrls }).eq('id', contractorId);
          }
        }

        // Sole proprietor ID docs trigger verification insert
        if (businessType === 'sole_proprietor' && docIdFront) {
          try {
            const existingUrl = updates.doc_id_front || '';
            if (existingUrl) {
              await supabase.from('verifications').insert({
                user_id: userId,
                filename: `id-front-${Date.now()}`,
                original_filename: docIdFront.name,
                document_type: 'National ID (Front)',
                document_url: existingUrl,
                status: 'PENDING',
                confidence: 0,
                source: 'manual_upload',
              });

              // Also notify Python verification backend
              uploadDocumentForVerification({
                file: docIdFront,
                userId,
                documentType: 'National ID (Front)',
                documentUrl: existingUrl,
              }).catch((apiErr) => console.error('[Register] Verification API call failed:', apiErr));
            }
          } catch (uploadErr) { console.error('[Register] Verification insert failed:', uploadErr); }
        }

        // Trade license verification for regulated trades
        if (REGULATED_TRADES.includes(category) && tradeLicenseNumber.trim()) {
          const tradeUpdates: Record<string, any> = {
            trade_license_number: tradeLicenseNumber.trim(),
            trade_license_status: 'pending',
          };
          if (tradeLicenseDoc) {
            try {
              const tradeDocResult = await uploadToCloudinary(tradeLicenseDoc);
              tradeUpdates.trade_license_doc_url = tradeDocResult.secure_url;
            } catch (uploadErr) {
              console.error('[Register] Trade license upload failed:', uploadErr);
            }
          }
          await supabase.from('contractors').update(tradeUpdates).eq('id', contractorId);
        }
      }

      setRegisteredEmail(email.trim());
      setShowSuccessModal(true);
    } catch (err: unknown) {
      console.error('[Register] Unexpected error:', err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setResentMessage('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      });
      if (resendError) {
        setResentMessage(resendError.message);
      } else {
        setResentMessage('Confirmation email resent! Check your inbox.');
      }
    } catch {
      setResentMessage('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard/tradesperson`,
        },
      });
      if (error) {
        setError(error.message);
      }
    } catch {
      setError('Failed to connect with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAcceptPolicy = async () => {
    setPolicyAccepting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;
      if (sessionUser?.id) {
        await supabase
          .from('profiles')
          .update({ accepted_policy_version: policyVersion })
          .eq('id', sessionUser.id);
      }
      localStorage.setItem('accepted_policy_version', String(policyVersion));
      setShowPolicyModal(false);
    } catch {
      localStorage.setItem('accepted_policy_version', String(policyVersion));
      setShowPolicyModal(false);
    } finally {
      setPolicyAccepting(false);
    }
  };

  if (showSuccessModal) {
    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-28 pb-12">
          <div className="w-full max-w-md">
            <div className="bg-white border border-background-200/70 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-100 flex items-center justify-center">
                <i className="ri-mail-send-line text-2xl text-primary-600" />
              </div>
              <h2 className="font-heading text-xl text-foreground-900 mb-2">Check Your Email</h2>
              <p className="text-sm text-foreground-600 mb-1">
                We sent a confirmation email to
              </p>
              <p className="text-sm font-medium text-foreground-900 mb-4 break-all">
                {registeredEmail}
              </p>
              <p className="text-sm text-foreground-500 mb-6">
                Click the link in the email to verify your account, then sign in to get started.
              </p>

              {role === 'tradesperson' && (
                <div className="mb-6 p-4 bg-background-100 rounded-md text-left">
                  <p className="text-sm font-medium text-foreground-800 mb-1">
                    <i className="ri-information-line mr-1.5 text-foreground-500" />
                    About Verification
                  </p>
                  <p className="text-xs text-foreground-600">
                    After confirming your email, our team will review your documents. You can browse jobs right away, but your <strong>Verified</strong> badge will show as pending until approved — usually within a few days.
                  </p>
                </div>
              )}

              {resentMessage && (
                <div className={`mb-5 p-3 rounded-md text-sm ${
                  resentMessage.includes('resent') || resentMessage.includes('Confirmation email')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-accent-100/80 border border-accent-300/60 text-accent-900'
                }`}>
                  {resentMessage}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="w-full py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {resending ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
                <Link
                  to="/login"
                  className="block w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer text-center"
                >
                  Go to Sign In
                </Link>
              </div>

              <p className="mt-5 text-xs text-foreground-400">
                Didn&apos;t receive the email? Check your spam folder or try a different email address.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const maxSecondaryTrades = businessType === 'registered_company' ? 50 : 3;

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-28 pb-12">
        <div className="w-full max-w-lg">
          <div className="bg-white border border-background-200/70 rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
                Join BuildGuyana.gy
              </h1>
              <p className="text-foreground-600 text-sm">
                Create your account and get started — it&apos;s free
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-accent-100/80 border border-accent-300/60 rounded-md">
                <p className="text-accent-900 text-sm">{error}</p>
                {(error.includes('sign in') || error.includes('Sign in') || error.includes('already exists')) && (
                  <Link
                    to="/login"
                    className="inline-block mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    Go to Login →
                  </Link>
                )}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm font-medium">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-2 font-label">
                      I am a...
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('project_owner')}
                        className={`p-4 border-2 rounded-md text-center transition-colors cursor-pointer ${
                          role === 'project_owner'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-background-200/70 hover:border-background-300'
                        }`}
                      >
                        <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                          <i className="ri-home-4-line text-xl text-foreground-700" />
                        </div>
                        <span className="block text-sm font-medium text-foreground-800 whitespace-nowrap">Project Owner</span>
                        <span className="block text-xs text-foreground-500 mt-1">Post jobs, find tradespeople</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('tradesperson')}
                        className={`p-4 border-2 rounded-md text-center transition-colors cursor-pointer ${
                          role === 'tradesperson'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-background-200/70 hover:border-background-300'
                        }`}
                      >
                        <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                          <i className="ri-tools-line text-xl text-foreground-700" />
                        </div>
                        <span className="block text-sm font-medium text-foreground-800 whitespace-nowrap">Tradesperson</span>
                        <span className="block text-xs text-foreground-500 mt-1">Get leads, grow your business</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Profile Photo */}
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                      Profile Photo (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-background-100 border-2 border-background-200/70 flex-shrink-0">
                        {profilePhotoPreview ? (
                          <img src={profilePhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="ri-user-line text-xl text-foreground-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoChange}
                          className="w-full text-sm text-foreground-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary-100 file:text-secondary-900 hover:file:bg-secondary-200 file:cursor-pointer cursor-pointer"
                        />
                        <p className="text-xs text-foreground-400 mt-1">
                          You can also add or change your photo later in your profile settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                      placeholder="Min. 6 characters"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!fullName || !email || !password || password.length < 6}
                    className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                  >
                    Continue
                  </button>
                </>
              )}

              {step === 2 && (
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
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
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
                      onChange={(e) => setRegion(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer"
                    >
                      <option value="">Select your region</option>
                      {REGIONS.map((r) => (
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
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                      placeholder="e.g. Georgetown, New Amsterdam"
                    />
                  </div>

                  {role === 'tradesperson' && (
                    <>
                      {/* === BUSINESS TYPE SELECTOR === */}
                      <div className="pt-4 border-t border-background-200/70">
                        <label className="block text-sm font-medium text-foreground-700 mb-2 font-label">
                          Business Type
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-1">
                          <button
                            type="button"
                            onClick={() => handleBusinessTypeChange('sole_proprietor')}
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
                            onClick={() => handleBusinessTypeChange('registered_company')}
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
                      </div>

                      {/* === COMPANY NAME (Registered Company only) === */}
                      {businessType === 'registered_company' && (
                        <div className="pl-4 border-l-2 border-primary-200 space-y-3">
                          <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                              Company / Organization Name <span className="text-accent-500">*</span>
                            </label>
                            <input
                              id="companyName"
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              required
                              className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                              placeholder="e.g. Singh Construction Services Ltd."
                            />
                          </div>
                        </div>
                      )}

                      {/* === PRIMARY TRADE === */}
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                          Primary Trade Category
                        </label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => { setCategory(e.target.value); setOtherTradeDescription(''); }}
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
                            onChange={(e) => setOtherTradeDescription(e.target.value)}
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

                      {/* === SECONDARY TRADES === */}
                      <div>
                        <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                          Secondary Trades (Optional — up to {maxSecondaryTrades})
                        </label>
                        <p className="text-xs text-foreground-500 mb-2">
                          {businessType === 'registered_company'
                            ? 'As a registered company, you can select up to 50 trade categories.'
                            : 'Select additional skills you offer. This helps you appear in more search results.'}
                        </p>

                        {secondaryTrades.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {secondaryTrades.map((trade) => (
                              <span key={trade} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-label rounded-full border border-primary-200/70">
                                {trade}
                                <button
                                  type="button"
                                  onClick={() => toggleSecondaryTrade(trade)}
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
                            onClick={() => setSecondaryDropdownOpen(!secondaryDropdownOpen)}
                            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 text-left focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span className={secondaryTrades.length === 0 ? 'text-foreground-400' : 'text-foreground-900'}>
                              {secondaryTrades.length === 0 ? 'Select additional trades...' : `${secondaryTrades.length} selected`}
                            </span>
                            <i className={`ri-arrow-down-s-line text-foreground-400 transition-transform ${secondaryDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {secondaryDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-background-200/70 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {CATEGORY_NAMES.filter((n) => n !== category).map((tradeName) => {
                                const isSelected = secondaryTrades.includes(tradeName);
                                const isDisabled = !isSelected && secondaryTrades.length >= maxSecondaryTrades;
                                return (
                                  <button
                                    key={tradeName}
                                    type="button"
                                    onClick={() => toggleSecondaryTrade(tradeName)}
                                    disabled={isDisabled}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors cursor-pointer ${
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
                          {secondaryDropdownOpen && (
                            <div className="fixed inset-0 z-0" onClick={() => setSecondaryDropdownOpen(false)} />
                          )}
                        </div>
                      </div>

                      {/* === YEARS OF EXPERIENCE === */}
                      <div>
                        <label htmlFor="yearsExperience" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                          Years of Experience
                        </label>
                        <input
                          id="yearsExperience"
                          type="number"
                          min="0"
                          max="60"
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                          placeholder="e.g. 5"
                        />
                      </div>

                      {/* === TRADE LICENSE VERIFICATION (regulated trades) === */}
                      {role === 'tradesperson' && REGULATED_TRADES.includes(category) && (
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
                              onChange={(e) => setTradeLicenseNumber(e.target.value)}
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
                              <span className="text-xs text-foreground-700 font-label">Trade License Document <span className="text-accent-500">*</span></span>
                            </div>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setTradeLicenseDoc(file);
                                }}
                                className="hidden"
                              />
                              <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
                                tradeLicenseDoc
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
                              }`}>
                                {tradeLicenseDoc ? (
                                  <span className="flex items-center gap-1">
                                    <i className="ri-check-line text-xs" />
                                    {tradeLicenseDoc.name.length > 15 ? tradeLicenseDoc.name.slice(0, 15) + '...' : tradeLicenseDoc.name}
                                  </span>
                                ) : 'Upload'}
                              </span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* === SOLE PROPRIETOR: ID DOCUMENTS === */}
                      {businessType === 'sole_proprietor' && (
                        <>
                          <div className="pt-3 border-t border-background-200/70">
                            <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                              ID Verification (Required)
                            </label>
                            <p className="text-xs text-foreground-500 mb-3">
                              Upload both the front and back of your National ID card, or your Passport, for identity verification.
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-background-50 border border-background-200/70 rounded-md">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 flex items-center justify-center">
                                    <i className="ri-id-card-line text-foreground-500" />
                                  </div>
                                  <span className="text-xs text-foreground-700 font-label">National ID (Front) <span className="text-accent-500">*</span></span>
                                </div>
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) setDocIdFront(file);
                                    }}
                                    className="hidden"
                                  />
                                  <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
                                    docIdFront
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
                                  }`}>
                                    {docIdFront ? (
                                      <span className="flex items-center gap-1">
                                        <i className="ri-check-line text-xs" />
                                        {docIdFront.name.length > 15 ? docIdFront.name.slice(0, 15) + '...' : docIdFront.name}
                                      </span>
                                    ) : 'Upload'}
                                  </span>
                                </label>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-background-50 border border-background-200/70 rounded-md">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 flex items-center justify-center">
                                    <i className="ri-id-card-line text-foreground-500" style={{ transform: 'rotate(180deg)' }} />
                                  </div>
                                  <span className="text-xs text-foreground-700 font-label">National ID (Back) <span className="text-accent-500">*</span></span>
                                </div>
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) setDocIdBack(file);
                                    }}
                                    className="hidden"
                                  />
                                  <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
                                    docIdBack
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
                                  }`}>
                                    {docIdBack ? (
                                      <span className="flex items-center gap-1">
                                        <i className="ri-check-line text-xs" />
                                        {docIdBack.name.length > 15 ? docIdBack.name.slice(0, 15) + '...' : docIdBack.name}
                                      </span>
                                    ) : 'Upload'}
                                  </span>
                                </label>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-background-50 border border-background-200/70 rounded-md">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 flex items-center justify-center">
                                    <i className="ri-passport-line text-foreground-500" />
                                  </div>
                                  <span className="text-xs text-foreground-700 font-label">Passport (Optional)</span>
                                </div>
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) setDocPassport(file);
                                    }}
                                    className="hidden"
                                  />
                                  <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
                                    docPassport
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
                                  }`}>
                                    {docPassport ? (
                                      <span className="flex items-center gap-1">
                                        <i className="ri-check-line text-xs" />
                                        {docPassport.name.length > 15 ? docPassport.name.slice(0, 15) + '...' : docPassport.name}
                                      </span>
                                    ) : 'Upload'}
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Sole Proprietor — optional business docs */}
                          <div>
                            <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                              Business Documents (Recommended)
                            </label>
                            <p className="text-xs text-foreground-500 mb-3">
                              Upload your official documents to speed up verification. These are reviewed by our admin team.
                            </p>
                            <div className="space-y-3">
                              {[
                                { label: 'Business Registration', state: docBusinessReg, setState: setDocBusinessReg, key: 'bus-reg' },
                                { label: 'GRA Compliance', state: docGra, setState: setDocGra, key: 'gra' },
                                { label: 'NIS Compliance', state: docNis, setState: setDocNis, key: 'nis' },
                                { label: 'Company Profile', state: docProfile, setState: setDocProfile, key: 'profile' },
                              ].map((doc) => (
                                <div key={doc.key} className="flex items-center justify-between p-2.5 bg-background-50 border border-background-200/70 rounded-md">
                                  <span className="text-xs text-foreground-700 font-label">{doc.label}</span>
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) doc.setState(file);
                                      }}
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
                        </>
                      )}

                      {/* === REGISTERED COMPANY: BUSINESS REG + DIRECTORS === */}
                      {businessType === 'registered_company' && (
                        <>
                          {/* Business Registration Document (Required) */}
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
                                  {docBusinessRegForCompany ? docBusinessRegForCompany.name : 'Upload your registration document'}
                                </span>
                              </div>
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setDocBusinessRegForCompany(file);
                                  }}
                                  className="hidden"
                                />
                                <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
                                  docBusinessRegForCompany
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
                                }`}>
                                  {docBusinessRegForCompany ? (
                                    <span className="flex items-center gap-1">
                                      <i className="ri-check-line text-xs" />
                                      Change
                                    </span>
                                  ) : 'Upload'}
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Directors/Owners IDs */}
                          <div>
                            <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                              Directors / Owners IDs (Optional — up to 3)
                            </label>
                            <p className="text-xs text-foreground-500 mb-3">
                              Upload identification documents for directors or owners of the company. Each director&apos;s ID helps speed up verification.
                            </p>
                            <div className="space-y-3">
                              {[0, 1, 2].map((index) => {
                                const directorFile = (directorIdFiles as unknown as (File | null)[])[index] || null;
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
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null;
                                          handleDirectorFileChange(index, file);
                                        }}
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

                          {/* Company — optional compliance docs */}
                          <div>
                            <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                              Compliance Documents (Recommended)
                            </label>
                            <p className="text-xs text-foreground-500 mb-3">
                              Upload additional compliance documents to support your company verification.
                            </p>
                            <div className="space-y-3">
                              {[
                                { label: 'GRA Compliance', state: docGra, setState: setDocGra, key: 'gra-co' },
                                { label: 'NIS Compliance', state: docNis, setState: setDocNis, key: 'nis-co' },
                                { label: 'Company Profile', state: docProfile, setState: setDocProfile, key: 'profile-co' },
                              ].map((doc) => (
                                <div key={doc.key} className="flex items-center justify-between p-2.5 bg-background-50 border border-background-200/70 rounded-md">
                                  <span className="text-xs text-foreground-700 font-label">{doc.label}</span>
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) doc.setState(file);
                                      }}
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
                        </>
                      )}

                      {/* No business type selected — show placeholder */}
                      {!businessType && (
                        <div className="p-4 bg-background-50 border border-background-200/70 rounded-md text-center">
                          <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                            <i className="ri-information-line text-foreground-400 text-xl" />
                          </div>
                          <p className="text-xs text-foreground-500">
                            Select your Business Type above to see the required documents.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <p className="text-xs text-foreground-400 text-center">
                    By signing up, you agree to our{' '}
                    <span className="text-primary-600 font-medium">Terms and Conditions</span>.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !phone || !region || (role === 'tradesperson' && (!category || !businessType)) || (role === 'tradesperson' && REGULATED_TRADES.includes(category) && (!tradeLicenseNumber.trim() || !tradeLicenseDoc))}
                      className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                    >
                      {submitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                </>
              )}
            </form>

            <p className="text-center text-sm text-foreground-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                Sign in here
              </Link>
            </p>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-background-200/70" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-foreground-400 font-label">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-background-50 text-foreground-700 text-sm font-label font-medium rounded-md border border-background-200/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
            >
              {googleLoading ? (
                'Connecting...'
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
        </div>
      </main>
      <Footer />

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white border border-background-200/70 rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-background-200/70">
              <h2 className="font-heading text-lg text-foreground-900">Updated Policies</h2>
              <p className="text-xs text-foreground-500 mt-0.5">Please review and accept to continue.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {policyActive.privacy && policyTexts.privacy && (
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-2">Privacy Notice</h3>
                  <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-background-50 p-3 rounded-md border border-background-200/70">
                    {policyTexts.privacy}
                  </div>
                </div>
              )}
              {policyActive.cookie && policyTexts.cookie && (
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-2">Cookie Policy</h3>
                  <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-background-50 p-3 rounded-md border border-background-200/70">
                    {policyTexts.cookie}
                  </div>
                </div>
              )}
              {!policyTexts.privacy && !policyTexts.cookie && (
                <p className="text-sm text-foreground-500 text-center py-4">No policy content is currently available. Click Agree to continue.</p>
              )}
            </div>
            <div className="p-4 border-t border-background-200/70 flex justify-end">
              <button
                onClick={handleAcceptPolicy}
                disabled={policyAccepting}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {policyAccepting ? 'Accepting...' : 'Agree'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}