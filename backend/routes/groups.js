const express = require('express');
const { Group } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.findAll({
      order: [['name', 'ASC']]
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add group
router.post('/', [
  authenticateToken,
  requirePermission('canManageServers'),
  body('name').isLength({ min: 1 }).trim().escape(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const group = await Group.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Group name already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update group
router.put('/:id', [
  authenticateToken,
  requirePermission('canManageServers'),
  body('name').isLength({ min: 1 }).trim().escape(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [updated] = await Group.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const group = await Group.findByPk(req.params.id);
    res.json(group);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Group name already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete group
router.delete('/:id', [
  authenticateToken,
  requirePermission('canManageServers')
], async (req, res) => {
  try {
    // Check if group has servers
    const { Server } = require('../models');
    const serverCount = await Server.count({
      where: { groupId: req.params.id }
    });
    
    if (serverCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete group. It contains ${serverCount} server(s). Please move or delete the servers first.` 
      });
    }
    
    const deleted = await Group.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;