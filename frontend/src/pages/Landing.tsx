import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { dashboardService } from "../services/ordensServicoService";
import type { DashboardKPIs } from "../types";

const FAQS = [
  {
    q: "A IA já está integrada no sistema?",
    a: "Ainda não. Nesta fase, todas as respostas de priorização e causa provável são simuladas (mock) por regras condicionais e palavras-chave, para validar a interface e o fluxo antes de integrar um LLM real.",
  },
  {
    q: "Como a prioridade é definida hoje?",
    a: "Por uma regra simples combinando a severidade reportada pelo operador com palavras-chave da descrição — um placeholder para o que futuramente será uma análise por IA.",
  },
  {
    q: "Dá pra usar em qualquer tipo de equipamento?",
    a: "Sim — máquinas industriais, veículos de frota e ferramentas elétricas já estão contemplados no cadastro de equipamentos.",
  },
];

export function Landing() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [faqAberta, setFaqAberta] = useState(0);

  useEffect(() => {
    dashboardService.kpis().then(setKpis).catch(() => setKpis(null));
  }, []);

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <Logo />
          <div className="nav-links">
            <a href="#problema">O Problema</a>
            <a href="#como-funciona">Como Funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#faq">FAQ</a>
          </div>
          <button className="nav-cta" onClick={() => navigate("/app/dashboard")}>Acessar Sistema →</button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-inner">
          <div className="eyebrow"><span className="rule" /> MANUTENÇÃO INDUSTRIAL · TRIAGEM INTELIGENTE</div>
          <h1>Sua frota avisa. <span className="hl">A FROTMAN prioriza</span> antes que vire prejuízo.</h1>
          <p>
            Centralize o reporte de problemas em equipamentos e frotas, receba priorização
            automática de ordens de serviço e tenha visibilidade total do histórico de
            manutenção — tudo em um único painel.
          </p>
          <div className="hero-ctas">
            <button className="btn" onClick={() => navigate("/app/dashboard")}>Acessar o Sistema →</button>
            <a href="#como-funciona" className="btn-outline">Ver como funciona</a>
          </div>
          <div className="hero-stats">
            <div className="hstat"><div className="v">{kpis?.total_equipamentos ?? "—"}</div><div className="l">Equipamentos monitorados</div></div>
            <div className="hstat"><div className="v">{kpis ? kpis.os_abertas + kpis.os_concluidas_mes : "—"}</div><div className="l">Ordens de serviço processadas</div></div>
            <div className="hstat"><div className="v">100%</div><div className="l">Rastreabilidade de histórico</div></div>
            <div className="hstat"><div className="v">0</div><div className="l">Modelos de IA integrados (por design)</div></div>
          </div>
        </div>
      </header>

      <section id="problema" className="section">
        <div className="section-inner">
          <div className="eyebrow-light">DIAGNÓSTICO <span className="rule" /></div>
          <h2 className="section-title">O custo invisível da manutenção reativa</h2>
          <p className="section-sub">Sem um sistema de triagem, sua equipe está sempre correndo atrás do problema — nunca à frente dele.</p>

          <div className="qa-grid">
            <div>
              <div className="qa-row"><div className="qa-q">Qual equipamento vai quebrar primeiro?</div></div>
              <div className="qa-row"><div className="qa-q">Quanto tempo de produção você perde com paradas não planejadas?</div></div>
              <div className="qa-row"><div className="qa-q">Existe histórico confiável de manutenções por equipamento?</div></div>
            </div>
            <div>
              <div className="qa-row"><div className="qa-a">Sem priorização, todo problema parece urgente — até o equipamento errado quebrar primeiro.</div></div>
              <div className="qa-row"><div className="qa-a">Reportes soltos fazem o técnico perder tempo entendendo o problema em vez de resolvê-lo.</div></div>
              <div className="qa-row"><div className="qa-a">Sem histórico centralizado, cada ocorrência é tratada como se fosse a primeira vez.</div></div>
            </div>
          </div>

          <div className="dark-callout">
            <div className="k">Resultado</div>
            <p>A FROTMAN transforma reportes soltos em ordens de serviço priorizadas automaticamente, com histórico completo por equipamento.</p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section" style={{ background: "var(--cream-2)" }}>
        <div className="section-inner">
          <div className="eyebrow-light">PROCESSO <span className="rule" /></div>
          <h2 className="section-title">Do reporte à ordem de serviço, em 3 etapas</h2>
          <div className="phases">
            <div className="phase">
              <div className="phase-num">01</div>
              <div className="phase-tag">Reporte</div>
              <h3>Operador reporta a ocorrência</h3>
              <p>Formulário dinâmico se adapta ao tipo de problema, com upload de foto ou áudio.</p>
            </div>
            <div className="phase">
              <div className="phase-num">02</div>
              <div className="phase-tag">Triagem</div>
              <h3>Sistema sugere prioridade e causa</h3>
              <p>Com base na severidade e em regras condicionais, uma OS é gerada automaticamente.</p>
            </div>
            <div className="phase">
              <div className="phase-num">03</div>
              <div className="phase-tag">Execução</div>
              <h3>Técnico executa e documenta</h3>
              <p>Linha do tempo de status e relatório — tudo rastreado no histórico do equipamento.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="section">
        <div className="section-inner">
          <div className="eyebrow-light">RECURSOS <span className="rule" /></div>
          <h2 className="section-title">O que está incluído no sistema</h2>
          <div className="feat-grid">
            {[
              ["Painel centralizado", "KPIs de equipamentos, OS abertas e urgências, com filtros reais."],
              ["Formulário dinâmico", "As perguntas mudam conforme o tipo de problema selecionado."],
              ["Ordem de serviço automática", "Prioridade e causa provável sugeridas por regras simuladas."],
              ["Histórico por equipamento", "Frequência de falhas com gráfico real (Recharts)."],
              ["Cadastro de equipamentos", "Máquinas, veículos e ferramentas, persistidos em SQLite."],
              ["Linha do tempo de status", "Aberta → Em andamento → Concluída, com histórico gravado."],
            ].map(([titulo, texto]) => (
              <div className="feat-card" key={titulo}>
                <div className="feat-icon">●</div>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="section-inner" style={{ maxWidth: 820 }}>
          <div className="eyebrow-light">DÚVIDAS <span className="rule" /></div>
          <h2 className="section-title">Perguntas frequentes</h2>
          <div>
            {FAQS.map((item, i) => (
              <div key={item.q} className={`faq-item ${faqAberta === i ? "open" : ""}`}>
                <div className="faq-q" onClick={() => setFaqAberta(faqAberta === i ? -1 : i)}>
                  <span><span className="qn">Q.0{i + 1}</span>{item.q}</span>
                  <span className="faq-chevron">⌄</span>
                </div>
                <div className="faq-a"><p>{item.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-final">
        <div className="section-inner">
          <div className="eyebrow"><span className="rule" /> COMECE AGORA</div>
          <h2>Veja a triagem inteligente funcionando</h2>
          <p>Explore o painel, reporte uma ocorrência e veja a ordem de serviço sendo gerada automaticamente.</p>
          <button className="btn" onClick={() => navigate("/app/dashboard")}>Acessar o Sistema →</button>
        </div>
      </section>

      <footer className="site-footer">
        <div className="foot-inner">
          <div className="foot-top">
            <div className="foot-col" style={{ maxWidth: 260 }}>
              <Logo />
              <div style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 10 }}>
                Triagem inteligente de manutenção para equipamentos e frotas industriais.
              </div>
            </div>
            <div className="foot-col">
              <h4>Sistema</h4>
              <a href="#como-funciona">Como funciona</a>
              <a href="#recursos">Recursos</a>
              <a href="#faq">FAQ</a>
              <Link to="/app/dashboard">Acessar sistema</Link>
            </div>
            <div className="foot-col">
              <h4>Projeto</h4>
              <div>Pós-graduação em IA — SENAI</div>
              <div>Disciplina: IA Generativa</div>
              <div>Análise simulada por regras — sem IA real integrada</div>
            </div>
          </div>
          <div className="foot-bottom">
            <div>© 2026 FROTMAN · Projeto acadêmico</div>
            <div>Análise simulada por regras. Nenhum modelo de IA está integrado nesta versão.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
