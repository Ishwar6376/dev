import express from "express";
import { db } from "../firebaseadmin/firebaseadmin.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collectionGroup("userReports").get();

    const reports = snapshot.docs.map(doc => {
      const data = doc.data();

      let department = "INFRASTRUCTURE";
      const path = doc.ref.path;

      if (path.includes("wasteReports")) department = "WASTE";
      if (path.includes("waterReports")) department = "WATER";
      if (path.includes("electricityReports")) department = "ELECTRICITY";
      if (path.includes("fireReports")) department = "FIRE";

      return {
        id: doc.id,
        department,
        ...data
      };
    });

    res.json({ success: true, data: reports });

  } catch (err) {
    console.error("MAP REPORT ERROR:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
