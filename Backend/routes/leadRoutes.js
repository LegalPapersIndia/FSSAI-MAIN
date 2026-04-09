// routes/leadRoutes.js

const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// ======================
// 1. Public Form Submission
// ======================
router.post('/leadRoutes', limiter, async (req, res) => {
  const payload = req.body;
  let lead = null;

  try {
    // routes/leadRoutes.js → POST /leadRoutes ke andar

lead = new Lead({
  rawPayload: payload,

  // Clean fields directly le lo (ab safe hai)
  application_type: payload.application_type,
  applicant_name: payload.applicant_name,
  email: payload.email,
  mobile: payload.mobile,
  nature_of_business: payload.nature_of_business,
  food_category: payload.food_category,
  designation: payload.designation,
  house_no: payload.house_no,
  area_locality: payload.area_locality,
  city: payload.city,
  district: payload.district,
  state: payload.state,
  pin: payload.pin,

  leadSource: payload.leadSource || 'fssaifood-india.org',
  serviceCategory: payload.serviceCategory || 'fssaiReg',
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  status: 'new'
});
    await lead.save();
    console.log(`✅ Lead Saved: ${lead.applicant_name || 'Unknown'}`);

  } catch (dbErr) {
    console.error('❌ Database Save Failed:', dbErr);
    return res.status(500).json({ success: false, message: 'Database save failed' });
  }

  // CRM in background (non-blocking)
  (async () => {
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
      console.warn('⚠️ CRM failed (data safe in DB):', crmErr.message);
    }
  })();

  res.status(200).json({ success: true, message: 'Application submitted successfully' });
});

// ======================
// 2. Admin Protected Route (Yeh missing tha!)
// ======================
const adminAuth = require('../middleware/adminAuth');

router.get('/api/leads', adminAuth, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ submittedAt: -1 });
    res.json(leads);
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

module.exports = router;