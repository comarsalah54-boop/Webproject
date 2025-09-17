const express = require('express');
const { Server, Group } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all servers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const servers = await Server.findAll({
      include: [{ 
        model: Group, 
        attributes: ['id', 'name', 'color'] 
      }],
      order: [['name', 'ASC']]
    });
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add server
router.post('/', [
  authenticateToken,
  requirePermission('canManageServers'),
  body('name').isLength({ min: 1 }).trim().escape(),
  body('hostname').isLength({ min: 1 }).trim(),
  body('ipAddress').isIP(),
  body('port').isInt({ min: 1, max: 65535 }),
  body('sshPort').optional().isInt({ min: 1, max: 65535 }),
  body('sshUser').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const server = await Server.create(req.body);
    const serverWithGroup = await Server.findByPk(server.id, {
      include: [{ 
        model: Group, 
        attributes: ['id', 'name', 'color'] 
      }]
    });
    res.status(201).json(serverWithGroup);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update server
router.put('/:id', [
  authenticateToken,
  requirePermission('canManageServers'),
  body('name').isLength({ min: 1 }).trim().escape(),
  body('hostname').isLength({ min: 1 }).trim(),
  body('ipAddress').isIP(),
  body('port').isInt({ min: 1, max: 65535 }),
  body('sshPort').optional().isInt({ min: 1, max: 65535 }),
  body('sshUser').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [updated] = await Server.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    const server = await Server.findByPk(req.params.id, {
      include: [{ 
        model: Group, 
        attributes: ['id', 'name', 'color'] 
      }]
    });
    res.json(server);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete server
router.delete('/:id', [
  authenticateToken,
  requirePermission('canManageServers')
], async (req, res) => {
  try {
    const deleted = await Server.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;