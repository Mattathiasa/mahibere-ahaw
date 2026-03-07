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

const STATUSES: TeachingStatus[] = ['Draft', 'Published', 'Archived'];

export function CreateTeachingDialog({ open, onOpenChange }: CreateTeachingDialogProps) {
    const queryClient = useQueryClient();
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
            toast.success('Teaching created successfully');
            onOpenChange(false);
            // Reset form?
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create teaching');
        },
    });

    const handleSubmit = () => {
        if (!formData.title || !formData.speaker || !formData.dateDelivered) {
            toast.error('Please fill in required fields (Title, Speaker, Date)');
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Create New Teaching</DialogTitle>
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
                                    Metadata
                                </TabsTrigger>
                                <TabsTrigger value="header" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Public Header
                                </TabsTrigger>
                                <TabsTrigger value="content" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Video className="w-4 h-4 mr-2" />
                                    Main Content
                                </TabsTrigger>
                                <TabsTrigger value="engagement" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Engagement
                                </TabsTrigger>
                                <TabsTrigger value="footer" className="w-full justify-start px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Mic2 className="w-4 h-4 mr-2" />
                                    Footer & Legal
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
                                            <Label>Teaching Title *</Label>
                                            <Input
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="e.g., Born Again: A Nighttime Encounter"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Speaker/Teacher *</Label>
                                            <Input
                                                value={formData.speaker}
                                                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                                                placeholder="Pastor Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date Delivered *</Label>
                                            <Input
                                                type="date"
                                                value={formData.dateDelivered}
                                                onChange={(e) => setFormData({ ...formData, dateDelivered: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Series</Label>
                                            <Input
                                                value={formData.series}
                                                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                                                placeholder="e.g., Gospel of John"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Series Part</Label>
                                            <Input
                                                value={formData.seriesPart}
                                                onChange={(e) => setFormData({ ...formData, seriesPart: e.target.value })}
                                                placeholder="e.g., Part 3 of 12"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Service Type</Label>
                                            <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v as TeachingServiceType })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as TeachingStatus })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label>Primary Scripture *</Label>
                                            <Input
                                                value={formData.primaryScripture}
                                                onChange={(e) => setFormData({ ...formData, primaryScripture: e.target.value })}
                                                placeholder="e.g., John 3:1-21"
                                            />
                                        </div>

                                        <div className="space-y-2 col-span-2">
                                            <Label>Supporting Scriptures</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={tempSupportingScripture}
                                                    onChange={(e) => setTempSupportingScripture(e.target.value)}
                                                    placeholder="Add scripture reference"
                                                />
                                                <Button type="button" onClick={() => addArrayItem('supportingScriptures', tempSupportingScripture, setTempSupportingScripture)}>Add</Button>
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
                                            <Label>Tags / Key Topics</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={tempTag}
                                                    onChange={(e) => setTempTag(e.target.value)}
                                                    placeholder="Add tag (e.g. Salvation)"
                                                />
                                                <Button type="button" onClick={() => addArrayItem('tags', tempTag, setTempTag)}>Add</Button>
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
                                            <Label>Target Audience</Label>
                                            <Input
                                                value={formData.targetAudience}
                                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                                placeholder="e.g., New Believers"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* 2. Public Header */}
                                <TabsContent value="header" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Featured Image URL</Label>
                                        <Input
                                            value={formData.featuredImage}
                                            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        {formData.featuredImage && (
                                            <div className="mt-2 h-40 w-full bg-muted rounded-md overflow-hidden relative">
                                                <img src={formData.featuredImage} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Short Description / Blurb *</Label>
                                        <Textarea
                                            value={formData.shortDescription}
                                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                            placeholder="1-2 sentences summarizing the teaching's core message."
                                            rows={3}
                                        />
                                    </div>
                                </TabsContent>

                                {/* 3. Main Content */}
                                <TabsContent value="content" className="mt-0 space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label>Media Embed URL</Label>
                                            <Input
                                                value={formData.mediaUrl}
                                                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                                placeholder="YouTube, Vimeo, or Audio link"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Media Type</Label>
                                            <Select value={formData.mediaType} onValueChange={(v) => setFormData({ ...formData, mediaType: v as any })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="video">Video</SelectItem>
                                                    <SelectItem value="audio">Audio</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Full Transcript / Notes</Label>
                                        <Textarea
                                            value={formData.transcript}
                                            onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                                            placeholder="Paste full text here..."
                                            className="min-h-[200px]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Sermon Outline</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tempOutlinePoint}
                                                onChange={(e) => setTempOutlinePoint(e.target.value)}
                                                placeholder="Add outline point (e.g., I. Introduction)"
                                            />
                                            <Button type="button" onClick={() => addArrayItem('sermonOutline', tempOutlinePoint, setTempOutlinePoint)}>Add</Button>
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
                                        <Label>Key Quotations</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tempQuote}
                                                onChange={(e) => setTempQuote(e.target.value)}
                                                placeholder="Add a memorable quote"
                                            />
                                            <Button type="button" onClick={() => addArrayItem('keyQuotations', tempQuote, setTempQuote)}>Add</Button>
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
                                        <Label>Discussion Questions</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tempQuestion}
                                                onChange={(e) => setTempQuestion(e.target.value)}
                                                placeholder="Add question for small groups"
                                            />
                                            <Button type="button" onClick={() => addArrayItem('discussionQuestions', tempQuestion, setTempQuestion)}>Add</Button>
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
                                        <Label>Weekly Challenge</Label>
                                        <Input
                                            value={formData.applicationChallenge}
                                            onChange={(e) => setFormData({ ...formData, applicationChallenge: e.target.value })}
                                            placeholder="Specific practical action step"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Digital Connection Point</Label>
                                        <Input
                                            value={formData.digitalConnectionPoint}
                                            onChange={(e) => setFormData({ ...formData, digitalConnectionPoint: e.target.value })}
                                            placeholder="e.g. Text 'BORNAGAIN' to 55555"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Related Resources</Label>
                                        <div className="flex gap-2 items-end">
                                            <div className="space-y-1 flex-1">
                                                <span className="text-xs text-muted-foreground">Title</span>
                                                <Input
                                                    value={tempResource.title}
                                                    onChange={(e) => setTempResource({ ...tempResource, title: e.target.value })}
                                                    placeholder="Resource Title"
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
                                            <Button type="button" onClick={() => addArrayItem('relatedResources', tempResource, setTempResource)}>Add</Button>
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
                                        <Label>Copyright Notice</Label>
                                        <Input
                                            value={formData.copyrightNotice}
                                            onChange={(e) => setFormData({ ...formData, copyrightNotice: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Speaker Bio</Label>
                                        <Textarea
                                            value={formData.speakerBio}
                                            onChange={(e) => setFormData({ ...formData, speakerBio: e.target.value })}
                                            placeholder="Brief bio..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact for Follow-up</Label>
                                        <Input
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                            placeholder="email@church.org"
                                        />
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Creating...' : 'Create Teaching'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
