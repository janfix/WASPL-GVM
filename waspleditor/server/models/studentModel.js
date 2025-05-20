import mongoose from "mongoose";
import validator from "validator";
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;
const { isEmail } = validator; 

const studentSchema = new Schema({
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  role: {
    type: String,
  },
  group: { type: [String], default: [] },
  SID: {
    type: String,
  },
  email: {
    type: String,
   // required: [true, "Please enter an E-mail."],
   // unique: true,
    lowercase: true,
   // validate: [isEmail, "Please enter a valid E-mail."],
  },
  password: {
    type: String,
   // required: [true, "Please enter a password."],
   // minlength: [5, "Minimum password length is 6 characters."],
  },
  tests: {
    type: Array,
  },
  testAuth: {
    type: [String], // List of authorized tests
    default: [],
  },
  publication: {
    type: Array,
  },
  institution: {
    type: String,
  },
  class: {
    type: String,
  },
  grade: {
    type: String,
  },
  sector: {
    type: String,
  },
  location: {
    type: String,
  },
  zipcode: {
    type: String,
  },
  mailStatus: {
    type: String,
  },
});

// Middleware to hash the password only if it is modified
studentSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});


const Student = mongoose.model("Student", studentSchema);

export default Student;