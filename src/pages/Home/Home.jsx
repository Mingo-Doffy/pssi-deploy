import React from 'react';
import { Box, Container, Typography, Button, Grid, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

export default function Home() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      <Container component="main" maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Grid container spacing={4}>
          {/* Section Hero */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h3" gutterBottom>
                Bienvenue sur PSSI
              </Typography>
              <Typography variant="h5" sx={{ mb: 3 }}>
              CYBERSECURITE: POLITIQUE DE SECURITE DES SYSTEMES D'INFORMATION DE L'ADMINISTRATION PUBLIQUE <br/>

                La solution complète pour évaluer votre sécurité informatique
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                to="/login"
                sx={{ mr: 2 }}
              >
                Se connecter
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                component={Link} 
                to="/register"
              >
                S'inscrire
              </Button>
            </Paper>
          </Grid>

          {/* Features */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Évaluation complète
              </Typography>
              <Typography>
                Analysez tous les aspects de votre sécurité informatique avec notre outil spécialisé.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Comparaison
              </Typography>
              <Typography>
                Comparez vos résultats avec d'autres entreprises de votre secteur.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Recommandations
              </Typography>
              <Typography>
                Recevez des suggestions personnalisées pour améliorer votre sécurité.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Footer />
    </Box>
  );
}