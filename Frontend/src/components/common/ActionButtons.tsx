import React from 'react';
import { Eye, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: (enabled: boolean) => void;
  isEnabled?: boolean;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showToggle?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  onToggle,
  isEnabled = true,
  showView = false,
  showEdit = false,
  showDelete = false,
  showToggle = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      {showView && onView && (
        <button
          onClick={onView}
          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
          title="View"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
      
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      
      {showToggle && onToggle && (
        <button
          onClick={() => onToggle(!isEnabled)}
          className={`p-1.5 rounded-lg transition-colors ${
            isEnabled 
              ? 'text-green-400 hover:bg-green-500/10' 
              : 'text-gray-400 hover:bg-gray-500/10'
          }`}
          title={isEnabled ? 'Disable' : 'Enable'}
        >
          {isEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
      )}
      
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
