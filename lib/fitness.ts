// BMR Calculation using Mifflin-St Jeor Equation
export interface UserProfile {
    name: string;
    age: number;
    gender: 'male' | 'female';
    weight: number; // in kg
    height: number; // in cm
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
    goal: 'deficit' | 'maintain' | 'surplus';
    dietType: 'veg' | 'nonveg' | 'flexitarian'; // flexitarian = veg on religious days
    trainingLevel?: 'beginner' | 'intermediate' | 'advanced' | 'athlete';
    bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph';
    bodyFatPercentage?: number; // For Katch-McArdle formula
    macroDistribution?: 'standard' | 'keto' | 'highcarb' | 'athlete';
    nonVegDays?: string[]; // For flexitarian diet
}

export interface MacroNutrients {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export interface Meal {
    name: string;
    hinglishName: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    type: 'veg' | 'nonveg';
}

// Calculate BMR using Mifflin-St Jeor
export function calculateBMR(profile: UserProfile): number {
    const { weight, height, age, gender } = profile;

    if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * age - 161;
    }
}

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(bmr: number, activityLevel: string): number {
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extra: 1.9,
    };

    return bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2);
}

// Calculate target calories based on goal
export function calculateTargetCalories(tdee: number, goal: string): number {
    switch (goal) {
        case 'deficit':
            return tdee - 500; // 500 calorie deficit
        case 'surplus':
            return tdee + 300; // 300 calorie surplus
        default:
            return tdee; // maintain
    }
}

// Calculate macronutrients with multiple distribution options
export function calculateMacros(calories: number, goal: string, distribution?: string): MacroNutrients {
    let proteinCalories, carbsCalories, fatsCalories;

    // Use custom distribution if provided
    if (distribution === 'keto') {
        // Ketogenic: Very low carb, high fat
        proteinCalories = calories * 0.25;
        carbsCalories = calories * 0.05;
        fatsCalories = calories * 0.70;
    } else if (distribution === 'highcarb') {
        // High carb for endurance athletes
        proteinCalories = calories * 0.20;
        carbsCalories = calories * 0.60;
        fatsCalories = calories * 0.20;
    } else if (distribution === 'athlete') {
        // Athlete: Higher protein for recovery
        proteinCalories = calories * 0.30;
        carbsCalories = calories * 0.45;
        fatsCalories = calories * 0.25;
    } else {
        // Standard distribution based on goal
        if (goal === 'surplus') {
            proteinCalories = calories * 0.25;
            carbsCalories = calories * 0.50;
            fatsCalories = calories * 0.25;
        } else if (goal === 'deficit') {
            proteinCalories = calories * 0.30;
            carbsCalories = calories * 0.40;
            fatsCalories = calories * 0.30;
        } else {
            proteinCalories = calories * 0.25;
            carbsCalories = calories * 0.45;
            fatsCalories = calories * 0.30;
        }
    }

    return {
        calories: Math.round(calories),
        protein: Math.round(proteinCalories / 4),
        carbs: Math.round(carbsCalories / 4),
        fats: Math.round(fatsCalories / 9),
    };
}

// Calculate BMR using Katch-McArdle (requires body fat %)
export function calculateBMRKatch(weight: number, bodyFatPercentage: number): number {
    const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
    return 370 + (21.6 * leanBodyMass);
}

// Supplement Recommendations
export interface SupplementRecommendation {
    name: string;
    purpose: string;
    timing: string;
    priority: 'essential' | 'recommended' | 'optional';
}

export function getSupplementRecommendations(
    goal: string,
    trainingLevel?: string,
    dietType?: string
): SupplementRecommendation[] {
    const recommendations: SupplementRecommendation[] = [];

    // Protein powder (for all)
    if (trainingLevel === 'athlete' || trainingLevel === 'advanced') {
        recommendations.push({
            name: 'Whey/Plant Protein',
            purpose: 'Muscle recovery & growth',
            timing: 'Post-workout within 30 mins',
            priority: 'essential',
        });
    } else {
        recommendations.push({
            name: 'Protein Powder',
            purpose: 'Meet daily protein goals',
            timing: 'Anytime (post-workout ideal)',
            priority: 'recommended',
        });
    }

    // Creatine for strength/muscle building
    if (goal === 'surplus' || trainingLevel === 'athlete') {
        recommendations.push({
            name: 'Creatine Monohydrate',
            purpose: 'Strength & power output',
            timing: '5g daily (timing doesn\'t matter)',
            priority: 'essential',
        });
    }

    // Multivitamin (vegetarians especially)
    if (dietType === 'veg' || dietType === 'flexitarian') {
        recommendations.push({
            name: 'Multivitamin + B12',
            purpose: 'Fill micronutrient gaps',
            timing: 'Morning with breakfast',
            priority: 'recommended',
        });
    }

    // Omega-3 for everyone
    recommendations.push({
        name: 'Omega-3 (Fish Oil/Algae)',
        purpose: 'Heart health & inflammation',
        timing: 'With any meal',
        priority: dietType === 'veg' ? 'essential' : 'recommended',
    });

    // Pre-workout for athletes
    if (trainingLevel === 'athlete' || trainingLevel === 'advanced') {
        recommendations.push({
            name: 'Pre-Workout',
            purpose: 'Energy & focus',
            timing: '20-30 mins before training',
            priority: 'optional',
        });
    }

    // Weight loss supplements
    if (goal === 'deficit') {
        recommendations.push({
            name: 'Green Tea Extract',
            purpose: 'Metabolism support',
            timing: 'Morning or pre-workout',
            priority: 'optional',
        });
    }

    return recommendations;
}

