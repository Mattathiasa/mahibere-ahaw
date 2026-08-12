import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { LearnMore } from '@/components/LearnMore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Globe, Send, FileText, MapPin, Users, Droplets, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { missionaryService } from '@/services/missionary';

import { useFormatters } from '@/lib/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
const Missionary = () => {
    const { user } = useAuth();
    const { t: tree } = useLanguage();
    const p = tree.pages;
    const { formatDate } = useFormatters();
    const queryClient = useQueryClient();
    const rolePerms = useRolePermissions();
    const moduleCfg = useModuleConfig('missionary');
    const [activeTab, setActiveTab] = useState('application');
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        desiredLocation: '',
        missionaryType: 'FullTime',
        description: '',
    });

    const [reportFormData, setReportFormData] = useState({
        title: '',
        location: '',
        content: '',
        peopleReached: 0,
        baptized: 0,
    });

    // Fetch Applications
    const { data: applications, isLoading: isLoadingApps } = useQuery({
        queryKey: ['missionary-applications', user?.id],
        queryFn: () => missionaryService.getAllApplications(user?.id),
        enabled: !!user?.id,
    });

    // Fetch Reports
    const { data: reports, isLoading: isLoadingReports } = useQuery({
        queryKey: ['missionary-reports'],
        queryFn: () => missionaryService.getAllReports(),
    });

    // Create Application Mutation
    const createApplicationMutation = useMutation({
        mutationFn: (data: any) => missionaryService.createApplication({
            ...data,
            userId: user?.id!,
            fullName: user?.fullName || 'Anonymous',
            phoneNumber: user?.phone || 'N/A',
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['missionary-applications'] });
            toast.success(p.applicationSubmitted);
            setFormData({ desiredLocation: '', missionaryType: 'FullTime', description: '' });
        },
        onError: () => {
            toast.error(p.applicationFailed);
        },
    });

    // Create Report Mutation
    const createReportMutation = useMutation({
        mutationFn: (data: any) => missionaryService.createReport({
            title: data.title,
            location: data.location,
            content: data.content,
            stats: {
                peopleReached: parseInt(data.peopleReached.toString()) || 0,
                baptized: parseInt(data.baptized.toString()) || 0,
            },
            missionaryId: user?.id!,
            date: new Date().toISOString(),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['missionary-reports'] });
            toast.success(p.fieldReportSubmitted);
            setIsReportDialogOpen(false);
            setReportFormData({ title: '', location: '', content: '', peopleReached: 0, baptized: 0 });
        },
        onError: () => {
            toast.error(p.fieldReportFailed);
        },
    });

    const handleSubmitApplication = (e: React.FormEvent) => {
        e.preventDefault();
        createApplicationMutation.mutate(formData);
    };

    const handleSubmitReport = (e: React.FormEvent) => {
        e.preventDefault();
        createReportMutation.mutate(reportFormData);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">{moduleCfg.headerTitle || 'Missionary Service'}</h1>
                <p className="text-muted-foreground mt-1">{moduleCfg.headerDescription || 'Apply for missionary service and manage reports'}</p>
                <LearnMore title={moduleCfg.headerTitle || 'Missionary Service'} content={moduleCfg.learnMore} />
            </div>

            <Tabs defaultValue="application" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="application">{p.applicationForm}</TabsTrigger>
                    <TabsTrigger value="my-applications">{p.myApplications}</TabsTrigger>
                    <TabsTrigger value="reports">{p.fieldReports}</TabsTrigger>
                </TabsList>

                <TabsContent value="application">
                    <Card>
                        <CardHeader>
                            <CardTitle>{p.missionaryApplicationForm}</CardTitle>
                            <CardDescription>{p.missionaryFormDesc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitApplication} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">{p.missionaryType}</Label>
                                        <Select
                                            value={formData.missionaryType}
                                            onValueChange={(value) => setFormData({ ...formData, missionaryType: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(moduleCfg.options.missionaryTypes ?? ['FullTime', 'PartTime', 'ShortTerm']).map((v) => (
                                                    <SelectItem key={v} value={v}>{v.replace(/([a-z])([A-Z])/g, '$1 $2')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">{p.desiredLocation}</Label>
                                        <Input
                                            id="location"
                                            placeholder={p.desiredLocationPlaceholder}
                                            value={formData.desiredLocation}
                                            onChange={(e) => setFormData({ ...formData, desiredLocation: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">{p.whyServe}</Label>
                                    <Textarea
                                        id="description"
                                        placeholder={p.whyServePlaceholder}
                                        rows={5}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                                {/* canSubmitMissionaryApplication was enforced
                                    nowhere. The route now admits anyone holding
                                    either it or canViewMissionary, so the button
                                    itself has to check. */}
                                <Button
                                    type="submit"
                                    disabled={
                                        createApplicationMutation.isPending ||
                                        !rolePerms.canSubmitMissionaryApplication
                                    }
                                >
                                    {createApplicationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Application
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="my-applications">
                    <Card>
                        <CardHeader>
                            <CardTitle>{p.applicationStatus}</CardTitle>
                            <CardDescription>{p.applicationStatusDesc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingApps ? (
                                <div>{tree.common.loading ?? tree.admin.loading}</div>
                            ) : applications?.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">{p.noApplications}</div>
                            ) : (
                                <div className="space-y-4">
                                    {applications?.map((app: any) => (
                                        <div key={app._id} className="flex justify-between items-center border p-4 rounded-lg">
                                            <div>
                                                <h4 className="font-semibold">{app.missionaryType} - {app.desiredLocation}</h4>
                                                <p className="text-sm text-muted-foreground">{formatDate(app.createdAt)}</p>
                                            </div>
                                            <Badge variant={app.status === 'Approved' ? 'default' : app.status === 'Rejected' ? 'destructive' : 'secondary'}>
                                                {app.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold tracking-tight">{p.fieldReports}</h2>
                            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Submit Report
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>{p.submitFieldReport}</DialogTitle>
                                        <DialogDescription>
                                            Share updates and statistics from your missionary field work.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmitReport} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="report-title">{p.reportTitle}</Label>
                                            <Input
                                                id="report-title"
                                                placeholder={p.reportTitlePlaceholder}
                                                value={reportFormData.title}
                                                onChange={(e) => setReportFormData({ ...reportFormData, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="report-location">{p.location}</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="report-location"
                                                    placeholder={p.locationPlaceholder}
                                                    className="pl-10"
                                                    value={reportFormData.location}
                                                    onChange={(e) => setReportFormData({ ...reportFormData, location: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="people-reached">{p.peopleReached}</Label>
                                                <div className="relative">
                                                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="people-reached"
                                                        type="number"
                                                        min="0"
                                                        className="pl-10"
                                                        value={reportFormData.peopleReached}
                                                        onChange={(e) => setReportFormData({ ...reportFormData, peopleReached: parseInt(e.target.value) || 0 })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="baptized">{p.baptized}</Label>
                                                <div className="relative">
                                                    <Droplets className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="baptized"
                                                        type="number"
                                                        min="0"
                                                        className="pl-10"
                                                        value={reportFormData.baptized}
                                                        onChange={(e) => setReportFormData({ ...reportFormData, baptized: parseInt(e.target.value) || 0 })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="report-content">{p.detailedReport}</Label>
                                            <Textarea
                                                id="report-content"
                                                placeholder={p.detailedReportPlaceholder}
                                                rows={6}
                                                value={reportFormData.content}
                                                onChange={(e) => setReportFormData({ ...reportFormData, content: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    createReportMutation.isPending ||
                                                    !rolePerms.canSubmitMissionaryReport
                                                }
                                            >
                                                {createReportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Submit Report
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {isLoadingReports ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : reports && reports.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {reports.map((report: any) => (
                                    <Card key={report._id || report.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg line-clamp-1">{report.title}</CardTitle>
                                                <Badge variant="outline" className="ml-2 shrink-0">
                                                    {formatDate(report.date)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {report.location}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 h-[60px]">
                                                {report.content}
                                            </p>
                                            <div className="flex gap-4 pt-4 border-t text-sm font-medium">
                                                <div className="flex items-center gap-1.5" title={p.peopleReached}>
                                                    <Users className="h-4 w-4 text-blue-500" />
                                                    <span>{report.stats?.peopleReached || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5" title={p.baptized}>
                                                    <Droplets className="h-4 w-4 text-cyan-500" />
                                                    <span>{report.stats?.baptized || 0}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="bg-muted/30 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <Globe className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                                    <h3 className="text-lg font-semibold">{p.noReportsYet}</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mt-1 mb-4">
                                        Submit your first missionary field report to start tracking your impact.
                                    </p>
                                    <Button variant="outline" onClick={() => setIsReportDialogOpen(true)}>
                                        Submit Report
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Missionary;
