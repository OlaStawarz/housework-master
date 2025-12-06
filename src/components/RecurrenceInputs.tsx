import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecurrenceUnit } from "@/types";

interface RecurrenceInputsProps {
  value: number | string;
  unit: RecurrenceUnit;
  onValueChange: (value: number | string) => void;
  onUnitChange: (unit: RecurrenceUnit) => void;
  valueError?: string | null;
  disabled?: boolean;
}

export function RecurrenceInputs({
  value,
  unit,
  onValueChange,
  onUnitChange,
  valueError,
  disabled = false,
}: RecurrenceInputsProps) {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Pozwól na puste pole
    if (inputValue === '') {
      onValueChange('');
      return;
    }
    
    // Sprawdź czy wartość jest liczbą
    const num = parseInt(inputValue, 10);
    if (!isNaN(num)) {
      onValueChange(num);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recurrence-value">Częstotliwość</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="recurrence-value"
              type="number"
              min="1"
              value={value}
              onChange={handleValueChange}
              disabled={disabled}
              aria-invalid={!!valueError}
              aria-describedby={valueError ? "recurrence-value-error" : undefined}
            />
            {valueError && (
              <p id="recurrence-value-error" className="text-sm text-destructive mt-1">
                {valueError}
              </p>
            )}
          </div>

          <Select value={unit} onValueChange={(value: RecurrenceUnit) => onUnitChange(value)} disabled={disabled}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">dni</SelectItem>
              <SelectItem value="months">miesiące</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
