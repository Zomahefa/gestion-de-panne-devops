import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { BarChart3, LoaderCircle, TrendingUp } from "lucide-react";
import AdminShell from "./AdminShell.jsx";
import { STATUS_CONFIG, STATUS_ORDER, getStatus } from "../utils/status.js";
import "./PanneChart.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = {
  pending: "#b7791f",
  on_the_way: "#1f6fb2",
  in_progress: "#d97706",
  resolved: "#17845b",
};

const PanneChart = () => {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}todos/`);
        const incidents = res.data;
        setTotal(incidents.length);

        const tempGrouped = {};
        incidents.forEach((p) => {
          const date = new Date(p.created_at).toLocaleDateString("fr-FR");
          if (!tempGrouped[date]) tempGrouped[date] = [];
          tempGrouped[date].push(p);
        });

        const dates = Object.keys(tempGrouped).sort(
          (a, b) => new Date(a) - new Date(b),
        );

        const ordered = {};
        dates.forEach((d) => {
          ordered[d] = tempGrouped[d];
        });
        setGrouped(ordered);

        setData({
          labels: dates,
          datasets: STATUS_ORDER.map((status) => ({
            label: STATUS_CONFIG[status].short,
            data: dates.map(
              (date) =>
                ordered[date].filter((p) => p.status === status).length,
            ),
            backgroundColor: COLORS[status],
            stack: "total",
            borderRadius: 4,
            maxBarThickness: 42,
          })),
        });
      } catch (err) {
        console.error("Erreur chargement statistiques", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 12, family: "Inter, sans-serif" },
          color: "#55677c",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const date = context.label;
            const status = STATUS_ORDER[context.datasetIndex];
            const quartier =
              grouped[date]?.find((p) => p.status === status)?.quartier ||
              "Quartier non précisé";
            return `${context.dataset.label} : ${context.parsed.y} · ${quartier}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: "#8494a6", font: { size: 11 } },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0, color: "#8494a6", font: { size: 11 } },
        grid: { color: "#eef2f7" },
      },
    },
  };

  return (
    <AdminShell
      title="Statistiques"
      subtitle="Répartition des pannes signalées par date"
      actions={
        <span className="pc-total">
          <TrendingUp size={16} aria-hidden="true" />
          {total} signalement{total > 1 ? "s" : ""}
        </span>
      }
    >
      <section className="sig-card pc-card">
        <div className="sig-card__head pc-card__head">
          <h2 className="sig-card__title">
            <BarChart3 size={18} aria-hidden="true" />
            Historique des pannes
          </h2>
          <div className="pc-legend">
            {STATUS_ORDER.map((key) => {
              const { Icon, short } = getStatus(key);
              return (
                <span className="pc-legend__item" key={key}>
                  <Icon size={13} aria-hidden="true" />
                  {short}
                </span>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="sig-empty">
            <LoaderCircle size={24} className="sig-spin" aria-hidden="true" />
            <p className="sig-empty__title">Chargement des statistiques…</p>
          </div>
        ) : data.labels.length === 0 ? (
          <div className="sig-empty">
            <span className="sig-empty__icon">
              <BarChart3 size={24} aria-hidden="true" />
            </span>
            <p className="sig-empty__title">Aucune donnée à afficher</p>
          </div>
        ) : (
          <div className="pc-chart">
            <Bar data={data} options={options} />
          </div>
        )}
      </section>
    </AdminShell>
  );
};

export default PanneChart;
