import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
};

export function UpgradeDialog({ open, onOpenChange, feature = 'this feature' }: Props) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" /> Upgrade Required
          </DialogTitle>
          <DialogDescription>
            Upgrade to the Premium Plan to use {feature}. Only $5/month.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Later</Button>
          <Button onClick={() => { onOpenChange(false); navigate('/billing'); }} className="gap-2 neon-glow">
            <Crown className="h-4 w-4" /> Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
