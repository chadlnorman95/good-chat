"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Input } from "ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
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
  Magic,
  Wand2,
  Shine
} from "lucide-react";

export function PremiumShowcase() {
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
            <Button className="premium-interactive premium-shadow">
              <Sparkles className="h-4 w-4 mr-2" />
              Explore Features
            </Button>
            <Button variant="outline" className="premium-interactive">
              <Eye className="h-4 w-4 mr-2" />
              View Components
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="premium-interactive premium-float">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Premium Colors</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Enhanced color palette with beautiful gradients and improved contrast ratios.
              </p>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-interactive premium-float" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Smooth Animations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Buttery smooth animations with premium easing curves and micro-interactions.
              </p>
              <Button className="premium-pulse w-full">
                <Magic className="h-4 w-4 mr-2" />
                Animated Button
              </Button>
            </CardContent>
          </Card>

          <Card className="premium-interactive premium-float" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Gem className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Glass Morphism</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Beautiful glass effects with backdrop blur and subtle transparency.
              </p>
              <div className="surface-glass p-4 rounded-lg">
                <div className="text-sm font-medium">Glass Effect</div>
                <div className="text-xs text-muted-foreground">Backdrop blur enabled</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Demo */}
        <Card className="premium-backdrop">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Interactive Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeDemo} onValueChange={setActiveDemo}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="buttons">Buttons</TabsTrigger>
                <TabsTrigger value="inputs">Inputs</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cards" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="premium-interactive">
                    <CardHeader>
                      <CardTitle className="text-base">Standard Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Hover to see the premium interaction effects.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="surface-glass">
                    <CardHeader>
                      <CardTitle className="text-base">Glass Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Beautiful glass morphism effect with backdrop blur.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="buttons" className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button className="premium-interactive">
                    <Star className="h-4 w-4 mr-2" />
                    Primary
                  </Button>
                  <Button variant="outline" className="premium-interactive">
                    <Heart className="h-4 w-4 mr-2" />
                    Outline
                  </Button>
                  <Button variant="secondary" className="premium-shimmer">
                    <Shine className="h-4 w-4 mr-2" />
                    Shimmer
                  </Button>
                  <Button className="premium-glow">
                    <Rocket className="h-4 w-4 mr-2" />
                    Glow Effect
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="inputs" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Premium input field..." className="premium-interactive" />
                  <Input placeholder="Glass input..." className="surface-glass" />
                </div>
              </TabsContent>
              
              <TabsContent value="effects" className="space-y-4">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Features List */}
        <Card className="surface-glass">
          <CardHeader>
            <CardTitle>✨ What's New in Premium UI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <Sparkles className="h-3 w-3" />
                  </Badge>
                  <div>
                    <div className="font-medium">Enhanced Color System</div>
                    <div className="text-sm text-muted-foreground">
                      Premium indigo brand color with beautiful gradients
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <Zap className="h-3 w-3" />
                  </Badge>
                  <div>
                    <div className="font-medium">Smooth Animations</div>
                    <div className="text-sm text-muted-foreground">
                      Premium easing curves and micro-interactions
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <Gem className="h-3 w-3" />
                  </Badge>
                  <div>
                    <div className="font-medium">Glass Morphism</div>
                    <div className="text-sm text-muted-foreground">
                      Beautiful backdrop blur and transparency effects
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <Crown className="h-3 w-3" />
                  </Badge>
                  <div>
                    <div className="font-medium">Premium Shadows</div>
                    <div className="text-sm text-muted-foreground">
                      Multi-layered shadows with brand color accents
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <Magic className="h-3 w-3" />
                  </Badge>
                  <div>
                    <div className="font-medium">Interactive Effects</div>
                    <div className="text-sm text-muted-foreground">
                      Hover states, focus rings, and press animations
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <Palette className="h-3 w-3" />
                  </Badge>
                  <div>
                    <div className="font-medium">Typography Polish</div>
                    <div className="text-sm text-muted-foreground">
                      Enhanced font features and improved readability
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}