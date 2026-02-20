import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import logo from '@/assets/logo.png';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  Users,
  Calendar,
  Network,
  BookOpen,
  ArrowRight,
  Check,
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bell,
      title: 'Announcements',
      description: 'Share church-wide updates and important notifications instantly.',
    },
    {
      icon: FileText,
      title: 'Plans & Reports',
      description: 'Organize ministry plans and track progress with detailed reports.',
    },
    {
      icon: Users,
      title: 'Member Management',
      description: 'Manage church members, ministries, and contact information.',
    },
    {
      icon: Calendar,
      title: 'Meetings',
      description: 'Schedule and coordinate Sinodos meetings and church events.',
    },
    {
      icon: Network,
      title: 'Hierarchy System',
      description: 'Clear organizational structure from Sinodos to HiyawanMahderat.',
    },
    {
      icon: BookOpen,
      title: 'HigeDenb',
      description: 'Access church rules, regulations, and governance guidelines.',
    },
  ];

  const testimonials = [
    {
      name: 'Abune Yohannes',
      role: 'Sinodos',
      content:
        'Ahaw has transformed how we manage our church operations. Everything is organized and accessible.',
    },
    {
      name: 'W/ro Marta Tadesse',
      role: 'Memriya',
      content:
        'The reporting system makes it easy to track our ministry activities and share progress.',
    },
    {
      name: 'Ato Daniel Bekele',
      role: 'Zone Leader',
      content:
        'Managing multiple Atbiya churches has never been easier. Highly recommended!',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Ahaw" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold text-primary">Ahaw</h1>
                <p className="text-xs text-muted-foreground">Church Management</p>
              </div>
            </div>
            <Button onClick={() => navigate('/login')}>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Modern Church Management for Ethiopian Orthodox Tewahedo Church
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your church operations with Ahaw - from announcements and member
              management to hierarchical reporting and meeting coordination.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/login')} className="text-lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for church hierarchy and ministry
              management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold text-center mb-12">
              Why Choose Ahaw?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                'Role-based access control for all hierarchy levels',
                'Real-time announcements and notifications',
                'Comprehensive reporting and tracking',
                'Member database with ministry assignments',
                'Meeting scheduling and coordination',
                'Secure and reliable platform',
                'Mobile-friendly responsive design',
                'Easy to use interface',
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 animate-fade-in">
                  <div className="p-1 rounded-full bg-primary/20 mt-1">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-5xl font-bold text-center mb-16">
            Trusted by Church Leaders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="animate-scale-in">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground italic mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold text-center mb-4">Get in Touch</h2>
            <p className="text-center text-muted-foreground mb-12">
              Have questions? We'd love to hear from you.
            </p>
            <Card>
              <CardContent className="pt-6">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="church">Church/Organization</Label>
                    <Input id="church" placeholder="Your church name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Tell us about your needs..." rows={5} />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Ahaw" className="h-10 w-10" />
              <div>
                <p className="font-bold text-primary">Ahaw</p>
                <p className="text-xs text-muted-foreground">Church Management System</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Ahaw. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
