import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const PartnerContact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        type: 'Partnership',
        message: '',
    });

    const submitMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/partners', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Request submitted successfully!');
            setFormData({ name: '', email: '', phone: '', type: 'Partnership', message: '' });
        },
        onError: () => {
            toast.error('Failed to submit request');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitMutation.mutate(formData);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                    <Handshake className="h-8 w-8 text-primary" />
                    Partner & Job Contact
                </h1>
                <p className="text-muted-foreground mt-2">
                    Interested in partnering with us or looking for job opportunities? Fill out the form below.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Form</CardTitle>
                    <CardDescription>Bro Serategninet / Partnership Request</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Interest Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Partnership">Partnership (አጋር)</SelectItem>
                                        <SelectItem value="JobApplication">Job Application (ስራ መጠየቂያ)</SelectItem>
                                        <SelectItem value="Other">Other (ሌላ)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message / Cover Letter</Label>
                            <Textarea
                                id="message"
                                placeholder="Tell us more about your request..."
                                rows={6}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                            {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default PartnerContact;
