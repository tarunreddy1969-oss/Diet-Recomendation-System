'use client';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MacroChart({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const data = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: [protein, carbs, fat],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 2,
    }]
  };

  return <Pie data={data} options={{ responsive: true, maintainAspectRatio: false }} />;
}