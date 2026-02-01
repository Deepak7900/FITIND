'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Scale,
  Ruler,
  Activity,
  Target,
  Utensils,
  Heart,
  Download,
  Sparkles,
  TrendingUp,
  Calendar,
  Zap,
  ArrowLeft,
  Home,
} from 'lucide-react';
import {
  UserProfile,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateBMI,
  getHealthStatus,
  vegetarianMeals,
  nonVegetarianMeals,
  scaleMeals,
  getFlexitarianWeeklyPlan,
  calculateWaterIntake,
  calculateGoalTimeline,
  getMealAlternatives,
  getSupplementRecommendations,
  getMealTiming,
  calculateBMRKatch,
  WeeklyMealPlan,
  GoalTimeline,
  SupplementRecommendation,
  MealTiming,
  MacroNutrients,
  Meal,
} from '@/lib/fitness';

export default function FitindApp() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 25,
    gender: 'male',
    weight: 70,
    height: 170,
    activityLevel: 'moderate',
    goal: 'maintain',
    dietType: 'veg',
    trainingLevel: 'beginner',
    bodyType: 'mesomorph',
    macroDistribution: 'standard',
    nonVegDays: ['Tuesday', 'Saturday'],
  });

  const [goalWeight, setGoalWeight] = useState<number>(65); // Target weight
  const [currentPage, setCurrentPage] = useState<'landing' | 'form' | 'quickPlan' | 'results'>('landing'); // Page state
  const [previousPage, setPreviousPage] = useState<'landing' | 'form' | 'quickPlan'>('landing');
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'regular' | 'religious'>('regular'); // For flexitarian weekly view

  // Quick Plan State (minimal inputs)
  const [quickPlan, setQuickPlan] = useState({
    weight: 70,
    age: 25,
    bmi: 22,
    dietType: 'veg' as 'veg' | 'nonveg',
  });

  const [results, setResults] = useState<{
    bmr: number;
    tdee: number;
    targetCalories: number;
    macros: MacroNutrients;
    bmi: number;
    healthStatus: { status: string; color: string };
    mealPlan: Meal[];
    weeklyPlan?: WeeklyMealPlan;
    waterIntake: number;
    goalTimeline?: GoalTimeline;
    supplements: SupplementRecommendation[];
    mealTiming: MealTiming;
  } | null>(null);

  // Custom cursor logic removed to prevent flickering as requested

  // Calculate completion progress
  const completionProgress = (() => {
    let filled = 0;
    if (profile.name) filled += 12.5;
    if (profile.age) filled += 12.5;
    if (profile.gender) filled += 12.5;
    if (profile.weight) filled += 12.5;
    if (profile.height) filled += 12.5;
    if (profile.activityLevel) filled += 12.5;
    if (profile.goal) filled += 12.5;
    if (profile.dietType) filled += 12.5;
    return filled;
  })();

  // Load profile
  useEffect(() => {
    const saved = localStorage.getItem('fitind-profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved profile');
      }
    }
  }, []);

  const saveProfile = () => {
    localStorage.setItem('fitind-profile', JSON.stringify(profile));
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#10b981', '#f59e0b', '#ffffff'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#10b981', '#f59e0b', '#ffffff'],
      });
    }, 250);
  };

  const calculatePlan = () => {
    const bmr = calculateBMR(profile);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    const targetCalories = calculateTargetCalories(tdee, profile.goal);
    const macros = calculateMacros(targetCalories, profile.goal, profile.macroDistribution);
    const bmi = calculateBMI(profile.weight, profile.height);
    const healthStatus = getHealthStatus(bmi, profile.goal);

    let mealPlan: Meal[];
    let weeklyPlan: WeeklyMealPlan | undefined;

    if (profile.dietType === 'flexitarian') {
      weeklyPlan = getFlexitarianWeeklyPlan(targetCalories, profile.nonVegDays);
      mealPlan = weeklyPlan.nonVegDays;
    } else {
      const meals = profile.dietType === 'veg' ? vegetarianMeals : nonVegetarianMeals;
      mealPlan = scaleMeals(meals, targetCalories);
    }

    const waterIntake = calculateWaterIntake(profile.weight, profile.activityLevel);
    const supplements = getSupplementRecommendations(profile.goal, profile.trainingLevel, profile.dietType);
    const mealTiming = getMealTiming(profile.goal, profile.trainingLevel);

    let goalTimeline: GoalTimeline | undefined;
    if (profile.goal !== 'maintain' && goalWeight !== profile.weight) {
      goalTimeline = calculateGoalTimeline(profile.weight, goalWeight, profile.goal, tdee, targetCalories);
    }

    setResults({
      bmr,
      tdee,
      targetCalories,
      macros,
      bmi,
      healthStatus,
      mealPlan,
      weeklyPlan,
      waterIntake,
      goalTimeline,
      supplements,
      mealTiming,
    });

    saveProfile();
    setPreviousPage('form');
    setCurrentPage('results');
    triggerConfetti();
  };

  const calculateQuickPlan = () => {
    const activityMultiplier = 1.55;
    const bmr = quickPlan.age < 30 ? quickPlan.weight * 24 : quickPlan.weight * 22;
    const tdee = Math.round(bmr * activityMultiplier);
    const targetCalories = tdee;
    const macros = calculateMacros(targetCalories, 'maintain', 'standard');
    const meals = quickPlan.dietType === 'veg' ? vegetarianMeals : nonVegetarianMeals;
    const scaledMeals = scaleMeals(meals, targetCalories);

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories,
      macros,
      bmi: quickPlan.bmi,
      healthStatus: getHealthStatus(quickPlan.bmi, 'maintain'),
      mealPlan: scaledMeals,
      waterIntake: calculateWaterIntake(quickPlan.weight, 'moderate'),
      supplements: getSupplementRecommendations('maintain', 'beginner', quickPlan.dietType),
      mealTiming: getMealTiming('maintain', 'beginner'),
    });

    saveProfile();
    setPreviousPage('quickPlan');
    setCurrentPage('results');
    triggerConfetti();
  };

  const toggleFlip = (index: number) => {
    setFlippedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Animated Glow Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[80px] animate-blob-1" style={{ willChange: 'transform' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-gold-500/15 blur-[80px] animate-blob-2" style={{ willChange: 'transform' }} />
      </div>

      {/* Progress Bar */}
      {currentPage === 'form' && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: completionProgress / 100 }}
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-gold-500 z-50 origin-left"
          style={{ width: '100%' }}
        />
      )}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 pt-12 pb-8 px-4"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center gap-3 mb-3"
          >
            <Sparkles className="w-10 h-10 text-emerald-500" />
            <h1 className="text-6xl md:text-7xl font-serif font-bold bg-gradient-to-r from-emerald-400 via-white to-gold-400 bg-clip-text text-transparent">
              Fitind
            </h1>
            <Sparkles className="w-10 h-10 text-gold-500" />
          </motion.div>
          <p className="text-gray-400 text-lg">
            Apna Cinematic Fitness Journey Shuru Karo
          </p>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* LANDING PAGE */}
        {currentPage === 'landing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-8"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-4 md:mb-8"
            >
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold mb-3 md:mb-6 bg-gradient-to-r from-emerald-400 via-gold-400 to-emerald-400 bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% auto' }}>Fitind</h1>
              <p className="text-xl sm:text-2xl md:text-4xl text-white font-light mb-2 md:mb-4 px-4">Your Personal Fitness <span className="text-emerald-400 font-semibold">AI Coach</span></p>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">Scientifically designed nutrition & training plans for athletes and everyday champions</p>
            </motion.div>

            <div className="hidden sm:flex gap-3 sm:gap-6 md:gap-8 mb-6 md:mb-12">
              {[
                { icon: '💪', delay: 0 },
                { icon: '🥗', delay: 0.1 },
                { icon: '🏃', delay: 0.2 },
                { icon: '⚡', delay: 0.3 },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="text-4xl sm:text-5xl md:text-6xl glass backdrop-blur-xl bg-white/5 border-white/10 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                  transition={{ y: { duration: 2, repeat: Infinity, delay: item.delay } }}
                >
                  {item.icon}
                </motion.div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-12 max-w-4xl px-4">
              {[
                { icon: '🎯', title: 'Personalized Plans', desc: 'Tailored for your body type, goals & training level' },
                { icon: '📊', title: 'Smart Analytics', desc: 'Visual BMI gauge, macro rings & goal timeline' },
                { icon: '💊', title: 'Supplement Stack', desc: 'Science-backed recommendations with timing guidance' },
              ].map((feature, idx) => (
                <div key={idx} className="glass backdrop-blur-xl bg-white/5 border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-colors duration-300">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">{feature.icon}</div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-xs md:text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center w-full gap-3">
              <Button onClick={() => { setPreviousPage('landing'); setCurrentPage('quickPlan'); }} className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 md:py-8 bg-gradient-to-r from-emerald-600 to-gold-600 hover:from-emerald-700 hover:to-gold-700 rounded-xl md:rounded-2xl shadow-2xl shadow-emerald-500/50 transition-all duration-300 w-full max-w-sm mx-auto">
                <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2" /> Quick Diet Plan ⚡
              </Button>
              <Button onClick={() => { setPreviousPage('landing'); setCurrentPage('form'); }} variant="outline" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 md:py-6 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-xl md:rounded-2xl transition-all duration-300 w-full max-w-sm mx-auto">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Full Plan (Advanced)
              </Button>
            </div>
          </motion.div>
        )}

        {/* Quick Diet Plan Form */}
        {currentPage === 'quickPlan' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="flex justify-start mb-4">
              <Button
                onClick={() => setCurrentPage('landing')}
                variant="ghost"
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Wapas Home Jao</span>
              </Button>
            </div>
            <Card className="glass backdrop-blur-xl bg-white/5 border-white/10 overflow-hidden">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-serif text-white pt-2">⚡ Quick Diet Plan</CardTitle>
                <CardDescription>Bas 4 details bhariye aur instant plan paiye</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Weight (kg)</label>
                    <Input type="number" value={quickPlan.weight} onChange={(e) => setQuickPlan({ ...quickPlan, weight: Number(e.target.value) })} className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Age</label>
                    <Input type="number" value={quickPlan.age} onChange={(e) => setQuickPlan({ ...quickPlan, age: Number(e.target.value) })} className="bg-white/5 border-white/20 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">BMI (Nahi pata toh estimation daalein)</label>
                  <Input type="number" value={quickPlan.bmi} onChange={(e) => setQuickPlan({ ...quickPlan, bmi: Number(e.target.value) })} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Khan-paan Ka Tarika</label>
                  <Select value={quickPlan.dietType} onValueChange={(value: any) => setQuickPlan({ ...quickPlan, dietType: value })}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">🥬 Shuddh Shakahari (Veg)</SelectItem>
                      <SelectItem value="nonveg">🍗 Mansahari (Non-Veg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={calculateQuickPlan} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 py-6 text-lg font-bold shadow-lg shadow-emerald-500/30">Get Instant Plan 🚀</Button>
                <button
                  onClick={() => setCurrentPage('landing')}
                  className="w-full text-center text-gray-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Wapas Jao
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Input Form */}
        {currentPage === 'form' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex justify-start mb-4 max-w-4xl mx-auto">
              <Button
                onClick={() => setCurrentPage('landing')}
                variant="ghost"
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Wapas Home Jao</span>
              </Button>
            </div>
            <div className="glass backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <CardHeader className="border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-gold-500/10">
                <CardTitle className="text-3xl font-serif text-white flex items-center gap-2">
                  <User className="w-8 h-8 text-emerald-400" /> Apni Profile Batao
                </CardTitle>
                <CardDescription className="text-gray-400">Saare details daal kar apna personalized plan paao</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Naam kya hai?</label>
                  <Input placeholder="Apna naam likho" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="bg-white/5 border-white/20 text-white focus:border-emerald-500" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Heart className="w-4 h-4 text-emerald-400" /> Umra kitni hai? (years)</label>
                    <Input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} className="bg-white/5 border-white/20 text-white focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Gender</label>
                    <Select value={profile.gender} onValueChange={(value: 'male' | 'female') => setProfile({ ...profile, gender: value })}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Scale className="w-4 h-4 text-emerald-400" /> Weight (kg)</label>
                    <Input type="number" value={profile.weight} onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })} className="bg-white/5 border-white/20 text-white focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Ruler className="w-4 h-4 text-emerald-400" /> Height (cm)</label>
                    <Input type="number" value={profile.height} onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })} className="bg-white/5 border-white/20 text-white focus:border-emerald-500" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Kitna active rehte ho?</label>
                    <Select value={profile.activityLevel} onValueChange={(value: any) => setProfile({ ...profile, activityLevel: value })}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Kam Active (Office Work)</SelectItem>
                        <SelectItem value="light">Thoda Active (1-3 days gym)</SelectItem>
                        <SelectItem value="moderate">Moderate (3-5 days gym)</SelectItem>
                        <SelectItem value="very">Bahut Active (6-7 days)</SelectItem>
                        <SelectItem value="extra">Athlete Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Target className="w-4 h-4 text-gold-400" /> Kya goal hai bhai?</label>
                    <Select value={profile.goal} onValueChange={(value: any) => setProfile({ ...profile, goal: value })}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deficit">Weight Ghatana Hai (Fat Loss)</SelectItem>
                        <SelectItem value="maintain">Maintain Karna Hai</SelectItem>
                        <SelectItem value="surplus">Muscle Banana Hai (Bulk)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">🏋️ Experience</label>
                    <Select value={profile.trainingLevel} onValueChange={(value: any) => setProfile({ ...profile, trainingLevel: value })}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">🌱 Beginner</SelectItem>
                        <SelectItem value="intermediate">💪 Intermediate</SelectItem>
                        <SelectItem value="advanced">🔥 Advanced</SelectItem>
                        <SelectItem value="athlete">🏆 Athlete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">🧬 Body Type</label>
                    <Select value={profile.bodyType} onValueChange={(value: any) => setProfile({ ...profile, bodyType: value })}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ectomorph">🪶 Ectomorph</SelectItem>
                        <SelectItem value="mesomorph">💪 Mesomorph</SelectItem>
                        <SelectItem value="endomorph">🐻 Endomorph</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Utensils className="w-4 h-4 text-gold-400" /> Diet Type</label>
                  <div className="flex gap-4 items-center">
                    <Select value={profile.dietType} onValueChange={(value: any) => setProfile({ ...profile, dietType: value })}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="veg">🥗 Vegetarian</SelectItem>
                        <SelectItem value="nonveg">🍗 Non-Vegetarian</SelectItem>
                        <SelectItem value="flexitarian">📿 Flexitarian (Select Non-Veg Days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {profile.dietType === 'flexitarian' && (
                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <p className="text-xs font-semibold text-emerald-400">Hafte mein kaunse din Non-Veg khaoge?</p>
                      <div className="flex flex-wrap gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <button key={day} type="button" onClick={() => {
                            const newDays = profile.nonVegDays?.includes(day) ? profile.nonVegDays.filter((d) => d !== day) : [...(profile.nonVegDays || []), day];
                            setProfile({ ...profile, nonVegDays: newDays });
                          }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${profile.nonVegDays?.includes(day) ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 border border-white/5'}`}>{day.slice(0, 3)}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Button onClick={calculatePlan} disabled={completionProgress < 100} className="w-full bg-gradient-to-r from-emerald-600 to-gold-600 hover:from-emerald-700 hover:to-gold-700 text-white py-6 text-lg font-semibold shadow-lg">
                    Chalo, Mera Plan Dikhao! 🚀
                  </Button>
                  {completionProgress < 100 && <p className="text-center text-sm text-gray-400 mt-2">{Math.round(completionProgress)}% complete - Saari details bharo</p>}
                </motion.div>
                <button
                  onClick={() => setCurrentPage('landing')}
                  className="w-full text-center text-gray-500 hover:text-white text-sm mt-4 transition-colors flex items-center justify-center gap-2 py-2"
                >
                  <Home className="w-4 h-4" /> Home Pe Jao
                </button>
              </CardContent>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {currentPage === 'results' && results && (
          <div className="space-y-6">
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setCurrentPage(previousPage)} variant="outline" className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/20">
                <ArrowLeft className="w-4 h-4 mr-2" /> {previousPage === 'form' ? 'Profile Edit Karo' : 'Galti Ho Gayi (Wapas)'}
              </Button>
              <Button onClick={() => window.print()} className="bg-gradient-to-r from-emerald-600 to-gold-600 hover:from-emerald-700 hover:to-gold-700 flex items-center gap-2"><Download className="w-4 h-4" /> Plan Download Karo</Button>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Card className="glass backdrop-blur-xl bg-white/5 border-white/10 pt-6 text-center">
                <CardContent>
                  <p className="text-sm text-gray-400 mb-2">Tumhari Health Status</p>
                  <p className={`text-4xl font-serif font-bold ${results.healthStatus.color}`}>{results.healthStatus.status}</p>
                  <p className="text-gray-400 mt-2">BMI: {results.bmi.toFixed(1)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Card className="glass backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-2xl font-serif text-white">Daily Macros - {profile.goal} Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-gray-300">Calories</span><span className="text-2xl font-bold text-emerald-400">{results.macros.calories} kcal</span></div>
                    <Progress value={100} className="h-3 bg-emerald-950" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center"><p className="text-blue-400 font-bold">{results.macros.protein}g</p><p className="text-[10px] text-gray-400">Protein</p></div>
                    <div className="text-center"><p className="text-amber-400 font-bold">{results.macros.carbs}g</p><p className="text-[10px] text-gray-400">Carbs</p></div>
                    <div className="text-center"><p className="text-orange-400 font-bold">{results.macros.fats}g</p><p className="text-[10px] text-gray-400">Fats</p></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                <Card className="glass backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/10">
                  <CardHeader><CardTitle className="text-xl font-serif text-white flex items-center gap-2">💧 Water Intake</CardTitle></CardHeader>
                  <CardContent className="text-center">
                    <p className="text-5xl font-bold text-cyan-400 mb-2">{results.waterIntake}L</p>
                    <p className="text-xs text-gray-400">Drink {Math.round(results.waterIntake * 4)} glasses daily</p>
                  </CardContent>
                </Card>
              </motion.div>

              {results.goalTimeline && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
                  <Card className="glass backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-white/10">
                    <CardHeader><CardTitle className="text-xl font-serif text-white flex items-center gap-2">⏱️ Goal Timeline</CardTitle></CardHeader>
                    <CardContent className="text-center">
                      <p className="text-4xl font-bold text-purple-400 mb-1">{results.goalTimeline.weeksToGoal} Weeks</p>
                      <p className="text-xs text-gray-400">Target Weight: {goalWeight}kg</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
              <Card className="glass backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader><CardTitle className="text-2xl font-serif text-white">📊 BMI Gauge</CardTitle></CardHeader>
                <CardContent>
                  <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
                    <div className="absolute h-full bg-emerald-500" style={{ width: `${Math.min(Math.max((results.bmi - 10) / 30 * 100, 0), 100)}%` }} />
                  </div>
                  <p className="text-center mt-2 text-white font-bold">{results.bmi.toFixed(1)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45 }}>
              <Card className="glass backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-white/10">
                <CardHeader><CardTitle className="text-2xl font-serif text-white">💊 Supplements</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {results.supplements.map((supp, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-white">{supp.name} <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 rounded-full">{supp.priority}</span></h4>
                      <p className="text-xs text-gray-400">{supp.purpose}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
              <Card className="glass backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-white flex items-center gap-2">
                    <Utensils className="w-6 h-6 text-gold-400" /> Desi Meal Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.dietType === 'flexitarian' && results.weeklyPlan && (
                    <div className="flex gap-2 mb-6">
                      <button onClick={() => setActiveTab('regular')} className={`flex-1 py-2 rounded-lg ${activeTab === 'regular' ? 'bg-emerald-600' : 'bg-white/5'}`}>Non-Veg Days</button>
                      <button onClick={() => setActiveTab('religious')} className={`flex-1 py-2 rounded-lg ${activeTab === 'religious' ? 'bg-purple-600' : 'bg-white/5'}`}>Veg Days</button>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {(profile.dietType === 'flexitarian' && results.weeklyPlan ? (activeTab === 'regular' ? results.weeklyPlan.nonVegDays : results.weeklyPlan.vegDays) : results.mealPlan).map((meal, index) => (
                      <div key={index} className="p-4 rounded-xl glass bg-white/5 border border-white/10">
                        <h3 className="font-bold text-white">{meal.name}</h3>
                        <p className="text-emerald-400 text-xs italic">{meal.hinglishName}</p>
                        <p className="text-gray-400 text-xs mt-1">{meal.portion}</p>
                        <div className="flex justify-between mt-2 text-[10px]">
                          <span className="text-blue-400">P: {meal.protein}g</span>
                          <span className="text-emerald-400 font-bold">{meal.calories} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <Card className="glass backdrop-blur-xl bg-gradient-to-r from-emerald-500/10 to-gold-500/10 border-white/10">
                <CardContent className="pt-6 text-center text-gray-300">
                  💪 <strong>Yaad Rakho:</strong> Consistency is key bhai! Let's get it! 🚀
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
