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
  });

  const [goalWeight, setGoalWeight] = useState<number>(65); // Target weight
  const [currentPage, setCurrentPage] = useState<'landing' | 'form' | 'quickPlan' | 'results'>('landing'); // Page state
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

  // Custom cursor
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 6);
      cursorY.set(e.clientY - 6);
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

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
      // Get weekly plan with religious days
      weeklyPlan = getFlexitarianWeeklyPlan(targetCalories);
      mealPlan = weeklyPlan.regularDays; // Default to regular days
    } else {
      const meals = profile.dietType === 'veg' ? vegetarianMeals : nonVegetarianMeals;
      mealPlan = scaleMeals(meals, targetCalories);
    }

    // Calculate water intake
    const waterIntake = calculateWaterIntake(profile.weight, profile.activityLevel);

    // Get supplement recommendations
    const supplements = getSupplementRecommendations(
      profile.goal,
      profile.trainingLevel,
      profile.dietType
    );

    // Get meal timing guidance
    const mealTiming = getMealTiming(profile.goal, profile.trainingLevel);

    // Calculate goal timeline if user has deficit/surplus goal
    let goalTimeline: GoalTimeline | undefined;
    if (profile.goal !== 'maintain' && goalWeight !== profile.weight) {
      goalTimeline = calculateGoalTimeline(
        profile.weight,
        goalWeight,
        profile.goal,
        tdee,
        targetCalories
      );
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
    setCurrentPage('results');
    triggerConfetti();
  };

  // Quick Plan Calculator
  const calculateQuickPlan = () => {
    // Determine activity multiplier based on standard assumptions
    const activityMultiplier = 1.55; // Moderate

    // Estimate BMR using quick formula
    const bmr = quickPlan.age < 30 ? quickPlan.weight * 24 : quickPlan.weight * 22;
    const tdee = Math.round(bmr * activityMultiplier);

    // Quick plan is usually for maintenance or slight deficit
    const targetCalories = tdee;

    const macros = calculateMacros(targetCalories, 'maintain', 'standard');

    // Get meal plan
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
      {/* Custom Cursor */}
      <motion.div
        className="custom-cursor"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
        }}
      />

      {/* Animated Glow Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/30 blur-[120px] animate-blob-1" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-gold-500/25 blur-[120px] animate-blob-2" />
      </div>

      {/* Liquid Progress Bar */}
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
            {/* Hero Section */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-4 md:mb-8"
            >
              <motion.h1
                className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold mb-3 md:mb-6 bg-gradient-to-r from-emerald-400 via-gold-400 to-emerald-400 bg-clip-text text-transparent animate-gradient"
                style={{ backgroundSize: '200% auto' }}
              >
                Fitind
              </motion.h1>
              <motion.p
                className="text-xl sm:text-2xl md:text-4xl text-white font-light mb-2 md:mb-4 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Your Personal Fitness{' '}
                <span className="text-emerald-400 font-semibold">AI Coach</span>
              </motion.p>
              <motion.p
                className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Scientifically designed nutrition & training plans for athletes and everyday champions
              </motion.p>
            </motion.div>

            {/* 3D Floating Icons - Hidden on mobile for space */}
            <motion.div
              className="hidden sm:flex gap-3 sm:gap-6 md:gap-8 mb-6 md:mb-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
            >
              {[
                { icon: '💪', delay: 0 },
                { icon: '🥗', delay: 0.1 },
                { icon: '🏃', delay: 0.2 },
                { icon: '⚡', delay: 0.3 },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="text-4xl sm:text-5xl md:text-6xl glass backdrop-blur-xl bg-white/5 border-white/10 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6"
                  whileHover={{ scale: 1.2, rotateY: 180 }}
                  animate={{
                    y: [0, -10, 0],
                    rotateZ: [0, 5, -5, 0],
                  }}
                  transition={{
                    y: {
                      duration: 2,
                      repeat: Infinity,
                      delay: item.delay,
                    },
                    rotateZ: {
                      duration: 4,
                      repeat: Infinity,
                      delay: item.delay,
                    },
                  }}
                >
                  {item.icon}
                </motion.div>
              ))}
            </motion.div>

            {/* Features Grid - Compact on mobile */}
            <motion.div
              className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-12 max-w-4xl px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              {[
                {
                  icon: '🎯',
                  title: 'Personalized Plans',
                  desc: 'Tailored for your body type, goals & training level',
                },
                {
                  icon: '📊',
                  title: 'Smart Analytics',
                  desc: 'Visual BMI gauge, macro rings & goal timeline',
                },
                {
                  icon: '💊',
                  title: 'Supplement Stack',
                  desc: 'Science-backed recommendations with timing guidance',
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  className="glass backdrop-blur-xl bg-white/5 border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.05, rotateX: 5 }}
                >
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">{feature.icon}</div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-xs md:text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats Section - Hidden on mobile to save space */}
            <motion.div
              className="hidden md:flex gap-6 sm:gap-8 md:gap-12 mb-8 md:mb-12 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              {[
                { number: '10K+', label: 'Plans Generated' },
                { number: '50+', label: 'Features' },
                { number: '99%', label: 'Satisfaction' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-400 mb-1">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Dual CTA Buttons - Quick vs Full Plan */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="flex flex-col items-center justify-center w-full gap-3"
            >
              <Button
                onClick={() => setCurrentPage('quickPlan')}
                className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 md:py-8 bg-gradient-to-r from-emerald-600 to-gold-600 hover:from-emerald-700 hover:to-gold-700 rounded-xl md:rounded-2xl shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all duration-300 w-full max-w-sm mx-auto"
              >
                <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                Quick Diet Plan ⚡
              </Button>

              <Button
                onClick={() => setCurrentPage('form')}
                variant="outline"
                className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 md:py-6 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-xl md:rounded-2xl transition-all duration-300 w-full max-w-sm mx-auto"
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Full Plan (Advanced)
              </Button>

              <p className="text-xs sm:text-sm text-gray-500 mt-2 px-4 text-center">Quick: 4 fields • Full: Complete analysis</p>
            </motion.div>
          </motion.div>
        )}

        {/* Quick Diet Plan Form */}
        {currentPage === 'quickPlan' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="glass backdrop-blur-xl bg-white/5 border-white/10 overflow-hidden">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-serif text-white">⚡ Quick Diet Plan</CardTitle>
                <CardDescription>Bas 4 details bhariye aur instant plan paiye</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Weight (kg)</label>
                    <Input
                      type="number"
                      value={quickPlan.weight}
                      onChange={(e) => setQuickPlan({ ...quickPlan, weight: Number(e.target.value) })}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Age</label>
                    <Input
                      type="number"
                      value={quickPlan.age}
                      onChange={(e) => setQuickPlan({ ...quickPlan, age: Number(e.target.value) })}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">BMI (Nahi pata toh estimation daalein - e.g. 22)</label>
                  <Input
                    type="number"
                    value={quickPlan.bmi}
                    onChange={(e) => setQuickPlan({ ...quickPlan, bmi: Number(e.target.value) })}
                    className="bg-white/5 border-white/20 text-white"
                  />
                  <p className="text-[10px] text-gray-500 italic">*BMI = Weight / (Height in m)²</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Khan-paan Ka Tarika</label>
                  <Select
                    value={quickPlan.dietType}
                    onValueChange={(value: any) => setQuickPlan({ ...quickPlan, dietType: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">🥬 Shuddh Shakahari (Veg)</SelectItem>
                      <SelectItem value="nonveg">🍗 Mansahari (Non-Veg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={calculateQuickPlan}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 py-6 text-lg font-bold shadow-lg shadow-emerald-500/30"
                >
                  Get Instant Plan 🚀
                </Button>

                <button
                  onClick={() => setCurrentPage('landing')}
                  className="w-full text-center text-gray-500 hover:text-white text-sm transition-colors"
                >
                  ← Wapas Jao
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Input Form */}
        {currentPage === 'form' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="glass backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <CardHeader className="border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-gold-500/10">
                <CardTitle className="text-3xl font-serif text-white flex items-center gap-2">
                  <User className="w-8 h-8 text-emerald-400" />
                  Apni Profile Batao
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Saare details daal kar apna personalized plan paao
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-gray-300">Naam kya hai?</label>
                  <Input
                    placeholder="Apna naam likho"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500"
                  />
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Age */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-emerald-400" />
                      Umra kitni hai? (years)
                    </label>
                    <Input
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                      className="bg-white/5 border-white/20 text-white focus:border-emerald-500"
                    />
                  </motion.div>

                  {/* Gender */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-semibold text-gray-300">Gender</label>
                    <Select
                      value={profile.gender}
                      onValueChange={(value: 'male' | 'female') => setProfile({ ...profile, gender: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Weight */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-400" />
                      Bhai, weight kitna hai? (kg)
                    </label>
                    <Input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
                      className="bg-white/5 border-white/20 text-white focus:border-emerald-500"
                    />
                  </motion.div>

                  {/* Height */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-emerald-400" />
                      Bhai, height batao (cm)
                    </label>
                    <Input
                      type="number"
                      value={profile.height}
                      onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
                      className="bg-white/5 border-white/20 text-white focus:border-emerald-500"
                    />
                  </motion.div>

                  {/* Activity Level */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Kitna active rehte ho?
                    </label>
                    <Select
                      value={profile.activityLevel}
                      onValueChange={(value: any) => setProfile({ ...profile, activityLevel: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Kam Active (Office Work)</SelectItem>
                        <SelectItem value="light">Thoda Active (1-3 days gym)</SelectItem>
                        <SelectItem value="moderate">Moderate (3-5 days gym)</SelectItem>
                        <SelectItem value="very">Bahut Active (6-7 days)</SelectItem>
                        <SelectItem value="extra">Athlete Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Goal */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Target className="w-4 h-4 text-gold-400" />
                      Kya goal hai bhai?
                    </label>
                    <Select
                      value={profile.goal}
                      onValueChange={(value: any) => setProfile({ ...profile, goal: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deficit">Weight Ghatana Hai (Fat Loss)</SelectItem>
                        <SelectItem value="maintain">Maintain Karna Hai</SelectItem>
                        <SelectItem value="surplus">Muscle Banana Hai (Bulk)</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </div>

                {/* Training Level */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    🏋️ Training Experience
                  </label>
                  <Select
                    value={profile.trainingLevel}
                    onValueChange={(value: any) => setProfile({ ...profile, trainingLevel: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">🌱 Beginner (0-1 year)</SelectItem>
                      <SelectItem value="intermediate">💪 Intermediate (1-3 years)</SelectItem>
                      <SelectItem value="advanced">🔥 Advanced (3-5 years)</SelectItem>
                      <SelectItem value="athlete">🏆 Athlete ({'>'}5 years / Competitive)</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Body Type */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    🧬 Body Type (Somatotype)
                  </label>
                  <Select
                    value={profile.bodyType}
                    onValueChange={(value: any) => setProfile({ ...profile, bodyType: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ectomorph">🪶 Ectomorph (Lean, fast metabolism)</SelectItem>
                      <SelectItem value="mesomorph">💪 Mesomorph (Athletic, muscular)</SelectItem>
                      <SelectItem value="endomorph">🐻 Endomorph (Stocky, slower metabolism)</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Macro Distribution */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    📊 Macro Distribution Style
                  </label>
                  <Select
                    value={profile.macroDistribution}
                    onValueChange={(value: any) => setProfile({ ...profile, macroDistribution: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">⚖️ Standard (Balanced)</SelectItem>
                      <SelectItem value="keto">🥑 Keto (Low Carb, High Fat)</SelectItem>
                      <SelectItem value="highcarb">🍚 High Carb (Endurance)</SelectItem>
                      <SelectItem value="athlete">🏃 Athlete (High Protein)</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Diet Type with SVG Plate */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-gold-400" />
                    Kya khana pasand hai?
                  </label>
                  <div className="flex gap-4 items-center">
                    <Select
                      value={profile.dietType}
                      onValueChange={(value: any) => setProfile({ ...profile, dietType: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="veg">🥗 Vegetarian (Shuddh Shakahari)</SelectItem>
                        <SelectItem value="nonveg">🍗 Non-Vegetarian (Sab Din)</SelectItem>
                        <SelectItem value="flexitarian">📿 Flexitarian (Mangalwar/Shaniwar Veg)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Interactive SVG Plate */}
                    <svg width="60" height="60" viewBox="0 0 60 60" className="flex-shrink-0">
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill={profile.dietType === 'veg' ? '#10b981' : profile.dietType === 'flexitarian' ? '#a855f7' : '#f59e0b'}
                        opacity="0.3"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="20"
                        fill="none"
                        stroke={profile.dietType === 'veg' ? '#10b981' : profile.dietType === 'flexitarian' ? '#a855f7' : '#f59e0b'}
                        strokeWidth="2"
                      />
                      <text
                        x="30"
                        y="35"
                        textAnchor="middle"
                        fill="white"
                        fontSize="20"
                      >
                        {profile.dietType === 'veg' ? '🥗' : profile.dietType === 'flexitarian' ? '📿' : '🍗'}
                      </text>
                    </svg>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button
                    onClick={calculatePlan}
                    disabled={completionProgress < 100}
                    className="w-full bg-gradient-to-r from-emerald-600 to-gold-600 hover:from-emerald-700 hover:to-gold-700 text-white py-6 text-lg font-semibold shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Chalo, Mera Plan Dikhao! 🚀
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </Button>
                  {completionProgress < 100 && (
                    <p className="text-center text-sm text-gray-400 mt-2">
                      {Math.round(completionProgress)}% complete - Saari details bharo
                    </p>
                  )}
                </motion.div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}

        {/* Results */}
        {currentPage === 'results' && results && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 justify-center"
            >
              <Button
                onClick={() => setCurrentPage('form')}
                variant="outline"
                className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/20"
              >
                ← Profile Edit Karo
              </Button>
              <Button
                onClick={() => window.print()}
                className="bg-gradient-to-r from-emerald-600 to-gold-600 hover:from-emerald-700 hover:to-gold-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Plan Download Karo
              </Button>
            </motion.div>

            {/* Health Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02, rotateX: 2 }}
            >
              <Card className="glass backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-gray-400 mb-2">Tumhari Health Status</p>
                  <p className={`text-4xl font-serif font-bold ${results.healthStatus.color}`}>
                    {results.healthStatus.status}
                  </p>
                  <p className="text-gray-400 mt-2">BMI: {results.bmi.toFixed(1)}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Macros */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, rotateX: 2 }}
            >
              <Card className="glass backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-white">
                    Daily Macros - {profile.goal === 'deficit' ? 'Fat Loss' : profile.goal === 'surplus' ? 'Muscle Gain' : 'Maintain'} Mode
                  </CardTitle>
                  <CardDescription className="text-gray-400">Roz ka target</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-300">Calories (Total Energy)</span>
                      <span className="text-2xl font-bold text-emerald-400">{results.macros.calories} kcal</span>
                    </div>
                    <Progress value={100} className="h-3 bg-emerald-950" />
                    <p className="text-xs text-gray-500 mt-1">
                      BMR: {Math.round(results.bmr)} | TDEE: {Math.round(results.tdee)}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-300">Protein</span>
                      <span className="text-lg font-bold text-blue-400">{results.macros.protein}g</span>
                    </div>
                    <Progress
                      value={(results.macros.protein * 4 / results.macros.calories) * 100}
                      className="h-3 bg-blue-950"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-300">Carbs</span>
                      <span className="text-lg font-bold text-amber-400">{results.macros.carbs}g</span>
                    </div>
                    <Progress
                      value={(results.macros.carbs * 4 / results.macros.calories) * 100}
                      className="h-3 bg-amber-950"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-300">Fats</span>
                      <span className="text-lg font-bold text-orange-400">{results.macros.fats}g</span>
                    </div>
                    <Progress
                      value={(results.macros.fats * 9 / results.macros.calories) * 100}
                      className="h-3 bg-orange-950"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Professional Features Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Water Intake Calculator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.02, rotateX: 2 }}
              >
                <Card className="glass backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                      💧 Daily Water Intake
                    </CardTitle>
                    <CardDescription className="text-gray-400">Stay hydrated for best results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-5xl font-bold text-cyan-400 mb-2">{results.waterIntake}L</p>
                      <p className="text-sm text-gray-400">
                        Based on {profile.weight}kg body weight & {profile.activityLevel} activity
                      </p>
                      <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <p className="text-xs text-cyan-300">
                          💡 Drink {Math.round(results.waterIntake * 4)} glasses (250ml each)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Goal Timeline */}
              {results.goalTimeline && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, rotateX: 2 }}
                >
                  <Card className="glass backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                        ⏱️ Goal Timeline
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        When you'll reach {goalWeight}kg
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-purple-400 mb-1">
                          {results.goalTimeline.weeksToGoal} Weeks
                        </p>
                        <p className="text-sm text-gray-400">Target: {results.goalTimeline.targetDate}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Weekly Change:</span>
                          <span className="text-purple-400 font-semibold">
                            {results.goalTimeline.weeklyWeightChange}kg/week
                          </span>
                        </div>
                        <div className={`p-3 rounded-lg ${results.goalTimeline.isRealistic
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-amber-500/10 border border-amber-500/20'
                          }`}>
                          <p className={`text-xs ${results.goalTimeline.isRealistic ? 'text-emerald-300' : 'text-amber-300'
                            }`}>
                            {results.goalTimeline.recommendation}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Enhanced BMI Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.02, rotateX: 2 }}
            >
              <Card className="glass backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-white flex items-center gap-2">
                    📊 BMI Visual Gauge
                  </CardTitle>
                  <CardDescription className="text-gray-400">Body Mass Index Analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* BMI Gauge Visual */}
                    <div className="relative h-32">
                      {/* Background zones */}
                      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                        <div className="flex-1 bg-blue-500/20 border-r border-white/10" title="Underweight" />
                        <div className="flex-1 bg-emerald-500/20 border-r border-white/10" title="Normal" />
                        <div className="flex-1 bg-amber-500/20 border-r border-white/10" title="Overweight" />
                        <div className="flex-1 bg-red-500/20" title="Obese" />
                      </div>

                      {/* BMI Pointer */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 transition-all duration-700"
                        style={{
                          left: `${Math.min(Math.max((results.bmi - 10) / 30 * 100, 0), 100)}%`,
                        }}
                      >
                        <div className="relative">
                          <div className="absolute -translate-x-1/2 -translate-y-full mb-2">
                            <div className="bg-white text-gray-900 px-3 py-1 rounded-full font-bold text-sm whitespace-nowrap">
                              {results.bmi.toFixed(1)}
                            </div>
                            <div className="w-0.5 h-4 bg-white mx-auto" />
                          </div>
                          <div className="w-4 h-4 bg-white rounded-full border-4 border-gray-900 -translate-x-1/2" />
                        </div>
                      </div>

                      {/* Zone Labels */}
                      <div className="absolute bottom-0 inset-x-0 flex text-xs text-gray-400">
                        <div className="flex-1 text-center">&lt;18.5</div>
                        <div className="flex-1 text-center">18.5-25</div>
                        <div className="flex-1 text-center">25-30</div>
                        <div className="flex-1 text-center">&gt;30</div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500/40" />
                        <span className="text-gray-400">Underweight</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-emerald-500/40" />
                        <span className="text-gray-400">Normal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500/40" />
                        <span className="text-gray-400">Overweight</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500/40" />
                        <span className="text-gray-400">Obese</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Supplement Recommendations */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02, rotateX: 2 }}
            >
              <Card className="glass backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-white flex items-center gap-2">
                    💊 Smart Supplement Stack
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Personalized for {profile.trainingLevel === 'athlete' ? 'Athletes' : 'Your Goals'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.supplements.map((supp, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            {supp.name}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${supp.priority === 'essential'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : supp.priority === 'recommended'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-gray-500/20 text-gray-400'
                                }`}
                            >
                              {supp.priority}
                            </span>
                          </h4>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">
                          <strong>Purpose:</strong> {supp.purpose}
                        </p>
                        <p className="text-sm text-emerald-400">
                          <strong>Timing:</strong> {supp.timing}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    💡 Always consult a healthcare provider before starting supplements
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Meal Timing Optimizer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 }}
              whileHover={{ scale: 1.02, rotateX: 2 }}
            >
              <Card className="glass backdrop-blur-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-white flex items-center gap-2">
                    ⏰ Meal Timing Strategy
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Optimize nutrient timing for best results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-pink-400 mb-2">Pre-Workout</h4>
                      <p className="text-sm text-gray-300">{results.mealTiming.preworkout}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-purple-400 mb-2">Post-Workout</h4>
                      <p className="text-sm text-gray-300">{results.mealTiming.postworkout}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-cyan-400 mb-2">Daily Structure</h4>
                      <p className="text-sm text-gray-300">{results.mealTiming.dailyMeals}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <h4 className="font-semibold text-emerald-400 mb-2">Protein Target</h4>
                      <p className="text-sm text-gray-300">{results.mealTiming.proteinDistribution}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Flippable Meal Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-white flex items-center gap-2">
                    <Utensils className="w-6 h-6 text-gold-400" />
                    Tumhara Desi Meal Plan
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {profile.dietType === 'veg' ? '🥗 Pure Vegetarian' : profile.dietType === 'flexitarian' ? '📿 Flexitarian (Religious Days Respected)' : '🍗 Non-Vegetarian'} • Card pe click karo benefits dekhne ke liye
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Flexitarian Tabs */}
                  {profile.dietType === 'flexitarian' && results?.weeklyPlan && (
                    <div className="mb-6">
                      <div className="flex gap-2 p-1 rounded-lg bg-white/5 border border-white/10">
                        <button
                          onClick={() => setActiveTab('regular')}
                          className={`flex-1 py-2 px-4 rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'regular'
                            ? 'bg-gradient-to-r from-emerald-600 to-gold-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        >
                          <Calendar className="w-4 h-4" />
                          Regular Days (Sun, Mon, Wed, Thu, Fri)
                        </button>
                        <button
                          onClick={() => setActiveTab('religious')}
                          className={`flex-1 py-2 px-4 rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'religious'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        >
                          📿 Religious Days (Tue, Sat)
                        </button>
                      </div>
                      <p className="text-center text-sm text-emerald-400 mt-3">
                        {results.weeklyPlan.note}
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {(profile.dietType === 'flexitarian' && results?.weeklyPlan
                      ? activeTab === 'regular'
                        ? results.weeklyPlan.regularDays
                        : results.weeklyPlan.religiousDays
                      : results.mealPlan
                    ).map((meal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, rotateY: 0 }}
                        animate={{ opacity: 1, rotateY: flippedCards.includes(index) ? 180 : 0 }}
                        transition={{ duration: 0.6 }}
                        onClick={() => toggleFlip(index)}
                        className="cursor-pointer h-40 relative"
                        style={{ perspective: '1000px' }}
                      >
                        <div
                          className={`absolute inset-0 rounded-xl p-4 ${flippedCards.includes(index) ? 'hidden' : 'block'
                            } glass backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-gold-500/10 border border-white/10`}
                        >
                          <h3 className="font-bold text-white text-lg">{meal.name}</h3>
                          <p className="text-emerald-400 italic text-sm">{meal.hinglishName}</p>
                          <p className="text-gray-400 text-sm mt-1">{meal.portion}</p>
                          <div className="mt-3 flex justify-between items-end">
                            <div className="flex gap-3 text-xs">
                              <span className="text-blue-400">P: {meal.protein}g</span>
                              <span className="text-amber-400">C: {meal.carbs}g</span>
                              <span className="text-orange-400">F: {meal.fats}g</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-400">{meal.calories}</p>
                          </div>
                        </div>

                        <div
                          className={`absolute inset-0 rounded-xl p-4 ${flippedCards.includes(index) ? 'block' : 'hidden'
                            } glass backdrop-blur-xl bg-gradient-to-br from-gold-500/10 to-emerald-500/10 border border-white/10`}
                          style={{ transform: 'rotateY(180deg)' }}
                        >
                          <h3 className="font-bold text-gold-400 text-sm">💡 Benefits</h3>
                          <p className="text-white text-sm mt-2">
                            {meal.name.includes('Protein') || meal.name.includes('Paneer') || meal.name.includes('Egg') || meal.name.includes('Chicken')
                              ? '🔥 High Protein for muscle recovery & growth'
                              : meal.name.includes('Rice') || meal.name.includes('Roti') || meal.name.includes('Poha')
                                ? '⚡ Complex carbs for sustained energy'
                                : meal.name.includes('Almonds') || meal.name.includes('Peanuts')
                                  ? '🧠 Healthy fats for brain & hormones'
                                  : '🌟 Balanced nutrition for overall health'}
                          </p>
                          <p className="text-emerald-400 text-xs mt-3">Click to flip back</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass backdrop-blur-xl bg-gradient-to-r from-emerald-500/10 to-gold-500/10 border-white/10">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-300">
                    💪 <strong className="text-white">Yaad Rakho:</strong> Consistency is key bhai! Apne body ko
                    suno, agar bhook lage toh thoda adjust karo. Paani bahut piyo aur 7-8 ghante sona mat bhoolo.
                    <span className="text-emerald-400 ml-2">Let's get it! 🚀</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
