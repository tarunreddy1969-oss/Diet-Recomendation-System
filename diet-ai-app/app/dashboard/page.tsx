'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getAuthInstance, getFirestoreInstance } from '../../lib/firebase';
import Navbar from '../../components/navbar';
import FoodScanner from '../../components/FoodScanner';
import MacroChart from '../../components/MacroChart';
import { 
  Dumbbell, 
  Flame, 
  Scale, 
  User as UserIcon, 
  Clock, 
  Check, 
  RotateCcw, 
  Droplet, 
  Sparkles,
  Search,
  BookOpen,
  Plus,
  TrendingUp,
  Apple,
  Utensils,
  Award,
  ChevronRight,
  ShieldAlert,
  Minus,
  Sliders,
  Sparkle
} from 'lucide-react';

import recipesJson from '../../data/recipes.json';

const MASTER_RECIPES = recipesJson as Recipe[];

interface UserProfile {
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity: string;
  goal: 'lose' | 'maintain' | 'gain';
  dietType: 'all' | 'vegetarian' | 'non-vegetarian' | 'vegan';
  calculatedBmi: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWater: number;
}

interface DailyLog {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

interface Recipe {
  id: string;
  name: string;
  diet: 'vegetarian' | 'non-vegetarian' | 'vegan';
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  ingredients: string[];
  steps: string[];
  description: string;
}

// Recipes are loaded from data/recipes.json

export default function Dashboard() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();