// Meal Timing Optimizer
export interface MealTiming {
    preworkout: string;
    postworkout: string;
    dailyMeals: string;
    proteinDistribution: string;
}

export function getMealTiming(goal: string, trainingLevel?: string): MealTiming {
    const isAthlete = trainingLevel === 'athlete' || trainingLevel === 'advanced';

    return {
        preworkout: isAthlete
            ? '🥖 1-2 hours before: 30-40g carbs + 10-15g protein (e.g., banana + peanut butter, oats)'
            : '🍌 30-60 mins before: Light snack (fruit, energy bar)',
        postworkout: isAthlete
            ? '🍗 Within 30 mins: 20-40g protein + 40-60g carbs (e.g., protein shake + rice, chicken + roti)'
            : '🥤 Within 1 hour: Protein shake or meal with protein + carbs',
        dailyMeals: isAthlete
            ? '🍽️ 5-6 meals: Spread protein evenly (every 3-4 hours for muscle protein synthesis)'
            : '🍽️ 3-4 meals: Focus on hitting daily targets, timing is flexible',
        proteinDistribution: isAthlete
            ? `📊 ${Math.round((goal === 'surplus' ? 2.2 : 2.0) * 10) / 10}g protein per kg body weight - spread across all meals`
            : `📊 ${Math.round((goal === 'surplus' ? 1.8 : goal === 'deficit' ? 2.0 : 1.6) * 10) / 10}g protein per kg - 3-4 meals is fine`,
    };
}

// BMI Calculator
export function calculateBMI(weight: number, height: number): number {
    return weight / Math.pow(height / 100, 2);
}

// Get health status based on BMI
export function getHealthStatus(bmi: number, goal: string): { status: string; color: string } {
    if (bmi < 18.5) {
        return { status: goal === 'surplus' ? 'Building Strength 💪' : 'Need More Energy 🌱', color: 'text-amber-500' };
    } else if (bmi >= 18.5 && bmi < 25) {
        return { status: 'Fit & Active 🌟', color: 'text-emerald-500' };
    } else if (bmi >= 25 && bmi < 30) {
        return { status: goal === 'deficit' ? 'On Track to Wellness 🎯' : 'Building Power 💫', color: 'text-blue-500' };
    } else {
        return { status: 'Focus on Longevity 🌿', color: 'text-orange-500' };
    }
}

// Indian Vegetarian Meals Database
export const vegetarianMeals: Meal[] = [
    {
        name: 'Breakfast - Poha with Peanuts',
        hinglishName: 'Subah ka Poha (1.5 Katori)',
        portion: '1.5 bowls',
        calories: 250,
        protein: 6,
        carbs: 40,
        fats: 8,
        type: 'veg',
    },
    {
        name: 'Mid-Morning - Banana & Almonds',
        hinglishName: 'Kela aur Badaam (1 Kela + 10 Badaam)',
        portion: '1 banana + 10 almonds',
        calories: 180,
        protein: 4,
        carbs: 30,
        fats: 6,
        type: 'veg',
    },
    {
        name: 'Lunch - Roti, Dal, Rice & Sabzi',
        hinglishName: 'Daal-Chawal aur 2 Roti (Ghar ka Khana)',
        portion: '2 rotis + 1 bowl dal + 1 bowl rice + sabzi',
        calories: 550,
        protein: 18,
        carbs: 85,
        fats: 12,
        type: 'veg',
    },
    {
        name: 'Evening Snack - Sprouts Chaat',
        hinglishName: 'Moong Sprouts Chat (1 Katori)',
        portion: '1 bowl',
        calories: 150,
        protein: 8,
        carbs: 22,
        fats: 3,
        type: 'veg',
    },
    {
        name: 'Dinner - Paneer Sabzi & Roti',
        hinglishName: 'Paneer ki Sabzi aur 2 Roti',
        portion: '2 rotis + paneer curry',
        calories: 450,
        protein: 20,
        carbs: 50,
        fats: 15,
        type: 'veg',
    },
    {
        name: 'Post-Dinner - Turmeric Milk',
        hinglishName: 'Haldi Doodh (1 Glass)',
        portion: '1 glass',
        calories: 120,
        protein: 8,
        carbs: 12,
        fats: 4,
        type: 'veg',
    },
];

