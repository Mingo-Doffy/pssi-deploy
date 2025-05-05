/*import React from 'react';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Box, 
  Typography,
  Grid,
  Alert,
  useTheme,
  Paper,
  CircularProgress
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

// Configuration des domaines
const DOMAIN_CONFIG = {
  leadership_gouvernance: "Leadership & Gouvernance",
  organisation_securite: "Organisation Sécurité",
  gestion_risques: "Gestion des Risques",
  securite_rh: "Sécurité RH",
  gestion_actifs: "Gestion des actifs informationnels",
  gestion_acces: "Gestion des Accès"
};

const EvolutionChart = ({ currentHistory = [], comparedHistory = [] }) => {
  const theme = useTheme();

  const prepareData = () => {
    if (!Array.isArray(currentHistory) || !Array.isArray(comparedHistory)) {
      return [];
    }

    // Prendre seulement les 6 dernières évaluations pour chaque entité
    const lastCurrent = currentHistory.slice(0, 6).reverse();
    const lastCompared = comparedHistory.slice(0, 6).reverse();

    const currentData = lastCurrent.map(evaluation => ({
      date: new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR'),
      [currentHistory[0]?.entite_nom || 'Votre entité']: evaluation.score,
    }));

    const comparedData = lastCompared.map(evaluation => ({
      date: new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR'),
      [comparedHistory[0]?.entite_nom || 'Entité comparée']: evaluation.score,
    }));

    return [...currentData, ...comparedData].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  const chartData = prepareData();

  if (chartData.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 4 }}>
        Données historiques insuffisantes pour afficher l'évolution
      </Alert>
    );
  }

  return (
    <Box sx={{ height: 400, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Évolution comparative (6 dernières évaluations)
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <RechartsTooltip formatter={(value) => [`${value}%`, 'Score']} />
          <RechartsLegend />
          <Line
            type="monotone"
            dataKey={currentHistory[0]?.entite_nom || 'Votre entité'}
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey={comparedHistory[0]?.entite_nom || 'Entité comparée'}
            stroke={theme.palette.secondary.main}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

const groupByDomain = (details) => {
  const domains = {};
  
  // Initialiser les domaines
  Object.keys(DOMAIN_CONFIG).forEach(domainId => {
    domains[domainId] = {
      total: 0,
      count: 0,
      name: DOMAIN_CONFIG[domainId],
      questions: []
    };
  });

  // Calculer les totaux par domaine
  Object.entries(details).forEach(([key, value]) => {
    // Extraire le domaine et la question (ex: "leadership_gouvernance_q1" => ["leadership_gouvernance", "q1"])
    const [domainId, questionId] = key.split('_q');
    
    if (domains[domainId]) {
      const points = typeof value === 'object' ? value.points : value;
      domains[domainId].total += points;
      domains[domainId].count += 1;
      domains[domainId].questions.push({
        id: questionId,
        points: points,
        suggestion: typeof value === 'object' ? value.suggestion : null
      });
    }
  });

  // Calculer les moyennes et formater les résultats
  const result = {};
  Object.entries(domains).forEach(([domainId, domainData]) => {
    const score = domainData.count > 0 ? 
      Math.round((domainData.total / (domainData.count * 10)) * 100) : 0;
      
    result[domainId] = {
      name: domainData.name,
      score: score,
      questions: domainData.questions
    };
  });

  return result;
};



export default function ComparisonRadar({ data, loading }) {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!data || !data.currentEntite || !data.comparedEntite) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Données de comparaison incomplètes
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Grouper les données par domaine
  const currentDomains = groupByDomain(data.currentEntite.data || {});
  const comparedDomains = groupByDomain(data.comparedEntite.data || {});
  const domainDifferences = calculateDifferences(currentDomains, comparedDomains);

  // Préparer les données pour les graphiques
  const domainLabels = Object.values(DOMAIN_CONFIG);
  
  const radarData = {
    labels: domainLabels,
    datasets: [
      {
        label: data.currentEntite.name,
        data: domainLabels.map(label => {
          const domainEntry = Object.values(currentDomains).find(d => d.name === label);
          return domainEntry ? domainEntry.score : 0;
        }),
        backgroundColor: 'rgba(63, 81, 181, 0.6)',
        borderColor: 'rgba(63, 81, 181, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(63, 81, 181, 1)',
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: data.comparedEntite.name,
        data: domainLabels.map(label => {
          const domainEntry = Object.values(comparedDomains).find(d => d.name === label);
          return domainEntry ? domainEntry.score : 0;
        }),
        backgroundColor: 'rgba(233, 30, 99, 0.6)',
        borderColor: 'rgba(233, 30, 99, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(233, 30, 99, 1)',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const barData = {
    labels: domainLabels,
    datasets: [
      {
        label: data.currentEntite.name,
        data: domainLabels.map(label => {
          const domainEntry = Object.values(currentDomains).find(d => d.name === label);
          return domainEntry ? domainEntry.score : 0;
        }),
        backgroundColor: 'rgba(63, 81, 181, 0.7)'
      },
      {
        label: data.comparedEntite.name,
        data: domainLabels.map(label => {
          const domainEntry = Object.values(comparedDomains).find(d => d.name === label);
          return domainEntry ? domainEntry.score : 0;
        }),
        backgroundColor: 'rgba(233, 30, 99, 0.7)'
      }
    ]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}%`
        }
      },
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14
          }
        }
      }
    }
  };

  const radarOptions = {
    ...commonOptions,
    elements: {
      line: {
        tension: 0.1,
        fill: true
      }
    },
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { 
          stepSize: 20,
          backdropColor: 'transparent'
        },
        pointLabels: {
          font: {
            size: theme.typography.fontSize
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader
        title={`Comparaison des évaluations: ${data.currentEntite.name} vs ${data.comparedEntite.name}`}
        subheader="Analyse des performances par domaine de sécurité"
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom align="center">
              Vue Radar par domaine
            </Typography>
            <Box sx={{ height: 400 }}>
              <Radar data={radarData} options={radarOptions} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom align="center">
              Comparaison par domaine
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar data={barData} options={commonOptions} />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Analyse des différences par domaine
              </Typography>
              <Grid container spacing={2}>
                {domainDifferences.map((diff, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper elevation={1} sx={{ 
                      p: 2, 
                      height: '100%',
                      borderLeft: `4px solid ${diff.isPositive ? theme.palette.success.main : theme.palette.error.main}`
                    }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {diff.domain}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {data.currentEntite.name}: {diff.currentScore}%
                        </Typography>
                        <Typography variant="body2">
                          {data.comparedEntite.name}: {diff.comparedScore}%
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        color={diff.isPositive ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        Différence: {diff.isPositive ? '+' : ''}{diff.difference}%
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

*/

