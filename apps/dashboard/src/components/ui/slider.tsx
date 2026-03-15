import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cn } from "../../lib/utils";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

function Slider({
  value,
  onValueChange,
  min = 0,
  max = 10,
  step = 1,
  disabled,
  className,
}: SliderProps) {
  function handleValueChange(newValue: number | number[]) {
    const v = Array.isArray(newValue) ? newValue[0] : newValue;
    onValueChange(v);
  }

  return (
    <BaseSlider.Root
      value={value}
      onValueChange={handleValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
    >
      <BaseSlider.Control className="relative flex w-full items-center h-5">
        <BaseSlider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <BaseSlider.Indicator className="absolute h-full bg-primary rounded-full" />
        </BaseSlider.Track>
        <BaseSlider.Thumb
          className={cn(
            "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}

export { Slider };
export type { SliderProps };
