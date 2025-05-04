const express = require('express');
const router = express.Router({ strict: true });
const authController = require('../controllers/authController');
const evaluationController = require('../controllers/evaluationController');
const questions = require('../questions/questions.json');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const db = require('../config/db');

// ==================== ROUTES PUBLIQUES ====================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// ==================== ROUTES PROTÉGÉES ====================
router.get('/questions', authenticate, (req, res) => {
  res.json({
    success: true,
    data: questions
  });
});

router.get('/evaluations/history', authenticate, async (req, res) => {
  try {
    const { entite_id } = req.user;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const [evaluations, total] = await Promise.all([
      db.query(
        `SELECT e.*, u.nom as evaluateur
         FROM evaluation e
         JOIN utilisateur u ON e.utilisateur_id = u.utilisateur_id
         WHERE e.entite_id = ?
         ORDER BY e.date_evaluation DESC,
        [entite_id]` 
      ),
      db.queryOne(
        `SELECT COUNT(*) as total 
         FROM evaluation 
         WHERE entite_id = ?`,
        [entite_id]
      )
    ]);

    res.json({
      success: true,
      data: evaluations,
      pagination: {
        total: total.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    console.error("Erreur récupération historique:", error);
    res.status(500).json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
});
/*router.get('/evaluations/history', authenticate, async (req, res) => {
  try {
    const { entite_id } = req.user;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const [evaluations, [total]] = await Promise.all([ // Destructuring pour plus de clarté et éviter une indirection
      db.query(
        `SELECT e.*, u.nom as evaluateur
         FROM evaluation e
         JOIN utilisateur u ON e.utilisateur_id = u.utilisateur_id
         WHERE e.entite_id = ?
         ORDER BY e.date_evaluation DESC
         LIMIT ? OFFSET ?`,
        [entite_id, limit, offset] // Utilisation des variables calculées
      ),
      db.query( // Changement de queryOne à query pour être compatible avec la déstructuration
        `SELECT COUNT(*) as total
         FROM evaluation
         WHERE entite_id = ?`,
        [entite_id]
      )
    ]);

    res.json({
      success: true,
      data: evaluations,
      pagination: {
        total: total.total, // Accès direct à la propriété 'total'
        page,
        limit,
        totalPages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    console.error("Erreur récupération historique:", error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur"
    });
  }
});*/

router.get('/evaluations/history/details',
  authenticate,
  (req, res, next) => {
    console.log(`Accessing history for user: ${req.user.utilisateur_id}`);
    next();
  },
  evaluationController.getEvaluationHistoryDetails
);

router.get('/evaluations/stats', authenticate, async (req, res) => {
  try {
    const [stats] = await db.query( // [] au lieu de queryOne pour uniformiser l'api
      `SELECT
        COUNT(*) as total_evaluations,
        AVG(score) as average_score,
        MIN(score) as min_score,
        MAX(score) as max_score,
        MIN(date_evaluation) as first_evaluation,
        MAX(date_evaluation) as last_evaluation
       FROM evaluation
       WHERE entite_id = ?`,
      [req.user.entite_id]
    );

    res.json({
      success: true,
      data: {
        ...stats[0], // Accès au premier élément du tableau
        average_score: stats[0]?.average_score ? parseFloat(stats[0].average_score) : 0 // ?. pour éviter erreur si stats est null
      }
    });
  } catch (error) {
    console.error("Erreur récupération statistiques:", error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur"
    });
  }
});

router.get('/entites', authenticate, async (req, res) => {
  try {
    const entites = await db.query(`
      SELECT entite_id, nom, secteur
      FROM entite
      WHERE entite_id != ?
      ORDER BY nom
    `, [req.user.entite_id]);

    res.json({
      success: true,
      data: entites
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

router.get('/evaluations/latest/:entiteId', authenticate, async (req, res) => {
  try {
      const [evaluation] = await db.query( // [] au lieu de queryOne
          `SELECT * FROM evaluation
           WHERE entite_id = ?
           ORDER BY date_evaluation DESC LIMIT 1`,
          [req.params.entiteId]
      );

      if (!evaluation || evaluation.length === 0) { //vérification que evaluation existe
          return res.status(404).json({
              success: false,
              error: 'NO_EVALUATION',
              message: "Aucune évaluation trouvée pour cette entité"
          });
      }

      res.json({
          success: true,
          ...evaluation[0], // Accès au premier élément
          details: JSON.parse(evaluation[0].details) // Accès à la propriété details
      });
  } catch (error) {
      console.error("Erreur récupération évaluation:", error);
      res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: "Erreur serveur"
      });
  }
});

// GET détails d'une entité spécifique
router.get('/entites/:id', authenticate, async (req, res) => {
  try {
    const [entite] = await db.query( // [] au lieu de queryOne
      'SELECT entite_id, nom, secteur FROM entite WHERE entite_id = ?',
      [req.params.id]
    );

    if (!entite || entite.length === 0) { // vérification que entite existe
      return res.status(404).json({
        success: false,
        error: 'ENTITY_NOT_FOUND',
        message: "Entité non trouvée"
      });
    }

    res.json({
      success: true,
      data: entite[0] // Accès au premier élément
    });
  } catch (error) {
    console.error("Erreur récupération entité:", error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur"
    });
  }
});


// Routes existantes...
router.get('/evaluations/latest/:entiteId', authenticate, evaluationController.getLatestEvaluation);
router.get('/evaluations/history', authenticate, evaluationController.getEvaluationHistory);
router.get('/evaluations/history/details', authenticate, evaluationController.getEvaluationHistoryDetails);
router.post('/evaluations', authenticate, evaluationController.createEvaluation);
router.get('/evaluations', authenticate, evaluationController.getEvaluations);
router.get('/evaluations/compare/:id', authenticate, evaluationController.compareEvaluations);
router.get('/entites', authenticate, evaluationController.getAllEntites);

// ==================== ROUTES ADMIN ====================
router.get('/admin/stats', authenticate, authorize(['DG']), (req, res) => {
  res.json({
    success: true,
    data: { /* statistiques */ }
  });
});

module.exports = router;
