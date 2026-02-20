import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Gavel, AlertCircle, ShieldCheck } from 'lucide-react';

const ChurchLaws = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Ye Betechristianu Liyu Liyu Denboch</h1>
                <p className="text-muted-foreground mt-1">Church Laws, Regulations, and Guidelines</p>
            </div>

            <Tabs defaultValue="guidelines" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="guidelines">General Guidelines</TabsTrigger>
                    <TabsTrigger value="prohibitions">Prohibitions (Kelkelowich)</TabsTrigger>
                    <TabsTrigger value="obligations">Obligations (Gidetawoch)</TabsTrigger>
                    <TabsTrigger value="administration">Admin Rules</TabsTrigger>
                </TabsList>

                <TabsContent value="guidelines">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Book className="h-5 w-5" />
                                Living Guidelines
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px] rounded-md border p-4">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">1. Sunday Worship</h3>
                                        <p className="text-muted-foreground">All members are expected to attend Sunday worship services regularly...</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">2. Community Service</h3>
                                        <p className="text-muted-foreground">Members are encouraged to participate in at least one community service activity per month...</p>
                                    </div>
                                    {/* Add more content here */}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="prohibitions">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                Prohibited Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                <li>Disruptive behavior during services.</li>
                                <li>Misuse of church funds or property.</li>
                                <li>Public defamation of church leadership or members.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="obligations">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-600">
                                <ShieldCheck className="h-5 w-5" />
                                Membership Obligations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                <li>Regular payment of Tithes (Asrat).</li>
                                <li>Active participation in assigned Mahderat (Small Group).</li>
                                <li>Respecting the hierarchy and leadership structure.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="administration">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gavel className="h-5 w-5" />
                                Administrative Rules
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Rules regarding elections, appointments, and financial management...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ChurchLaws;
