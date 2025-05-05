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

/*router.get('/evaluations/latest/:entiteId', authenticate, async (req, res) => {
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
});*/

// Modifiez la route /evaluations/latest/:entiteId
router.get('/evaluations/latest/:entiteId', authenticate, async (req, res) => {
  try {
    const [evaluation] = await db.query(
      `SELECT e.*, ent.nom as entite_nom 
       FROM evaluation e
       JOIN entite ent ON e.entite_id = ent.entite_id
       WHERE e.entite_id = ?
       ORDER BY e.date_evaluation DESC LIMIT 1`,
      [req.params.entiteId]
    );

    if (!evaluation || evaluation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NO_EVALUATION',
        message: "Aucune évaluation trouvée pour cette entité"
      });
    }

    // Parse les détails si nécessaire
    let details = {};
    try {
      details = evaluation[0].details ? 
        (typeof evaluation[0].details === 'string' ? 
          JSON.parse(evaluation[0].details) : 
          evaluation[0].details) : 
        {};
    } catch (e) {
      console.error("Erreur parsing details:", e);
    }

    res.json({
      success: true,
      data: {
        ...evaluation[0],
        details: details
      }
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

// Ajoutez une nouvelle route pour la comparaison
/*router.get('/evaluations/compare', authenticate, async (req, res) => {
  try {
    const { entite1, entite2 } = req.query;
    
    if (!entite1 || !entite2) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMS',
        message: "Les IDs des entités à comparer sont requis"
      });
    }

    const [entite1Data, entite2Data, entite1History, entite2History] = await Promise.all([
      db.query(
        `SELECT e.*, ent.nom as entite_nom 
         FROM evaluation e
         JOIN entite ent ON e.entite_id = ent.entite_id
         WHERE e.entite_id = ?
         ORDER BY e.date_evaluation DESC LIMIT 1`,
        [entite1]
      ),
      db.query(
        `SELECT e.*, ent.nom as entite_nom 
         FROM evaluation e
         JOIN entite ent ON e.entite_id = ent.entite_id
         WHERE e.entite_id = ?
         ORDER BY e.date_evaluation DESC LIMIT 1`,
        [entite2]
      ),
      db.query(
        `SELECT * FROM evaluation 
         WHERE entite_id = ?
         ORDER BY date_evaluation DESC LIMIT 6`,
        [entite1]
      ),
      db.query(
        `SELECT * FROM evaluation 
         WHERE entite_id = ?
         ORDER BY date_evaluation DESC LIMIT 6`,
        [entite2]
      )
    ]);

    // Fonction pour parser les détails
    const parseDetails = (evalData) => {
      if (!evalData || !evalData[0]) return {};
      try {
        return evalData[0].details ? 
          (typeof evalData[0].details === 'string' ? 
            JSON.parse(evalData[0].details) : 
            evalData[0].details) : 
          {};
      } catch (e) {
        console.error("Erreur parsing details:", e);
        return {};
      }
    };

    res.json({
      success: true,
      data: {
        currentEntite: {
          id: entite1,
          name: entite1Data[0]?.entite_nom || "Entité 1",
          data: parseDetails(entite1Data)
        },
        comparedEntite: {
          id: entite2,
          name: entite2Data[0]?.entite_nom || "Entité 2",
          data: parseDetails(entite2Data)
        },
        currentHistory: entite1History || [],
        comparedHistory: entite2History || []
      }
    });

  } catch (error) {
    console.error("Erreur comparaison:", error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur lors de la comparaison"
    });
  }
});*/
router.get('/evaluations/compare', authenticate, async (req, res) => {
  try {
    const { entite1, entite2 } = req.query;
    
    if (!entite1 || !entite2) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMS',
        message: "Les IDs des entités à comparer sont requis"
      });
    }

    // Vérification que les entités existent
    const [entite1Exists, entite2Exists] = await Promise.all([
      db.query('SELECT entite_id FROM entite WHERE entite_id = ?', [entite1]),
      db.query('SELECT entite_id FROM entite WHERE entite_id = ?', [entite2])
    ]);

    if (entite1Exists.length === 0 || entite2Exists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ENTITIES_NOT_FOUND',
        message: "Une ou plusieurs entités n'existent pas"
      });
    }

    // Récupération des données
    const [entite1Data, entite2Data, entite1History, entite2History] = await Promise.all([
      db.query(
        `SELECT e.*, ent.nom as entite_nom 
         FROM evaluation e
         JOIN entite ent ON e.entite_id = ent.entite_id
         WHERE e.entite_id = ?
         ORDER BY e.date_evaluation DESC LIMIT 1`,
        [entite1]
      ),
      db.query(
        `SELECT e.*, ent.nom as entite_nom 
         FROM evaluation e
         JOIN entite ent ON e.entite_id = ent.entite_id
         WHERE e.entite_id = ?
         ORDER BY e.date_evaluation DESC LIMIT 1`,
        [entite2]
      ),
      db.query(
        `SELECT evaluation_id, entite_id, date_evaluation, score 
         FROM evaluation 
         WHERE entite_id = ?
         ORDER BY date_evaluation DESC LIMIT 6`,
        [entite1]
      ),
      db.query(
        `SELECT evaluation_id, entite_id, date_evaluation, score 
         FROM evaluation 
         WHERE entite_id = ?
         ORDER BY date_evaluation DESC LIMIT 6`,
        [entite2]
      )
    ]);

    // Fonction pour parser et valider les détails
    const parseDetails = (evalData) => {
      if (!evalData || !evalData[0] || !evalData[0].details) return {};
      
      try {
        const details = typeof evalData[0].details === 'string' 
          ? JSON.parse(evalData[0].details) 
          : evalData[0].details;
        
        // Validation des données
        if (typeof details !== 'object' || details === null) {
          console.error('Details invalides:', details);
          return {};
        }
        
        return details;
      } catch (e) {
        console.error("Erreur parsing details:", e);
        return {};
      }
    };

    // Vérification des données avant envoi
    if (!entite1Data[0] || !entite2Data[0]) {
      return res.status(404).json({
        success: false,
        error: 'NO_EVALUATION_DATA',
        message: "Données d'évaluation manquantes pour une ou plusieurs entités"
      });
    }

    res.json({
      success: true,
      data: {
        currentEntite: {
          id: entite1,
          name: entite1Data[0]?.entite_nom || "Entité 1",
          data: parseDetails(entite1Data),
          latestScore: entite1Data[0]?.score || 0,
          latestDate: entite1Data[0]?.date_evaluation || null
        },
        comparedEntite: {
          id: entite2,
          name: entite2Data[0]?.entite_nom || "Entité 2",
          data: parseDetails(entite2Data),
          latestScore: entite2Data[0]?.score || 0,
          latestDate: entite2Data[0]?.date_evaluation || null
        },
        currentHistory: entite1History,
        comparedHistory: entite2History
      }
    });

  } catch (error) {
    console.error("Erreur comparaison:", error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur lors de la comparaison",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
