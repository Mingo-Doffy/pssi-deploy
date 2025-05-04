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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Debug logging
    console.log(`Fetching history for entite_id: ${entite_id}, page: ${page}, limit: ${limit}, offset: ${offset}`);

    const [evaluations, [totalCount]] = await Promise.all([
      db.query(
        `SELECT e.*, u.nom as evaluateur
         FROM evaluation e
         JOIN utilisateur u ON e.utilisateur_id = u.utilisateur_id
         WHERE e.entite_id = ?
         ORDER BY e.date_evaluation DESC
         LIMIT ? OFFSET ?`,
        [entite_id, limit.toString(), offset.toString()] // Explicit string conversion
      ),
      db.query(
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
        total: totalCount?.total || 0, // Ajout de vérification si totalCount est null/undefined
        page,
        limit,
        totalPages: Math.ceil((totalCount?.total || 0) / limit) // Ajout de vérification
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

router.get('/evaluations/history/details',
  authenticate,
  (req, res, next) => {
    console.log(`Accessing history for user: ${req.user.utilisateur_id}`);
    next();
  },
  evaluationController.getEvaluationHistoryDetails
);

/*router.get('/evaluations/stats', authenticate, async (req, res) => {
  try {
    const [stats] = await db.query(
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
        ...stats[0] || {}, // Retourne un objet vide si stats est null/undefined
        average_score: stats[0]?.average_score ? parseFloat(stats[0].average_score) : 0
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
});*/
// Dans votre route /evaluations/stats
router.get('/evaluations/stats', authenticate, async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT
        COUNT(*) as total_evaluations,
        AVG(score) as average_score,
        MIN(date_evaluation) as first_evaluation,
        MAX(date_evaluation) as last_evaluation
      FROM evaluation
      WHERE entite_id = ?
    `, [req.user.entite_id]);

    res.json({
      success: true,
      total_evaluations: results[0]?.total_evaluations || 0,
      average_score: results[0]?.average_score ? parseFloat(results[0].average_score) : 0,
      first_evaluation: results[0]?.first_evaluation || null,
      last_evaluation: results[0]?.last_evaluation || null
    });
  } catch (error) {
    console.error("Erreur stats:", error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
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
    const [evaluation] = await db.query( // Utilisation de db.query
      `SELECT * FROM evaluation
       WHERE entite_id = ?
       ORDER BY date_evaluation DESC LIMIT 1`,
      [req.params.entiteId]
    );

    if (!evaluation || evaluation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NO_EVALUATION',
        message: "Aucune évaluation trouvée pour cette entité"
      });
    }

    res.json({
      success: true,
      ...evaluation[0] || {}, // Spread un objet vide si evaluation[0] est undefined
      details: evaluation[0]?.details ? JSON.parse(evaluation[0].details) : null // Vérification avant de parser
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
    const [entite] = await db.query(
      'SELECT entite_id, nom, secteur FROM entite WHERE entite_id = ?',
      [req.params.id]
    );

    if (!entite || entite.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ENTITY_NOT_FOUND',
        message: "Entité non trouvée"
      });
    }

    res.json({
      success: true,
      data: entite[0]
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
