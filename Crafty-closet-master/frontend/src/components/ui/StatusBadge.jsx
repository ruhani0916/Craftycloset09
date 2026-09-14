// frontend/src/components/ui/StatusBadge.jsx
import { statusClass, statusIcon } from '../../utils/helpers';
export default function StatusBadge({ status }) {
  return (
    <span className={statusClass(status)}>
      {statusIcon(status)} {status}
    </span>
  );
}
