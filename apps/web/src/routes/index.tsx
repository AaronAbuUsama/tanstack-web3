import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const capabilityCards = [
  {
    title: 'Safe Setup',
    body: 'Create or connect a Safe with deterministic signer policy and explicit setup constraints.',
    tone: 'bg-[#8ae06f]',
  },
  {
    title: 'Transactions',
    body: 'Build, sign, and execute multisig transactions with honest pending and activity states.',
    tone: 'bg-[#77d9ff]',
  },
  {
    title: 'Governance',
    body: 'Manage owners, threshold, guard, and modules from one consistent command surface.',
    tone: 'bg-[#ffe169]',
  },
] as const

function LandingPage() {
  return (
    <main className='min-h-screen bg-[#f4eedc] text-[#171734]'>
      <section className='mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 py-6 md:px-8 md:py-8'>
        <header className='border-4 border-[#171734] bg-[#171734] p-4 text-white shadow-[8px_8px_0_#171734] md:p-5'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='border-4 border-[#171734] bg-[#8ae06f] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#171734]'>
              Gnosis Safe Runtime
            </p>
            <p className='font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffe169]'>
              TanStack + Wagmi + Safe SDK
            </p>
          </div>
        </header>

        <div className='grid gap-4 md:grid-cols-3'>
          <div className='border-4 border-[#171734] bg-[#8ae06f] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] shadow-[4px_4px_0_#171734]'>
            Production Baseline
          </div>
          <div className='border-4 border-[#171734] bg-[#ffe169] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] shadow-[4px_4px_0_#171734]'>
            Safe Runtime + Dev Wallet
          </div>
          <div className='border-4 border-[#171734] bg-[#77d9ff] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] shadow-[4px_4px_0_#171734]'>
            Neo-Brutalist Interface
          </div>
        </div>

        <section className='border-4 border-[#171734] bg-[#fff7d6] px-6 py-7 shadow-[10px_10px_0_#171734] md:px-8 md:py-9'>
            <p className='mb-4 inline-block border-4 border-[#171734] bg-[#ff7aa2] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white'>
              Safe Boilerplate
            </p>
            <h1 className='text-4xl font-black uppercase leading-[0.95] md:text-6xl'>
              Ship Safe Apps
              <br className='hidden md:block' />
              Without Glue Work
            </h1>
            <p className='mt-5 max-w-3xl text-base font-semibold leading-relaxed md:text-lg'>
              Build and validate multisig flows with deterministic local wallets, runtime policy
              controls, and a command surface ready for production hardening.
            </p>

            <div className='mt-7 flex flex-wrap gap-4'>
              <Link
                className='inline-flex items-center border-4 border-[#171734] bg-[#8ae06f] px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.1em] shadow-[5px_5px_0_#171734] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#171734]'
                to='/safe'
                search={{}}
              >
                Open Safe Setup
              </Link>
              <Link
                className='inline-flex items-center border-4 border-[#171734] bg-[#ffe169] px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.1em] shadow-[5px_5px_0_#171734] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#171734]'
                to='/safe'
                search={{}}
              >
                Enter Runtime
              </Link>
            </div>
        </section>

        <section className='grid gap-4 md:grid-cols-3'>
          {capabilityCards.map((card) => (
            <article
              key={card.title}
              className={`border-4 border-[#171734] px-5 py-5 shadow-[6px_6px_0_#171734] ${card.tone}`}
            >
              <h4 className='font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#171734]'>
                {card.title}
              </h4>
              <p className='mt-2 text-sm font-semibold leading-relaxed'>{card.body}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}
