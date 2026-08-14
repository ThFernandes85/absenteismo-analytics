import { useState, type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { KeyRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

const schema = z
  .object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

const INPUT_STYLE: CSSProperties = {
  padding: '11px 14px',
  borderRadius: 9,
  border: '1px solid #dfe2e6',
  fontSize: 14,
  color: '#1c2024',
  outline: 'none',
  width: '100%',
}

export function UpdatePasswordPage() {
  const { updatePassword, clearPasswordRecovery } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const { error } = await updatePassword(values.password)
    if (error) {
      setServerError('Não foi possível trocar a senha. Peça um novo link de recuperação e tente de novo.')
      return
    }
    toast.success('Senha atualizada com sucesso.')
    clearPasswordRecovery()
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background:
          'linear-gradient(160deg,#0a1428 0%,#16294f 32%,#1f3a72 55%,#2e4d8a 78%,#4468ab 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`
        .update-password-input:focus {
          border-color: #2e4d8a !important;
          box-shadow: 0 0 0 3px rgba(46,77,138,0.12);
        }
      `}</style>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 432,
          background: '#ffffff',
          borderRadius: 18,
          padding: '40px 36px 36px',
          boxShadow: '0 24px 60px rgba(6,14,32,0.4), 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg,#1f3a72,#4468ab)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 20px rgba(31,58,114,0.3)',
            }}
          >
            <KeyRound size={26} color="#fff" strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#1c2024' }}>Definir Nova Senha</div>
          <div style={{ fontSize: 13, color: '#5a6d8f', marginTop: 6 }}>
            Escolha uma nova senha para sua conta
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Nova senha</label>
            <input
              type="password"
              autoComplete="new-password"
              className="update-password-input"
              placeholder="••••••••"
              style={INPUT_STYLE}
              {...register('password')}
            />
            {errors.password && <p style={{ fontSize: 12, color: '#c0392b', margin: 0 }}>{errors.password.message}</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Confirmar nova senha</label>
            <input
              type="password"
              autoComplete="new-password"
              className="update-password-input"
              placeholder="••••••••"
              style={INPUT_STYLE}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p style={{ fontSize: 12, color: '#c0392b', margin: 0 }}>{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 12 }}>{serverError}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full !h-auto !rounded-[9px]"
            style={{
              padding: 13,
              background: 'linear-gradient(135deg,#1f3a72,#16294f)',
              fontSize: 14.5,
              fontWeight: 700,
              letterSpacing: 0.2,
              boxShadow: '0 6px 16px rgba(22,41,79,0.32)',
            }}
          >
            {isSubmitting ? 'Salvando…' : 'Salvar Nova Senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
