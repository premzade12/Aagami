import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    assistantName: {
      type: String,
    },
    assistantImage: {
      type: String,
    },
    selectedVoice: {
      type: String,
      default: "21m00Tcm4TlvDq8ikWAM" // Default to Rachel
    },
    contacts: {
      type: Map,
      of: String,
      default: new Map() // Store contact name -> phone number mapping
    },
    history: [historySchema], // ⬅️ updated to store structured data
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
