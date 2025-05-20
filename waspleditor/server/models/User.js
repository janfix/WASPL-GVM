import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      // Ne pas renvoyer le mot de passe par défaut
    },
    firstname: {
      type: String,
      required: false,
      trim: true,
    },
    lastname: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Invalid email format"],
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    language:{ type: String, default: 'English' },
    role: {
      type: String,
      enum: [
        "Author",
        "Tester",
        "Statisticien",
        "Teacher",
        "Admin",
        "Supervisor",
        "Director",
        "Manager",
        "Parent",
        "Other",
      ],
      default: "Author",
      required: true,
    },
    institution: {
      type: String,
      trim: true,
    },
   /*  classSystemEncoding: {
      type: String,
      enum: [
        "ISCED",
        "France",
        "UK",
        "Germany",
        "Swiss",
        "Spain",
        "Italy",
        "Belgium",
        "Netherlands",
        "Portugal",
        "Austria",
      ],
      default: "ISCED",
      required: true,
    }, */
    subjects: [{ type: String }],
    domains: [{ type: String }],
    grades: [{ type: String }],
    ISCED : { type: String },
    backdrop: { type: Boolean, default: true },
    reportOptions: {
      detailed: { type: Boolean, default: false },
      summary: { type: Boolean, default: true },
      exportFormat: {
        type: String,
        enum: ["PDF", "CSV", "JSON"],
        default: "PDF",
      },
    },
  },
  { timestamps: true }
);

// 🔐 Hashage du mot de passe avant sauvegarde
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔑 Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
