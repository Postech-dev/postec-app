import './Logo.css'

interface LogoProps {
  slogan?: boolean
  // versão clara para fundo laranja
  clara?: boolean
}

function Logo({ slogan, clara }: LogoProps) {
  return (
    <div className={`logo ${clara ? 'logo-clara' : ''}`}>
      <div className="logo-marca">
        <img className="logo-icone" src="/logo.png" alt="" />
        <span className="logo-texto">PosTec</span>
      </div>
      {slogan && <p className="logo-slogan">Tecnologia e praticidade para Pós Vendas.</p>}
    </div>
  )
}

export default Logo
