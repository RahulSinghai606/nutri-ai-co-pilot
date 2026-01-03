import { AnalysisResult, IngredientCategory, Tradeoff } from "@/types/analysis";

// Demo scenario: Doritos Nacho Cheese
export const doritosAnalysis: AnalysisResult = {
  id: "doritos-demo",
  productName: "Doritos Nacho Cheese",
  verdict: "caution",
  confidence: 72,
  summary: "This product is generally fine for occasional consumption but contains artificial colors and flavor enhancers that some people prefer to avoid. The MSG and artificial dyes are the main points worth knowing about.",
  detectedContext: "Snack food for adults",
  contextNote: "I noticed this is a classic snack chip. I've focused on additives, artificial colors, and sodium content.",
  categories: [
    {
      name: "Base Ingredients",
      icon: "🌽",
      ingredients: [
        { commonName: "Corn", explanation: "The primary ingredient - ground corn forms the base of the chip", safety: "safe" },
        { commonName: "Vegetable Oil", scientificName: "Corn, Canola, Sunflower", explanation: "Used for frying and texture", safety: "safe" },
        { commonName: "Maltodextrin", explanation: "A corn-derived carbohydrate used as a flavor carrier", safety: "safe" },
      ],
    },
    {
      name: "Cheese & Dairy",
      icon: "🧀",
      ingredients: [
        { commonName: "Cheddar Cheese", explanation: "Real cheese powder for authentic flavor", safety: "safe" },
        { commonName: "Whey", explanation: "Milk protein that adds savory taste", safety: "safe" },
        { commonName: "Buttermilk", explanation: "Adds tangy dairy flavor", safety: "safe" },
        { commonName: "Romano Cheese", explanation: "Aged cheese for depth of flavor", safety: "safe" },
      ],
    },
    {
      name: "Flavor Enhancers",
      icon: "✨",
      aiNote: "This category contains ingredients that intensify flavor perception. While FDA-approved, some people report sensitivity.",
      ingredients: [
        { 
          commonName: "MSG", 
          scientificName: "Monosodium Glutamate", 
          explanation: "A flavor enhancer that's been controversial but is FDA-approved", 
          safety: "moderate",
          detailedInfo: "MSG enhances umami (savory) taste. Despite past concerns, extensive research hasn't proven harmful effects at normal consumption levels. Some people report sensitivity symptoms."
        },
        { 
          commonName: "Disodium Inosinate", 
          explanation: "Works with MSG to boost savory flavor", 
          safety: "moderate" 
        },
        { 
          commonName: "Disodium Guanylate", 
          explanation: "Another MSG-type flavor enhancer", 
          safety: "moderate" 
        },
      ],
    },
    {
      name: "Artificial Colors",
      icon: "🎨",
      aiNote: "These synthetic dyes are approved in the US but banned or require warnings in some other countries.",
      ingredients: [
        { 
          commonName: "Yellow 5", 
          scientificName: "Tartrazine", 
          explanation: "Synthetic dye linked to hyperactivity in some studies", 
          safety: "concern",
          detailedInfo: "Yellow 5 is one of the most studied food dyes. Some research links it to behavioral changes in children. The EU requires a warning label; the US does not."
        },
        { 
          commonName: "Yellow 6", 
          scientificName: "Sunset Yellow", 
          explanation: "Another synthetic dye with similar concerns", 
          safety: "concern" 
        },
        { 
          commonName: "Red 40", 
          scientificName: "Allura Red", 
          explanation: "The most widely used red dye in the US", 
          safety: "concern",
          detailedInfo: "Red 40 is petroleum-derived. While FDA considers it safe, some studies suggest it may affect attention in sensitive children."
        },
      ],
    },
  ],
  tradeoffs: [
    {
      ingredient: "Artificial Colors (Yellow 5, 6, Red 40)",
      why: "These dyes create the vibrant orange color that's become iconic to the brand. Natural alternatives like turmeric or paprika would change the color and potentially the taste.",
      concern: "Multiple studies have linked artificial food dyes to hyperactivity in some children. Several countries require warning labels or have banned certain dyes.",
      reality: "At typical consumption levels, most adults won't notice effects. If you have children or are sensitive to additives, you might prefer naturally-colored alternatives like Siete chips."
    },
    {
      ingredient: "Monosodium Glutamate (MSG)",
      why: "MSG creates that intensely savory, 'can't stop eating' quality. It's the same compound naturally found in tomatoes, parmesan, and soy sauce.",
      concern: "Some people report 'MSG symptom complex' - headaches, flushing, or sweating after consuming MSG. However, controlled studies haven't consistently reproduced these effects.",
      reality: "MSG is one of the most studied food additives and is considered safe by FDA, WHO, and scientific consensus. If you've never noticed issues, you're probably fine."
    },
  ],
};

