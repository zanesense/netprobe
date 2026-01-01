// Professional landing page for NetProbe
import { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import {
  Radar,
  Shield,
  Target,
  ArrowRight,
  Search,
  Network,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';

function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  // Redirect authenticated users
  if (user) {
    return <Navigate to="/app" replace />;
  }

  const features = [
    {
      icon: Radar,
      title: 'Network Discovery',
      description: 'Discover active hosts and services on your network with advanced scanning techniques.',
      color: 'text-blue-500'
    },
    {
      icon: Shield,
      title: 'Security Assessment',
      description: 'Identify vulnerabilities and security gaps in your network infrastructure.',
      color: 'text-green-500'
    },
    {
      icon: Target,
      title: 'Port Scanning',
      description: 'Comprehensive port scanning with service detection and OS fingerprinting.',
      color: 'text-red-500'
    },
    {
      icon: Search,
      title: 'Service Detection',
      description: 'Identify running services and their versions for security analysis.',
      color: 'text-purple-500'
    },
    {
      icon: Network,
      title: 'Firewall Analysis',
      description: 'Analyze firewall rules and detect filtering mechanisms.',
      color: 'text-orange-500'
    },
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description: 'Monitor network activity and changes in real-time.',
      color: 'text-cyan-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Radar className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">NetProbe</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setAuthTab('signin');
                setShowAuthModal(true);
              }}
            >
              Sign In
            </Button>
            <Button
              onClick={() => {
                setAuthTab('signup');
                setShowAuthModal(true);
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ y }}
          >
            <Badge variant="secondary" className="mb-4">
              Free Network Security Assessment Tool
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Secure Your Network with
              <br />
              Advanced Scanning
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover vulnerabilities, analyze security posture, and protect your infrastructure with our comprehensive network security assessment platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => {
                  setAuthTab('signup');
                  setShowAuthModal(true);
                }}
                className="text-lg px-8"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setAuthTab('signin');
                  setShowAuthModal(true);
                }}
                className="text-lg px-8"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Free & Open Source</h2>
          <p className="text-muted-foreground">
            NetProbe is completely free to use with no limitations or hidden costs
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Security Assessment
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to assess, monitor, and secure your network infrastructure in one powerful platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`p-3 rounded-lg bg-background w-fit ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for Security Professionals
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            NetProbe provides the essential tools needed for network security assessment and vulnerability discovery
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Secure Your Network?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Sign up now and start scanning your network for security vulnerabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => {
                  setAuthTab('signup');
                  setShowAuthModal(true);
                }}
                className="text-lg px-8"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setAuthTab('signin');
                  setShowAuthModal(true);
                }}
                className="text-lg px-8"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="p-2 rounded-lg bg-primary/10">
                <Radar className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold">NetProbe</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 NetProbe. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authTab}
      />
    </div>
  );
}

export default Landing;