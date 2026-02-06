import { ShiftTemplate } from '@/hooks/useShiftTemplates';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, ChevronDown, Clock, MapPin, Plus } from 'lucide-react';

interface TemplateSelectorProps {
  templates: ShiftTemplate[];
  onSelect: (template: ShiftTemplate) => void;
  onCreateNew: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TemplateSelector = ({
  templates,
  onSelect,
  onCreateNew,
}: TemplateSelectorProps) => {
  if (templates.length === 0) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onCreateNew}>
        <FileText className="w-4 h-4" />
        Save as Template
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="w-4 h-4" />
          Templates
          <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {templates.map(template => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelect(template)}
            className="flex flex-col items-start gap-1 py-2"
          >
            <span className="font-medium">{template.name}</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {template.start_time} - {template.end_time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {template.location}
              </span>
            </div>
            {template.days_of_week && template.days_of_week.length > 0 && (
              <div className="flex gap-1 mt-1">
                {template.days_of_week.map(day => (
                  <span 
                    key={day}
                    className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                  >
                    {DAYS[day]}
                  </span>
                ))}
              </div>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