// Indian Non-Vegetarian Meals Database
export const nonVegetarianMeals: Meal[] = [
    {
        name: 'Breakfast - Egg Bhurji & Roti',
        hinglishName: 'Anda Bhurji aur 2 Roti',
        portion: '2 eggs + 2 rotis',
        calories: 320,
        protein: 18,
        carbs: 35,
        fats: 12,
        type: 'nonveg',
    },
    {
        name: 'Mid-Morning - Banana & Boiled Egg',
        hinglishName: 'Kela aur Uble Ande',
        portion: '1 banana + 2 eggs',
        calories: 220,
        protein: 14,
        carbs: 28,
        fats: 8,
        type: 'nonveg',
    },
    {
        name: 'Lunch - Chicken Curry, Rice & Roti',
        hinglishName: 'Chicken Curry, Chawal aur Roti',
        portion: '150g chicken + 1 bowl rice + 2 rotis',
        calories: 650,
        protein: 45,
        carbs: 75,
        fats: 18,
        type: 'nonveg',
    },
    {
        name: 'Evening Snack - Boiled Eggs',
        hinglishName: 'Uble Ande (2 Ande)',
        portion: '2 boiled eggs',
        calories: 140,
        protein: 12,
        carbs: 2,
        fats: 10,
        type: 'nonveg',
    },
    {
        name: 'Dinner - Fish Curry & Roti',
        hinglishName: 'Machhli ki Curry aur 2 Roti',
        portion: '150g fish + 2 rotis',
        calories: 420,
        protein: 35,
        carbs: 45,
        fats: 12,
        type: 'nonveg',
    },
    {
        name: 'Post-Dinner - Protein Milk',
        hinglishName: 'Doodh (1 Glass)',
        portion: '1 glass',
        calories: 120,
        protein: 8,
        carbs: 12,
        fats: 4,
        type: 'nonveg',
    },
];

// Flexitarian Meals - Mix of Veg and Non-Veg for those who avoid non-veg on religious days
export const flexitarianMeals: Meal[] = [
    {
        name: 'Breakfast - Egg Bhurji OR Poha (based on day)',
        hinglishName: 'Subah ka Nashta',
        portion: 'Veg on Tue/Sat, Non-veg other days',
        calories: 280,
        protein: 12,
        carbs: 38,
        fats: 10,
        type: 'veg',
    },
    {
        name: 'Mid-Morning - Fruits & Nuts',
        hinglishName: 'Kela aur Badaam',
        portion: '1 banana + 10 almonds',
        calories: 180,
        protein: 4,
        carbs: 30,
        fats: 6,
        type: 'veg',
    },
    {
        name: 'Lunch - Dal/Chicken with Rice & Roti',
        hinglishName: 'Daal-Chawal (Tue/Sat) ya Chicken (other days)',
        portion: 'Changes based on religious days',
        calories: 600,
        protein: 28,
        carbs: 80,
        fats: 15,
        type: 'veg',
    },
    {
        name: 'Evening Snack - Sprouts OR Boiled Eggs',
        hinglishName: 'Moong Sprouts ya Uble Ande',
        portion: 'Veg on Tue/Sat',
        calories: 150,
        protein: 10,
        carbs: 18,
        fats: 5,
        type: 'veg',
    },
    {
        name: 'Dinner - Paneer/Fish with Roti',
        hinglishName: 'Paneer (Tue/Sat) ya Machhli (other days)',
        portion: '2 rotis + curry',
        calories: 480,
        protein: 26,
        carbs: 48,
        fats: 14,
        type: 'veg',
    },
    {
        name: 'Post-Dinner - Milk',
        hinglishName: 'Haldi Doodh',
        portion: '1 glass',
        calories: 120,
        protein: 8,
        carbs: 12,
        fats: 4,
        type: 'veg',
    },
];

// Get flexitarian plan note
export function getFlexiPlanNote(nonVegDays?: string[]): string {
    if (!nonVegDays || nonVegDays.length === 0) {
        return '🥬 Flexitarian: Abhi aapne koi Non-Veg din select nahi kiya hai, toh sab din Veg dikhadenge.';
    }
    return `🍖 Flexitarian: ${nonVegDays.join(', ')} ko Non-Veg meals, aur baaki din Pure Veg.`;
}

