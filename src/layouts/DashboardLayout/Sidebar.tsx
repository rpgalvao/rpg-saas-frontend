import { XIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { masterNavItem, navItems } from "./navigation";

type SidebarProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const { user } = useAuth();
	const tenant = user?.tenant;
	const tenantName = tenant?.tradeName || tenant?.name || "RPG SaaS";
	const visibleItems = navItems.filter(
		(item) => item.to !== "/checklists" || user?.role !== "TECHNICIAN",
	);

	return (
		<aside
			id="dashboard-sidebar"
			className={cn(
				"fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
				isOpen
					? "translate-x-0"
					: "-translate-x-full max-lg:pointer-events-none max-lg:invisible",
			)}
		>
			<div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
				<Avatar className="rounded-lg border border-sidebar-border bg-card">
					{tenant?.logo_url ? (
						<AvatarImage
							src={tenant.logo_url}
							alt=""
							className="object-contain"
						/>
					) : null}
					<AvatarFallback className="rounded-lg bg-foreground text-[0.65rem] font-semibold text-background">
						{getInitials(tenantName)}
					</AvatarFallback>
				</Avatar>
				<p
					className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight"
					title={tenantName}
				>
					{tenantName}
				</p>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="text-muted-foreground lg:hidden"
					aria-label="Fechar menu"
					onClick={onClose}
				>
					<XIcon />
				</Button>
			</div>

			<nav
				aria-label="Principal"
				className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3"
			>
				{visibleItems.map((item) => {
					const Icon = item.icon;

					return (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end}
							className={({ isActive }) =>
								cn(
									"flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors",
									isActive
										? "bg-card text-foreground shadow-xs dark:bg-sidebar-accent dark:text-sidebar-accent-foreground dark:shadow-none"
										: "text-muted-foreground hover:bg-card/70 hover:text-foreground dark:hover:bg-sidebar-accent/80 dark:hover:text-sidebar-accent-foreground",
								)
							}
						>
							<Icon
								className="size-4 shrink-0"
								strokeWidth={1.75}
							/>
							<span className="truncate">{item.label}</span>
						</NavLink>
					);
				})}
			</nav>
			{user?.role === "SUPER_ADMIN" ? (
				<div className="border-t border-sidebar-border px-3 py-3">
					<NavLink
						to={masterNavItem.to}
						className={({ isActive }) =>
							cn(
								"flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors",
								isActive
									? "bg-card text-foreground shadow-xs dark:bg-sidebar-accent dark:text-sidebar-accent-foreground dark:shadow-none"
									: "text-muted-foreground/80 hover:bg-card/70 hover:text-foreground dark:hover:bg-sidebar-accent/80 dark:hover:text-sidebar-accent-foreground",
							)
						}
					>
						<masterNavItem.icon
							className="size-4 shrink-0"
							strokeWidth={1.75}
						/>
						<span className="truncate">{masterNavItem.label}</span>
						<span className="ml-auto rounded border border-sidebar-border px-1 py-px text-[10px] leading-none font-medium tracking-wide text-muted-foreground uppercase">
							Master
						</span>
					</NavLink>
				</div>
			) : null}
			{/* Footer empurrado para o final da sidebar (mt-auto) */}
			<footer className="mt-auto border-t border-sidebar-border p-4 text-center text-xs text-muted-foreground">
				&copy; {new Date().getFullYear()} Desenvolvido por <br />
				<a
					href="https://rpgsistemas.com.br"
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium hover:text-foreground transition-colors underline-offset-4 hover:underline"
				>
					@rpg Sistemas
				</a>
			</footer>
		</aside>
	);
}
