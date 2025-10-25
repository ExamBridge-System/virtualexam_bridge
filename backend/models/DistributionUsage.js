const mongoose = require('mongoose');

const distributionUsageSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['3 Easy', '1 Easy, 1 Medium', '1 Hard'],
  },
  usageCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('DistributionUsage', distributionUsageSchema);
