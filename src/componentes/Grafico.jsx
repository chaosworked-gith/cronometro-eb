import { useEffect, useRef } from 'react';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);
Chart.defaults.font.family = "'Lato', sans-serif";
Chart.defaults.font.size = 14;
Chart.defaults.color = '#000000';

// Só as cores da paleta, nesta ordem; depois, as mesmas com transparência
const BASE = [
  [0, 23, 128],
  [0, 55, 255],
  [64, 105, 255],
  [212, 18, 26],
  [169, 42, 46],
];
const OPACIDADES = [1, 0.6, 0.35];

export function corDaSerie(i) {
  const [r, g, b] = BASE[i % BASE.length];
  const opacidade = OPACIDADES[Math.floor(i / BASE.length) % OPACIDADES.length];
  return opacidade === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${opacidade})`;
}

// Recria o gráfico quando os dados mudam (dados e opções devem vir memorizados)
export default function Grafico({ tipo, dados, opcoes, rotulo }) {
  const canvas = useRef(null);

  useEffect(() => {
    const grafico = new Chart(canvas.current, {
      type: tipo,
      data: dados,
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 300 }, ...opcoes },
    });
    return () => grafico.destroy();
  }, [tipo, dados, opcoes]);

  return (
    <div className="grafico">
      <canvas ref={canvas} role="img" aria-label={rotulo} />
    </div>
  );
}
