// frontend/src/components/ui/EmptyState.jsx
import { Link } from 'react-router-dom';
export default function EmptyState({ icon = '💎', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="font-display text-xl font-semibold text-rose-800 mb-2">{title}</h3>
      {description && <p className="text-rose-400 text-sm mb-6 max-w-xs">{description}</p>}
      {action && <Link to={action.to} className="btn-primary">{action.label}</Link>}
    </div>
  );
}
