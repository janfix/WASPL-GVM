import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publication",
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    sessionStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sessionEnd: {
      type: Date,
    },
    testStartTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    abandoned: {
      type: Boolean,
      default: false,
    },
    submitted: {
      type: Boolean,
      default: false,
    },
    finalized: {
      type: Boolean,
      default: false,
    }, // indique que la session est finie (manuellement ou par cron)
    accessStatus: {
      type: Boolean,
      default: true,
    },
    reactivated: {
      type: Boolean,
      default: false,
    },
    pending: {
      type: Boolean,
      default: false,
    }, // l'élève a demandé une réactivation
    justification: {
      type: String,
    }, // message libre
    finalizationReason: {
      type: String,
      enum: ['submitted', 'timeout-abandon', 'forced-abandon', 'reactivated-submission'],
    }, // raison de la fin de session
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
