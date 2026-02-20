import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Users } from 'lucide-react';
import { api } from '@/services/api';

const StrategicPlan = () => {
    const { data: goals, isLoading } = useQuery({
        queryKey: ['strategic-goals'],
        queryFn: async () => {
            const response = await api.get('/strategic-plans');
            return response.data;
        },
    });

    // Mock data if no backend data yet
    const mockGoals = [
        {
            id: 1,
            title: '50 Million Members in 50 Years',
            description: 'Our long term vision for church growth and evangelism.',
            targetYear: 2075,
            currentValue: 1200000,
            targetValue: 50000000,
            unit: 'Members',
        },
        {
            id: 2,
            title: 'Plant 10,000 New Churches',
            description: 'Establishing new places of worship across the region.',
            targetYear: 2030,
            currentValue: 2450,
            targetValue: 10000,
            unit: 'Churches',
        }
    ];

    const displayGoals = goals && goals.length > 0 ? goals : mockGoals;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Strategic Plan (Yesltwe Ekd)</h1>
                <p className="text-muted-foreground mt-1">Tracking our long-term vision and goals</p>
            </div>

            <div className="grid gap-6">
                {displayGoals.map((goal: any) => {
                    const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

                    return (
                        <Card key={goal._id || goal.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Target className="h-5 w-5 text-primary" />
                                            {goal.title}
                                        </CardTitle>
                                        <CardDescription className="mt-1">{goal.description}</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-muted-foreground">Target Year</span>
                                        <p className="text-lg font-bold">{goal.targetYear}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress to date</span>
                                        <span className="font-bold">{percentage}%</span>
                                    </div>
                                    <Progress value={percentage} className="h-3" />
                                    <div className="flex justify-between items-end mt-2">
                                        <div>
                                            <p className="text-2xl font-bold text-primary">{goal.currentValue.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">Current {goal.unit}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-muted-foreground">{goal.targetValue.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">Target {goal.unit}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default StrategicPlan;
