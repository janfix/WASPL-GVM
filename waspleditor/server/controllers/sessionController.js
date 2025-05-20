import Student from "../models/studentModel.js";
import Session from "../models/sessionModel.js";
import mongoose from "mongoose";

function buildMatchFilters(query) {
  const filters = {};
  if (query["firstName"]) {
    filters["studentData.firstname"] = { $regex: query["firstName"], $options: "i" };
  }
  if (query["lastName"]) {
    filters["studentData.lastname"] = { $regex: query["lastName"], $options: "i" };
  }
  if (query["status"]) {
    filters["status"] = query["status"];
  }
  return filters;
}

export const getPaginatedStudentStats = async (req, res) => {
  try {
    const { publicationId } = req.params;
    const { page = 1, size = 10, sort, ...filters } = req.query;

    if (!mongoose.Types.ObjectId.isValid(publicationId)) {
      return res.status(400).json({ message: "Invalid publication ID" });
    }

    const matchStage = {
      publication: new mongoose.Types.ObjectId(publicationId),
    };

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentData",
        },
      },
      { $unwind: "$studentData" },
      {
        $group: {
          _id: "$studentData._id",
          studentID: { $first: "$studentData._id" },
          firstName: { $first: "$studentData.firstname" },
          lastName: { $first: "$studentData.lastname" },
          connectionNumber: { $sum: 1 },
          submittedCount: { $sum: { $cond: ["$submitted", 1, 0] } },
          abandonedCount: { $sum: { $cond: ["$abandoned", 1, 0] } },
          ongoingCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$submitted", false] }, { $eq: ["$abandoned", false] }] },
                1,
                0,
              ]
            }
          }
        }
      },
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                { case: { $gt: ["$submittedCount", 0] }, then: "submitted" },
                { case: { $gt: ["$abandonedCount", 0] }, then: "abandoned" },
                { case: { $gt: ["$ongoingCount", 0] }, then: "ongoing" },
              ],
              default: "not started",
            }
          },
          statusLabel: {
            $switch: {
              branches: [
                {
                  case: { $gt: ["$submittedCount", 0] },
                  then: "The student has submitted the test."
                },
                {
                  case: { $gt: ["$abandonedCount", 0] },
                  then: "The student started but did not finish the test."
                },
                {
                  case: { $gt: ["$ongoingCount", 0] },
                  then: "The student is currently taking the test."
                },
              ],
              default: "The student has not started the test."
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          studentID: 1,
          firstName: 1,
          lastName: 1,
          connectionNumber: 1,
          status: 1,
          statusLabel: 1,
        }
      },
      { $match: buildMatchFilters(filters) }
    ];

    // Tri
    if (sort) {
      const [field, dir] = sort.split("|");
      pipeline.push({ $sort: { [field]: dir === "desc" ? -1 : 1 } });
    } else {
      pipeline.push({ $sort: { lastName: 1, firstName: 1 } });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(size);
    const facetStage = {
      $facet: {
        data: [{ $skip: skip }, { $limit: parseInt(size) }],
        total: [{ $count: "count" }],
      }
    };

    pipeline.push(facetStage);

    const result = await Session.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].total[0]?.count || 0;

    res.json({ data, total, last_page: Math.ceil(total / size) });

  } catch (err) {
    console.error("❌ Error in getPaginatedStudentStats:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const getStudentSessionStats = async (req, res) => {
  try {
    const { publicationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(publicationId)) {
      return res.status(400).json({ message: "Invalid publication ID" });
    }

    // Option 1: Retourner directement les sessions (approche simple)
    // Cette approche est plus directe et correspondra mieux à votre frontend actuel
    const sessions = await Session.find({ 
      publication: new mongoose.Types.ObjectId(publicationId) 
    }).populate('student', 'firstname lastname').lean();

    // Transformer le format pour correspondre à ce qu'attend le frontend
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      studentID: session.student?._id || session.student,
      firstName: session.student?.firstname,
      lastName: session.student?.lastname,
      submitted: session.submitted,
      abandoned: session.abandoned,
      accessStatus: session.accessStatus, // ← AJOUT ICI
      status: session.submitted
        ? "submitted"
        : (session.abandoned ? "abandoned" : "ongoing"),
      statusLabel: session.submitted
        ? "The student has submitted the test."
        : (session.abandoned
            ? "The student started but did not finish the test."
            : "The student is currently taking the test.")
    }));
    

    res.json(formattedSessions);

    /* 
    // Option 2: Utiliser l'agrégation (si vous voulez continuer avec cette approche)
    const aggregatedSessions = await Session.aggregate([
      {
        $match: { publication: new mongoose.Types.ObjectId(publicationId) }
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentData",
        },
      },
      { $unwind: "$studentData" },
      {
        $group: {
          _id: "$studentData._id",
          studentID: { $first: "$studentData._id" },
          lastName: { $first: "$studentData.lastname" },
          firstName: { $first: "$studentData.firstname" },
          connectionNumber: { $sum: 1 },
          // Garder les valeurs originales de submitted et abandoned
          submitted: { $max: "$submitted" },    // true si au moins une session a submitted=true
          abandoned: { $max: "$abandoned" },    // true si au moins une session a abandoned=true
          // Compteurs pour des statistiques supplémentaires si nécessaire
          submittedCount: { 
            $sum: { $cond: [{ $eq: ["$submitted", true] }, 1, 0] }
          },
          abandonedCount: { 
            $sum: { $cond: [{ $eq: ["$abandoned", true] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                { case: "$submitted", then: "submitted" },
                { case: "$abandoned", then: "abandoned" },
                { case: { $not: ["$submitted"] }, then: "ongoing" }
              ],
              default: "not started"
            }
          }
        }
      },
      {
        $addFields: {
          statusLabel: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$status", "submitted"] },
                  then: "The student has submitted the test."
                },
                {
                  case: { $eq: ["$status", "abandoned"] },
                  then: "The student started but did not finish the test."
                },
                {
                  case: { $eq: ["$status", "ongoing"] },
                  then: "The student is currently taking the test."
                },
              ],
              default: "The student has not started the test."
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          studentID: 1,
          firstName: 1,
          lastName: 1,
          connectionNumber: 1,
          submitted: 1,
          abandoned: 1,
          accomplished: "$submittedCount",  // Pour rétrocompatibilité
          status: 1,
          statusLabel: 1,
        }
      }
    ]);

    res.json(aggregatedSessions);
    */
  } catch (error) {
    console.error("❌ Error fetching student session stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

