import { db } from '../../firebaseadmin/firebaseadmin.js';

export const saveWaterReport = async (req, res) => {
    try {
        const data = req.body;
        const { userId, geohash } = data;

        if (!userId || !geohash) {
            return res.status(400).json({ message: "Missing userId or geohash in payload" });
        }
        const dataToSave = { ...data };
        delete dataToSave.userId;
        delete dataToSave.geohash;
        const reportRef = db.collection('waterReports')
            .doc(geohash)
            .collection('reports')
            .doc(userId);
        await reportRef.set(dataToSave, { merge: true });

        console.log(`Water Report Saved: ${geohash} -> ${userId}`);
        return res.status(200).json({ 
            status: "VERIFIED", 
            message: "Water report saved successfully",
            reportId: dataToSave.reportId
        });

    } catch (error) {
        console.error("Error saving water report:", error);
        return res.status(500).json({ status: "FAILED", message: error.message });
    }
};