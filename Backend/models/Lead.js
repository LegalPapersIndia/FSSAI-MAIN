const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Exact raw payload jo frontend bhej raha hai
  rawPayload: {
    type: Object,
    required: true
  },

  // Clean fields for easy searching/filtering in admin dashboard
  application_type: String,
  applicant_name: String,
  email: String,
  mobile: String,
  nature_of_business: String,
  food_category: String,
  designation: String,
  house_no: String,
  area_locality: String,
  city: String,
  district: String,
  state: String,
  pin: String,

  leadSource: { type: String, default: 'fssaifood-india.org' },
  serviceCategory: { type: String, default: 'fssaiReg' },
  ip: String,
  userAgent: String,
  submittedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['new', 'contacted', 'paid', 'completed'],
    default: 'new'
  }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);