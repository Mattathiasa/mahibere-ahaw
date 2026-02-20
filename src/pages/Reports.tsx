import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Calendar, MessageSquare, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/reports';
import { planService } from '@/services/plans';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { RecipientSelector } from '@/components/ui/recipient-selector';
import { toast } from 'sonner';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const Reports = () => {
  const permissions = useRolePermissions();
  const [expandedReports, setExpandedReports] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [commentContent, setCommentContent] = useState('');
  const [formData, setFormData] = useState({
    planId: '',
    option: 'Memriya' as 'Memriya' | 'Kifil' | 'Zerf',
    timeframe: 'Weekly' as 'Weekly' | 'Monthly' | 'Annually',
    workDone: '',
    result: '',
    attachments: [] as string[],
    recipients: [] as string[],
  });
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getAllReports(),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.getAllPlans(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => reportService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Report created successfully!');
      setShowCreateDialog(false);
      setFormData({
        planId: '',
        option: 'Memriya',
        timeframe: 'Weekly',
        workDone: '',
        result: '',
        attachments: [],
        recipients: [],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create report');
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ reportId, content }: { reportId: string; content: string }) =>
      reportService.addComment(reportId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Comment added successfully!');
      setShowCommentDialog(false);
      setCommentContent('');
      setSelectedReportId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    },
  });

  const toggleReport = (reportId: string) => {
    setExpandedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planId) {
      toast.error('Please select a plan');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleAddComment = (reportId: string) => {
    setSelectedReportId(reportId);
    setShowCommentDialog(true);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commentMutation.mutate({ reportId: selectedReportId, content: commentContent });
  };

  const reports = reportsData?.reports || [];
  const plans = plansData?.plans || [];

  const optionColors = {
    Memriya: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Kifil: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Zerf: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  const timeframeColors = {
    Weekly: 'bg-primary/10 text-primary',
    Monthly: 'bg-secondary/10 text-secondary',
    Annually: 'bg-accent/10 text-accent',
  };

  if (isLoadingReports) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Track progress and results of church activities</p>
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
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Track progress and results of church activities
          </p>
        </div>
        {permissions.canCreateReport && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Submit a progress report for a ministry plan
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planId">Select Plan *</Label>
                <Select
                  value={formData.planId}
                  onValueChange={(value) => setFormData({ ...formData, planId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.timeframe})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="option">Report Type *</Label>
                <Select
                  value={formData.option}
                  onValueChange={(value: 'Memriya' | 'Kifil' | 'Zerf') =>
                    setFormData({ ...formData, option: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Memriya">Memriya</SelectItem>
                    <SelectItem value="Kifil">Kifil</SelectItem>
                    <SelectItem value="Zerf">Zerf</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="workDone">Work Done *</Label>
                <Textarea
                  id="workDone"
                  value={formData.workDone}
                  onChange={(e) => setFormData({ ...formData, workDone: e.target.value })}
                  placeholder="Describe the work that was completed"
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="result">Result *</Label>
                <Textarea
                  id="result"
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  placeholder="Describe the outcomes and results"
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <p className="text-sm text-muted-foreground">Attach supporting documents for "to whom it may concern"</p>
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
                  placeholder="Select Memriyas to send this report to..."
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
                  {createMutation.isPending ? 'Creating...' : 'Create Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Share your feedback or thoughts on this report
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Comment *</Label>
              <Textarea
                id="comment"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Enter your comment"
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCommentDialog(false);
                  setCommentContent('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={commentMutation.isPending}>
                {commentMutation.isPending ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map((report: any) => {
            const isExpanded = expandedReports.includes(report.id);

            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <Collapsible open={isExpanded} onOpenChange={() => toggleReport(report.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl">{report.planName}</CardTitle>
                          <Badge className={optionColors[report.option as keyof typeof optionColors]}>
                            {report.option}
                          </Badge>
                          <Badge className={timeframeColors[report.timeframe as keyof typeof timeframeColors]} variant="secondary">
                            {report.timeframe}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(report.submittedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                          Work Done
                        </h3>
                        <p className="text-foreground leading-relaxed">{report.workDone}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                          Result
                        </h3>
                        <p className="text-foreground leading-relaxed">{report.result}</p>
                      </div>

                      {/* Attachments Section */}
                      {report.attachments && report.attachments.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm text-muted-foreground">
                              Attachments ({report.attachments.length})
                            </h3>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {report.attachments.length} document{report.attachments.length > 1 ? 's' : ''} attached
                          </div>
                        </div>
                      )}

                      {/* Comments Section */}
                      {report.comments && report.comments.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm text-muted-foreground">
                              Comments ({report.comments.length})
                            </h3>
                          </div>
                          <div className="space-y-4">
                            {report.comments.map((comment: any) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 border border-border">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {comment.authorName
                                      .split(' ')
                                      .map((n: string) => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(comment.createdAt), {
                                        addSuffix: true,
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddComment(report.id)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add Comment
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No reports found. Create your first report to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