// Demo scenario: Protein Bar
export const proteinBarAnalysis: AnalysisResult = {
  id: "protein-bar-demo",
  productName: "Protein Power Bar",
  verdict: "safe",
  confidence: 85,
  summary: "This protein bar uses quality protein sources and sugar alternatives. While it's processed, it's a reasonable choice for a convenient protein boost. Watch out for digestive sensitivity to sugar alcohols.",
  detectedContext: "Fitness/protein supplement",
  contextNote: "I see this is a protein-focused product. I've emphasized protein quality, sweetener types, and overall nutritional balance.",
  categories: [
    {
      name: "Protein Sources",
      icon: "💪",
      ingredients: [
        { commonName: "Whey Protein Isolate", explanation: "High-quality, fast-absorbing protein from milk", safety: "safe" },
        { commonName: "Milk Protein Isolate", explanation: "Blend of casein and whey for sustained release", safety: "safe" },
        { commonName: "Calcium Caseinate", explanation: "Slow-digesting milk protein", safety: "safe" },
      ],
    },
    {
      name: "Sweeteners",
      icon: "🍯",
      aiNote: "Multiple sweeteners are used to achieve sweetness without sugar. This is common in 'healthy' products.",
      ingredients: [
        { commonName: "Erythritol", explanation: "A sugar alcohol with minimal calories and blood sugar impact", safety: "safe" },
        { commonName: "Stevia", scientificName: "Steviol Glycosides", explanation: "Natural zero-calorie sweetener from leaves", safety: "safe" },
        { commonName: "Sucralose", explanation: "Artificial sweetener 600x sweeter than sugar", safety: "moderate" },
      ],
    },
    {
      name: "Fiber & Texture",
      icon: "🌾",
      ingredients: [
        { commonName: "Soluble Corn Fiber", explanation: "Added fiber that also helps with texture", safety: "safe" },
        { commonName: "Almonds", explanation: "Whole nuts for texture and healthy fats", safety: "safe" },
        { commonName: "Palm Kernel Oil", explanation: "Used for chocolate coating texture", safety: "moderate" },
      ],
    },
  ],
  tradeoffs: [
    {
      ingredient: "Sugar Alcohols (Erythritol)",
      why: "Erythritol provides sweetness without spiking blood sugar or adding significant calories. It's popular in keto and low-carb products.",
      concern: "Sugar alcohols can cause digestive issues (bloating, gas) in some people, especially in larger amounts.",
      reality: "Erythritol is actually the best-tolerated sugar alcohol. Start with half a bar if you're new to it. Most people adapt within a few days."
    },
  ],
};

// Demo scenario: Baby Food
export const babyFoodAnalysis: AnalysisResult = {
  id: "baby-food-demo",
  productName: "Organic Apple Banana Oats",
  verdict: "safe",
  confidence: 94,
  summary: "This is a clean, simple baby food with organic ingredients. The short ingredient list is exactly what you want to see. Vitamin C is added for nutrition and preservation - completely safe.",
  detectedContext: "Baby/infant food",
  contextNote: "⚠️ I detected this is baby food. I've applied extra scrutiny for infant safety and flagged anything that might need pediatrician consultation.",
  categories: [
    {
      name: "Fruits",
      icon: "🍎",
      ingredients: [
        { commonName: "Organic Apples", explanation: "Simple, whole fruit - great first food", safety: "safe" },
        { commonName: "Organic Bananas", explanation: "Easy to digest, naturally sweet", safety: "safe" },
      ],
    },
    {
      name: "Grains",
      icon: "🌾",
      ingredients: [
        { commonName: "Organic Oats", explanation: "Whole grain, good source of fiber for babies", safety: "safe" },
      ],
    },
    {
      name: "Additions",
      icon: "✨",
      ingredients: [
        { commonName: "Water", explanation: "For texture consistency", safety: "safe" },
        { commonName: "Organic Cinnamon", explanation: "Natural flavor, very small amount", safety: "safe" },
        { commonName: "Vitamin C", scientificName: "Ascorbic Acid", explanation: "Added vitamin, also acts as natural preservative", safety: "safe" },
      ],
    },
  ],
  tradeoffs: [],
};

export const demoScenarios = [
  {
    name: "Doritos Nacho Cheese",
    description: "Popular snack with artificial colors & MSG",
    input: "Corn, Vegetable Oil (Corn, Canola, and/or Sunflower Oil), Maltodextrin (Made From Corn), Salt, Cheddar Cheese (Milk, Cheese Cultures, Salt, Enzymes), Whey, Monosodium Glutamate, Buttermilk, Romano Cheese (Part-Skim Cow's Milk, Cheese Cultures, Salt, Enzymes), Whey Protein Concentrate, Onion Powder, Corn Flour, Natural and Artificial Flavors, Dextrose, Tomato Powder, Lactose, Spices, Artificial Color (Yellow 6, Yellow 5, and Red 40), Lactic Acid, Citric Acid, Sugar, Garlic Powder, Skim Milk, Red and Green Bell Pepper Powder, Disodium Inosinate, Disodium Guanylate",
    result: doritosAnalysis,
  },
  {
    name: "Protein Bar",
    description: "\"Healthy\" bar reality check",
    input: "Protein Blend (Whey Protein Isolate, Milk Protein Isolate), Soluble Corn Fiber, Almonds, Water, Erythritol, Natural Flavors, Palm Kernel Oil, Cocoa Processed with Alkali, Calcium Caseinate, Contains Less Than 2% of: Sea Salt, Sunflower Lecithin, Steviol Glycosides (Stevia), Sucralose",
    result: proteinBarAnalysis,
  },
  {
    name: "Baby Food",
    description: "Clean organic option",
    input: "Organic Apples, Organic Bananas, Organic Oats, Water, Organic Cinnamon, Ascorbic Acid (Vitamin C)",
    result: babyFoodAnalysis,
  },
];

export const suggestedQuestions = [
  "Is this okay for kids?",
  "What's the worst ingredient?",
  "Compare to whole foods",
  "Is this pregnancy safe?",
  "What would a nutritionist say?",
  "Should I worry about the sodium?",
];
