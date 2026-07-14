import { useState, type CSSProperties } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
})

type LoginForm = z.infer<typeof loginSchema>

const INPUT_STYLE: CSSProperties = {
  padding: '11px 14px',
  borderRadius: 9,
  border: '1px solid #dfe2e6',
  fontSize: 14,
  color: '#1c2024',
  outline: 'none',
  width: '100%',
}

export function LoginPage() {
  const { session, signIn } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetSending, setResetSending] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const emailValue = watch('email')

  if (session) return <Navigate to="/" replace />

  async function onSubmit(values: LoginForm) {
    setServerError(null)
    const { error } = await signIn(values.email, values.password)
    if (error) setServerError('E-mail ou senha inválidos.')
  }

  async function handleForgotPassword() {
    if (!emailValue || !z.string().email().safeParse(emailValue).success) {
      toast.error('Digite seu e-mail no campo acima primeiro.')
      return
    }
    setResetSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
      redirectTo: window.location.origin + import.meta.env.BASE_URL,
    })
    setResetSending(false)
    if (error) {
      toast.error(
        error.message.includes('rate limit')
          ? 'Limite de e-mails atingido. Fale com o Admin Master para redefinir sua senha.'
          : 'Erro ao enviar e-mail de recuperação.',
      )
    } else {
      toast.success('Se esse e-mail existir, enviamos um link de recuperação.')
      setResetMode(false)
    }
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
        @keyframes loginFloatBlob {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px,24px) scale(1.06); }
        }
        .login-input:focus {
          border-color: #2e4d8a !important;
          box-shadow: 0 0 0 3px rgba(46,77,138,0.12);
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          top: -120,
          left: -100,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)',
          animation: 'loginFloatBlob 14s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -160,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)',
          animation: 'loginFloatBlob 18s ease-in-out infinite reverse',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          opacity: 0.5,
        }}
      />

      <div style={{ position: 'absolute', top: 32, left: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
            overflow: 'hidden',
          }}
        >
          <img src={`${import.meta.env.BASE_URL}sodexo-logo.png`} alt="Sodexo" style={{ width: 26, height: 'auto' }} />
        </div>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>
          Sodexo · People Analytics
        </div>
      </div>

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
            <Building2 size={26} color="#fff" strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#1c2024' }}>Controle de Absenteísmo</div>
          <div style={{ fontSize: 13, color: '#5a6d8f', marginTop: 6 }}>
            {resetMode ? 'Informe seu e-mail para recuperar o acesso' : 'Entre com suas credenciais corporativas'}
          </div>
        </div>

        {resetMode ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>E-mail</label>
              <input
                type="email"
                className="login-input"
                placeholder="nome@sodexo.com"
                style={INPUT_STYLE}
                {...register('email')}
              />
            </div>
            <button
              onClick={handleForgotPassword}
              disabled={resetSending}
              style={{
                width: '100%',
                padding: 13,
                border: 'none',
                borderRadius: 9,
                background: 'linear-gradient(135deg,#1f3a72,#16294f)',
                color: '#fff',
                fontSize: 14.5,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 0.2,
                boxShadow: '0 6px 16px rgba(22,41,79,0.32)',
              }}
            >
              {resetSending ? 'Enviando…' : 'Enviar link de recuperação'}
            </button>
            <button
              onClick={() => setResetMode(false)}
              style={{
                width: '100%',
                marginTop: 12,
                padding: 0,
                border: 'none',
                background: 'none',
                fontSize: 12.5,
                color: '#2e4d8a',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>E-mail</label>
              <input
                type="email"
                autoComplete="email"
                className="login-input"
                placeholder="nome@sodexo.com"
                style={INPUT_STYLE}
                {...register('email')}
              />
              {errors.email && <p style={{ fontSize: 12, color: '#c0392b', margin: 0 }}>{errors.email.message}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Senha</label>
              <input
                type="password"
                autoComplete="current-password"
                className="login-input"
                placeholder="••••••••"
                style={INPUT_STYLE}
                {...register('password')}
              />
              {errors.password && <p style={{ fontSize: 12, color: '#c0392b', margin: 0 }}>{errors.password.message}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setResetMode(true)}
                style={{ fontSize: 12.5, color: '#2e4d8a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Esqueci minha senha
              </button>
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
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9199a3' }}>
          Acesso restrito a colaboradores autorizados
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 20, fontSize: 11.5, color: 'rgba(255,255,255,0.75)', zIndex: 1 }}>
        © {new Date().getFullYear()} Sodexo · Painel de Absenteísmo do Efetivo
      </div>
    </div>
  )
}
