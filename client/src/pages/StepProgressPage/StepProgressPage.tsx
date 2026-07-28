import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Package,
  ShoppingBag,
  ThumbsUp,
  Truck,
  type LucideIcon,
} from 'lucide-react';
interface Step {
  key: string;
  label: string;
  icon: LucideIcon;
}
interface StepProgressProps {
  steps: Step[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  activeColor?: string;
}
function StepProgress({
  steps,
  currentIndex,
  onStepClick,
  activeColor = 'bg-emerald-500',
}: StepProgressProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className="group z-10 flex cursor-pointer flex-col items-center"
              onClick={() => onStepClick?.(index)}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                  isCompleted
                    ? `${activeColor} text-white`
                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                } ${!isCompleted ? 'group-hover:ring-2 group-hover:ring-emerald-500/50' : ''}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`mt-2 text-center text-sm transition-colors ${
                  isCurrent
                    ? 'font-medium'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Progress bar */}
      <div className="absolute top-6 right-0 left-0 mx-6 h-1 -translate-y-1/2">
        <div className="h-full rounded-full bg-muted">
          <div
            className={`h-full ${activeColor} rounded-full transition-all duration-500`}
            style={{
              width: `${(currentIndex / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
// Demo: Delivery tracking steps
const deliverySteps: Step[] = [
  { key: 'processing', label: 'Processing', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: ThumbsUp },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
];
// Demo: Order process steps
const orderSteps: Step[] = [
  { key: 'cart', label: 'Cart', icon: ShoppingBag },
  { key: 'details', label: 'Details', icon: FileText },
  { key: 'payment', label: 'Payment', icon: CreditCard },
  { key: 'complete', label: 'Complete', icon: CheckCircle2 },
];
// Demo: Task progress steps
const taskSteps: Step[] = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: Package },
  { key: 'review', label: 'Review', icon: FileText },
  { key: 'done', label: 'Done', icon: CheckCircle2 },
];
export default function StepProgressDemo() {
  const [deliveryIndex, setDeliveryIndex] = useState(1);
  const [orderIndex, setOrderIndex] = useState(2);
  const [taskIndex, setTaskIndex] = useState(1);
  return (
    <div className="min-h-[400px] w-full space-y-12 p-6">
      {/* Delivery tracking example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Delivery Tracking</h3>
        <div className="rounded-lg border bg-card p-6">
          <StepProgress
            steps={deliverySteps}
            currentIndex={deliveryIndex}
            onStepClick={setDeliveryIndex}
            activeColor="bg-emerald-500"
          />
        </div>
      </div>
      {/* Order process example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Order Process</h3>
        <div className="rounded-lg border bg-card p-6">
          <StepProgress
            steps={orderSteps}
            currentIndex={orderIndex}
            onStepClick={setOrderIndex}
            activeColor="bg-blue-500"
          />
        </div>
      </div>
      {/* Task progress example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Task Progress</h3>
        <div className="rounded-lg border bg-card p-6">
          <StepProgress
            steps={taskSteps}
            currentIndex={taskIndex}
            onStepClick={setTaskIndex}
            activeColor="bg-violet-500"
          />
        </div>
      </div>
    </div>
  );
}
export { StepProgress };
export type { Step, StepProgressProps };
