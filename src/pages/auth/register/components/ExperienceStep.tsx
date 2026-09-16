interface Props {
  yearsExperience: string;
  onYearsExperienceChange: (value: string) => void;
}

export default function ExperienceStep({ yearsExperience, onYearsExperienceChange }: Props) {
  return (
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
        onChange={(e) => onYearsExperienceChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
        placeholder="e.g. 5"
      />
    </div>
  );
}