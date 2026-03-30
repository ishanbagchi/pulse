import { ChevronDown, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import api from '../lib/api'

export default function Admin() {
	const [users, setUsers] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const { data } = await api.get('/auth/users')
				setUsers(data.users)
			} catch {
				toast.error('Failed to load users')
			} finally {
				setLoading(false)
			}
		}
		fetchUsers()
	}, [])

	const handleRoleChange = async (userId, newRole) => {
		const user = users.find((u) => u._id === userId)
		if (!window.confirm(`Change ${user?.name}'s role to ${newRole}?`))
			return
		try {
			await api.patch(`/auth/users/${userId}/role`, { role: newRole })
			setUsers((prev) =>
				prev.map((u) =>
					u._id === userId ? { ...u, role: newRole } : u,
				),
			)
			toast.success('Role updated')
		} catch {
			toast.error('Failed to update role')
		}
	}

	return (
		<Layout>
			<div className="space-y-6">
				<div className="flex items-center space-x-3">
					<Users className="h-6 w-6 text-indigo-600" />
					<h1 className="text-2xl font-bold text-gray-900">
						User Management
					</h1>
				</div>

				<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
					{loading ? (
						<div className="flex items-center justify-center h-40">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
						</div>
					) : (
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200 bg-gray-50">
									<th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
										User
									</th>
									<th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
										Email
									</th>
									<th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
										Role
									</th>
									<th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
										Joined
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{users.map((u) => (
									<tr
										key={u._id}
										className="hover:bg-gray-50"
									>
										<td className="px-5 py-3">
											<p className="text-sm font-medium text-gray-900">
												{u.name}
											</p>
										</td>
										<td className="px-5 py-3 text-sm text-gray-600">
											{u.email}
										</td>
										<td className="px-5 py-3">
											<div className="relative inline-block">
												<select
													value={u.role}
													onChange={(e) =>
														handleRoleChange(
															u._id,
															e.target.value,
														)
													}
													className="appearance-none bg-transparent border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
												>
													<option value="viewer">
														Viewer
													</option>
													<option value="editor">
														Editor
													</option>
													<option value="admin">
														Admin
													</option>
												</select>
												<ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
											</div>
										</td>
										<td className="px-5 py-3 text-sm text-gray-500">
											{new Date(
												u.createdAt,
											).toLocaleDateString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</Layout>
	)
}
