import express from "express";
import { Element } from "../models/itemModel.js"; // ← à adapter si besoin
import mongoose from "mongoose";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  //console.log("📥 Route /api/items atteinte");

  let query = {};
 

  try {
    const {
      page = 1,
      size = 10,
      sortField = "el_Label",
      sortDir = "asc",
      filters,
      headerFilters, // <-- on les récupère
    } = req.query;

    const limit = parseInt(size);
    const skip = (parseInt(page) - 1) * limit;
    const sort = { [sortField]: sortDir === "desc" ? -1 : 1 };

   

    // 🔍 Filtres classiques envoyés manuellement (ex: via searchQuery)
    if (filters) {
      try {
        const parsedFilters = JSON.parse(filters);
        parsedFilters.forEach(({ field, type = "like", value }) => {
          if (value !== undefined && value !== "") {
            if (type === "like") {
              query[field] = { $regex: value, $options: "i" };
            } else {
              query[field] = value;
            }
          }
        });
      } catch (parseErr) {
        console.error("❌ Erreur parsing des filters:", parseErr);
      }
    }

    // 🔍 Filtres via les champs dans le header (Tabulator)
    if (headerFilters) {
      try {
        const parsedHeaderFilters = JSON.parse(headerFilters);
        parsedHeaderFilters.forEach(({ field, value }) => {
          if (value !== undefined && value !== "") {
            query[field] = { $regex: value, $options: "i" };
          }
        });
      } catch (parseErr) {
        console.error("❌ Erreur parsing des headerFilters:", parseErr);
      }
    }

    query.owner = req.user._id; // Filtre pour l'utilisateur connecté

    const totalItems = await Element.countDocuments(query);
    const items = await Element.find(query).sort(sort).skip(skip).limit(limit);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({ items, totalPages, totalItems });
  } catch (error) {
    console.error("❌ Erreur API /items :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", async (req, res) => {
  console.log("✅ Requête reçue :", req.body);
  try {
    if (req.body._id) {
      delete req.body._id; // 🧹 Supprimer l'id pour éviter le conflit
    }

    const item = new Element({
      ...req.body, // 🧠 Inclut tous les champs, y compris el_InteractionData
      owner: req.user._id,
    });

    await item.save();
    res.status(201).json({ message: "Item inséré avec succès", item });
  } catch (error) {
    console.error("Erreur lors de l'insertion de l'item:", error);
    res.status(500).json({ error: "Erreur lors de l'insertion de l'item" });
  }
});

// Route DELETE pour supprimer un item par ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedItem = await Element.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ error: "Item non trouvé." });
    }
    res
      .status(200)
      .json({ message: "Item supprimé avec succès.", deletedItem });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression de l'item." });
  }
});

// Route PUT pour mettre à jour un item par ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const newItemData = req.body;

  try {
    const item = await Element.findOne({ _id: id, owner: req.user._id });

    if (!item) {
      return res.status(403).json({ error: "Accès refusé ou item inexistant." });
    }

    item.overwrite(newItemData);
    const updatedItem = await item.save();

    res.status(200).json({ message: "Item mis à jour avec succès.", updatedItem });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'item." });
  }
});


// GET /api/items/importer → Pour ItemBankgrabber.vue
router.get("/importer", async (req, res) => {
  console.log("📥 Route /api/items/importer atteinte");
 

  try {
    const searchQuery = req.query.q;
    const filter = {};
    filter.owner = req.user._id;

    if (searchQuery && searchQuery.trim().length > 0) {
      const regex = { $regex: searchQuery.trim(), $options: "i" };

      // Rechercher dans plusieurs champs
      filter.$or = [
        { el_Label: regex },
        { el_Text: regex },
        { el_RichText: regex },
        { el_keywords: regex }, // fonctionne si el_keywords est un tableau de strings
      ];
    }

    const items = await Element.find(filter, {
      el_Label: 1,
      el_Text: 1,
      el_RichText: 1,
      el_keywords: 1,
      el_ID: 1,
    })
      .limit(100)
      .lean(); // ⚠️ limite de sécurité pour éviter surcharge

    res.status(200).json(items);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des items :", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des items." });
  }
});

router.get("/full/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const item = await Element.findOne({ _id: id, owner: req.user._id });

    if (!item) {
      return res.status(404).json({ error: "Item non trouvé." });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("❌ Erreur récupération item complet :", error.message);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération de l'item." });
  }
});

export default router;
