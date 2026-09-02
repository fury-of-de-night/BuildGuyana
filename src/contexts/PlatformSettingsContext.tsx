import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface PlatformSettings {
  credit_to_gyd_rate: number;
  stat_tradespeople: number;
  stat_jobs: number;
  stat_rating: number;
  stat_regions: number;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  credit_to_gyd_rate: 500,
  stat_tradespeople: 500,
  stat_jobs: 2400,
  stat_rating: 4.8,
  stat_regions: 10,
};

interface PlatformSettingsContextValue {
  settings: PlatformSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  getCreditToGyd: (credits: number) => number;
  getGydToCredits: (gyd: number) => number;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextValue | undefined>(undefined);

export function PlatformSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value');

      if (error || !data) return;

      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value;
      });

      setSettings({
        credit_to_gyd_rate: parseInt(map.credit_to_gyd_rate, 10) || DEFAULT_SETTINGS.credit_to_gyd_rate,
        stat_tradespeople: parseInt(map.stat_tradespeople, 10) || DEFAULT_SETTINGS.stat_tradespeople,
        stat_jobs: parseInt(map.stat_jobs, 10) || DEFAULT_SETTINGS.stat_jobs,
        stat_rating: parseFloat(map.stat_rating) || DEFAULT_SETTINGS.stat_rating,
        stat_regions: parseInt(map.stat_regions, 10) || DEFAULT_SETTINGS.stat_regions,
      });
    } catch {
      // Use defaults silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getCreditToGyd = useCallback(
    (credits: number) => credits * settings.credit_to_gyd_rate,
    [settings.credit_to_gyd_rate],
  );

  const getGydToCredits = useCallback(
    (gyd: number) => Math.floor(gyd / settings.credit_to_gyd_rate),
    [settings.credit_to_gyd_rate],
  );

  return (
    <PlatformSettingsContext.Provider value={{ settings, loading, refresh: fetchSettings, getCreditToGyd, getGydToCredits }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const ctx = useContext(PlatformSettingsContext);
  if (!ctx) {
    throw new Error('usePlatformSettings must be used within PlatformSettingsProvider');
  }
  return ctx;
}