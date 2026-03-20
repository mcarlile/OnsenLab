import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Droplets, Camera, BarChart3, Shield } from "lucide-react";
import heroImage from "@assets/hero-hottub.png";

const features = [
  {
    icon: Camera,
    title: "Snap & Analyze",
    description: "Take a photo of your test strip and get instant AI-powered readings for pH, chlorine, alkalinity, and more.",
  },
  {
    icon: BarChart3,
    title: "Track Trends",
    description: "Monitor your water chemistry over time with interactive charts and historical data to keep your tub in perfect balance.",
  },
  {
    icon: Shield,
    title: "Auditable Evidence",
    description: "Every test photo is securely stored in the cloud so you can look back at exactly what the strip showed.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Droplets className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold" data-testid="text-brand-name">Hot Tub Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/login">
              <Button data-testid="button-login">Log In</Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight" data-testid="text-hero-heading">
              Keep Your Water <span className="text-primary">Crystal Clear</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Snap a photo of your test strip, and our AI instantly reads pH, chlorine, alkalinity, bromine, and hardness — no squinting at tiny color charts.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/api/login">
                <Button size="lg" data-testid="button-get-started">
                  Get Started
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>Free to use</span>
              <span>No credit card required</span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-md overflow-hidden ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-300 hover:scale-[1.02]">
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Crystal clear hot tub water"
                  className="w-full h-auto object-cover"
                  data-testid="img-hero"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center mb-4" data-testid="text-features-heading">
            How It Works
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Three simple steps to perfectly balanced water chemistry.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card
                key={feature.title}
                className="p-6 hover-elevate"
                data-testid={`card-feature-${i}`}
              >
                <div className="rounded-lg bg-primary/10 p-2.5 w-fit mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          Hot Tub Monitor
        </div>
      </footer>
    </div>
  );
}
