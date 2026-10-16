import { LockIcon, LogOutIcon } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function BlockedTenantScreen() {
  const { user, signOut } = useAuth()
  const companyName = user?.tenant?.tradeName || user?.tenant?.name

  useEffect(() => {
    toast.dismiss()
  }, [])

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-950 px-6 text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.12),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <section
        role="alert"
        className="relative flex w-full max-w-md flex-col items-center gap-6 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_40px_-8px_rgba(239,68,68,0.45)]">
          <LockIcon className="size-6" strokeWidth={1.75} />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Acesso Suspenso
          </h1>
          <p className="text-sm leading-6 text-slate-400">
            A assinatura da sua empresa encontra-se inativa. Por favor, entre em
            contato com a RPG Sistemas para regularizar seu acesso.
          </p>
        </div>

        {companyName || user?.email ? (
          <div className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-left text-xs">
            {companyName ? (
              <p className="truncate font-medium text-slate-200">
                {companyName}
              </p>
            ) : null}
            {user?.email ? (
              <p className="truncate text-slate-500">{user.email}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="flex-1 border-slate-800 bg-transparent text-slate-200 hover:bg-slate-900 hover:text-white"
          >
            <a
              href="https://rpgsistemas.com.br"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com a RPG Sistemas
            </a>
          </Button>
          <Button
            type="button"
            className="flex-1 bg-white text-slate-950 hover:bg-slate-200"
            onClick={signOut}
          >
            <LogOutIcon />
            Sair
          </Button>
        </div>
      </section>
    </main>
  )
}
