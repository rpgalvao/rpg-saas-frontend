import { XIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { navItems } from "./navigation";

type SidebarProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
				<div className="flex size-7 items-center justify-center rounded-lg bg-foreground text-xs font-semibold text-background">
					R
				</div>
				<p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
					RPG SaaS
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
				{navItems.map((item) => {
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
