import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Heart, Hand, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { userService } from '@/services/users';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { LearnMore } from '@/components/LearnMore';

const DEFAULT_MINISTRY_DESCRIPTIONS: Record<string, string> = {
    'Ebet Metreg': 'Help keep the church clean and welcoming.',
    'Natanim Agelgelot': 'Special service for helping the needy.',
    'Choir': 'Sing in the church choir.',
    'Ushering': 'Welcome and guide guests during services.',
    'Sunday School': 'Teach and fast-track children.',
    'Charity': 'Community outreach programs.',
    'Evangelism': 'Spread the gospel in the community.',
    'Media': 'Help with sound, video, and projection.',
};

const Volunteer = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const moduleCfg = useModuleConfig('volunteer');
    const [selectedMinistries, setSelectedMinistries] = useState<string[]>(user?.volunteerMinistries || []);

    const ministries = (moduleCfg.options.ministries ?? Object.keys(DEFAULT_MINISTRY_DESCRIPTIONS)).map((id) => ({
        id,
        label: id,
        description: DEFAULT_MINISTRY_DESCRIPTIONS[id] ?? '',
    }));

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => userService.updateUser(user?.id || '', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            // In a real app, we might need to refresh the auth user state too
            toast.success('Volunteer preferences updated successfully!');
        },
        onError: () => {
            toast.error('Failed to update preferences');
        },
    });

    const handleCreate = () => {
        updateProfileMutation.mutate({ volunteerMinistries: selectedMinistries });
    };

    const toggleMinistry = (id: string) => {
        if (selectedMinistries.includes(id)) {
            setSelectedMinistries(selectedMinistries.filter(m => m !== id));
        } else {
            setSelectedMinistries([...selectedMinistries, id]);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                    <Heart className="h-8 w-8 text-red-500" />
                    {moduleCfg.headerTitle || 'Volunteer Service'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {moduleCfg.headerDescription || '"As each has received a gift, use it to serve one another." - 1 Peter 4:10'}
                </p>
                <div className="flex justify-center mt-3">
                    <LearnMore title={moduleCfg.headerTitle || 'Volunteer Service'} content={moduleCfg.learnMore} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Your Ministry Preferences</CardTitle>
                    <CardDescription>
                        Where would you like to serve? Check all that apply.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ministries.map((ministry) => (
                            <div
                                key={ministry.id}
                                className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${selectedMinistries.includes(ministry.id)
                                        ? 'bg-primary/5 border-primary'
                                        : 'bg-card hover:bg-muted'
                                    }`}
                            >
                                <Checkbox
                                    id={ministry.id}
                                    checked={selectedMinistries.includes(ministry.id)}
                                    onCheckedChange={() => toggleMinistry(ministry.id)}
                                    className="mt-1"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor={ministry.id}
                                        className="text-base font-semibold cursor-pointer"
                                    >
                                        {ministry.label}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {ministry.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button
                            size="lg"
                            onClick={handleCreate}
                            disabled={updateProfileMutation.isPending}
                            className="gap-2"
                        >
                            {updateProfileMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Hand className="h-4 w-4" />
                            )}
                            Save Preferences
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Volunteer;
