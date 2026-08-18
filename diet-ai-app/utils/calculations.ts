export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender.toLowerCase() === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

export function calculateTDEE(bmr: number, activity: string): number {
  const multipliers: { [key: string]: number } = { Low: 1.2, Medium: 1.55, High: 1.9 };
  return Math.round(bmr * multipliers[activity]);
}

export function calculateMacros(calories: number) {
  return {
    protein: Math.round((calories * 0.30) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.25) / 9)
  };
}