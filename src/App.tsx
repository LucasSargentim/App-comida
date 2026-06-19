import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Flame, 
  Utensils, 
  Brain, 
  Plus, 
  History, 
  Trash2, 
  Layers, 
  ChevronRight, 
  Scale, 
  Info,
  Apple,
  Check,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { SAMPLE_MEALS, SampleMeal, MealAnalysis, FoodIngredient } from "./data";

export default function App() {
  // Application states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // History and total tracker
  const [history, setHistory] = useState<Array<{ id: string; timestamp: string; analysis: MealAnalysis; imageUrl: string | null }>>([]);
  
  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Active view tab state ("analyze" or "history")
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nutriscan_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        // Initialize history with a sample meal so the user has some initial data to see on first load
        const initialSample = {
          id: "initial_history_pf",
          timestamp: new Date().toLocaleString("pt-BR"),
          analysis: SAMPLE_MEALS[0].analysis,
          imageUrl: SAMPLE_MEALS[0].imageUrl
        };
        setHistory([initialSample]);
        localStorage.setItem("nutriscan_history", JSON.stringify([initialSample]));
      }
    } catch (e) {
      console.error("Não foi possível carregar o histórico:", e);
    }
  }, []);

  // Update localStorage when history changes
  const saveHistory = (newHistory: typeof history) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("nutriscan_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Não foi possível salvar o histórico:", e);
    }
  };

  // Convert files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor, selecione apenas arquivos de imagem comuns (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("A imagem selecionada é muito grande. Escolha uma foto com até 10 MB.");
      return;
    }

    setErrorMessage(null);
    setSelectedMimeType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      // Automatically triggers analysis or prompts
    };
    reader.onerror = () => {
      setErrorMessage("Ocorreu um erro ao carregar a imagem selecionada.");
    };
    reader.readAsDataURL(file);
  };

  // Handle drag/drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Analyze the current image
  const analyzeFoodImage = async (base64Data?: string, mime?: string) => {
    const imgToAnalyze = base64Data || selectedImage;
    const typeToAnalyze = mime || selectedMimeType;

    if (!imgToAnalyze) {
      setErrorMessage("Por favor, envie ou tire uma foto antes de iniciar a análise.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    // Strip out metadata if vorhanden (e.g. "data:image/jpeg;base64,")
    const cleanBase64 = imgToAnalyze.includes(",") 
      ? imgToAnalyze.split(",")[1] 
      : imgToAnalyze;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: cleanBase64,
          mimeType: typeToAnalyze || "image/jpeg"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro desconhecido ao processar sua foto de refeição.");
      }

      setAnalysisResult(data);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Não foi possível realizar a análise. Verifique sua conexão ou se inseriu a GEMINI_API_KEY no painel de segredos.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Setup sample food plate analysis
  const loadSampleAnalysis = (sample: SampleMeal) => {
    setErrorMessage(null);
    setSelectedImage(sample.imageUrl);
    setSelectedMimeType("image/jpeg");
    setAnalysisResult(sample.analysis);
  };

  // Save analysis to history/diary
  const handleSaveToDiary = () => {
    if (!analysisResult) return;

    const newRecord = {
      id: "meal_" + Date.now(),
      timestamp: new Date().toLocaleString("pt-BR", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric", 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
      analysis: analysisResult,
      imageUrl: selectedImage
    };

    const updated = [newRecord, ...history];
    saveHistory(updated);
    
    // Smooth scroll to history summary
    alert("Prato adicionado com sucesso ao seu histórico diário!");
  };

  // Delete item from history
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja realmente remover esta refeição do seu diário?")) {
      const updated = history.filter(item => item.id !== id);
      saveHistory(updated);
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (confirm("Aviso: Isso irá apagar todo o seu histórico de consumo de hoje. Continuar?")) {
      saveHistory([]);
    }
  };

  // Quick statistical indicators based on current history list
  const totalDailyCalories = history.reduce((sum, item) => sum + item.analysis.totalCalories, 0);
  const totalDailyCarbs = history.reduce((sum, item) => sum + item.analysis.totalCarbs, 0);
  const totalDailyProtein = history.reduce((sum, item) => sum + item.analysis.totalProtein, 0);
  const totalDailyFats = history.reduce((sum, item) => sum + item.analysis.totalFats, 0);

  // Targets for typical daily distribution (example standard)
  const targetCalories = 2000;
  const targetCarbs = 250;
  const targetProtein = 120;
  const targetFats = 70;

  // Calorie progress bar percentage
  const caloriePercentage = Math.min(Math.round((totalDailyCalories / targetCalories) * 100), 100);

  return (
    <div id="app" className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* HEADER SECTION IN VIBRANT EMERALD STYLE */}
      <nav id="navbar" className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold transition-transform hover:rotate-12">
            <Apple className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            NutriScan<span className="text-emerald-500">AI</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex gap-4 text-sm font-semibold text-slate-500">
            <button 
              onClick={() => setActiveTab("analyze")} 
              className={`pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "analyze" ? "border-emerald-500 text-emerald-600" : "border-transparent hover:text-slate-800"}`}
            >
              Análise e Scanner
            </button>
            <button 
              onClick={() => setActiveTab("history")} 
              className={`pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "history" ? "border-emerald-500 text-emerald-600" : "border-transparent hover:text-slate-800"}`}
            >
              Diário ({history.length})
            </button>
          </div>
          <div className="hidden sm:block text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-semibold uppercase tracking-wider">
            Alimentação Saudável
          </div>
        </div>
      </nav>

      {/* BANNER INSTRUÇÕES CHAVE DE API / INFO */}
      <div className="m-4 mx-4 md:mx-8 mb-0 p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-xs text-amber-900 text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex gap-2.5 items-start">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Dica de Configuração:</span> Este app faz chamadas reais via IA. Para analisar suas próprias fotos tiradas no celular ou computador, certifique-se de preencher o seu <span className="font-bold underline">GEMINI_API_KEY</span> no painel de segredos do AI Studio localizado em <span className="font-bold">Settings &gt; Secrets</span> no topo. Se não tiver uma chave configurada no momento, sinta-se à vontade para clicar em qualquer prato de demonstração abaixo para simular instantaneamente os resultados!
          </div>
        </div>
      </div>

      {/* PRINCIPAL COMPONENT GRID */}
      <div className="flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA (UPLOAD, SCANNER & PRESETS) - COBRE 7 COLUNAS EM TELAS GRANDES */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* PAINEL DE METAS DIÁRIAS COMPACTO */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5 text-slate-800">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base">Meta e Consumo Diário</h3>
              </div>
              <button 
                onClick={handleClearAllHistory}
                disabled={history.length === 0}
                className="text-xs flex items-center gap-1 text-rose-500 hover:text-rose-700 disabled:opacity-40 transition-colors pointer-events-auto cursor-pointer font-medium"
                title="Apagar dados e reiniciar o dia"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Limpar Dia
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Calorias totais do dia */}
              <div className="bg-emerald-500 rounded-2xl p-4 text-white flex flex-col justify-between">
                <span className="text-xs font-medium opacity-90 uppercase tracking-wider">Consumidas</span>
                <span className="text-3xl font-black mt-1">{totalDailyCalories} <span className="text-xs font-normal">kcal</span></span>
                <div className="mt-2 w-full bg-white/25 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-white h-full" style={{ width: `${caloriePercentage}%` }}></div>
                </div>
                <span className="text-[10px] mt-1 opacity-80 font-mono">Meta: {targetCalories} kcal ({caloriePercentage}%)</span>
              </div>

              {/* Carboidratos */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Carboidratos</span>
                <span className="text-2xl font-black text-amber-900 mt-1">{totalDailyCarbs}g</span>
                <span className="text-[11px] text-amber-700 font-medium">Meta: {targetCarbs}g</span>
              </div>

              {/* Proteínas */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Proteínas</span>
                <span className="text-2xl font-black text-blue-900 mt-1">{totalDailyProtein}g</span>
                <span className="text-[11px] text-blue-700 font-medium">Meta: {targetProtein}g</span>
              </div>

              {/* Gorduras */}
              <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gorduras</span>
                <span className="text-2xl font-black text-slate-800 mt-1">{totalDailyFats}g</span>
                <span className="text-[11px] text-slate-600 font-medium">Meta: {targetFats}g</span>
              </div>
            </div>
          </div>

          {activeTab === "analyze" ? (
            <>
              {/* INTERACTIVE SCANNER / UPLOAD AREA */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-500" /> Scanner de Comida por IA
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Envie a imagem da sua refeição para estimar instantaneamente os macronutrientes.</p>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-800 flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="leading-normal">{errorMessage}</div>
                  </div>
                )}

                {/* DROPZONE / VIEWER */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative min-h-[340px] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all overflow-hidden ${
                    selectedImage ? "border-emerald-500/50" : isDragging ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  {selectedImage ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-900 group">
                      <img 
                        src={selectedImage} 
                        alt="Prato selecionado" 
                        className="w-full h-full object-contain"
                      />
                      
                      {/* VIBRANT SCANNING GRID & LASER */}
                      {isAnalyzing && (
                        <>
                          <div className="absolute inset-0 bg-transparent flex flex-col items-center pointer-events-none z-10">
                            {/* Pulse animation horizontal line */}
                            <div className="w-[90%] h-1 bg-emerald-400/80 shadow-[0_0_18px_rgba(52,211,153,1)] animate-bounce mt-24"></div>
                          </div>
                          <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-xs flex items-center justify-center z-20">
                            <div className="bg-white/95 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse border border-emerald-100">
                              <Sparkles className="w-5 h-5 text-emerald-500 animate-spin" />
                              <span className="text-sm font-bold text-slate-800">IA analisando prato e porções...</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Corner crop borders aesthetic mimicking computer vision tracking */}
                      <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl pointer-events-none"></div>
                      <div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl pointer-events-none"></div>
                      <div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl pointer-events-none"></div>
                      <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-emerald-400 rounded-br-xl pointer-events-none"></div>

                      {!isAnalyzing && (
                        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-white opacity-90 font-medium">
                          MIME: {selectedMimeType?.split("/")[1]?.toUpperCase() || "JPEG"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-6 max-w-md flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 text-emerald-500">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-slate-700 text-lg mb-1">Arraste a foto do seu prato aqui</h3>
                      <p className="text-sm text-slate-400 mb-6">Ou selecione um arquivo de imagem do seu celular ou computador para calcular.</p>
                      
                      <label className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-transform active:scale-[0.98] cursor-pointer inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Escolher Imagem
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* BOTÕES DE CONFIGURAÇÃO E SUBMISSÃO DA ANÁLISE */}
                {selectedImage && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => analyzeFoodImage()}
                      disabled={isAnalyzing}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.99] pointer-events-auto"
                    >
                      <Sparkles className="w-5 h-5 text-emerald-100 animate-pulse" />
                      {isAnalyzing ? "Analisando..." : "Realizar Análise de Calorias com IA"}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedMimeType(null);
                        setAnalysisResult(null);
                        setErrorMessage(null);
                      }}
                      disabled={isAnalyzing}
                      className="px-5 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-700 disabled:opacity-50 transition-colors cursor-pointer pointer-events-auto text-sm"
                    >
                      Remover Foto
                    </button>
                  </div>
                )}
              </div>

              {/* DEMONSTRAÇÕES RÁPIDAS (PORTUGUESE PRESET PLATES) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800 text-base">Testar sem câmera? Use as amostras abaixo:</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4 font-sans">
                  Não possui foto agora? Clique em uma das refeições brasileiras abaixo para carregar as fotos reais estruturadas e ver como o sistema responde instantaneamente à distribuição energética:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SAMPLE_MEALS.map((sample) => (
                    <div 
                      key={sample.id}
                      onClick={() => loadSampleAnalysis(sample)}
                      className="group bg-slate-50 hover:bg-emerald-50/50 rounded-2xl p-3 border border-slate-200/60 hover:border-emerald-200 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2">
                          <img 
                            src={sample.imageUrl} 
                            alt={sample.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-800 px-2 py-0.5 rounded-md">
                            {sample.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-emerald-700">{sample.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{sample.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/50 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">{sample.analysis.totalCalories} kcal</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          Ver análise <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* VISUALIZAÇÃO DE HISTÓRICO / COMPONENTES DO DIÁRIO */
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-500" /> Histórico Diário de Alimentação
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">Seu registro local de refeições analisadas para controle de dieta saudável.</p>
                </div>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                  {history.length} {history.length === 1 ? "refeição" : "refeições"}
                </span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg mb-1">Seu diário está em branco</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                    Mande fotos de alimentos ou use os pratos pré-definidos na aba de análise para iniciar o seu acompanhamento nutricional.
                  </p>
                  <button 
                    onClick={() => setActiveTab("analyze")}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl text-sm"
                  >
                    Analisar Novo Prato
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setAnalysisResult(item.analysis);
                        setSelectedImage(item.imageUrl);
                        setActiveTab("analyze");
                      }}
                      className="group bg-slate-50/70 hover:bg-emerald-50/30 p-4 rounded-2xl border border-slate-200/60 hover:border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all cursor-pointer"
                    >
                      <div className="flex gap-4 items-center">
                        {item.imageUrl ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                            <img src={item.imageUrl} alt={item.analysis.dishName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-500">
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{item.timestamp}</span>
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{item.analysis.dishName}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-500" /> {item.analysis.totalCalories} kcal</span>
                            <span>•</span>
                            <span>C: {item.analysis.totalCarbs}g</span>
                            <span>P: {item.analysis.totalProtein}g</span>
                            <span>G: {item.analysis.totalFats}g</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                        <span className="text-emerald-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Visualizar Relatório &rarr;</span>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-1 px-1.5 bg-white hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-100 transition-colors"
                          title="Remover refeição do diário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* COLUNA DIREITA (RELATÓRIO DE NUTRICIONISTA IA) - COBRE 5 COLUNAS EM TELAS GRANDES */}
        <section className="lg:col-span-12 xl:col-span-5 lg:order-last">
          
          {analysisResult ? (
            <div className="flex flex-col gap-5">
              
              {/* COMPONENTE PRINCIPAL DO RESULTADO DE CALORIAS */}
              <div className="bg-emerald-500 rounded-[32px] p-6 text-white shadow-md relative overflow-hidden">
                {/* Decorative glowing circles */}
                <div className="absolute top-[-50px] right-[-30px] w-48 h-48 bg-emerald-400/35 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="bg-emerald-700/50 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest font-extrabold uppercase inline-block">
                      Resultado da Análise IA
                    </span>
                    <h2 className="text-xl font-extrabold mt-1.5 line-clamp-2 leading-tight">
                      {analysisResult.dishName}
                    </h2>
                  </div>
                  <div className="bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 tracking-wider">
                    DE CONFIANÇA {(analysisResult.confidence * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="my-6 relative z-10">
                  <span className="text-xs font-medium opacity-90 uppercase tracking-widest">Calorias Estimadas</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-6xl font-black tracking-tight">{analysisResult.totalCalories}</span>
                    <span className="text-2xl font-semibold opacity-90">kcal</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20 flex justify-between gap-2 text-xs font-extrabold relative z-10">
                  <div className="flex-1 bg-white/10 p-2.5 rounded-xl">
                    <span className="block opacity-75 text-[10px] uppercase font-bold tracking-wider">Carboidratos</span>
                    <span className="text-xl font-black block mt-0.5">{analysisResult.totalCarbs}g</span>
                  </div>
                  <div className="flex-1 bg-white/10 p-2.5 rounded-xl">
                    <span className="block opacity-75 text-[10px] uppercase font-bold tracking-wider">Proteínas</span>
                    <span className="text-xl font-black block mt-0.5">{analysisResult.totalProtein}g</span>
                  </div>
                  <div className="flex-1 bg-white/10 p-2.5 rounded-xl">
                    <span className="block opacity-75 text-[10px] uppercase font-bold tracking-wider">Gorduras</span>
                    <span className="text-xl font-black block mt-0.5">{analysisResult.totalFats}g</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-3 relative z-10">
                  <button
                    onClick={handleSaveToDiary}
                    className="flex-1 bg-white text-emerald-950 hover:bg-emerald-50 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Salvar no Diário
                  </button>
                </div>
              </div>

              {/* DETALHAMENTO DE CADA INGREDIENTE */}
              <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-500" /> Detalhamento de Itens
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Porções e macronutrientes estimados de cada alimento de forma individual:</p>
                </div>

                <div className="space-y-3.5 divide-y divide-slate-100">
                  {analysisResult.ingredients.map((ing, idx) => (
                    <div key={idx} className={`pt-3.5 ${idx === 0 ? "pt-0 border-t-0" : ""}`}>
                      <div className="flex justify-between items-start mb-1 text-sm font-bold text-slate-800">
                        <span>{ing.name}</span>
                        <span className="text-emerald-600 font-mono font-bold shrink-0">{ing.calories} kcal</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Porção: {ing.portion}</span>
                        <div className="flex items-center gap-2.5 font-mono text-[10px]">
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">C: {ing.carbs}g</span>
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">P: {ing.protein}g</span>
                          <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">G: {ing.fats}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AVALIAÇÃO DO NUTRICIONISTA */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 text-sm my-1">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2 text-sm">
                    <Brain className="w-4 h-4 text-emerald-500" /> Parecer Geral do Especialista
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed font-sans">{analysisResult.nutritionalAssessment}</p>
                </div>

                {/* DICAS DE NUTRIENTES CARENTES */}
                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/60">
                  <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> AI Sugestões de Nutrientes
                  </h4>
                  <ul className="text-xs text-emerald-900/95 space-y-2 leading-relaxed">
                    {analysisResult.nutrientSuggestions.map((sug, sIdx) => (
                      <li key={sIdx} className="flex gap-2">
                        <span className="text-emerald-500 font-bold">&bull;</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* SUBSTITUIÇÕES SAUDÁVEIS */}
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                  <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600 animate-pulse" /> Alternativas para Enriquecer o Prato
                  </h4>
                  <ul className="text-xs text-amber-900/95 space-y-2 leading-relaxed">
                    {analysisResult.healthyAlternatives.map((alt, aIdx) => (
                      <li key={aIdx} className="flex gap-2">
                        <span className="text-amber-500 font-bold">&rarr;</span>
                        <span>{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          ) : (
            /* EMPTY REPORT STATE */
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 text-center flex flex-col items-center justify-center min-h-[460px] shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                <Brain className="w-10 h-10 text-emerald-500/55" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-2">Aguardando Foto de Prato</h3>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Tire ou envie uma foto ou use um prato de exemplo ao lado para gerar o relatório profissional completo de calorias, macronutrientes e sugestões da nossa inteligência artificial do Gemini.
              </p>
              
              <div className="mt-8 pt-6 border-t border-slate-100 w-full text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">O que nossa IA analisa:</h4>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2 bg-slate-55 p-1.5 rounded">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[9px]">1</div>
                    <span>Estimativa individualizada de porções</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-55 p-1.5 rounded">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[9px]">2</div>
                    <span>Corte fiel de carboidrato, proteína e energia</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-55 p-1.5 rounded">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[9px]">3</div>
                    <span>Recomendações e substituições funcionais de saúde</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>

      </div>

      {/* FOOTER */}
      <footer id="footer" className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; 2026 NutriScan AI. Todos os direitos reservados.</span>
          <span className="flex items-center gap-1.5">
            Alimentado por <span className="font-bold text-emerald-500">Gemini 3.5 Flash</span> no Google AI Studio
          </span>
        </div>
      </footer>
    </div>
  );
}
