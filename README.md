# GERBRAS · Parcerias Internacionais UEA

Dashboard interativo que cruza os pesquisadores da **Universidade do Estado do
Amazonas (UEA)** com potenciais parceiros de pesquisa na **Alemanha**, a
partir dos currículos Lattes, ORCID e das publicações indexadas no OpenAlex.

**🔗 Site publicado:** https://willpine1992.github.io/dashboard-gerbas/

## O que tem no dashboard

| Página | Conteúdo |
|---|---|
| **Painel** (`docs/index.html`) | Filtros em cascata (Grande Área → Área → PPG → linha de pesquisa → professor), gráfico Sankey linha de pesquisa × instituição alemã, nuvem de palavras das instituições, mapa do país estrangeiro, ranking de linhas de pesquisa e de pesquisadores estrangeiros |
| **Mapa de Fluxo** (`docs/flowmap.html`) | Globo 3D arrastável/zoom com arcos de Manaus até cada instituição alemã; clicar num arco mostra o detalhe e permite voltar ao painel já filtrado |
| **Perfil do pesquisador** (`docs/professor.html`) | Ao clicar num pesquisador estrangeiro: dados pessoais, linhas de pesquisa em comum, professores da UEA conectados, dados da instituição (com mini-mapa e info ao vivo via OpenAlex) e lista de publicações reais (ORCID) |

Todo o site é **estático** (HTML/CSS/JS + dados em JSON, sem backend) e roda
inteiramente no navegador — publicado via GitHub Pages a partir da pasta
`docs/`.

## Estrutura do repositório

```
GERBRAS Programming/
├── docs/                    # o dashboard publicado (GitHub Pages)
│   ├── index.html           # Página 1 — Painel
│   ├── flowmap.html         # Página 2 — Mapa de Fluxo
│   ├── professor.html       # Página 3 — Perfil do pesquisador
│   ├── css/style.css
│   ├── js/                  # common.js, charts.js, page1.js, flowmap.js, professor.js
│   ├── data/                # researchers.json, edges.json, institutions.json, manaus.json
│   ├── lib/                 # D3, d3-sankey, d3-cloud, topojson (vendorizados, sem CDN)
│   └── image/propespuea.svg
│
└── DASHBOARD 2/etl/         # pipeline Python que gera os dados acima
    ├── lattes_parser.py     # extrai nome, ORCID, universidade, endereço dos PDFs Lattes
    ├── geocode.py           # geocoding via Nominatim (cache local)
    ├── openalex_enrich.py   # DOIs e keywords dos últimos 5 anos, via OpenAlex
    ├── germany_match.py     # cruza as keywords com pesquisadores/instituições alemãs
    ├── db.py                # schema SQLite (researchers, publications, keywords,
    │                        #   research_areas, international_matches)
    ├── run_etl.py            # orquestrador principal
    ├── run_germany_match.py  # roda o cruzamento com a Alemanha
    ├── export_dashboard_data.py  # gera os JSON consumidos pelo docs/
    └── export_csv.py         # exporta as tabelas em CSV (separador `|`)
```

> Os PDFs Lattes (`DATA BASE/`), os CSVs com dados pessoais (`EXPORTS_CSV/`) e
> o banco SQLite (`DASHBOARD 2/output/`) **não são versionados** — contêm
> dados pessoais dos professores e/ou são grandes demais para o GitHub. O
> `.gitignore` já cuida disso.

## Como atualizar os dados

Com Python 3 e o `pdftotext` (poppler) instalados:

```bash
cd "DASHBOARD 2"
python3 etl/run_etl.py                 # reprocessa os currículos Lattes
python3 etl/run_germany_match.py       # refaz o cruzamento com a Alemanha
python3 etl/export_dashboard_data.py   # gera os JSON em docs/data/
```

Reexecuções são rápidas (~30s) graças ao cache local (`DASHBOARD 2/cache/`) —
só bate na internet para ORCIDs, cidades ou instituições novas.

Depois é só commitar e dar push: o GitHub Pages republica sozinho em ~1 minuto.

## Como rodar localmente

O dashboard precisa ser servido por HTTP (não abrir o `.html` direto, por
causa do CORS no `fetch` dos JSON):

```bash
cd docs
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Fontes de dados

- **Lattes (CNPq)** — identificação, ORCID, universidade/endereço, áreas de
  atuação (Grande Área/Área/Subárea/Especialidade)
- **OpenAlex** — DOIs, keywords e publicações dos últimos 5 anos, por ORCID
- **Nominatim (OpenStreetMap)** — geocoding de cidades e instituições
- **ORCID** — perfil público usado como canal de contato dos pesquisadores
  estrangeiros (não coletamos e-mail/telefone)

## Limitações conhecidas

- O cruzamento internacional está restrito à **Alemanha** por enquanto.
- Nem todo pesquisador da UEA tem ORCID no Lattes — sem ORCID, não há
  enriquecimento via OpenAlex (DOIs/keywords ficam vazios para esse registro).
- As coordenadas de algumas instituições alemãs são aproximadas (nível de
  cidade), quando o nome não é resolvido pelo Nominatim.
