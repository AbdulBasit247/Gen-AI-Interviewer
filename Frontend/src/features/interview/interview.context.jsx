import { createContext,useState } from "react";


export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
    const [generating, setGenerating] = useState(false)
    const [reportLoading, setReportLoading] = useState(false)
    const [reportsLoading, setReportsLoading] = useState(false)
    const [downloadingResume, setDownloadingResume] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])

    return (
        <InterviewContext.Provider value={{ generating, setGenerating, reportLoading, setReportLoading, reportsLoading, setReportsLoading, downloadingResume, setDownloadingResume, report, setReport, reports, setReports }}>
            {children}
        </InterviewContext.Provider>
    )
}
