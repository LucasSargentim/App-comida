export interface FoodIngredient {
  name: string;
  portion: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
}

export interface MealAnalysis {
  dishName: string;
  confidence: number;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFats: number;
  ingredients: FoodIngredient[];
  nutritionalAssessment: string;
  nutrientSuggestions: string[];
  healthyAlternatives: string[];
}

export interface SampleMeal {
  id: string;
  title: string;
  category: "Almoço" | "Jantar" | "Café da Manhã" | "Lanche";
  imageUrl: string;
  description: string;
  analysis: MealAnalysis;
}

export const SAMPLE_MEALS: SampleMeal[] = [
  {
    id: "sample_pf",
    title: "Prato Feito Brasileiro (PF)",
    category: "Almoço",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    description: "O clássico almoço brasileiro: arroz, feijão, bife acebolado, batata frita e salada de folhas.",
    analysis: {
      dishName: "Prato Feito Brasileiro Tradicional",
      confidence: 0.96,
      totalCalories: 785,
      totalCarbs: 92,
      totalProtein: 45,
      totalFats: 26,
      ingredients: [
        { name: "Arroz Branco Cozido", portion: "150g (3 colheres de sopa cheias)", calories: 195, carbs: 42, protein: 4, fats: 0.5 },
        { name: "Feijão Carioca Cozido", portion: "100g (1 concha média)", calories: 76, carbs: 14, protein: 5, fats: 0.5 },
        { name: "Bife de Alcatra Grelhado", portion: "120g (1 unidade média)", calories: 230, carbs: 0, protein: 32, fats: 11 },
        { name: "Batata Frita Caseira", portion: "80g (1 porção pequena)", calories: 250, carbs: 32, protein: 3, fats: 13 },
        { name: "Salada de Alface e Tomate", portion: "50g (1 prato de sobremesa)", calories: 34, carbs: 4, protein: 1, fats: 1 }
      ],
      nutritionalAssessment: "Prato muito reconfortante e rico em proteínas magras provenientes do bife, além de oferecer energia rápida de carboidratos. No entanto, possui teor calórico e lipídico ligeiramente elevado devido à presença de batatas fritas.",
      nutrientSuggestions: [
        "Aumente a ingestão de fibras: Adicionar folhas escuras (como rúcula ou couve) e vegetais cozidos aumentaria o teor de fibras, melhorando a saciedade pulmonar.",
        "Selecione fontes de gordura saudáveis como azeite extra virgem cru para temperar a salada, em vez de focar em frituras."
      ],
      healthyAlternatives: [
        "Substitua os 80g de batata frita por batata doce assada com ervas no forno ou airfryer para reduzir a gordura adicionada em 80%.",
        "Troque o arroz branco por arroz integral ou quinoa para enriquecer com fibras alimentares e minerais, diminuindo o índice glicêmico geral do prato."
      ]
    }
  },
  {
    id: "sample_salad",
    title: "Salada Caesar com Frango Grelhado",
    category: "Jantar",
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80",
    description: "Salada leve com tiras de frango suculentas, croutons crocantes, lascas de parmesão e molho especial.",
    analysis: {
      dishName: "Salada Caesar com Frango Grelhado",
      confidence: 0.98,
      totalCalories: 435,
      totalCarbs: 16,
      totalProtein: 34,
      totalFats: 25,
      ingredients: [
        { name: "Cru de Peito de Frango Grelhado", portion: "120g (1 filé grande)", calories: 198, carbs: 0, protein: 30, fats: 7 },
        { name: "Alface Romana Fresca", portion: "100g (1 prato fundo cheio)", calories: 15, carbs: 3, protein: 1, fats: 0.2 },
        { name: "Queijo Parmesão Ralado", portion: "15g (1 colher de sopa)", calories: 60, carbs: 0.5, protein: 5, fats: 4 },
        { name: "Croutons de Pão Italiano", portion: "20g (1 punhado pequeno)", calories: 72, carbs: 12, protein: 1.5, fats: 2 },
        { name: "Molho Caesar Tradicional", portion: "20g (1 colher de sopa)", calories: 90, carbs: 0.5, protein: 0.5, fats: 9.8 }
      ],
      nutritionalAssessment: "Uma refeição leve, de baixa caloria e com excelente aporte biológico de proteínas magras para recuperação muscular. O molho Caesar é saboroso, porém concentra a maior parte das calorias gordurosas do prato.",
      nutrientSuggestions: [
        "Excelente balanço proteico. Adicione um pouco mais de cores no prato: vegetais ricos em licopeno e betacaroteno como tomate cereja ou cenoura ralada.",
        "Monitore o consumo das gorduras saturadas presentes no queijo parmesão e nas bases de maionese do molho tradicional."
      ],
      healthyAlternatives: [
        "Substitua o molho Caesar tradicional por um molho à base de iogurte desnatado, limão, mostarda e mel, reduzindo as calorias do molho de 90 kcal para apenas 25 kcal.",
        "Escolha croutons de pão integral assados com azeite e alecrim para adicionar mais micronutrientes e fibras complexas."
      ]
    }
  },
  {
    id: "sample_breakfast",
    title: "Café da Manhã com Ovos e Mamão",
    category: "Café da Manhã",
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    description: "Ovos mexidos com fios de azeite, torrada de pão integral multigrãos e uma fatia de mamão formosa com aveia.",
    analysis: {
      dishName: "Café da Manhã Funcional Completo",
      confidence: 0.95,
      totalCalories: 380,
      totalCarbs: 38,
      totalProtein: 19,
      totalFats: 16,
      ingredients: [
        { name: "Ovos Mexidos Grelhados", portion: "2 unidades inteiras", calories: 154, carbs: 1, protein: 12, fats: 11 },
        { name: "Torrada de Pão de Forma Integral", portion: "1 fatia (25g)", calories: 68, carbs: 12, protein: 3, fats: 1 },
        { name: "Mamão Formosa Fresco", portion: "1 fatia média (150g)", calories: 60, carbs: 15, protein: 1, fats: 0.1 },
        { name: "Aveia em Flocos Finos de Cobertura", portion: "15g (1 colher de sopa rasa)", calories: 58, carbs: 10, protein: 2.5, fats: 1 },
        { name: "Azeite de Oliva Extra Virgem (Preparo)", portion: "4g (meia colher de chá)", calories: 40, carbs: 0, protein: 0, fats: 4.5 }
      ],
      nutritionalAssessment: "Café da manhã de extrema excelência funcional e antioxidante. Os ovos fornecem colina e proteínas de alto valor biológico com boa saciedade. O mamão auxilia na perfeita digestibilidade gástrica graças à enzima papaína, e a aveia contribui com beta-glucanas para o controle glicêmico.",
      nutrientSuggestions: [
        "Excelente distribuição nutricional. Se você busca performance física de manhã, considere acrescentar 150ml de café preto sem açúcar para estímulo termogênico e foco metabólico adicionado."
      ],
      healthyAlternatives: [
        "Para reduzir o consumo de gorduras saturadas de manhã mantendo o volume de proteínas, utilize 1 ovo inteiro e 2 claras batidas.",
        "Salpique sementes de chia ou linhaça dourada moída para agregar ômega-3 anti-inflamatório à porção de mamão."
      ]
    }
  }
];
