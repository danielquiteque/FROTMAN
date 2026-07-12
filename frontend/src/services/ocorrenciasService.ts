import { api } from "./api";
import type { AnaliseResultado } from "../types";

export interface NovaOcorrencia {
  equipamento_id: number;
  tipo_problema: string;
  severidade: number;
  descricao?: string;
  detalhes_json?: string;
  anexo_url?: string;
}

export const ocorrenciasService = {
  // Cria a ocorrência e recebe de volta a análise simulada + a OS já gerada.
  criar: (payload: NovaOcorrencia) =>
    api.post<AnaliseResultado>("/ocorrencias", payload).then((r) => r.data),
};
