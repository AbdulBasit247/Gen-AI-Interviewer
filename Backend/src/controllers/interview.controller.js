const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")


/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        // 1. Safe PDF parsing with fallback
        let resumeText = "";
        
        if (req.file && req.file.buffer) {
            const pdfParser = new pdfParse.PDFParse(Uint8Array.from(req.file.buffer));
            const parsedData = await pdfParser.getText();
            resumeText = parsedData.text || "";
        }

        const { selfDescription, jobDescription } = req.body;

        // 2. Extra Validation (At least one must be provided)
        if (!resumeText && !selfDescription) {
            return res.status(400).json({
                message: "Please provide either a resume file or a self description."
            });
        }

        // 3. Generate AI Report
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        // 4. Save to Database
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        });

        // 5. Send Response
        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("Error generating interview report:", error);
        return res.status(500).json({
            message: "Internal server error while generating report.",
            error: error.message
        });
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        // 1. Ownership + Report check in a single DB query
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        // 2. Return 404/403 if not found or doesn't belong to the logged-in user
        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized access."
            });
        }

        const { resume, jobDescription, selfDescription } = interviewReport;

        // 3. Generate PDF Buffer
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription });

        // 4. Set Headers & Stream/Send Response
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
            "Content-Length": pdfBuffer.length
        });

        return res.send(pdfBuffer);

    } catch (error) {
        console.error("Error downloading resume PDF:", error);
        return res.status(500).json({
            message: "Internal server error while generating resume PDF.",
            error: error.message
        });
    }
}


/**
 * @description Controller to delete an interview report by interviewId.
 */
async function deleteInterviewReportController(req, res) {
    try {
        const { interviewId } = req.params;

        // Ownership + existence check in a single query, same pattern as other controllers
        const interviewReport = await interviewReportModel.findOneAndDelete({
            _id: interviewId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized access."
            });
        }

        return res.status(200).json({
            message: "Interview report deleted successfully."
        });

    } catch (error) {
        console.error("Error deleting interview report:", error);
        return res.status(500).json({
            message: "Internal server error while deleting interview report.",
            error: error.message
        });
    }
}


module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController, deleteInterviewReportController }