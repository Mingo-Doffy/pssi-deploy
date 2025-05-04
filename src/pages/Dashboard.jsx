import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box, Typography, Container, Card, CardContent, Grid, Button,
  Tabs, Tab, Divider, CircularProgress, Alert, Avatar, List,
  ListItem, ListItemText, ListItemAvatar, Chip, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Business as BusinessIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Compare as CompareIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ComparisonRadar from '../components/Dashboard/ComparisonRadar';
import SecurityTest from '../components/Dashboard/SecurityTest';
import HistoryChart from '../components/Dashboard/HistoryChart';

function ComparisonTab({ 
  entites, 
  selectedEntite, 
  setSelectedEntite, 
  comparison, 
  compareEntites, 
  loading,
  user 
}) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Comparer avec une autre entité
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : entites.length === 0 ? (
              <Alert severity="warning">
                Aucune autre entité disponible pour comparaison
              </Alert>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Entité à comparer</InputLabel>
                  <Select
                    value={selectedEntite || ''}
                    onChange={(e) => setSelectedEntite(e.target.value)}
                    label="Entité à comparer"
                  >
                    {entites.map((entite) => (
                      <MenuItem 
                        key={entite.entite_id} 
                        value={entite.entite_id}
                        disabled={entite.entite_id === user?.entite_id}
                      >
                        {entite.nom} ({entite.secteur})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  onClick={compareEntites}
                  disabled={loading || !selectedEntite}
                  fullWidth
                  sx={{ mt: 2 }}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Comparaison en cours...' : 'Lancer la comparaison'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={8}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Chargement des données...</Typography>
          </Box>
        ) : comparison ? (
          <ComparisonRadar data={comparison} />
        ) : (
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '400px'
            }}>
              <CompareIcon color="action" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" align="center">
                {entites.length > 0 
                  ? "Sélectionnez une entité à comparer" 
                  : "Aucune entité disponible pour comparaison"}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
}

function HistoryTab() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/evaluations/history');
        setHistory(response.data);
      } catch (err) {
        setError(err.message || "Erreur lors du chargement de l'historique");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Analyse des Évaluations
      </Typography>
      
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <HistoryChart data={history} />
      )}
    </Box>
  );
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function StatCard({ title, value, icon, suffix = '' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          {React.cloneElement(icon, { color: 'primary', fontSize: 'large' })}
        </Box>
        <Typography variant="h5">
          {value}{suffix}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}
/*
function ProfileTab({ user }) {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [statsResponse, historyResponse] = await Promise.all([
          api.get('/evaluations/stats'),
          api.get('/evaluations/history')
        ]);

// Ajoutez des logs pour déboguer
console.log('Stats response:', statsResponse.data);
console.log('History response:', historyResponse.data);

        setStats(statsResponse.data);
        setHistory(historyResponse.data);
      } catch (err) {
        console.error("Erreur chargement stats:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const lineData = history.length > 0 ? [
    { date: "Début", score: 0 },
    ...history.sort((a, b) => new Date(a.date_evaluation) - new Date(b.date_evaluation))
      .map(evaluation => ({
        date: new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR'),
        score: evaluation.score
      }))
  ] : [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ width: 100, height: 100, mb: 2 }}>
              {user?.nom?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h5">{user?.nom || 'Utilisateur'}</Typography>
            <Typography color="text.secondary">{user?.email || ''}</Typography>
            
            <Box sx={{ mt: 3, width: '100%' }}>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Entité" 
                    secondary={user?.entite_nom || 'Non spécifié'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Secteur" 
                    secondary={user?.secteur || 'Non spécifié'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Rôle" 
                    secondary={user?.role || 'Non spécifié'} 
                  />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Statistiques des évaluations
            </Typography>
            
            {loading ? (
              <CircularProgress />
            ) : stats ? (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <StatCard 
                      title="Total" 
                      value={stats.total_evaluations || 0} 
                      icon={<AssessmentIcon />}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard 
                      title="Moyenne" 
                      value={stats.average_score?.toFixed(2) || '0.00'} 
                      suffix="/5"
                      icon={<TrendingUpIcon />}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard 
                      title="Première" 
                      value={stats.first_evaluation ? new Date(stats.first_evaluation).toLocaleDateString() : 'N/A'} 
                      icon={<HistoryIcon />}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard 
                      title="Dernière" 
                      value={stats.last_evaluation ? new Date(stats.last_evaluation).toLocaleDateString() : 'N/A'} 
                      icon={<UpdateIcon />}
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" gutterBottom>
                  Évolution des scores
                </Typography>
                <Box sx={{ height: 300 }}>
                  {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip 
                          formatter={(value) => [`${value}/5`, 'Score']}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                      Aucune donnée d'évolution disponible
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <Typography color="text.secondary">
                Aucune statistique disponible
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}*/
function ProfileTab({ user }) {
  const theme = useTheme();
  const [stats, setStats] = useState({
    total_evaluations: 0,
    average_score: 0,
    first_evaluation: null,
    last_evaluation: null
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // On charge d'abord l'historique qui fonctionne
        const historyResponse = await api.get('/evaluations/history');
        const evaluations = historyResponse.data || [];
        setHistory(evaluations);

        // On essaie de récupérer les stats
        let statsData = {
          total_evaluations: 0,
          average_score: 0,
          first_evaluation: null,
          last_evaluation: null
        };

        try {
          const statsResponse = await api.get('/evaluations/stats');
          if (statsResponse.data && statsResponse.data.total_evaluations !== undefined) {
            statsData = statsResponse.data;
          } else {
            // Calcul des stats côté frontend si l'API ne les fournit pas
            statsData = calculateStatsFromHistory(evaluations);
          }
        } catch (statsError) {
          console.warn("Erreur stats API, calcul côté frontend", statsError);
          statsData = calculateStatsFromHistory(evaluations);
        }

        setStats(statsData);

      } catch (err) {
        console.error("Erreur chargement données:", err);
        setError(err.response?.data?.message || err.message || "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour calculer les stats à partir de l'historique
  const calculateStatsFromHistory = (evaluations) => {
    if (!evaluations || evaluations.length === 0) {
      return {
        total_evaluations: 0,
        average_score: 0,
        first_evaluation: null,
        last_evaluation: null
      };
    }

    const sorted = [...evaluations].sort((a, b) => 
      new Date(a.date_evaluation) - new Date(b.date_evaluation)
    );

    return {
      total_evaluations: evaluations.length,
      average_score: evaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / evaluations.length,
      first_evaluation: sorted[0].date_evaluation,
      last_evaluation: sorted[sorted.length - 1].date_evaluation
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
    }
  };

  // Préparation des données pour le graphique
  const lineData = history.length > 0 ? [
    { date: "Début", score: 0 },
    ...history
      .sort((a, b) => new Date(a.date_evaluation) - new Date(b.date_evaluation))
      .map(evaluation => ({
        date: formatDate(evaluation.date_evaluation),
        score: evaluation.score || 0
      }))
  ] : [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ width: 100, height: 100, mb: 2 }}>
              {user?.nom?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h5">{user?.nom || 'Utilisateur'}</Typography>
            <Typography color="text.secondary">{user?.email || ''}</Typography>
            
            <Box sx={{ mt: 3, width: '100%' }}>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Entité" 
                    secondary={user?.entite_nom || 'Non spécifié'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Secteur" 
                    secondary={user?.secteur || 'Non spécifié'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Rôle" 
                    secondary={user?.role || 'Non spécifié'} 
                  />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Statistiques des évaluations
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <StatCard 
                      title="Score Moyen" 
                      value={stats?.average_score?.toFixed(2) || '0.00'} 
                      suffix="/5"
                      icon={<TrendingUpIcon />}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard 
                      title="Total Évaluations" 
                      value={stats?.total_evaluations || 0} 
                      icon={<AssessmentIcon />}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard 
                      title="Première Évaluation" 
                      value={stats?.first_evaluation 
                        ? new Date(stats.first_evaluation).toLocaleDateString('fr-FR') 
                        : 'N/A'} 
                      icon={<HistoryIcon />}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard 
                      title="Dernière Évaluation" 
                      value={stats?.last_evaluation 
                        ? new Date(stats.last_evaluation).toLocaleDateString('fr-FR') 
                        : 'N/A'} 
                      icon={<UpdateIcon />}
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" gutterBottom>
                  Évolution des scores
                </Typography>
                <Box sx={{ height: 300 }}>
                  {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip 
                          formatter={(value) => [`${value}/5`, 'Score']}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                      Aucune donnée d'évolution disponible
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entites, setEntites] = useState([]);
  const [selectedEntite, setSelectedEntite] = useState(null);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const entitesResponse = await api.get('/entites');
        
        if (!entitesResponse.data || entitesResponse.data.length === 0) {
          setError("Aucune entité trouvée dans le système");
          return;
        }

        setEntites(entitesResponse.data);

        if (entitesResponse.data.length > 0 && !selectedEntite) {
          const firstAvailableEntite = entitesResponse.data.find(e => e.entite_id !== user?.entite_id);
          if (firstAvailableEntite) {
            setSelectedEntite(firstAvailableEntite.entite_id);
          }
        }

        if (user?.entite_id) {
          await api.get(`/evaluations?entite_id=${user.entite_id}`);
        }
        
      } catch (err) {
        console.error("Erreur chargement données:", err);
        setError(err.message || "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const compareEntites = async () => {
    if (!selectedEntite) {
      setError("Veuillez sélectionner une entité valide");
      return;
    }

    if (!user?.entite_id) {
      setError("Impossible d'identifier votre entité actuelle");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedEntiteNum = Number(selectedEntite);
      
      const [
        selectedEntiteInfo, 
        currentEntiteData, 
        selectedEntiteData,
        currentHistoryRes,
        comparedHistoryRes
      ] = await Promise.all([
        api.get(`/entites/${selectedEntiteNum}`),
        api.get(`/evaluations/latest/${user.entite_id}`),
        api.get(`/evaluations/latest/${selectedEntiteNum}`),
        api.get(`/evaluations/history?entite_id=${user.entite_id}`),
        api.get(`/evaluations/history?entite_id=${selectedEntiteNum}`)
      ]);

      const transformDetails = (details) => {
        if (!details) return {};
        return Object.fromEntries(
          Object.entries(details).map(([key, value]) => [
            key,
            typeof value === 'object' ? value.points : value
          ])
        );
      };

      setComparison({
        currentEntite: {
          id: user.entite_id,
          name: user.entite_nom || "Votre entité",
          data: transformDetails(currentEntiteData.details)
        },
        comparedEntite: {
          id: selectedEntiteNum,
          name: selectedEntiteInfo.data.nom || "Entité comparée",
          data: transformDetails(selectedEntiteData.details)
        },
        categories: Object.keys(transformDetails(currentEntiteData.details)),
        currentHistory: currentHistoryRes.data,
        comparedHistory: comparedHistoryRes.data
      });

    } catch (err) {
      console.error("Erreur de comparaison:", err);
      setError(err.message || "Erreur lors de la comparaison");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              <BusinessIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Tableau de bord - {user?.entite_nom || 'Mon Tableau de Bord'}
            </Typography>
            <Typography color="text.secondary">
              Secteur: {user?.secteur || 'Non spécifié'} | Rôle: {user?.role || 'Non spécifié'}
            </Typography>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={logout}>
              Déconnexion
            </Button>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Card>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Profil" icon={<PersonIcon />} />
            <Tab label="Test de Sécurité" icon={<SecurityIcon />} />
            <Tab label="Historique" icon={<HistoryIcon />} />
            <Tab label="Comparaison" icon={<CompareIcon />} />
          </Tabs>
          
          <Divider />
          
          <TabPanel value={tabValue} index={0}>
            <ProfileTab user={user} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <SecurityTest />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <HistoryTab />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <ComparisonTab 
              entites={entites} 
              selectedEntite={selectedEntite}
              setSelectedEntite={setSelectedEntite}
              comparison={comparison}
              compareEntites={compareEntites}
              loading={loading}
              user={user}
            />
          </TabPanel>
        </Card>
      </Box>
    </Container>
  );
}