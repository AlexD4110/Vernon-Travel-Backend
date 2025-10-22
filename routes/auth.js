// routes/auth.js
// ======================================================================
// Players API for Vernon Travel Basketball (Supabase + Express)
// - Public: POST /register
// - Admin:  GET /, GET /:id, PATCH /:id, DELETE /:id  (requires x-api-key)
// Notes:
//   * Database columns are snake_case. We map camelCase request fields to snake_case.
//   * Email sending uses your configured transporter (mailer.js).
// ======================================================================

const express = require('express');
const router = express.Router();
const transporter = require('../mailer');
const nodemailer = require('nodemailer');

// ------------------------ helpers & middleware ------------------------

// API key guard for admin endpoints
function requireApiKey(req, res, next) {
  const key = req.get('x-api-key');
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
}

// Attach Supabase client
router.use((req, res, next) => {
  const supabase = req.app.locals.supabase;
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase client not configured' });
  }
  req.supabase = supabase;
  next();
});

// Light validators
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(s || '').trim());
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

// Centralized Supabase error handler
function handleSbError(res, error, fallbackStatus = 400) {
  if (error && error.code === '23505') {
    // unique_violation
    return res.status(409).json({ message: 'Duplicate record.', details: error });
  }
  return res.status(fallbackStatus).json({ message: error?.message || 'Database error', details: error });
}

// ------------------------------- routes --------------------------------

/**
 * GET / (admin)
 * Paginated list of players
 * Query: ?page=1&size=50
 */
router.get('/', requireApiKey, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const size = Math.min(Math.max(parseInt(req.query.size || '50', 10), 1), 200);
    const from = (page - 1) * size;
    const to = from + size - 1;

    const { data, error, count } = await req.supabase
      .from('players')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return handleSbError(res, error, 500);
    return res.json({ page, size, count, data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * GET /:id (admin)
 * Fetch a single player by id
 */
router.get('/:id', requireApiKey, getPlayer, (req, res) => {
  return res.json(res.player);
});

/**
 * POST /register (public)
 * Validates input, inserts into public.players (snake_case), sends confirmation email.
 */
router.post('/register', async (req, res) => {
  try {
    const { parentName, playerFirstName, playerLastName, email } = req.body;

    if (!nonEmpty(parentName) || !nonEmpty(playerFirstName) || !nonEmpty(playerLastName) || !isEmail(email)) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Map camelCase body -> snake_case DB columns
    const playerPayload = {
      player_first_name: req.body.playerFirstName,
      player_last_name:  req.body.playerLastName,
      parent_name:       req.body.parentName,
      email:             String(req.body.email || '').trim().toLowerCase(),
      phone:             req.body.phone ?? null,
      grade_level:       req.body.gradeLevel ?? null,
      gender:            req.body.gender ?? null,
      address: {
        street: req.body.street ?? '',
        town:   req.body.town ?? '',
        state:  req.body.state ?? '',
        zip:    req.body.zip ?? '',
      },
      emergency_contact_name:   req.body.emergencyContactName ?? null,
      emergency_contact_number: req.body.emergencyContactNumber ?? null,
    };

    const { data: newPlayer, error } = await req.supabase
      .from('players')
      .insert([playerPayload])
      .select()
      .single();

    if (error) return handleSbError(res, error);

    // Email confirmation
    const mailOptions = {
      from: `"Vernon Travel Basketball" <no-reply@vernontravellbasketball.org>`,
      to: playerPayload.email,
      replyTo: 'contact@vernontravellbasketball.org',
      subject: 'Registration Confirmation',
      text: `Dear ${req.body.parentName},

Thank you for registering ${req.body.playerFirstName} ${req.body.playerLastName} for the 2025 season of Vernon Travel Basketball!

We have received your registration details and will share more information over the next few days and week!

Best regards,
Vernon Travel Basketball`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      const preview = nodemailer.getTestMessageUrl(info); // ethereal only
      return res.status(201).json({
        message: 'Registration successful, confirmation email sent.',
        ...(preview ? { previewUrl: preview } : {}),
        player: newPlayer,
      });
    } catch (mailErr) {
      console.error('Email send error:', mailErr);
      return res.status(201).json({
        message: 'Registration successful, but failed to send confirmation email.',
        player: newPlayer,
      });
    }
  } catch (err) {
    console.error('Error during registration:', err);
    return res.status(400).json({ message: err.message });
  }
});

/**
 * PATCH /:id (admin)
 * Updates only provided fields. Maps camelCase body -> snake_case columns.
 */
router.patch('/:id', requireApiKey, getPlayer, async (req, res) => {
  const updates = {};
  const addressUpdates = {};

  // Map individual fields to snake_case if provided
  if (req.body.playerFirstName != null) updates.player_first_name = req.body.playerFirstName;
  if (req.body.playerLastName  != null) updates.player_last_name  = req.body.playerLastName;
  if (req.body.parentName      != null) updates.parent_name       = req.body.parentName;
  if (req.body.email           != null) updates.email             = String(req.body.email).trim().toLowerCase();
  if (req.body.gradeLevel      != null) updates.grade_level       = req.body.gradeLevel;
  if (req.body.phone           != null) updates.phone             = req.body.phone;
  if (req.body.gender          != null) updates.gender            = req.body.gender;

  // Address (JSON merge)
  if (req.body.street != null) addressUpdates.street = req.body.street;
  if (req.body.town   != null) addressUpdates.town   = req.body.town;
  if (req.body.state  != null) addressUpdates.state  = req.body.state;
  if (req.body.zip    != null) addressUpdates.zip    = req.body.zip;
  if (Object.keys(addressUpdates).length > 0) {
    updates.address = { ...(res.player.address || {}), ...addressUpdates };
  }

  // Emergency contact (snake_case)
  if (req.body.emergencyContactName    != null) updates.emergency_contact_name   = req.body.emergencyContactName;
  if (req.body.emergencyContactNumber  != null) updates.emergency_contact_number = req.body.emergencyContactNumber;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields provided for update' });
  }

  try {
    const { data: updatedPlayer, error } = await req.supabase
      .from('players')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return handleSbError(res, error);
    return res.json(updatedPlayer);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /:id (admin)
 * Permanently deletes a player.
 */
router.delete('/:id', requireApiKey, getPlayer, async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('players')
      .delete()
      .eq('id', req.params.id);

    if (error) return handleSbError(res, error, 500);
    return res.json({ message: 'Deleted player' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ------------------------------- utilities ------------------------------

/**
 * Middleware: loads player by :id or 404
 */
async function getPlayer(req, res, next) {
  try {
    const { data: player, error } = await req.supabase
      .from('players')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) return handleSbError(res, error, 500);
    if (!player) return res.status(404).json({ message: 'Cannot find player' });

    res.player = player;
    return next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = router;
