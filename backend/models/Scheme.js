import mongoose from "mongoose";

const SchemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add new Schema name"],
      unique: true,
      trim: true,
    },

    // for government policies and rules and shemes
    benefits: {
      type: {
        type: String,
        enum: ["Financial", "Subsidy", "Insurance", "Service"],
        default: "financial",
      },
      max_value_inr: {
        type: Number,
        default: 0,
      },
      description: String,
    },
    // to enlist the docs
    required_documents: [String],

    // for RAG and Embeddings
    original_pdf_url: String,
    text_chunks: [
      {
        content: String,
        page: Number,
        // embedding: [Number]
      },
    ],

    // filtering metadata and fast search
    filters: {
      state: [String],
      gender: [String],
      caste: [String],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Scheme", SchemeSchema);
