import { Link } from "react-router"
import "./not-found.scss"

const NotFound = () => {
    return (
        <main className="not-found-page">
            <h1>404</h1>
            <p>The page you're looking for doesn't exist.</p>
            <Link to="/" className="button primary-button">Back to Home</Link>
        </main>
    )
}

export default NotFound
