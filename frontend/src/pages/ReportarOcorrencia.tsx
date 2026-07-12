import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { equipamentosService } from "../services/equipamentosService";
import { ocorrenciasService } from "../services/ocorrenciasService";
import { uploadService } from "../services/uploadService";
import { Badge } from "../components/Badge";
import type { AnaliseResultado, Equipamento } from "../types";

const schema = z.object({
  equipamento_id: z.number().min(1, "Selecione um equipamento"),
  tipo_problema: z.enum(["ruido", "vazamento", "nao_liga"]),
  frequencia_ruido: z.string().optional(),
  tipo_fluido: z.string().optional(),
  volume_vazamento: z.string().optional(),
  ultima_vez_funcionou: z.string().optional(),
  severidade: z.number().min(1).max(5),
  descricao: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const STEP_LABELS = ["Equipamento", "Tipo de problema", "Detalhes", "Severidade", "Descrição", "Resultado"];
const FIELDS_PER_STEP: (keyof FormValues)[][] = [
  ["equipamento_id"],
  ["tipo_problema"],
  [],
  ["severidade"],
  ["descricao"],
  [],
];

export function ReportarOcorrencia() {
  const navigate = useNavigate();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [step, setStep] = useState(0);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<AnaliseResultado | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const { register, handleSubmit, trigger, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { severidade: 3, tipo_problema: "ruido" },
  });
  const tipoProblema = watch("tipo_problema");

  useEffect(() => {
    equipamentosService.listar().then(setEquipamentos);
  }, []);

  const avancar = async () => {
    const campos = FIELDS_PER_STEP[step];
    if (campos.length) {
      const ok = await trigger(campos);
      if (!ok) return;
    }
    if (step < STEP_LABELS.length - 1) setStep(step + 1);
  };
  const voltar = () => step > 0 && setStep(step - 1);

  const enviar = handleSubmit(async (values) => {
    setAnalisando(true);
    setErroEnvio(null);
    try {
      let anexo_url: string | undefined;
      if (arquivo) {
        const up = await uploadService.enviar(arquivo);
        anexo_url = up.url;
      }
      const detalhes = {
        frequencia_ruido: values.frequencia_ruido,
        tipo_fluido: values.tipo_fluido,
        volume_vazamento: values.volume_vazamento,
        ultima_vez_funcionou: values.ultima_vez_funcionou,
      };
      const res = await ocorrenciasService.criar({
        equipamento_id: values.equipamento_id,
        tipo_problema: values.tipo_problema,
        severidade: values.severidade,
        descricao: values.descricao,
        detalhes_json: JSON.stringify(detalhes),
        anexo_url,
      });
      setResultado(res);
      setStep(5);
    } catch {
      setErroEnvio("Não foi possível enviar a ocorrência. Verifique se o backend está rodando.");
    } finally {
      setAnalisando(false);
    }
  });

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Reportar Ocorrência</h1>
          <p>Formulário adaptado conforme o tipo de problema reportado</p>
        </div>
      </div>

      <div className="panel">
        <div className="steps">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className={`step ${i < step ? "done" : i === step ? "current" : ""}`}>
              <div className="dot">{i < step ? "✓" : i + 1}</div>
              {label}
            </div>
          ))}
        </div>

        <div className="step-panel">
          {step === 0 && (
            <div className="field full">
              <label>Selecione o equipamento</label>
              <select {...register("equipamento_id", { valueAsNumber: true })}>
                <option value="">Selecione...</option>
                {equipamentos.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.nome} — {eq.setor}</option>
                ))}
              </select>
              {errors.equipamento_id && <span className="error">{errors.equipamento_id.message}</span>}
              {equipamentos.length === 0 && (
                <span className="error">Nenhum equipamento cadastrado — cadastre um antes de reportar.</span>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="field full">
              <label>Tipo de problema</label>
              <div className="chips">
                {(["ruido", "vazamento", "nao_liga"] as const).map((tipo) => (
                  <label key={tipo} className={`chip ${tipoProblema === tipo ? "selected" : ""}`}>
                    <input type="radio" value={tipo} {...register("tipo_problema")} style={{ display: "none" }} />
                    {tipo === "ruido" ? "Ruído anormal" : tipo === "vazamento" ? "Vazamento" : "Não liga"}
                  </label>
                ))}
              </div>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 10 }}>
                ↳ As perguntas do próximo passo mudam conforme o tipo selecionado.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="form-grid" style={{ padding: 0 }}>
              {tipoProblema === "ruido" && (
                <div className="field">
                  <label>Frequência do ruído</label>
                  <select {...register("frequencia_ruido")}>
                    <option value="continuo">Contínuo</option>
                    <option value="intermitente">Intermitente</option>
                    <option value="ao_ligar">Ao ligar</option>
                  </select>
                </div>
              )}
              {tipoProblema === "vazamento" && (
                <>
                  <div className="field">
                    <label>Tipo de fluido</label>
                    <select {...register("tipo_fluido")}>
                      <option value="oleo_hidraulico">Óleo hidráulico</option>
                      <option value="agua_refrigerante">Água/refrigerante</option>
                      <option value="combustivel">Combustível</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Volume estimado</label>
                    <select {...register("volume_vazamento")}>
                      <option value="poucas_gotas">Poucas gotas</option>
                      <option value="fluxo_constante">Fluxo constante</option>
                      <option value="grande_vazamento">Grande vazamento</option>
                    </select>
                  </div>
                </>
              )}
              {tipoProblema === "nao_liga" && (
                <div className="field full">
                  <label>Quando foi a última vez que funcionou normalmente?</label>
                  <input type="text" placeholder="Ex: ontem à tarde, durante o turno" {...register("ultima_vez_funcionou")} />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <>
              <div className="field full">
                <label>Severidade percebida</label>
                <div className="severity-row">
                  <input type="range" min={1} max={5} {...register("severidade", { valueAsNumber: true })} />
                  <span className="sev-val mono">{watch("severidade")}</span>
                </div>
              </div>
              <div className="field full" style={{ marginTop: 14 }}>
                <label>Anexo (foto ou áudio do problema)</label>
                <label className={`upload-box ${arquivo ? "has-file" : ""}`}>
                  {arquivo ? `Selecionado: ${arquivo.name}` : "Clique para selecionar um arquivo (opcional)"}
                  <input
                    type="file"
                    accept="image/*,audio/*"
                    style={{ display: "none" }}
                    onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="field full">
              <label>Descrição livre do problema</label>
              <textarea rows={4} placeholder="Descreva o que está acontecendo..." {...register("descricao")} />
            </div>
          )}

          {step === 5 && (
            <>
              {analisando && (
                <div className="analyzing"><div className="spinner" /> Analisando ocorrência (simulado)...</div>
              )}
              {resultado && !analisando && (
                <div className="result-card">
                  <div className="result-row">
                    <span className="k">Prioridade sugerida</span>
                    <Badge tipo="prioridade" valor={resultado.prioridade} />
                  </div>
                  <div className="result-row">
                    <span className="k">Causa provável (mock)</span>
                    <span>{resultado.causa_provavel}</span>
                  </div>
                  <div className="result-row">
                    <span className="k">OS gerada</span>
                    <span className="mono">OS-{String(resultado.ordem_servico_id).padStart(4, "0")}</span>
                  </div>
                </div>
              )}
              {erroEnvio && <p className="error">{erroEnvio}</p>}
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12 }}>
                * Análise simulada por regras. Nenhum modelo de IA está integrado nesta versão. Em produção,
                esta etapa poderia ser substituída por um LLM real.
              </p>
            </>
          )}
        </div>

        <div className="step-actions">
          <button className="btn-ghost" style={{ visibility: step === 0 ? "hidden" : "visible" }} onClick={voltar}>
            Voltar
          </button>
          {step < 4 && <button className="btn" onClick={avancar}>Continuar</button>}
          {step === 4 && (
            <button className="btn" onClick={enviar} disabled={analisando}>
              {analisando ? "Analisando..." : "Analisar"}
            </button>
          )}
          {step === 5 && resultado && (
            <button className="btn" onClick={() => navigate(`/app/ordens/${resultado.ordem_servico_id}`)}>
              Ver Ordem de Serviço →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
