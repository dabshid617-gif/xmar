import { Button } from "@/components/ui/button";

type Mode = 'qty' | 'price' | 'disc';

interface NumpadProps {
  mode: Mode;
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  onDelete: () => void;
  onModeChange: (m: Mode) => void;
}

const keys = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '.', '⌫'],
];

export const Numpad = ({ mode, value, onChange, onApply, onDelete, onModeChange }: NumpadProps) => {
  const press = (k: string) => {
    if (k === '⌫') return onDelete();
    if (k === '.' && value.includes('.')) return;
    onChange(value === '0' ? k : value + k);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((k) => (
          <Button key={k} variant="outline" className="h-12 text-lg" onClick={() => press(k)}>
            {k}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Button variant={mode==='qty' ? 'default' : 'outline'} onClick={() => onModeChange('qty')}>Qty</Button>
        <Button variant={mode==='price' ? 'default' : 'outline'} onClick={() => onModeChange('price')}>Price</Button>
        <Button variant={mode==='disc' ? 'default' : 'outline'} onClick={() => onModeChange('disc')}>Disc %</Button>
        <Button onClick={onApply}>Apply</Button>
      </div>
      <div className="text-sm text-muted-foreground">
        Mode: <span className="font-medium">{mode.toUpperCase()}</span>
      </div>
    </div>
  );
};

export default Numpad;

