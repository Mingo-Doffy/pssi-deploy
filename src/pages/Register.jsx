import React from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';

export default function Register() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    role: 'DSI',
    entite_nom: '',
    secteur: '',
    taille: 'Moyenne'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation améliorée
    if (!formData.nom || !formData.email || !formData.mot_de_passe || !formData.entite_nom) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (formData.mot_de_passe.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);
    
    try {
      const result = await register(formData);
      
      if (result.success) {
        navigate('/login', { 
          state: { 
            registrationSuccess: true,
            email: formData.email 
          } 
        });
      } else {
        setError(result.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <HowToRegIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography component="h1" variant="h5" sx={{ mt: 1 }}>
          Création de compte
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <TextField
                name="nom"
                required
                fullWidth
                label="Nom complet"
                autoFocus
                value={formData.nom}
                onChange={handleChange}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                name="email"
                required
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                name="mot_de_passe"
                required
                fullWidth
                label="Mot de passe"
                type="password"
                value={formData.mot_de_passe}
                onChange={handleChange}
                helperText="Minimum 8 caractères"
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Rôle</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Rôle"
                  onChange={handleChange}
                >
                  <MenuItem value="DSI">DSI</MenuItem>
                  <MenuItem value="DG">DG</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                name="entite_nom"
                required
                fullWidth
                label="Nom de l'entité"
                value={formData.entite_nom}
                onChange={handleChange}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                name="secteur"
                fullWidth
                label="Secteur d'activité"
                value={formData.secteur}
                onChange={handleChange}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Taille</InputLabel>
                <Select
                  name="taille"
                  value={formData.taille}
                  label="Taille"
                  onChange={handleChange}
                >
                  <MenuItem value="Petite">Petite</MenuItem>
                  <MenuItem value="Moyenne">Moyenne</MenuItem>
                  <MenuItem value="Grande">Grande</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'S\'inscrire'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="/login" variant="body2">
                Déjà un compte? Se connecter
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}