import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Award, BarChart3, ArrowRight, GraduationCap } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Rich Course Content",
    description: "Learn through beautifully rendered lessons with embedded videos and images.",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description: "See exactly where you stand with visual progress tracking for every course.",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    description: "Complete courses and receive downloadable PDF certificates and digital badges.",
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-xl font-serif text-foreground">Instructional</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/courses">
              <Button variant="ghost" size="sm">Courses</Button>
            </Link>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <GraduationCap className="h-4 w-4" />
              Start learning today
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-foreground leading-tight">
              Master new skills with{" "}
              <span className="text-primary">Instructional</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A modern learning platform where you can browse courses, track your progress, 
              and earn certificates — all at your own pace.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link to={user ? "/dashboard" : "/auth"}>
                <Button size="lg" className="h-13 px-8 text-base gap-2">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="outline" size="lg" className="h-13 px-8 text-base">
                  Browse courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card">
        <div className="container py-20 md:py-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">
              Everything you need to learn
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              A streamlined platform designed to help you focus on what matters — learning.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="text-center space-y-4 p-6 rounded-xl hover:bg-secondary/50 transition-colors"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-serif text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="container py-20 md:py-28 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
            Ready to start learning?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Join Instructional today and begin your learning journey with courses designed for you.
          </p>
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button size="lg" className="h-13 px-10 text-base gap-2">
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card">
        <div className="container py-8 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-serif">Instructional</span>
          </div>
          <p>© {new Date().getFullYear()} Instructional. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
