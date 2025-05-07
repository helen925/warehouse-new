import Link from "next/link";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
					仓库<span className="text-[hsl(280,100%,70%)]">管理系统</span>
				</h1>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
					<Link
						className="flex flex-col items-center justify-center rounded-xl bg-white/10 p-6 text-white hover:bg-white/20"
						href="/shipments"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="mb-2 h-10 w-10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z" />
							<polyline points="2.32 6.16 12 11 21.68 6.16" />
							<line x1="12" y1="22.76" x2="12" y2="11" />
						</svg>
						<h3 className="text-xl font-bold">货物管理</h3>
						<div className="text-sm">查看和管理所有货物信息</div>
					</Link>
					<Link
						className="flex flex-col items-center justify-center rounded-xl bg-white/10 p-6 text-white hover:bg-white/20"
						href="/operations/outbound"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="mb-2 h-10 w-10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="12" y1="12" x2="12" y2="18" />
							<line x1="9" y1="15" x2="15" y2="15" />
						</svg>
						<h3 className="text-xl font-bold">出库操作</h3>
						<div className="text-sm">记录货物出库信息</div>
					</Link>
					<Link
						className="flex flex-col items-center justify-center rounded-xl bg-white/10 p-6 text-white hover:bg-white/20"
						href="/reports/storage-fees"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="mb-2 h-10 w-10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
							<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
							<path d="M12 7h.01" />
						</svg>
						<h3 className="text-xl font-bold">仓储费计算</h3>
						<div className="text-sm">查看和计算仓储费用</div>
					</Link>
				</div>
			</div>
		</main>
	);
}
