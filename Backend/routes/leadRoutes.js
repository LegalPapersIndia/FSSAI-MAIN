// routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

const adminAuth = require('../middleware/adminAuth'); // add this

// === Public Route (Form Submission) ===
router.post('/leadRoutes', limiter, async (req, res) => {
  const payload = req.body;
  let lead = null;

  try {
    lead = new Lead({
      rawPayload: payload,
      application_type: payload['ctl00$ContentPlaceHolder1$ddlApplicationType'],
      applicant_name: payload['ctl00$ContentPlaceHolder1$txtName'],
      email: payload['ctl00$ContentPlaceHolder1$txtEmail'],
      mobile: payload['ctl00$ContentPlaceHolder1$txtPhone1'],
      nature_of_business: payload['ctl00$ContentPlaceHolder1$ddlNatureBusiness'],
      food_category: payload['ctl00$ContentPlaceHolder1$ddlFoodCategory'],
      designation: payload['ctl00$ContentPlaceHolder1$ddlDesignition'],
      house_no: payload['ctl00$ContentPlaceHolder1$txtHOUSE'],
      area_locality: payload['ctl00$ContentPlaceHolder1$txtAreaLocality'],
      city: payload['ctl00$ContentPlaceHolder1$txtCity'],
      district: payload['ctl00$ContentPlaceHolder1$txtDistrict'],
      state: payload['ctl00$ContentPlaceHolder1$ddlState'],
      pin: payload['ctl00$ContentPlaceHolder1$txtPin'],
      leadSource: payload.leadSource,
      serviceCategory: payload.serviceCategory,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'new'
    });

    await lead.save();
    console.log(`✅ Lead Saved: ${lead.applicant_name}`);

  } catch (err) {
    console.error('Database save error:', err);
    return res.status(500).send('error');
  }

  // Try CRM in background (non-blocking)
  try {
    const crmRes = await fetch("https://legalpapers.konceptsoftwaresolutions.com/leadRoutes", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload).toString(),
    });

    if (crmRes.ok) {
      await Lead.findByIdAndUpdate(lead._id, { status: 'contacted' });
    }
  } catch (crmErr) {
    console.warn('CRM sync failed (data safe in DB)', crmErr);
  }

  res.status(200).send('success');
});

// === Admin Protected Routes ===
router.get('/api/leads', adminAuth, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ submittedAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.get('/api/lead/:id', adminAuth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;