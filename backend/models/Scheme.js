import mongoose from 'mongoose';

const SchemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add new Schema name'],
      trim: true,
    },

    // for government policies and rules and shemes
    benefits: {
      type: {
        type: String,
        enum: ['Financial', 'Subsidy', 'Insurance', 'Service'],
        default: 'Financial',
      },
      max_value_inr: {
        type: Number,
        default: 0,
      },
      description: String,
    },
    // to enlist the docs
    required_documents: [String],
    filters: {
      state: [String],
      gender: [String],
      caste: [String],
    },

    // for RAG and Embeddings
    original_pdf_url: String,
    snippet: String,
    vector: [Number],
    page_number: Number,

  },
  { timestamps: true }
);

export default mongoose.model('Scheme', SchemeSchema);
