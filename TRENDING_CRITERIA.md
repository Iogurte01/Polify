# Critérios de Tendência - Pesquisas em Alta

## Versão Atual: Combinado Simples (Opção 5)

Uma pesquisa é considerada **"em tendência"** quando atende SIMULTANEAMENTE aos seguintes critérios:

### Critério 1: Progresso da Meta
```
responses ≥ 40% de targetResponses
```
**Exemplo**: Se a meta é 100 respostas, a pesquisa entra em tendência com 40+ respostas

### Critério 2: Atividade Mínima
```
responses ≥ 3
```
**Exemplo**: Pesquisa precisa de pelo menos 3 respostas para ser considerada em tendência

---

## Lógica Implementada

### Função de Cálculo
```typescript
const calculateTrending = (responses: number, targetResponses: number): boolean => {
  const progressPercent = (responses / targetResponses) * 100;
  return progressPercent >= 40 && responses >= 3;
};
```

### Locais de Aplicação
1. **`fetchForms()`** (AppContext.tsx)
   - Calcula trending para pesquisas públicas no Hub
   - Usa: `calculateTrending(form.responses || 0, form.min_respondentes || 50)`

2. **`fetchMySurveys()`** (AppContext.tsx)
   - Calcula trending para pesquisas criadas pelo usuário
   - Usa: `calculateTrending(survey.responses || 0, survey.min_respondentes || 50)`

---

## Exemplos Práticos

### Exemplo 1: Pesquisa em Tendência ✅
- Meta: 100 respostas
- Respostas atuais: 42
- Progresso: 42% ≥ 40% ✅
- Atividade: 42 ≥ 3 ✅
- **Resultado: EM TENDÊNCIA**

### Exemplo 2: Pesquisa Abaixo da Tendência ❌
- Meta: 100 respostas
- Respostas atuais: 35
- Progresso: 35% < 40% ❌
- Atividade: 35 ≥ 3 ✅
- **Resultado: NÃO EM TENDÊNCIA**

### Exemplo 3: Pesquisa com Muitas Respostas ✅
- Meta: 100 respostas
- Respostas atuais: 50
- Progresso: 50% ≥ 40% ✅
- Atividade: 50 ≥ 3 ✅
- **Resultado: EM TENDÊNCIA** ✅

### Exemplo 4: Pesquisa Nova com Pouca Atividade ❌
- Meta: 100 respostas
- Respostas atuais: 2
- Progresso: 2% < 40% ❌
- Atividade: 2 < 3 ❌
- **Resultado: NÃO EM TENDÊNCIA**

---

## Vantagens desta Abordagem

✅ **Simples**: Fácil de compreender e implementar  
✅ **Dinâmico**: Pesquisas mudam de status conforme progridem  
✅ **Justo**: Não favorece pesquisas antigas ou novas  
✅ **Determinístico**: Sem aleatoriedade, resultado é previsível  
✅ **Sem Dependência de Qualidade**: Não requer coleta de dados de qualidade  

---

## Tuning Futuro

Se necessário ajustar os critérios, os thresholds são:

| Parâmetro | Valor Atual | Descrição |
|-----------|------------|-----------|
| `progressThreshold` | 40% | Mínimo de progresso da meta |
| `minResponses` | 3 | Mínimo de respostas absolutas |

---

## Data de Implementação
- **Data**: 12 de Maio de 2026
- **Versão**: 2.0 (Simplificada)
- **Status**: ✅ Implementado e Testado

## Critérios de Cálculo

### 1. **Respostas Recentes (0-25 pontos)**
- **O quê:** Número de respostas nos últimas 24 horas
- **Cálculo:** `(recentResponses / 5) * 25`
- **Máximo:** 5 respostas recentes = 25 pontos
- **Exemplo:** 2 respostas recentes = 10 pontos

### 2. **Taxa de Crescimento (0-25 pontos)**
- **O quê:** Crescimento percentual comparado ao período anterior (semana anterior)
- **Cálculo:** `((responses - previousResponses) / previousResponses) * 100` → normalizado para 25 pontos
- **Máximo:** +100% crescimento = 25 pontos
- **Exemplo:** +50% crescimento = 12,5 pontos

### 3. **Qualidade das Respostas (0-25 pontos)**
- **O quê:** Rating médio das respostas (escala 1-5)
- **Cálculo:** `((avgQuality - 2.5) / 2.5) * 25`
- **Máximo:** Rating 5.0 = 25 pontos
- **Mínimo:** Rating < 2.5 = 0 pontos
- **Exemplo:** Rating 4.0 = 15 pontos

### 4. **Progresso em Relação à Meta (0-25 pontos)**
- **O quê:** Percentual de respondentes alcançados vs. target
- **Cálculo:** `(responses / targetResponses) * 25`
- **Máximo:** 100% da meta = 25 pontos
- **Exemplo:** 50% da meta = 12,5 pontos

