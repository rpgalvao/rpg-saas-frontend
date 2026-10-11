import { useAuth } from "@/contexts/AuthContext";

export function DashboardPage() {
	const { user } = useAuth();

	return (
		<div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
			{/* Conteúdo Principal */}
			<section className="flex max-w-2xl flex-col gap-2">
				<p className="text-[0.68rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
					Sessão ativa
				</p>
				<h1 className="text-3xl font-semibold tracking-tight text-balance">
					Olá, {user?.name}
				</h1>
				<p className="text-sm text-muted-foreground">{user?.email}</p>
			</section>
		</div>
	);
}
