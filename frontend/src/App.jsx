import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Upload from './pages/Upload'
import VideoPlayer from './pages/VideoPlayer'
import Videos from './pages/Videos'

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Toaster position="top-right" />
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route element={<ProtectedRoute />}>
						<Route path="/" element={<Dashboard />} />
						<Route path="/videos" element={<Videos />} />
						<Route path="/videos/:id" element={<VideoPlayer />} />
					</Route>
					<Route
						element={<ProtectedRoute roles={['editor', 'admin']} />}
					>
						<Route path="/upload" element={<Upload />} />
					</Route>
					<Route element={<ProtectedRoute roles={['admin']} />}>
						<Route path="/admin" element={<Admin />} />
					</Route>
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	)
}
