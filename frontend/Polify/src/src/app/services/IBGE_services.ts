// src/services/ibgeService.ts

interface IBGEMunicipio {
  id: number;
  nome: string;
}

export async function fetchCitiesByState(uf: string): Promise<string[]> {
  if (!uf) return [];
  
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
    );
    
    if (!response.ok) throw new Error('Erro ao buscar cidades');

    const data: IBGEMunicipio[] = await response.json();
    
    return data
      .map((city) => city.nome)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Erro na integração com IBGE:", error);
    return [];
  }
}