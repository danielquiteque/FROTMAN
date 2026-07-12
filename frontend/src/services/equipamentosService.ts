import { api } from "./api";
import type { Equipamento } from "../types";

export interface NovoEquipamento {
  nome: string;
  tipo: string;
  setor?: string;
  data_aquisicao?: string;
}

export const equipamentosService = {
  listar: (busca?: string) =>
    api.get<Equipamento[]>("/equipamentos", { params: busca ? { busca } : {} }).then((r) => r.data),

  criar: (payload: NovoEquipamento) =>
    api.post<Equipamento>("/equipamentos", payload).then((r) => r.data),

  obter: (id: number) => api.get<Equipamento>(`/equipamentos/${id}`).then((r) => r.data),

  atualizarFoto: (id: number, fotoUrl: string) =>
    api
      .patch<Equipamento>(`/equipamentos/${id}/foto`, null, { params: { foto_url: fotoUrl } })
      .then((r) => r.data),
};
