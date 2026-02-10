import { createFileRoute, Link } from '@tanstack/react-router'
import { Shield, Send, FileCode, Wallet, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Shield className="w-16 h-16 text-cyan-400" />
            <h1 className="text-5xl md:text-6xl font-black text-white">
              <span className="text-gray-300">Gnosis</span>{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Safe Boilerplate
              </span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Full-stack Web3 starter kit with Safe SDK integration
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Build multi-signature dApps with TanStack Start, wagmi, and Gnosis Safe Protocol Kit.
            Supports both Safe App (iframe) and standalone modes.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/safe"
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 group"
          >
            <Shield className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Safe Creation</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Deploy and manage Gnosis Safe multi-signature wallets with configurable owners and thresholds.
            </p>
            <span className="inline-flex items-center gap-1 text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
              Open Dashboard <ArrowRight size={16} />
            </span>
          </Link>

          <Link
            to="/safe"
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 group"
          >
            <Send className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Multi-sig Transactions</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Build, sign, and execute multi-signature transactions with a local-first workflow.
            </p>
            <span className="inline-flex items-center gap-1 text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
              Transaction Builder <ArrowRight size={16} />
            </span>
          </Link>

          <Link
            to="/wallet"
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 group"
          >
            <Wallet className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Wallet Connection</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Connect MetaMask or use the dev wallet. View balances and switch networks.
            </p>
            <span className="inline-flex items-center gap-1 text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
              Connect Wallet <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      <section className="py-12 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8">
          <FileCode className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Smart Contracts</h3>
          <p className="text-gray-400 mb-4">
            Foundry-based contracts focused on Safe extensions: SpendingLimitGuard and AllowanceModule.
          </p>
          <code className="px-3 py-1.5 bg-slate-700 rounded text-cyan-400 text-sm">
            cd packages/contracts && forge test
          </code>
        </div>
      </section>
    </div>
  )
}