import React, { useState } from 'react';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Box, 
  Typography,
  Grid,
  Alert,
  useTheme,
  Paper,
  CircularProgress
} from '@mui/material';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const DOMAIN_CONFIG = {
  leadership_gouvernance: "Leadership & Gouvernance",
  organisation_securite: "Organisation Sécurité",
  gestion_risques: "Gestion des Risques",
  securite_rh: "Sécurité RH",
  gestion_actifs: "Gestion des actifs informationnels",
  gestion_acces: "Gestion des Accès"
};

const groupByDomain = (details) => {
  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
    return Object.keys(DOMAIN_CONFIG).reduce((acc, domainId) => {
      acc[domainId] = {
        name: DOMAIN_CONFIG[domainId],
        score: 0,
        questions: []
      };
      return acc;
    }, {});
  }

  const domains = {};
  
  Object.keys(DOMAIN_CONFIG).forEach(domainId => {
    domains[domainId] = {
      total: 0,
      count: 0,
      name: DOMAIN_CONFIG[domainId],
      questions: []
    };
  });

  Object.entries(details).forEach(([key, value]) => {
    try {
      const [domainId, questionId] = key.includes('_q') ? 
        key.split('_q') : 
        [key.replace(/_\d+$/, ''), key.split('_').pop()];
      
      if (domains[domainId]) {
        const points = typeof value === 'object' ? 
                      (value.points || 0) : 
                      (typeof value === 'number' ? value : 0);
        
        domains[domainId].total += points;
        domains[domainId].count += 1;
        domains[domainId].questions.push({
          id: questionId,
          points: points,
          suggestion: typeof value === 'object' ? value.suggestion : null
        });
      }
    } catch (err) {
      console.warn(`Erreur traitement question ${key}:`, err);
    }
  });

  const result = {};
  Object.entries(domains).forEach(([domainId, domainData]) => {
    const score = domainData.count > 0 ? 
      Math.round((domainData.total / (domainData.count * 10)) * 100) : 0;
      
    result[domainId] = {
      name: domainData.name,
      score: Math.min(100, Math.max(0, score)),
      questions: domainData.questions
    };
  });

  return result;
};

