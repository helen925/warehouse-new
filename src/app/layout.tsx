import "@/styles/globals.css";
import Link from "next/link";

export const metadata = {
	title: "仓库管理系统",
	description: "一个简易的仓库管理系统，包含入库、出库和仓租计算功能",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="zh">
			<body className="font-sans">
				<div className="flex min-h-screen flex-col">
					<header className="bg-purple-800 shadow">
						<nav className="container mx-auto flex items-center justify-between p-4">
							<div className="flex items-center space-x-8">
								<Link href="/" className="text-xl font-bold text-white">
									仓库管理系统
								</Link>
								<div className="hidden space-x-6 sm:flex">
									<Link href="/inbound-pending" className="text-white hover:text-purple-200">
										待入库订单
									</Link>
									<Link href="/shipments" className="text-white hover:text-purple-200">
										货物管理
									</Link>
									<Link href="/operations/outbound" className="text-white hover:text-purple-200">
										出库操作
									</Link>
									<Link href="/reports/storage-fees" className="text-white hover:text-purple-200">
										仓储费用
									</Link>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<span className="hidden rounded-full bg-white px-3 py-1 text-sm font-medium text-purple-800 md:block">
									仓管员: Admin
								</span>
							</div>
						</nav>
					</header>
					<main className="flex-1 bg-gray-50">{children}</main>
					<footer className="bg-gray-100 py-4 text-center text-sm text-gray-600">
						<div className="container mx-auto">
							&copy; {new Date().getFullYear()} 仓库管理系统 | 版本 1.0.0
						</div>
					</footer>
				</div>
			</body>
		</html>
	);
}
