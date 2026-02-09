import { useState, useEffect } from "react";
import { Check, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { 
  AVATAR_STYLES, 
  type AvatarStyleKey, 
  getAvatarStyle, 
  setAvatarStyle,
  generateStylePreview 
} from "../../lib/avatar";

export function AppearanceSettings() {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleKey>(getAvatarStyle());
  const [previewSeed] = useState(() => `preview-${Date.now()}`);

  // Listen for external changes
  useEffect(() => {
    const handleChange = (e: CustomEvent<AvatarStyleKey>) => {
      setSelectedStyle(e.detail);
    };
    window.addEventListener('avatar-style-changed', handleChange as EventListener);
    return () => window.removeEventListener('avatar-style-changed', handleChange as EventListener);
  }, []);

  function handleStyleSelect(style: AvatarStyleKey) {
    setSelectedStyle(style);
    setAvatarStyle(style);
  }

  // Group styles into categories
  const styleCategories = {
    "Robots & Tech": ["bottts", "botttsNeutral", "glass", "shapes", "rings", "identicon", "icons"],
    "Pixel Art": ["pixelArt", "pixelArtNeutral", "miniavs"],
    "Illustrated": ["lorelei", "loreleiNeutral", "notionists", "notionistsNeutral", "openPeeps", "personas", "dylan", "micah"],
    "Fun & Playful": ["funEmoji", "thumbs", "bigSmile", "croodles", "croodlesNeutral"],
    "Characters": ["adventurer", "adventurerNeutral", "bigEars", "bigEarsNeutral"],
    "Simple": ["initials"],
  } as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Avatar Style
          </CardTitle>
          <CardDescription>
            Choose a consistent avatar style for all agents. Each agent will still have a unique avatar based on their ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current selection preview */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <img 
              src={generateStylePreview(selectedStyle, previewSeed)} 
              alt="Current style preview"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <p className="font-medium">{AVATAR_STYLES[selectedStyle].name}</p>
              <p className="text-sm text-muted-foreground">{AVATAR_STYLES[selectedStyle].description}</p>
            </div>
          </div>

          {/* Style categories */}
          {Object.entries(styleCategories).map(([category, styles]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {styles.map((styleKey) => {
                  const styleInfo = AVATAR_STYLES[styleKey as AvatarStyleKey];
                  if (!styleInfo) return null;
                  const isSelected = selectedStyle === styleKey;
                  
                  return (
                    <button
                      key={styleKey}
                      onClick={() => handleStyleSelect(styleKey as AvatarStyleKey)}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:bg-accent/50 ${
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-transparent bg-muted/30 hover:border-muted-foreground/20"
                      }`}
                      title={styleInfo.description}
                    >
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <img 
                        src={generateStylePreview(styleKey as AvatarStyleKey, previewSeed)} 
                        alt={styleInfo.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <span className="text-[10px] font-medium text-center leading-tight">
                        {styleInfo.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sample agents preview */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Preview with sample agents</h4>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {["agent-dennis", "tech-talent", "marketing-lead", "code-reviewer", "data-analyst", "support-bot"].map((seed, i) => (
                <div key={seed} className="flex flex-col items-center gap-1 shrink-0">
                  <img 
                    src={generateStylePreview(selectedStyle, seed)} 
                    alt={seed}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-[9px] text-muted-foreground">L{10 - i}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
