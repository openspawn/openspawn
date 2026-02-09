import { useState, useEffect } from "react";
import { Check, Palette, Paintbrush } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { 
  AVATAR_STYLES, 
  BACKGROUND_COLORS,
  BACKGROUND_TYPES,
  type AvatarStyleKey,
  type BackgroundColorKey,
  type BackgroundTypeKey,
  getAvatarSettings, 
  setAvatarStyle,
  setBackgroundColor,
  setBackgroundType,
  generateStylePreview,
  generateBackgroundPreview,
} from "../../lib/avatar";

export function AppearanceSettings() {
  const [settings, setSettings] = useState(getAvatarSettings);
  const [previewSeed] = useState(() => `preview-${Date.now()}`);

  // Listen for external changes
  useEffect(() => {
    const handleChange = () => {
      setSettings(getAvatarSettings());
    };
    window.addEventListener('avatar-style-changed', handleChange as EventListener);
    return () => window.removeEventListener('avatar-style-changed', handleChange as EventListener);
  }, []);

  function handleStyleSelect(style: AvatarStyleKey) {
    setAvatarStyle(style);
  }

  function handleBgColorSelect(color: BackgroundColorKey) {
    setBackgroundColor(color);
  }

  function handleBgTypeSelect(type: BackgroundTypeKey) {
    setBackgroundType(type);
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
      {/* Avatar Style Card */}
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
              src={generateStylePreview(settings.style, previewSeed)} 
              alt="Current style preview"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <p className="font-medium">{AVATAR_STYLES[settings.style].name}</p>
              <p className="text-sm text-muted-foreground">{AVATAR_STYLES[settings.style].description}</p>
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
                  const isSelected = settings.style === styleKey;
                  
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
        </CardContent>
      </Card>

      {/* Background Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Background Style
          </CardTitle>
          <CardDescription>
            Customize avatar background colors. "Level-Based" uses different colors for each agent level (L10=pink, L9=purple, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Background Type */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Background Type</h4>
            <div className="flex gap-3">
              {Object.entries(BACKGROUND_TYPES).map(([key, info]) => {
                const isSelected = settings.bgType === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleBgTypeSelect(key as BackgroundTypeKey)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-muted bg-muted/30 hover:border-muted-foreground/30"
                    }`}
                  >
                    {info.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Color Scheme</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Object.entries(BACKGROUND_COLORS).map(([key, info]) => {
                const isSelected = settings.bgColor === key;
                const bgColorKey = key as BackgroundColorKey;
                
                return (
                  <button
                    key={key}
                    onClick={() => handleBgColorSelect(bgColorKey)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:bg-accent/50 ${
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-transparent bg-muted/30 hover:border-muted-foreground/20"
                    }`}
                    title={info.description}
                  >
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <img 
                      src={generateBackgroundPreview(bgColorKey, settings.bgType, previewSeed)} 
                      alt={info.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <span className="text-[10px] font-medium text-center leading-tight">
                      {info.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample agents preview with levels */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Preview across agent levels</h4>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                { seed: "agent-dennis", level: 10, label: "L10 COO" },
                { seed: "tech-talent", level: 9, label: "L9 HR" },
                { seed: "marketing-lead", level: 7, label: "L7 Mgr" },
                { seed: "code-reviewer", level: 6, label: "L6 Sr" },
                { seed: "data-analyst", level: 4, label: "L4 Wkr" },
                { seed: "new-intern", level: 2, label: "L2 Prob" },
              ].map(({ seed, level, label }) => (
                <div key={seed} className="flex flex-col items-center gap-1 shrink-0">
                  <img 
                    src={generateStylePreview(settings.style, seed, 64, level)} 
                    alt={seed}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            {settings.bgColor === 'levelBased' && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 With "Level-Based" colors, each level has a distinct color for quick visual hierarchy.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
