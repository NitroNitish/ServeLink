import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, ChefHat, BarChart3, Users, Smartphone, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ServeLink
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-warm-50 to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Modern Restaurant Management
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
              QR-based ordering, real-time kitchen displays, analytics, and multi-branch control. 
              Everything your restaurant needs in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto shadow-elegant">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/menu/demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Demo Menu
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to run your restaurant efficiently and delight your customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-card transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">QR Menu Ordering</h3>
                <p className="text-muted-foreground">
                  Contactless ordering with dynamic QR codes for each table. Update menu in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <ChefHat className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Kitchen Display System</h3>
                <p className="text-muted-foreground">
                  Real-time order tracking and preparation status for kitchen staff.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Track sales, popular items, and performance metrics across all branches.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
                <p className="text-muted-foreground">
                  Separate panels for admin, staff, kitchen, and customers with proper permissions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Mobile Friendly</h3>
                <p className="text-muted-foreground">
                  Optimized for all devices. Works seamlessly on phones, tablets, and desktops.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-card transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Sync</h3>
                <p className="text-muted-foreground">
                  Instant updates across all devices. Never miss an order or status change.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Restaurant?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of restaurants already using ServeLink to streamline operations and boost revenue.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="shadow-lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 ServeLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
