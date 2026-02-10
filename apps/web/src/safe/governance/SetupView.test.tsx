import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getDevWalletSignerForIndex,
  setDevWalletActiveAccountIndex,
} from '../../web3/dev-wallet'
import SetupView from './SetupView'

describe('SetupView', () => {
  beforeEach(() => {
    setDevWalletActiveAccountIndex(0)
  })

  afterEach(() => {
    setDevWalletActiveAccountIndex(0)
  })

  it('passes dev wallet signer when connecting an existing safe', async () => {
    const safe = {
      connectSafe: vi.fn().mockResolvedValue(undefined),
      deploySafe: vi.fn().mockResolvedValue('0xsafe'),
      error: null,
    }
    const runtimePolicy = {
      appContext: 'standalone',
      signerProvider: 'dev-mnemonic-account',
      txSubmissionPath: 'protocol-kit-direct',
      canSign: true,
      canSubmit: true,
    } as const

    render(<SetupView address="0x1111111111111111111111111111111111111111" safe={safe as any} rpcUrl="http://127.0.0.1:8545" runtimePolicy={runtimePolicy} />)

    const addressInputs = screen.getAllByPlaceholderText('0x...')
    const connectInput = addressInputs[1]

    fireEvent.change(connectInput, {
      target: { value: '0x2222222222222222222222222222222222222222' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }))

    await waitFor(() => {
      expect(safe.connectSafe).toHaveBeenCalledWith(
        '0x2222222222222222222222222222222222222222',
        'http://127.0.0.1:8545',
        getDevWalletSignerForIndex(0),
      )
    })
  })

  it('passes dev wallet signer when deploying a new safe', async () => {
    const safe = {
      connectSafe: vi.fn().mockResolvedValue(undefined),
      deploySafe: vi.fn().mockResolvedValue('0xsafe'),
      error: null,
    }
    const runtimePolicy = {
      appContext: 'standalone',
      signerProvider: 'dev-mnemonic-account',
      txSubmissionPath: 'protocol-kit-direct',
      canSign: true,
      canSubmit: true,
    } as const

    render(<SetupView address="0x1111111111111111111111111111111111111111" safe={safe as any} rpcUrl="http://127.0.0.1:8545" runtimePolicy={runtimePolicy} />)

    fireEvent.click(screen.getByRole('button', { name: 'Deploy Safe' }))

    await waitFor(() => {
      expect(safe.deploySafe).toHaveBeenCalledWith({
        owners: ['0x1111111111111111111111111111111111111111'],
        threshold: 1,
        provider: 'http://127.0.0.1:8545',
        signer: getDevWalletSignerForIndex(0),
      })
    })
  })

  it('uses the switched dev account signer after account index changes', async () => {
    setDevWalletActiveAccountIndex(1)

    const safe = {
      connectSafe: vi.fn().mockResolvedValue(undefined),
      deploySafe: vi.fn().mockResolvedValue('0xsafe'),
      error: null,
    }
    const runtimePolicy = {
      appContext: 'standalone',
      signerProvider: 'dev-mnemonic-account',
      txSubmissionPath: 'protocol-kit-direct',
      canSign: true,
      canSubmit: true,
    } as const

    render(<SetupView address="0x1111111111111111111111111111111111111111" safe={safe as any} rpcUrl="http://127.0.0.1:8545" runtimePolicy={runtimePolicy} />)

    fireEvent.click(screen.getByRole('button', { name: 'Deploy Safe' }))

    await waitFor(() => {
      expect(safe.deploySafe).toHaveBeenCalledWith({
        owners: ['0x1111111111111111111111111111111111111111'],
        threshold: 1,
        provider: 'http://127.0.0.1:8545',
        signer: getDevWalletSignerForIndex(1),
      })
    })
  })

  it('shows a guard-rail error when current signer provider is unsupported', async () => {
    const safe = {
      connectSafe: vi.fn().mockResolvedValue(undefined),
      deploySafe: vi.fn().mockResolvedValue('0xsafe'),
      error: null,
    }
    const runtimePolicy = {
      appContext: 'standalone',
      signerProvider: 'injected-eip1193',
      txSubmissionPath: 'protocol-kit-direct',
      canSign: true,
      canSubmit: true,
    } as const

    render(<SetupView address="0x1111111111111111111111111111111111111111" safe={safe as any} rpcUrl="http://127.0.0.1:8545" runtimePolicy={runtimePolicy} />)

    const addressInputs = screen.getAllByPlaceholderText('0x...')
    const connectInput = addressInputs[1]
    fireEvent.change(connectInput, {
      target: { value: '0x2222222222222222222222222222222222222222' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }))

    await waitFor(() => {
      expect(screen.getByText('Current wallet path cannot sign Safe setup operations in standalone mode yet.')).toBeInTheDocument()
    })
    expect(safe.connectSafe).not.toHaveBeenCalled()
  })
})
