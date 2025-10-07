"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Zap, 
  Star, 
  Crown, 
  Gem, 
  Palette,
  Eye,
  Heart,
  Rocket,
  Wand2
} from "lucide-react";

export default function DemoPage() {
  const [activeDemo, setActiveDemo] = useState("cards");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium premium-gradient">Premium UI Makeover</span>
          </div>
          
          <h1 className="text-5xl font-bold premium-gradient">
            Beautiful. Modern. Premium.
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the new premium design system with enhanced colors, smooth animations, 
            and beautiful glass morphism effects.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <button className="premium-interactive premium-shadow px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Explore Features
            </button>
            <button className="premium-interactive px-6 py-3 border border-border rounded-lg font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Components
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="premium-interactive premium-float bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Premium Colors</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Enhanced color palette with beautiful gradients and improved contrast ratios.
            </p>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
            </div>
          </div>

          <div className="premium-interactive premium-float bg-card border border-border rounded-lg p-6" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Smooth Animations</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Buttery smooth animations with premium easing curves and micro-interactions.
            </p>
            <button className="premium-pulse w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              Animated Button
            </button>
          </div>

          <div className="premium-interactive premium-float bg-card border border-border rounded-lg p-6" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gem className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Glass Morphism</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Beautiful glass effects with backdrop blur and subtle transparency.
            </p>
            <div className="surface-glass p-4 rounded-lg">
              <div className="text-sm font-medium">Glass Effect</div>
              <div className="text-xs text-muted-foreground">Backdrop blur enabled</div>
            </div>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="premium-backdrop rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Interactive Components
          </h2>
          
          <div className="grid grid-cols-4 gap-2 mb-6">
            <button 
              onClick={() => setActiveDemo("cards")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeDemo === "cards" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Cards
            </button>
            <button 
              onClick={() => setActiveDemo("buttons")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeDemo === "buttons" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Buttons
            </button>
            <button 
              onClick={() => setActiveDemo("inputs")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeDemo === "inputs" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Inputs
            </button>
            <button 
              onClick={() => setActiveDemo("effects")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeDemo === "effects" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Effects
            </button>
          </div>
          
          {activeDemo === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="premium-interactive bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Standard Card</h3>
                <p className="text-sm text-muted-foreground">
                  Hover to see the premium interaction effects.
                </p>
              </div>
              
              <div className="surface-glass rounded-lg p-4">
                <h3 className="font-semibold mb-2">Glass Card</h3>
                <p className="text-sm text-muted-foreground">
                  Beautiful glass morphism effect with backdrop blur.
                </p>
              </div>
            </div>
          )}
          
          {activeDemo === "buttons" && (
            <div className="flex flex-wrap gap-4">
              <button className="premium-interactive px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Primary
              </button>
              <button className="premium-interactive px-4 py-2 border border-border rounded-lg font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Outline
              </button>
              <button className="premium-shimmer px-4 py-2 bg-secondary rounded-lg font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Shimmer
              </button>
              <button className="premium-glow px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Glow Effect
              </button>
            </div>
          )}
          
          {activeDemo === "inputs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                placeholder="Premium input field..." 
                className="premium-interactive px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input 
                placeholder="Glass input..." 
                className="surface-glass px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          
          {activeDemo === "effects" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 premium-float text-center">
                <div className="text-sm font-medium">Float</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 premium-pulse text-center">
                <div className="text-sm font-medium">Pulse</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 premium-glow text-center">
                <div className="text-sm font-medium">Glow</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 premium-shimmer text-center">
                <div className="text-sm font-medium">Shimmer</div>
              </div>
            </div>
          )}
        </div>

        {/* Color Palette */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Premium Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600"></div>
              <div className="text-sm font-medium">Primary</div>
              <div className="text-xs text-muted-foreground">#6366f1</div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600"></div>
              <div className="text-sm font-medium">Danger</div>
              <div className="text-xs text-muted-foreground">#f43f5e</div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600"></div>
              <div className="text-sm font-medium">Success</div>
              <div className="text-xs text-muted-foreground">#10b981</div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600"></div>
              <div className="text-sm font-medium">Warning</div>
              <div className="text-xs text-muted-foreground">#f59e0b</div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"></div>
              <div className="text-sm font-medium">Muted</div>
              <div className="text-xs text-muted-foreground">Adaptive</div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-900 to-black dark:from-white dark:to-slate-100"></div>
              <div className="text-sm font-medium">Foreground</div>
              <div className="text-xs text-muted-foreground">Adaptive</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}