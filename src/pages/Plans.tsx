import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, Search, Trash2, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planService } from '@/services/plans';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { RecipientSelector } from '@/components/ui/recipient-selector';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const Plans = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    timeframe: 'Weekly' as 'Weekly' | 'Monthly' | 'Annually', 
    details: '',
    attachments: [] as string[],
    recipients: [] as string[]
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.getAllPlans(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; timeframe: 'Weekly' | 'Monthly' | 'Annually'; details: string; attachments?: string[] }) => 
      planService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan created successfully!');
      setShowCreateDialog(false);
      setFormData({ name: '', timeframe: 'Weekly', details: '', attachments: [], recipients: [] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create plan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => planService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    },
  });

  const frequencyColors = {
    Weekly: 'bg-primary/10 text-primary',
    Monthly: 'bg-secondary/10 text-secondary',
    Annually: 'bg-accent/10 text-accent',
  };

  const plans = plansData?.plans || [];
  const filteredPlans = plans.filter(
    (plan: any) =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plans</h1>
          <p className="text-muted-foreground mt-1">Church activities and ministry plans</p>
        </div>
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plans</h1>
          <p className="text-muted-foreground mt-1">
            Church activities and ministry plans
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
              <DialogDescription>
                Create a ministry plan with specific timeframe and details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter plan name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeframe">Time Period *</Label>
                <Select
                  value={formData.timeframe}
                  onValueChange={(value: 'Weekly' | 'Monthly' | 'Annually') => 
                    setFormData({ ...formData, timeframe: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Details *</Label>
                <Textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Enter plan details and objectives"
                  rows={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <p className="text-sm text-muted-foreground">Attach supporting documents for this plan</p>
                <FileUpload
                  value={formData.attachments}
                  onChange={(files) => setFormData({ ...formData, attachments: files })}
                  maxFiles={5}
                  maxSize={10}
                />
              </div>
              <div className="space-y-2">
                <RecipientSelector
                  label="Send to (Optional)"
                  placeholder="Select Memriyas to send this plan to..."
                  hierarchyLevel="Memriya"
                  value={formData.recipients}
                  onChange={(recipients) => setFormData({ ...formData, recipients })}
                  maxRecipients={5}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search plans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan: any) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <Badge className={frequencyColors[plan.timeframe as keyof typeof frequencyColors]} variant="secondary">
                    {plan.timeframe}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{plan.createdBy?.fullName || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{plan.details}</p>
                {plan.attachments && plan.attachments.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                    <span>{plan.attachments.length} attachment{plan.attachments.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => toast.info('View details feature coming soon')}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(plan.id, plan.name)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No plans found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default Plans;
