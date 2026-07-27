import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Phone, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface InviteUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUsersDialog({ open, onOpenChange }: InviteUsersDialogProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+251');
  const [role, setRole] = useState('ADMIN');
  const [isSending, setIsSending] = useState(false);

  const handleSendInvite = () => {
    if (!email.trim() && !phone.trim()) {
      toast.error('Please provide an email or phone number');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      toast.success(`Invitation sent successfully to ${email || phone}`);
      setIsSending(false);
      onOpenChange(false);
      setEmail('');
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-cyan-600" />
            Invite Users
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-500" /> Email Address
            </Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-500" /> Phone Number
            </Label>
            <Input
              placeholder="+251 9..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-500" /> Assigned Role
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">System Owner</SelectItem>
                <SelectItem value="ADMIN">System Admin</SelectItem>
                <SelectItem value="FINANCE">Finance Manager</SelectItem>
                <SelectItem value="HR">HR Manager</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSendInvite} disabled={isSending} className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
            {isSending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
