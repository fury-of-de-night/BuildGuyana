import type { Role } from '../register.types';

export default function RoleSelectionStep({
  role,
  onRoleChange,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground-700 mb-2 font-label">
        I am a...
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onRoleChange('project_owner')}
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
          onClick={() => onRoleChange('tradesperson')}
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
  );
}