// Get weekly meal plan for flexitarian
export interface WeeklyMealPlan {
    nonVegDays: Meal[];
    vegDays: Meal[];
    note: string;
}

export function getFlexitarianWeeklyPlan(targetCalories: number, nonVegDays?: string[]): WeeklyMealPlan {
    // Non-veg meals for selected days
    const nonVegDayMeals = scaleMeals(nonVegetarianMeals, targetCalories);

    // Veg meals for other days
    const vegDayMeals = scaleMeals(vegetarianMeals, targetCalories);

    return {
        nonVegDays: nonVegDayMeals,
        vegDays: vegDayMeals,
        note: getFlexiPlanNote(nonVegDays),
    };
}

// Scale meals based on target calories
export function scaleMeals(meals: Meal[], targetCalories: number): Meal[] {
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const scaleFactor = targetCalories / totalCalories;

    return meals.map(meal => ({
        ...meal,
        calories: Math.round(meal.calories * scaleFactor),
        protein: Math.round(meal.protein * scaleFactor),
        carbs: Math.round(meal.carbs * scaleFactor),
        fats: Math.round(meal.fats * scaleFactor),
    }));
}

// Calculate daily water intake (in liters) based on weight
export function calculateWaterIntake(weight: number, activityLevel: string): number {
    // Base: 30-35ml per kg of body weight
    let baseWater = weight * 0.033; // Start with 33ml per kg

    // Adjust for activity level
    const activityMultipliers = {
        sedentary: 1.0,
        light: 1.1,
        moderate: 1.2,
        very: 1.3,
        extra: 1.4,
    };

    const multiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.0;
    return Math.round(baseWater * multiplier * 10) / 10; // Round to 1 decimal
}

// Calculate timeline to reach goal weight
export interface GoalTimeline {
    weeksToGoal: number;
    targetDate: string;
    weeklyWeightChange: number;
    isRealistic: boolean;
    recommendation: string;
}

export function calculateGoalTimeline(
    currentWeight: number,
    goalWeight: number,
    goal: string,
    tdee: number,
    targetCalories: number
): GoalTimeline {
    const weightDifference = Math.abs(currentWeight - goalWeight);
    const calorieDeficitOrSurplus = Math.abs(tdee - targetCalories);

    // 7700 calories = 1 kg of fat
    const weeksToGoal = (weightDifference * 7700) / (calorieDeficitOrSurplus * 7);
    const weeklyWeightChange = weightDifference / weeksToGoal;

    // Realistic weight loss: 0.5-1 kg per week, gain: 0.25-0.5 kg per week
    const isRealistic = goal === 'deficit'
        ? weeklyWeightChange >= 0.3 && weeklyWeightChange <= 1
        : weeklyWeightChange >= 0.2 && weeklyWeightChange <= 0.5;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + Math.round(weeksToGoal * 7));

    let recommendation = '';
    if (!isRealistic && goal === 'deficit') {
        recommendation = weeklyWeightChange > 1
            ? '⚠️ Too aggressive! Slow down to prevent muscle loss'
            : '💡 Progress might be slow. Consider increasing calorie deficit slightly';
    } else if (!isRealistic && goal === 'surplus') {
        recommendation = weeklyWeightChange > 0.5
            ? '⚠️ Too fast! Risk of excess fat gain'
            : '💡 Very slow bulk. Consider small calorie increase';
    } else {
        recommendation = '✅ Perfect pace for sustainable results!';
    }

    return {
        weeksToGoal: Math.round(weeksToGoal),
        targetDate: targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        weeklyWeightChange: Math.round(weeklyWeightChange * 10) / 10,
        isRealistic,
        recommendation,
    };
}

// Get meal alternatives/swaps
export function getMealAlternatives(mealName: string): string[] {
    const alternatives: { [key: string]: string[] } = {
        'Breakfast': [
            'Oats with milk & berries',
            'Dosa with sambar',
            'Idli with coconut chutney',
            'Besan chilla with curd',
        ],
        'Lunch': [
            'Brown rice with rajma',
            'Quinoa pulao with raita',
            'Mixed dal with 2 rotis',
            'Chole with bhature (sunday treat)',
        ],
        'Dinner': [
            'Grilled fish with veggies',
            'Tofu stir-fry with rotis',
            'Egg curry with rice',
            'Palak paneer with 2 rotis',
        ],
        'Snack': [
            'Roasted makhana',
            'Fruit chaat',
            'Greek yogurt with nuts',
            'Protein shake',
        ],
    };

    // Find matching category
    for (const [category, options] of Object.entries(alternatives)) {
        if (mealName.toLowerCase().includes(category.toLowerCase())) {
            return options;
        }
    }

    return ['Adjust portions to fit your macros', 'Consult nutritionist for specific swaps'];
}