## Score Total e Threshold

- **Soma:** Soma dos 4 critérios (máx. 100 pontos)
- **Threshold de Trending:** ≥ 60 pontos
- **Breakpoints recomendados:**
  - 0-30: Sem trending (pouco engajamento)
  - 30-60: Em desenvolvimento (potencial)
  - 60-80: Trending (bom momentum)
  - 80+: Viral (excelente performance)

## Exemplo Prático

**Pesquisa:** "Percepção de Cosméticos Naturais"

| Critério | Valor | Pontos |
|----------|-------|--------|
| Respostas Recentes | 4/5 | 20 |
| Taxa Crescimento | +45% | 11,25 |
| Qualidade (Avg Rating) | 4.2/5 | 17 |
| Progresso Meta | 70/100 respondentes | 17,5 |
| **TOTAL** | | **65,75** ✅ TRENDING |

---

**Pesquisa:** "Hábitos de Compra Online"

| Critério | Valor | Pontos |
|----------|-------|--------|
| Respostas Recentes | 1/5 | 5 |
| Taxa Crescimento | +10% | 2,5 |
| Qualidade (Avg Rating) | 3.1/5 | 3 |
| Progresso Meta | 25/100 respondentes | 6,25 |
| **TOTAL** | | **16,75** ❌ SEM TRENDING |

## Implementação

### Frontend (`mockData.ts` + `AppContext.tsx`)
- Função: `calculateTrendingScore(survey: Survey): TrendingScoreData` em `mockData.ts`
- Retorna: Score total, status de trending, breakdown de pontos, e `trendGrowth` formatado
- Endpoints: `/api/forms` e `/api/my-surveys` agora retornam os 4 campos de trending

### Backend (`app.py`)
**Função Helper:** `calculate_trending_metrics(cursor, form_id)`
- Calcula `recentResponses`: Contagem de respostas distintas nas últimas 24 horas
- Calcula `previousPeriodResponses`: Contagem de respostas da semana anterior (dias 7-14)
- Calcula `avgQuality`: Heurística baseada em taxa de conclusão de respostas (escala 3.5-5.0)
- Retorna `lastUpdated`: Timestamp da última resposta registrada

**Queries SQL Implementadas:**
```sql
-- Respostas nas últimas 24h
SELECT COUNT(DISTINCT rf.id_user) 
FROM resp_form rf
JOIN perguntas_form pf ON rf.id_perg = pf.id_perg
WHERE pf.id_form = {form_id} 
AND rf.created_at >= NOW() - INTERVAL '24 hours'

-- Respostas semana anterior (7-14 dias atrás)
SELECT COUNT(DISTINCT rf.id_user) 
FROM resp_form rf
JOIN perguntas_form pf ON rf.id_perg = pf.id_perg
WHERE pf.id_form = {form_id}
AND rf.created_at >= NOW() - INTERVAL '14 days'
AND rf.created_at < NOW() - INTERVAL '7 days'

-- Taxa de completude de respostas (para calcular quality)
SELECT AVG(response_completeness)
FROM (
  SELECT rf.id_user, COUNT(rf.id) * 100.0 / {total_questions} as response_completeness
  FROM resp_form rf
  JOIN perguntas_form pf ON rf.id_perg = pf.id_perg
  WHERE pf.id_form = {form_id}
  GROUP BY rf.id_user
)
```

**Endpoints Atualizados:**
1. `GET /api/forms` — Adiciona 4 campos de trending na resposta
2. `GET /api/my-surveys` — Adiciona 4 campos de trending na resposta

**Payload de Resposta (exemplo):**
```json
{
  "id": 12,
  "nome_formulario": "Hábitos de Compra",
  "categoria": "Comportamento do Consumidor",
  "min_respondentes": 100,
  "recentResponses": 3,
  "avgQuality": 4.2,
  "previousPeriodResponses": 5,
  "lastUpdated": "2026-04-30T15:30:45.123456+00:00"
}
```

## Vantagens Desse Sistema

✅ **Justo:** Combina múltiplos fatores, não apenas volume  
✅ **Realista:** Recompensa qualidade + crescimento + engajamento recente  
✅ **Dinâmico:** Pesquisas antigas sem atividade perdem trending naturalmente  
✅ **Transparente:** Critérios claros e auditáveis  
✅ **Escalável:** Fácil de ajustar thresholds sem quebrar lógica

## Possíveis Ajustes Futuros

- Adicionar peso por **categoria** (algumas categorias tendem a ter mais respostas)
- Incluir **locação geográfica** (diversidade de regiões)
- Considerar **time-to-complete** (pesquisas mais rápidas podem ter mais tração)
- Implementar **decay** temporal (pesquisas mais antigas naturalmente caem em trending)
