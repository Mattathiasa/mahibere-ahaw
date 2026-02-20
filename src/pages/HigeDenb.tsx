import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Scale, Shield } from 'lucide-react';

const HigeDenb = () => {
  const rules = [
    {
      id: '1',
      title: 'Church Governance Structure',
      icon: Shield,
      content:
        'The Ethiopian Orthodox Tewahedo Church follows a hierarchical structure starting from Sinodos at the highest level, followed by KuamiSinodos (9 units), Memriya (7 members), Zone, Atbiya (individual churches), EnkesekaseMaikel, and HiyawanMahderat at the base level.',
    },
    {
      id: '2',
      title: 'Reporting Requirements',
      icon: FileText,
      content:
        'All Memriya members and higher levels must submit regular reports on church activities, including attendance, financial matters, and ministry progress. Reports should be submitted according to the designated frequency: weekly, monthly, or yearly.',
    },
    {
      id: '3',
      title: 'Ministry Conduct',
      icon: BookOpen,
      content:
        'All church members serving in ministry roles must uphold the highest standards of spiritual conduct, maintain regular attendance at services, and actively participate in their assigned ministry areas. Sunday School teachers, youth leaders, and other ministry workers must complete appropriate training.',
    },
    {
      id: '4',
      title: 'Communication Protocol',
      icon: Scale,
      content:
        'Official announcements can only be made by Memriya level and above. All communications must follow the established chain of command. Urgent matters should be escalated through proper channels to ensure timely response and appropriate action.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">HigeDenb</h1>
        <p className="text-muted-foreground mt-1">
          Church rules, regulations, and governance guidelines
        </p>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <Card key={rule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl pt-2">{rule.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{rule.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            These regulations are based on the canonical laws of the Ethiopian Orthodox Tewahedo
            Church and should be followed by all members. For detailed information about specific
            rules or to request clarification, please contact your local Memriya representative or
            higher church authority.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HigeDenb;
