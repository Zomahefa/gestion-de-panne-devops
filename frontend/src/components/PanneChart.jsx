import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PanneChart = () => {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}todos/`);
      const incidents = res.data;

      const statuses = ['pending', 'on_the_way', 'in_progress', 'resolved'];
      const colors = {
        pending: '#f44336',
        on_the_way: '#ff9800',
        in_progress: '#2196f3',
        resolved: '#4caf50',
      };

      const tempGrouped = {};
      incidents.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString();
        if (!tempGrouped[date]) tempGrouped[date] = [];
        tempGrouped[date].push(p);
      });

      setGrouped(tempGrouped);

      const datasets = statuses.map(status => ({
        label: status,
        data: Object.keys(tempGrouped).map(date =>
          tempGrouped[date].filter(p => p.status === status).length
        ),
        backgroundColor: colors[status],
        stack: 'total',
      }));

      setData({
        labels: Object.keys(tempGrouped),
        datasets: datasets,
      });
    };
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <Link to="/admin-dashboard" className="btn btn-outline-primary mb-3">
        🔙 Retour au tableau admin
      </Link>
      <h3>📊 Historique des pannes par date</h3>
      <Bar
        data={data}
        options={{
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const date = context.label;
                  const status = context.dataset.label;
                  const quartier = grouped[date]?.find(p => p.status === status)?.quartier || 'Inconnu';
                  return `${status} – ${quartier}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                precision: 0
              },
              title: {
                display: true,
                text: 'Nombre de pannes'
              },
              stacked: true
            },
            x: {
              title: {
                display: true,
                text: 'Date de signalement'
              },
              stacked: true
            }
          }
        }}
      />
    </div>
  );
};

export default PanneChart;