const calculateDifferences = (currentDomains, comparedDomains) => {
  const differences = [];
  
  Object.entries(currentDomains).forEach(([domainId, currentData]) => {
    const comparedData = comparedDomains[domainId];
    if (comparedData) {
      const diff = currentData.score - comparedData.score;
      differences.push({
        domain: currentData.name,
        currentScore: currentData.score,
        comparedScore: comparedData.score,
        difference: diff,
        isPositive: diff > 0
      });
    }
  });

  return differences.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
};

export default function ComparisonRadar({ data, loading }) {
  const theme = useTheme();
  const [error, setError] = useState(null);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!data || !data.currentEntite || !data.comparedEntite) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {data?.error || "Données de comparaison incomplètes"}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  try {
    const currentDomains = groupByDomain(data.currentEntite.data || {});
    const comparedDomains = groupByDomain(data.comparedEntite.data || {});
    const domainDifferences = calculateDifferences(currentDomains, comparedDomains);

    const domainLabels = Object.values(DOMAIN_CONFIG);
    
    const radarData = {
      labels: domainLabels,
      datasets: [
        {
          label: data.currentEntite.name,
          data: domainLabels.map(label => {
            const domainEntry = Object.values(currentDomains).find(d => d.name === label);
            return domainEntry ? domainEntry.score : 0;
          }),
          backgroundColor: 'rgba(63, 81, 181, 0.6)',
          borderColor: 'rgba(63, 81, 181, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(63, 81, 181, 1)',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: data.comparedEntite.name,
          data: domainLabels.map(label => {
            const domainEntry = Object.values(comparedDomains).find(d => d.name === label);
            return domainEntry ? domainEntry.score : 0;
          }),
          backgroundColor: 'rgba(233, 30, 99, 0.6)',
          borderColor: 'rgba(233, 30, 99, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(233, 30, 99, 1)',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };

    const barData = {
      labels: domainLabels,
      datasets: [
        {
          label: data.currentEntite.name,
          data: domainLabels.map(label => {
            const domainEntry = Object.values(currentDomains).find(d => d.name === label);
            return domainEntry ? domainEntry.score : 0;
          }),
          backgroundColor: 'rgba(63, 81, 181, 0.7)'
        },
        {
          label: data.comparedEntite.name,
          data: domainLabels.map(label => {
            const domainEntry = Object.values(comparedDomains).find(d => d.name === label);
            return domainEntry ? domainEntry.score : 0;
          }),
          backgroundColor: 'rgba(233, 30, 99, 0.7)'
        }
      ]
    };

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.raw}%`
          }
        },
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 14
            }
          }
        }
      }
    };

    const radarOptions = {
      ...commonOptions,
      elements: {
        line: {
          tension: 0.1,
          fill: true
        }
      },
      scales: {
        r: {
          angleLines: { display: true },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { 
            stepSize: 20,
            backdropColor: 'transparent'
          },
          pointLabels: {
            font: {
              size: theme.typography.fontSize
            }
          }
        }
      }
    };

    return (
      <Card>
        <CardHeader
          title={`Comparaison: ${data.currentEntite.name} vs ${data.comparedEntite.name}`}
          subheader={`Dernières évaluations: ${new Date(data.currentEntite.latestDate).toLocaleDateString()} (${data.currentEntite.latestScore}%) vs ${new Date(data.comparedEntite.latestDate).toLocaleDateString()} (${data.comparedEntite.latestScore}%)`}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 400 }}>
                <Radar data={radarData} options={radarOptions} />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ height: 400 }}>
                <Bar data={barData} options={commonOptions} />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Analyse des différences par domaine
                </Typography>
                <Grid container spacing={2}>
                  {domainDifferences.map((diff, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper elevation={1} sx={{ 
                        p: 2, 
                        height: '100%',
                        borderLeft: `4px solid ${diff.isPositive ? theme.palette.success.main : theme.palette.error.main}`
                      }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {diff.domain}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            {data.currentEntite.name}: {diff.currentScore}%
                          </Typography>
                          <Typography variant="body2">
                            {data.comparedEntite.name}: {diff.comparedScore}%
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          color={diff.isPositive ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          Différence: {diff.isPositive ? '+' : ''}{diff.difference}%
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  } catch (err) {
    console.error("Erreur de rendu:", err);
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Une erreur est survenue lors de l'affichage des données
          </Alert>
        </CardContent>
      </Card>
    );
  }
}