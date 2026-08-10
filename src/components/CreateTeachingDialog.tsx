import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Info, Video, FileText, MessageCircle, Mic2 } from 'lucide-react';
import { teachingService } from '@/services/teachings';
import { TeachingServiceType, TeachingStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/i18n/translations';
import { TEACHING_STATUSES, teachingStatusLabel } from '@/i18n/enums';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';

interface CreateTeachingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SERVICE_TYPES: TeachingServiceType[] = [
    'Sunday Morning',
    'Wednesday Bible Study',
    "Men's Breakfast",
    "Women's Ministry",
    'Youth Service',
    'Special Event',
    'Other'
];

/**
 * Service-type token -> translation key. The token is what is written to
 * Firestore, so it stays exactly as it is; only the label beside it changes.
 */
const SERVICE_TYPE_KEYS: Record<string, keyof Translations['content']> = {
    'Sunday Morning': 'serviceTypeSundayMorning',
    'Wednesday Bible Study': 'serviceTypeWednesdayBibleStudy',
    "Men's Breakfast": 'serviceTypeMensBreakfast',
    "Women's Ministry": 'serviceTypeWomensMinistry',
    'Youth Service': 'serviceTypeYouthService',
    'Special Event': 'serviceTypeSpecialEvent',
    'Other': 'serviceTypeOther',
};

export function CreateTeachingDialog({ open, onOpenChange }: CreateTeachingDialogProps) {
    const queryClient = useQueryClient();
    const moduleCfg = useModuleConfig('teachings');
    const { t } = useLanguage();
    const c = t.content;
    const [activeTab, setActiveTab] = useState('metadata');

    // Form State
    const [formData, setFormData] = useState({
        // 1. Metadata
        title: '',
        series: '',
        seriesPart: '',
        speaker: '',
        dateDelivered: new Date().toISOString().split('T')[0],
        serviceType: 'Sunday Morning' as TeachingServiceType,
        primaryScripture: '',
        supportingScriptures: [] as string[],
        tags: [] as string[],
        targetAudience: '',
        status: 'Draft' as TeachingStatus,

        // 2. Public-Facing Header
        featuredImage: '',
        shortDescription: '',

        // 3. Main Content
        mediaUrl: '',
        mediaType: 'video' as 'video' | 'audio',
        transcript: '',
        sermonOutline: [] as string[],
        keyQuotations: [] as string[],

        // 4. Engagement & Application
        discussionQuestions: [] as string[],
        applicationChallenge: '',
        relatedResources: [] as { title: string; url: string }[],
        digitalConnectionPoint: '',

        // 5. Footer & Legal
        copyrightNotice: `© ${new Date().getFullYear()} Church Name`,
        speakerBio: '',
        contactEmail: ''
    });

    // Helpers for array fields
    const [tempTag, setTempTag] = useState('');
    const [tempSupportingScripture, setTempSupportingScripture] = useState('');
    const [tempOutlinePoint, setTempOutlinePoint] = useState('');
    const [tempQuote, setTempQuote] = useState('');
    const [tempQuestion, setTempQuestion] = useState('');
    const [tempResource, setTempResource] = useState({ title: '', url: '' });

    const addArrayItem = (field: keyof typeof formData, value: any, setTemp?: (v: any) => void) => {
        if (!value) return;
        if (typeof value === 'string' && !value.trim()) return;

        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] as any[]), value]
        }));
        if (setTemp) {
            if (typeof value === 'object') setTemp({ title: '', url: '' });
            else setTemp('');
        }
    };

    const removeArrayItem = (field: keyof typeof formData, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] as any[]).filter((_, i) => i !== index)
        }));
    };

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            return teachingService.createTeaching(data as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachings'] });
            toast.success(c.teachingCreated);
            onOpenChange(false);
            // Reset form?
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create teaching');
        },
    });

    const handleSubmit = () => {
        if (!formData.title || !formData.speaker || !formData.dateDelivered) {
            toast.error(c.teachingMissingFields);
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{c.createTeaching}</DialogTitle>
                    <DialogDescription>
                        Fill out the template below to create a new teaching record.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex">
                    {/* Tabs Navigation */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex-1 flex h-full">
                        <div className="w-64 border-r bg-muted/20 p-4 shrink-0 overflow-y-auto">
                            <TabsList className="flex flex-col h-auto bg-transparent space-y-2 w-full">
                                <TabsTrigger value="metadata" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Info className="w-4 h-4 mr-2" />
                                    {c.tabMetadata}
                                </TabsTrigger>
                                <TabsTrigger value="header" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <FileText className="w-4 h-4 mr-2" />
                                    {c.tabPublicHeader}
                                </TabsTrigger>
                                <TabsTrigger value="content" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Video className="w-4 h-4 mr-2" />
                                    {c.tabMainContent}
                                </TabsTrigger>
                                <TabsTrigger value="engagement" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    {c.tabEngagement}
                                </TabsTrigger>
                                <TabsTrigger value="footer" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Mic2 className="w-4 h-4 mr-2" />
                                    {c.tabFooterLegal}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Tab Content */}
                        <ScrollArea className="flex-1 h-full">
                            <div className="p-6 space-y-6">
                                {/* 1. Metadata */}
                                <TabsContent value="metadata" className="mt-0 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label>{c.teachingTitle}</Label>
                                            <Input
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder={c.teachingTitlePlaceholder}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{c.speaker}</Label>
                                            <Input
                                                value={formData.speaker}
                                                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                                                placeholder={c.speakerPlaceholder}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ቀን (Date Delivered) *</Label>
                                            <EthiopianDatePicker
                                                value={formData.dateDelivered}
                                                onChange={(isoDate) => setFormData({ ...formData, dateDelivered: isoDate })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{c.series}</Label>
                                            <Input
                                                value={formData.series}
                                                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                                                placeholder={c.seriesPlaceholder}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{c.seriesPart}</Label>
                                            <Input
                                                value={formData.seriesPart}
                                                onChange={(e) => setFormData({ ...formData, seriesPart: e.target.value })}
                                                placeholder={c.seriesPartPlaceholder}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{c.serviceType}</Label>
                                            <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v as TeachingServiceType })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(moduleCfg.options.serviceTypes ?? SERVICE_TYPES).map(v => (
                                                        <SelectItem key={v} value={v}>
                                                            {SERVICE_TYPE_KEYS[v] ? c[SERVICE_TYPE_KEYS[v]] : v}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{c.status}</Label>
                                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as TeachingStatus })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TEACHING_STATUSES.map(v => <SelectItem key={v} value={v}>{teachingStatusLabel(t, v)}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label>{c.primaryScripture}</Label>
                                            <Input
                                                value={formData.primaryScripture}
                                                onChange={(e) => setFormData({ ...formData, primaryScripture: e.target.value })}
                                                placeholder={c.primaryScripturePlaceholder}
                                            />
                                        </div>

                                        <div className="space-y-2 col-span-2">
                                            <Label>{c.supportingScriptures}</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={tempSupportingScripture}
                                                    onChange={(e) => setTempSupportingScripture(e.target.value)}
                                                    placeholder={c.addScripturePlaceholder}
                                                />
                                                <Button type="button" onClick={() => addArrayItem('supportingScriptures', tempSupportingScripture, setTempSupportingScripture)}>{c.add}</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.supportingScriptures.map((item, i) => (
                                                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                                                        {item}
                                                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('supportingScriptures', i)} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2 col-span-2">
                                            <Label>{c.tags}</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={tempTag}
                                                    onChange={(e) => setTempTag(e.target.value)}
                                                    placeholder={c.addTagPlaceholder}
                                                />
                                                <Button type="button" onClick={() => addArrayItem('tags', tempTag, setTempTag)}>{c.add}</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.tags.map((item, i) => (
                                                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                                                        {item}
                                                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeArrayItem('tags', i)} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2 col-span-2">
                                            <Label>{c.targetAudience}</Label>
                                            <Input
                                                value={formData.targetAudience}
                                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                                placeholder={c.targetAudiencePlaceholder}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* 2. Public Header */}
                                <TabsContent value="header" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>{c.featuredImageUrl}</Label>
                                        <Input
                                            value={formData.featuredImage}
                                            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        {formData.featuredImage && (
                                            <div className="mt-2 h-40 w-full bg-muted rounded-md overflow-hidden relative">
                                                <img src={formData.featuredImage} alt={c.preview} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{c.shortDescription}</Label>
                                        <Textarea
                                            value={formData.shortDescription}
                                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                            placeholder={c.shortDescriptionPlaceholder}
                                            rows={3}
                                        />
                                    </div>
                                </TabsContent>

                                {/* 3. Main Content */}
                                <TabsContent value="content" className="mt-0 space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label>{c.mediaEmbedUrl}</Label>
                                            <Input
                                                value={formData.mediaUrl}
                                                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                                placeholder={c.mediaEmbedPlaceholder}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{c.mediaType}</Label>
                                            <Select value={formData.mediaType} onValueChange={(v) => setFormData({ ...formData, mediaType: v as any })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="video">{c.mediaVideo}</SelectItem>
                                                    <SelectItem value="audio">{c.mediaAudio}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{c.fullTranscript}</Label>
                                        <Textarea
                                            value={formData.transcript}
                                            onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                                            placeholder={c.fullTranscriptPlaceholder}
                                            className="min-h-[200px]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{c.sermonOutline}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tempOutlinePoint}
                                                onChange={(e) => setTempOutlinePoint(e.target.value)}
                                                placeholder={c.outlinePlaceholder}
                                            />
                                            <Button type="button" onClick={() => addArrayItem('sermonOutline', tempOutlinePoint, setTempOutlinePoint)}>{c.add}</Button>
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            {formData.sermonOutline.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 p-2 bg-muted/40 rounded-md text-sm">
                                                    <div className="flex-1">{item}</div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeArrayItem('sermonOutline', i)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{c.keyQuotations}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tempQuote}
                                                onChange={(e) => setTempQuote(e.target.value)}
                                                placeholder={c.quotePlaceholder}
                                            />
                                            <Button type="button" onClick={() => addArrayItem('keyQuotations', tempQuote, setTempQuote)}>{c.add}</Button>
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            {formData.keyQuotations.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 p-3 bg-primary/5 border-l-2 border-primary rounded-r-md text-sm italic">
                                                    <div className="flex-1">"{item}"</div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeArrayItem('keyQuotations', i)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* 4. Engagement */}
                                <TabsContent value="engagement" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>{c.discussionQuestions}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tempQuestion}
                                                onChange={(e) => setTempQuestion(e.target.value)}
                                                placeholder={c.questionPlaceholder}
                                            />
                                            <Button type="button" onClick={() => addArrayItem('discussionQuestions', tempQuestion, setTempQuestion)}>{c.add}</Button>
                                        </div>
                                        <ul className="list-disc pl-5 space-y-1 mt-2">
                                            {formData.discussionQuestions.map((item, i) => (
                                                <li key={i} className="text-sm pl-1 group flex items-start justify-between">
                                                    <span>{item}</span>
                                                    <X className="h-3 w-3 opacity-0 group-hover:opacity-100 cursor-pointer ml-2 mt-1" onClick={() => removeArrayItem('discussionQuestions', i)} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{c.weeklyChallenge}</Label>
                                        <Input
                                            value={formData.applicationChallenge}
                                            onChange={(e) => setFormData({ ...formData, applicationChallenge: e.target.value })}
                                            placeholder={c.weeklyChallengePlaceholder}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{c.digitalConnection}</Label>
                                        <Input
                                            value={formData.digitalConnectionPoint}
                                            onChange={(e) => setFormData({ ...formData, digitalConnectionPoint: e.target.value })}
                                            placeholder={c.digitalConnectionPlaceholder}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{c.relatedResources}</Label>
                                        <div className="flex gap-2 items-end">
                                            <div className="space-y-1 flex-1">
                                                <span className="text-xs text-muted-foreground">{c.resourceTitle}</span>
                                                <Input
                                                    value={tempResource.title}
                                                    onChange={(e) => setTempResource({ ...tempResource, title: e.target.value })}
                                                    placeholder={c.resourceTitlePlaceholder}
                                                />
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <span className="text-xs text-muted-foreground">URL</span>
                                                <Input
                                                    value={tempResource.url}
                                                    onChange={(e) => setTempResource({ ...tempResource, url: e.target.value })}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <Button type="button" onClick={() => addArrayItem('relatedResources', tempResource, setTempResource)}>{c.add}</Button>
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            {formData.relatedResources.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    <a href={item.url} target="_blank" rel="noreferrer" className="text-primary underline flex-1">{item.title}</a>
                                                    <X className="h-4 w-4 cursor-pointer" onClick={() => removeArrayItem('relatedResources', i)} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* 5. Footer */}
                                <TabsContent value="footer" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>{c.copyrightNotice}</Label>
                                        <Input
                                            value={formData.copyrightNotice}
                                            onChange={(e) => setFormData({ ...formData, copyrightNotice: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{c.speakerBio}</Label>
                                        <Textarea
                                            value={formData.speakerBio}
                                            onChange={(e) => setFormData({ ...formData, speakerBio: e.target.value })}
                                            placeholder={c.speakerBioPlaceholder}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{c.contactFollowUp}</Label>
                                        <Input
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                            placeholder={c.contactFollowUpPlaceholder}
                                        />
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                        {createMutation.isPending ? t.admin.busyCreating : t.content.createTeachingButton}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