  // Profile Variables
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Interactive Onboarding Input Structuring
  const [formGender, setFormGender] = useState('male');
  const [formAge, setFormAge] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formActivity, setFormActivity] = useState('Medium');
  const [formGoal, setFormGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [formDietType, setFormDietType] = useState<'all' | 'vegetarian' | 'non-vegetarian' | 'vegan'>('all');

  // Logs state
  const [dailyLog, setDailyLog] = useState<DailyLog>({
    calories: 0, protein: 0, carbs: 0, fat: 0, water: 0
  });

  // Interface Management Variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>('All');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recipes' | 'ai-planner'>('overview');
  const [detected, setDetected] = useState<any>(null);

  // SIMULATION ALIGNMENT CORES
  const [simulatedMeal, setSimulatedMeal] = useState<Recipe | null>(null);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        setLoadingAuth(false);
      } else {
        if (localStorage.getItem('isGuest') === 'true') {
          setIsGuest(true);
          setLoadingAuth(false);
        } else {
          router.push('/');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const getLogId = () => {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  useEffect(() => {
    if (loadingAuth) return;
    let unsubscribeProfile = () => {};
    let unsubscribeLog = () => {};

    if (user) {
      const db = getFirestoreInstance();
      unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists() && docSnap.data().profile) {
          setProfile(docSnap.data().profile as UserProfile);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      });

      const logDocRef = doc(db, 'users', user.uid, 'daily_logs', getLogId());
      unsubscribeLog = onSnapshot(logDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setDailyLog(docSnap.data() as DailyLog);
        } else {
          const initialLog = { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
          setDoc(logDocRef, initialLog);
          setDailyLog(initialLog);
        }
      });
    } else if (isGuest) {
      const savedProfile = localStorage.getItem('diet_profile_guest');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }

      const savedLog = localStorage.getItem(`diet_log_guest_${getLogId()}`);
      if (savedLog) setDailyLog(JSON.parse(savedLog));
    }

    return () => {
      unsubscribeProfile();
      unsubscribeLog();
    };
  }, [loadingAuth, user, isGuest]);

  const handleCalculateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(formAge);
    const heightNum = parseFloat(formHeight);
    const weightNum = parseFloat(formWeight);

    if (!ageNum || !heightNum || !weightNum) return;

    const heightInMeters = heightNum / 100;
    const bmiCalculated = parseFloat((weightNum / (heightInMeters * heightInMeters)).toFixed(1));

    let baseBmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum);
    baseBmr = formGender === 'male' ? baseBmr + 5 : baseBmr - 161;

    let multiplier = 1.2;
    if (formActivity === 'Medium') multiplier = 1.45;
    if (formActivity === 'High') multiplier = 1.725;
    const computedTdee = Math.round(baseBmr * multiplier);

    let finalTargetCalories = computedTdee;
    if (formGoal === 'lose') finalTargetCalories = computedTdee - 450;
    if (formGoal === 'gain') finalTargetCalories = computedTdee + 400;

    const assignedProteinGrams = Math.round(weightNum * 2);
    const proteinCalories = assignedProteinGrams * 4;
    const remainingCalories = finalTargetCalories - proteinCalories;
    const assignedCarbsGrams = Math.round((remainingCalories * 0.60) / 4);
    const assignedFatGrams = Math.round((remainingCalories * 0.40) / 9);

    let finalWaterMl = Math.round(weightNum * 35);
    if (formActivity === 'Medium') finalWaterMl += 500;
    if (formActivity === 'High') finalWaterMl += 1000;

    const constructedProfile: UserProfile = {
      gender: formGender, age: ageNum, height: heightNum, weight: weightNum,
      activity: formActivity, goal: formGoal, dietType: formDietType,
      calculatedBmi: bmiCalculated, targetCalories: finalTargetCalories,
      targetProtein: assignedProteinGrams, targetCarbs: assignedCarbsGrams,
      targetFat: assignedFatGrams, targetWater: finalWaterMl
    };

    if (user) {
      const db = getFirestoreInstance();
      await setDoc(doc(db, 'users', user.uid), { profile: constructedProfile }, { merge: true });
    } else {
      localStorage.setItem('diet_profile_guest', JSON.stringify(constructedProfile));
      setProfile(constructedProfile);
    }
    setShowOnboarding(false);
  };

  const commitDailyUpdate = async (updatedFields: Partial<DailyLog>) => {
    const freshLogState = { ...dailyLog, ...updatedFields };
    if (user) {
      const db = getFirestoreInstance();
      await setDoc(doc(db, 'users', user.uid, 'daily_logs', getLogId()), freshLogState, { merge: true });
    } else {
      localStorage.setItem(`diet_log_guest_${getLogId()}`, JSON.stringify(freshLogState));
      setDailyLog(freshLogState);
    }
  };

  const handleEatRecipe = (recipe: Recipe) => {
    commitDailyUpdate({
      calories: Math.round(dailyLog.calories + recipe.calories),
      protein: Math.round(dailyLog.protein + recipe.protein),
      carbs: Math.round(dailyLog.carbs + recipe.carbs),
      fat: Math.round(dailyLog.fat + recipe.fat)
    });
    setSelectedRecipe(null);
  };

  // ADVANCED AUTO-BALANCING ALGORITHM MATRIX
  const extractMacroBalancingRecommendations = (anchorMeal: Recipe) => {
    if (!profile) return [];
    const targetSlots = ['breakfast', 'lunch', 'snack', 'dinner'].filter(slot => slot !== anchorMeal.mealType);
    
    return MASTER_RECIPES.filter(recipe => {
      if (recipe.id === anchorMeal.id) return false;
      if (profile.dietType === 'vegetarian' && recipe.diet !== 'vegetarian') return false;
      if (profile.dietType === 'vegan' && recipe.diet !== 'vegan') return false;
      if (profile.dietType === 'non-vegetarian' && recipe.diet === 'vegan') return false; 
      return targetSlots.includes(recipe.mealType);
    }).slice(0, 4); 
  };

  const parsedRecommendationMatrix = MASTER_RECIPES.filter((item) => {
    if (profile) {
      if (profile.dietType === 'vegetarian' && item.diet !== 'vegetarian') return false;
      if (profile.dietType === 'vegan' && item.diet !== 'vegan') return false;
    }
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMealType = selectedMealFilter === 'All' || item.mealType.toLowerCase() === selectedMealFilter.toLowerCase();
    return matchesQuery && matchesMealType;
  });

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mb-4" />
        <p className="text-xs uppercase tracking-widest text-slate-400">Loading Configuration Profiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24">
        
        {/* UPPER DISPLAY STATUS */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-6 rounded-3xl border border-emerald-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-black tracking-widest rounded-md">Macro Target Engine</span>
              <h1 className="text-3xl font-black tracking-tight">DietAI Dashboard</h1>
            </div>
            {profile && (
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-wrap items-center gap-4 text-xs">
                <div><p className="text-[9px] uppercase font-bold text-slate-400">BMI Target</p><p className="text-sm font-black text-white">{profile.calculatedBmi}</p></div>
                <div className="w-[1px] bg-white/10 h-6 hidden sm:block" />
                <div><p className="text-[9px] uppercase font-bold text-slate-400">Goal Scope</p><p className="text-sm font-black text-emerald-400 uppercase">{profile.goal}</p></div>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION TAB STRIPS */}
        <div className="flex border-b border-slate-200 gap-6">
          <button onClick={() => setActiveTab('overview')} className={`pb-3 text-xs uppercase tracking-wider font-black ${activeTab === 'overview' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400'}`}>
            Telemetry Board
          </button>
          <button onClick={() => setActiveTab('recipes')} className={`pb-3 text-xs uppercase tracking-wider font-black ${activeTab === 'recipes' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400'}`}>
            Master Recipe Index ({MASTER_RECIPES.length})
          </button>
          <button onClick={() => setActiveTab('ai-planner')} className={`pb-3 text-xs uppercase tracking-wider font-black flex items-center gap-1.5 ${activeTab === 'ai-planner' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400'}`}>
            <Sliders size={13} /> Interactive Goal Matcher
          </button>
        </div>

        {activeTab === 'overview' ? (
          <>
            {profile ? (
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* CALORIC COUNTER CARD */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Caloric Intake</h3>
                    <div className="my-4 text-center">
                      <h2 className="text-3xl font-black text-slate-800">{dailyLog.calories} <span className="text-xs text-slate-400">/ {profile.targetCalories} kcal</span></h2>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (dailyLog.calories / profile.targetCalories) * 100)}%` }} />
                  </div>
                </div>

                {/* MACRO BREAKDOWNS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide mb-3">Macro Metrics Allocation</h3>
                  <div className="space-y-2 text-xs font-bold text-slate-600">
                    <div className="flex justify-between"><span>Protein Target</span><span className="text-emerald-600 font-black">{dailyLog.protein}g / {profile.targetProtein}g</span></div>
                    <div className="flex justify-between"><span>Carbohydrates</span><span>{dailyLog.carbs}g / {profile.targetCarbs}g</span></div>
                    <div className="flex justify-between"><span>Lipids & Fats</span><span className="text-rose-500">{dailyLog.fat}g / {profile.targetFat}g</span></div>
                  </div>
                </div>

                {/* HYDRATION SYSTEM WITH ERROR CORRECTION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Hydration Tracker</h3>
                      <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg"><Droplet size={14} /></span>
                    </div>
                    <div className="my-4 text-center">
                      <h2 className="text-3xl font-black text-slate-800">{dailyLog.water} <span className="text-xs text-slate-400">/ {profile.targetWater} ml</span></h2>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button 
                      onClick={() => commitDailyUpdate({ water: Math.max(0, dailyLog.water - 250) })}
                      disabled={dailyLog.water === 0}
                      className="w-full py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Minus size={12} /> Remove 250ml Mistake
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => commitDailyUpdate({ water: dailyLog.water + 250 })} className="py-2 bg-sky-50 text-sky-700 font-bold rounded-xl text-xs">+250ml</button>
                      <button onClick={() => commitDailyUpdate({ water: dailyLog.water + 500 })} className="py-2 bg-sky-600 text-white font-bold rounded-xl text-xs">+500ml</button>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl">
                <button onClick={() => setShowOnboarding(true)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl">Configure Biometrics</button>
              </div>
            )}
            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <FoodScanner onFoodDetected={(res) => setDetected(res)} />
            </div>
          </>
        ) : activeTab === 'recipes' ? (
          
          /* RECIPE DIRECTORY SEARCH MODULE */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search recipe elements..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
                {['All', 'Breakfast', 'Lunch', 'Snack', 'Dinner'].map((m) => (
                  <button key={m} onClick={() => setSelectedMealFilter(m)} className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${selectedMealFilter === m ? 'bg-slate-900 text-white' : 'bg-white border text-slate-400'}`}>{m}</button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {parsedRecommendationMatrix.map((recipe) => (
                <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)} className="bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase bg-emerald-50 px-2 py-0.5 rounded text-emerald-700">{recipe.diet}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{recipe.mealType}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-base mt-2">{recipe.name}</h4>
                    <p className="text-slate-400 text-xs line-clamp-2 mt-1">{recipe.description}</p>
                  </div>
                  <div className="grid grid-cols-4 text-center text-xs border-t pt-2 mt-4 font-bold">
                    <div><p>{recipe.calories}</p><span className="text-[9px] text-slate-400 uppercase">kcal</span></div>
                    <div><p className="text-emerald-600">{recipe.protein}g</p><span className="text-[9px] text-slate-400 uppercase">Prot</span></div>
                    <div><p>{recipe.carbs}g</p><span className="text-[9px] text-slate-400 uppercase">Carb</span></div>
                    <div><p className="text-rose-500">{recipe.fat}g</p><span className="text-[9px] text-slate-400 uppercase">Fat</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          
          /* INTERACTIVE AUTO-BALANCING PLATFORM SECTION */
          <div className="space-y-6">
            <div className="bg-emerald-50/60 border border-emerald-100 p-5 rounded-2xl">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Sparkle className="text-emerald-600 fill-emerald-600" size={18} /> Interactive Core Auto-Balancing
              </h3>
              <p className="text-slate-600 text-xs mt-1 max-w-2xl">
                Select the exact meal you want to eat right now. The engine will instantly subtract its values from your daily target requirements, and output balanced alternative options for your other remaining meal slots.
              </p>
              
              <div className="mt-4">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">What do you want to eat for this meal?</label>
                <select 
                  onChange={(e) => {
                    const match = MASTER_RECIPES.find(r => r.id === e.target.value);
                    setSimulatedMeal(match || null);
                  }}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none w-full max-w-xl shadow-sm focus:border-emerald-500"
                >
                  <option value="">-- Choose a primary dish baseline --</option>
                  {MASTER_RECIPES.map(r => (
                    <option key={r.id} value={r.id}>[{r.mealType.toUpperCase()} - {r.diet.toUpperCase()}] {r.name} (P: {r.protein}g | F: {r.fat}g)</option>
                  ))}
                </select>
              </div>
            </div>

            {simulatedMeal ? (
              <div className="grid md:grid-cols-3 gap-6 items-start">
                
                {/* TRACKED ANCHOR SELECTION CARDS */}
                <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-sm space-y-3">
                  <div>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] uppercase font-black rounded">{simulatedMeal.mealType} Focus</span>
                    <h4 className="text-base font-black text-slate-900 mt-1">{simulatedMeal.name}</h4>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between"><span>Calories</span><span className="font-bold">{simulatedMeal.calories} kcal</span></div>
                    <div className="flex justify-between text-emerald-600 font-bold"><span>Protein Payload</span><span>+{simulatedMeal.protein}g</span></div>
                    <div className="flex justify-between text-rose-500 font-bold"><span>Lipids Fat Impact</span><span>{simulatedMeal.fat}g</span></div>
                  </div>
                  <button 
                    onClick={() => { handleEatRecipe(simulatedMeal); setActiveTab('overview'); }}
                    className="w-full py-2 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl tracking-wider shadow-md"
                  >
                    Commit Meal Strategy
                  </button>
                </div>

                {/* COMPENSATORY GENERATIVE MATRIX RESULTS */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">AI-Generated Alternative Balancing Solutions</h4>
                    <p className="text-slate-400 text-xs">To fulfill your body's total remaining biometrics, eat these options throughout your other meal times:</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {extractMacroBalancingRecommendations(simulatedMeal).map((rec) => (
                      <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition shadow-sm">
                        <div>
                          <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400">
                            <span>Fills Missing Slot: {rec.mealType}</span>
                            <span className="text-emerald-600 font-black">{rec.diet}</span>
                          </div>
                          <h5 className="font-black text-slate-900 text-sm mt-1">{rec.name}</h5>
                        </div>
                        <div className="grid grid-cols-3 text-center text-[11px] font-bold mt-3 pt-2 border-t bg-slate-50 rounded-lg p-1">
                          <div><p className="text-slate-700">{rec.calories}</p><span className="text-[8px] text-slate-400 block">KCAL</span></div>
                          <div><p className="text-emerald-600">+{rec.protein}g</p><span className="text-[8px] text-slate-400 block">PROT</span></div>
                          <div><p className="text-rose-500">{rec.fat}g</p><span className="text-[8px] text-slate-400 block">FAT</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 border border-dashed border-slate-200 rounded-2xl text-center bg-white text-slate-400 text-xs font-bold">
                Please pick a baseline dish in the selection box above to generate your customized alternative recommendations.
              </div>
            )}
          </div>
        )}

      </div>

      {/* DETAILED RECIPE DISPLAY MODAL */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{selectedRecipe.diet}</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedRecipe.name}</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1"><Clock size={12}/>{selectedRecipe.time}</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs font-bold my-4">
              <div><p className="text-slate-800">{selectedRecipe.calories}</p><span className="text-[9px] text-slate-400">Calories</span></div>
              <div><p className="text-emerald-600">{selectedRecipe.protein}g</p><span className="text-[9px] text-slate-400">Protein</span></div>
              <div><p className="text-slate-800">{selectedRecipe.carbs}g</p><span className="text-[9px] text-slate-400">Carbs</span></div>
              <div><p className="text-rose-500">{selectedRecipe.fat}g</p><span className="text-[9px] text-slate-400">Fat</span></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1">Required Measured Ingredients</h4>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600 font-medium">
                  {selectedRecipe.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1">Preparation & Cooking Steps</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 font-medium">
                  {selectedRecipe.steps.map((step, idx) => <li key={idx} className="pl-0.5">{step}</li>)}
                </ol>
              </div>
            </div>

            <div className="flex gap-2 pt-4 mt-5 border-t">
              <button onClick={() => setSelectedRecipe(null)} className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-400 uppercase">Dismiss</button>
              <button onClick={() => handleEatRecipe(selectedRecipe)} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase shadow-md">Log To Daily Metrics</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
