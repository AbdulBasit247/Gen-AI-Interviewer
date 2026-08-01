import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, deleteInterviewReport } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { toast } from "sonner"
import { InterviewContext } from "../interview.context"
import { useParams, useNavigate } from "react-router"

export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()
    const navigate = useNavigate()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { generating, setGenerating, reportLoading, setReportLoading, reportsLoading, setReportsLoading, downloadingResume, setDownloadingResume, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setGenerating(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            toast.success(response.message || "Interview strategy generated successfully!")
            return response.interviewReport
        } catch (error) {
            const message = error.response?.data?.message || "Failed to generate interview report. Please try again."
            toast.error(message)
            return null
        } finally {
            setGenerating(false)
        }
    }

    const getReportById = async (interviewId) => {
        setReportLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load interview report."
            toast.error(message)
            return null
        } finally {
            setReportLoading(false)
        }
    }

    const getReports = async () => {
        setReportsLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            const message = error.response?.data?.message || "Failed to load your interview reports."
            toast.error(message)
            return null
        } finally {
            setReportsLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setDownloadingResume(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success("Resume PDF downloaded successfully!")
        }
        catch (error) {
            const message = error.response?.data?.message || "Failed to generate resume PDF. Please try again."
            toast.error(message)
        } finally {
            setDownloadingResume(false)
        }
    }
    
    const deleteReport = async (id) => {
        try {
            const response = await deleteInterviewReport(id)
            toast.success(response.message || "Report deleted successfully!")
            setReports(prev => prev.filter(r => r._id !== id))
            if (interviewId === id) {
                navigate('/')
            }
            return true
        } catch (error) {
            const message = error.response?.data?.message || "Failed to delete report."
            toast.error(message)
            return false
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { generating, reportLoading, reportsLoading, downloadingResume, report, reports, generateReport, getReportById, getReports, getResumePdf, deleteReport }
}
