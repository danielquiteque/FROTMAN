import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { equipamentosService } from "../services/equipamentosService";
import { Toast } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import type { Equipamento } from "../types";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome do equipamento"),
  tipo: z.enum(["maquina_industrial", "veiculo", "ferramenta_eletrica"]),
  setor: z.string().optional(),
  data_aquisicao: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function Equipamentos() {
  const navigate = useNavigate();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [busca, setBusca] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { message, showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: "maquina_industrial" },
  });

  const carregar = (termo?: string) => {
    equipamentosService.listar(termo).then(setEquipamentos);
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => carregar(busca || undefined), 300);
    return () => clearTimeout(timeout);
  }, [busca]);

  const onSubmit = async (values: FormValues) => {
    setEnviando(true);
    try {
      await equipamentosService.criar(values);
      showToast("Equipamento cadastrado com sucesso");
      reset({ tipo: "maquina_industrial", nome: "", setor: "", data_aquisicao: "" });
      carregar();
    } catch {
      showToast("Erro ao cadastrar equipamento");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Equipamentos</h1>
          <p>Cadastro e busca de máquinas, veículos e ferramentas</p>
        </div>
      </div>

      <form className="panel" onSubmit={handleSubmit(onSubmit)}>
        <div className="panel-head"><h3>Novo Equipamento</h3></div>
        <div className="form-grid">
          <div className="field">
            <label>Nome do equipamento</label>
            <input type="text" placeholder="Ex: Torno CNC 03" {...register("nome")} />
            {errors.nome && <span className="error">{errors.nome.message}</span>}
          </div>
          <div className="field">
            <label>Tipo</label>
            <select {...register("tipo")}>
              <option value="maquina_industrial">Máquina industrial</option>
              <option value="veiculo">Veículo</option>
              <option value="ferramenta_eletrica">Ferramenta elétrica</option>
            </select>
          </div>
          <div className="field">
            <label>Setor</label>
            <input type="text" placeholder="Ex: Linha de Produção B" {...register("setor")} />
          </div>
          <div className="field">
            <label>Data de aquisição</label>
            <input type="date" {...register("data_aquisicao")} />
          </div>
          <div className="field full" style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="btn-ghost" onClick={() => reset()}>Cancelar</button>
            <button type="submit" className="btn" disabled={enviando}>
              {enviando ? "Salvando..." : "Salvar equipamento"}
            </button>
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h3>Equipamentos Cadastrados</h3>
          <input type="text" placeholder="Buscar..." style={{ width: 180 }} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <table>
          <thead><tr><th>Nome</th><th>Tipo</th><th>Setor</th><th>Cadastrado em</th></tr></thead>
          <tbody>
            {equipamentos.length === 0 ? (
              <tr><td colSpan={4} className="empty">Nenhum equipamento cadastrado ainda</td></tr>
            ) : (
              equipamentos.map((e) => (
                <tr key={e.id} className="row-hover" onClick={() => navigate(`/app/historico/${e.id}`)}>
                  <td>{e.nome}</td>
                  <td>{formatarTipo(e.tipo)}</td>
                  <td>{e.setor || "—"}</td>
                  <td className="mono" style={{ color: "var(--muted)" }}>{new Date(e.criado_em).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Toast message={message} />
    </div>
  );
}

function formatarTipo(tipo: string) {
  return { maquina_industrial: "Máquina industrial", veiculo: "Veículo", ferramenta_eletrica: "Ferramenta elétrica" }[tipo] ?? tipo;
}
