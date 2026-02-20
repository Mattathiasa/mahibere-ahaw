import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, User, Mic2, Tag } from 'lucide-react';
import { api } from '@/services/api';
import { TeachingServiceType, TeachingStatus } from '@/types';
import { CreateTeachingDialog } from '@/components/CreateTeachingDialog';

const Teaching = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { data: teachings, isLoading } = useQuery({
        queryKey: ['teachings'],
        queryFn: async () => {
            const response = await api.get('/teachings');
            return response.data;
        },
    });

    const getStatusColor = (status: TeachingStatus) => {
        switch (status) {
            case 'Published': return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900';
            case 'Draft': return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
            case 'Archived': return 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-900';
            default: return '';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Teachings & Articles</h1>
                    <p className="text-muted-foreground mt-1">Educational resources and spiritual guidance</p>
                </div>
                {/* Only admins would see this in real implementation */}
                <Button onClick={() => setIsCreateDialogOpen(true)}>Create New Teaching</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div>Loading...</div>
                ) : teachings && teachings.length > 0 ? (
                    teachings.map((teaching: any) => (
                        <Card key={teaching._id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col h-full">
                            {teaching.featuredImage && (
                                <div className="h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                                    <img
                                        src={teaching.featuredImage}
                                        alt={teaching.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                            )}
                            <CardHeader className="flex-1">
                                <div className="flex justify-between items-start mb-3 gap-2">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="font-normal text-xs">
                                            {teaching.serviceType}
                                        </Badge>
                                        <Badge variant="outline" className={`${getStatusColor(teaching.status)} border-0 font-medium text-xs`}>
                                            {teaching.status}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(teaching.dateDelivered).toLocaleDateString()}
                                    </span>
                                </div>
                                <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                    {teaching.title}
                                </CardTitle>
                                {teaching.series && (
                                    <p className="text-sm font-medium text-primary/80 mt-1">
                                        Series: {teaching.series} {teaching.seriesPart && `(${teaching.seriesPart})`}
                                    </p>
                                )}
                                <CardDescription className="line-clamp-3 mt-2">
                                    {teaching.shortDescription}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="py-2">
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {teaching.tags?.slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground flex items-center">
                                            <Tag className="h-2 w-2 mr-1" />{tag}
                                        </span>
                                    ))}
                                    {teaching.tags?.length > 3 && (
                                        <span className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground">
                                            +{teaching.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t bg-muted/5 mt-auto">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
                                    <Mic2 className="h-3 w-3" />
                                    <span className="truncate flex-1 font-medium">{teaching.speaker}</span>
                                    {teaching.mediaType && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase">
                                            {teaching.mediaType}
                                        </Badge>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-16 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                        <BookOpen className="mx-auto h-12 w-12 opacity-20 mb-4" />
                        <h3 className="text-lg font-medium mb-1">No teachings found</h3>
                        <p className="text-sm opacity-70">Check back later for new content.</p>
                    </div>
                )}
            </div>
            <CreateTeachingDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
        </div>
    );
};

export default Teaching;
