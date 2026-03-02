#!/usr/bin/env python3
"""
fix_ptbr_encoding.py
────────────────────
One-time script to repair PT-BR text corruption in backend content files.

Two types of corruption are fixed:

  1. Ã-mojibake  — UTF-8 bytes misread as Latin-1 (Ã© → é, Ã£ → ã, etc.)
     Applied to: seed.sql + ALL lesson *.json files (safety pass)

  2. ?-replacement — accented chars replaced with literal '?' at content-gen time
     Applied to: lesson_master_challenge_1.json only

Run from the repo root:
    python fix_ptbr_encoding.py
"""

import pathlib

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = pathlib.Path(__file__).parent / "backend" / "content"
MASTER = ROOT / "sql_basics" / "module_11" / "lesson_master_challenge_1.json"

# ─── 1. Ã-mojibake map (matches ptBrText.js on the frontend) ─────────────────
MOJI_MAP = [
    ("Ã§Ã£", "çã"),
    ("Ã§Ãµ", "çõ"),
    ("Ã§", "ç"),
    ("Ã£", "ã"),
    ("Ãµ", "õ"),
    ("Ã¡", "á"),
    ("Ã¢", "â"),
    ("Ã©", "é"),
    ("Ãª", "ê"),
    ("Ã­", "í"),
    ("Ã³", "ó"),
    ("Ã´", "ô"),
    ("Ãº", "ú"),
]

def fix_moji(text: str) -> str:
    for bad, good in MOJI_MAP:
        text = text.replace(bad, good)
    return text


# ─── 2. ?-replacement word dictionary for master challenge JSON ───────────────
# Ordered longest-first to prevent partial substitutions (e.g. "recomenda??es"
# before "a??es").  Both capitalised and lower-case forms are listed.
WORD_FIXES = [
    # ── double-? ─────────────────────────────────────────────────────────────
    ("investiga??es",    "investigações"),  ("Investiga??es",    "Investigações"),
    ("investiga??o",     "investigação"),   ("Investiga??o",     "Investigação"),
    ("recomenda??es",    "recomendações"),  ("Recomenda??es",    "Recomendações"),
    ("recomenda??o",     "recomendação"),   ("Recomenda??o",     "Recomendação"),
    ("reconcilia??o",    "reconciliação"),  ("Reconcilia??o",    "Reconciliação"),
    ("distribui??es",    "distribuições"),  ("Distribui??es",    "Distribuições"),
    ("distribui??o",     "distribuição"),   ("Distribui??o",     "Distribuição"),
    ("contribui??o",     "contribuição"),   ("Contribui??o",     "Contribuição"),
    ("verifica??o",      "verificação"),    ("Verifica??o",      "Verificação"),
    ("identifica??o",    "identificação"),  ("Identifica??o",    "Identificação"),
    ("avalia??o",        "avaliação"),      ("Avalia??o",        "Avaliação"),
    ("opera??es",        "operações"),      ("Opera??es",        "Operações"),
    ("opera??o",         "operação"),       ("Opera??o",         "Operação"),
    ("varia??es",        "variações"),      ("Varia??es",        "Variações"),
    ("varia??o",         "variação"),       ("Varia??o",         "Variação"),
    ("corre??es",        "correções"),      ("Corre??es",        "Correções"),
    ("corre??o",         "correção"),       ("Corre??o",         "Correção"),
    ("propor??o",        "proporção"),      ("Propor??o",        "Proporção"),
    ("posi??es",         "posições"),       ("Posi??es",         "Posições"),
    ("posi??o",          "posição"),        ("Posi??o",          "Posição"),
    ("reten??o",         "retenção"),       ("Reten??o",         "Retenção"),
    ("inclina??o",       "inclinação"),     ("Inclina??o",       "Inclinação"),
    ("concentra??o",     "concentração"),   ("Concentra??o",     "Concentração"),
    ("interpreta??o",    "interpretação"),  ("Interpreta??o",    "Interpretação"),
    ("evolu??o",         "evolução"),       ("Evolu??o",         "Evolução"),
    ("convers?es",       "conversões"),     ("Convers?es",       "Conversões"),
    ("convers?o",        "conversão"),      ("Convers?o",        "Conversão"),
    ("regress?o",        "regressão"),      ("Regress?o",        "Regressão"),
    ("concis?o",         "concisão"),       ("Concis?o",         "Concisão"),
    ("evas?o",           "evasão"),         ("Evas?o",           "Evasão"),
    ("sess?es",          "sessões"),        ("Sess?es",          "Sessões"),
    ("fun??es",          "funções"),        ("Fun??es",          "Funções"),
    ("fun??o",           "função"),         ("Fun??o",           "Função"),
    ("a??es",            "ações"),          ("A??es",            "Ações"),
    ("a??o",             "ação"),           ("A??o",             "Ação"),
    ("divis?o",          "divisão"),        ("Divis?o",          "Divisão"),
    ("fa?a",             "faça"),           ("Fa?a",             "Faça"),
    ("fa?am",            "façam"),          ("Fa?am",            "Façam"),
    ("avalia??es",       "avaliações"),     ("Avalia??es",       "Avaliações"),
    ("situa??o",         "situação"),       ("Situa??o",         "Situação"),
    ("afirma??o",        "afirmação"),      ("Afirma??o",        "Afirmação"),
    ("comunica??o",      "comunicação"),    ("Comunica??o",      "Comunicação"),
    ("adapta??o",        "adaptação"),      ("Adapta??o",        "Adaptação"),
    ("cria??o",          "criação"),        ("Cria??o",          "Criação"),
    ("configura??o",     "configuração"),   ("Configura??o",     "Configuração"),
    ("atualiza??o",      "atualização"),    ("Atualiza??o",      "Atualização"),
    ("combina??o",       "combinação"),     ("Combina??o",       "Combinação"),
    ("constata??o",      "constatação"),    ("Constata??o",      "Constatação"),
    ("apresenta??o",     "apresentação"),   ("Apresenta??o",     "Apresentação"),
    ("valida??o",        "validação"),      ("Valida??o",        "Validação"),
    ("aten??o",          "atenção"),        ("Aten??o",          "Atenção"),
    ("explica??o",       "explicação"),     ("Explica??o",       "Explicação"),
    ("utiliza??o",       "utilização"),     ("Utiliza??o",       "Utilização"),
    # ── single-? ─────────────────────────────────────────────────────────────
    ("evid?ncias",       "evidências"),     ("Evid?ncias",       "Evidências"),
    ("evid?ncia",        "evidência"),      ("Evid?ncia",        "Evidência"),
    ("experi?ncias",     "experiências"),   ("Experi?ncias",     "Experiências"),
    ("experi?ncia",      "experiência"),    ("Experi?ncia",      "Experiência"),
    ("refer?ncia",       "referência"),     ("Refer?ncia",       "Referência"),
    ("refer?ncias",      "referências"),    ("Refer?ncias",      "Referências"),
    ("discrep?ncia",     "discrepância"),   ("Discrep?ncia",     "Discrepância"),
    ("discrep?ncias",    "discrepâncias"),  ("Discrep?ncias",    "Discrepâncias"),
    ("tend?ncia",        "tendência"),      ("Tend?ncia",        "Tendência"),
    ("tend?ncias",       "tendências"),     ("Tend?ncias",       "Tendências"),
    ("efici?ncia",       "eficiência"),     ("Efici?ncia",       "Eficiência"),
    ("coer?ncia",        "coerência"),      ("Coer?ncia",        "Coerência"),
    ("hip?teses",        "hipóteses"),      ("Hip?teses",        "Hipóteses"),
    ("hip?tese",         "hipótese"),       ("Hip?tese",         "Hipótese"),
    ("Tr?s",             "Três"),           ("tr?s",             "três"),
    ("eletr?nicos",      "eletrônicos"),    ("Eletr?nicos",      "Eletrônicos"),
    ("eletr?nico",       "eletrônico"),     ("Eletr?nico",       "Eletrônico"),
    ("acess?rios",       "acessórios"),     ("Acess?rios",       "Acessórios"),
    ("acess?rio",        "acessório"),      ("Acess?rio",        "Acessório"),
    ("dicion?rio",       "dicionário"),     ("Dicion?rio",       "Dicionário"),
    ("dicion?rios",      "dicionários"),
    ("par?metros",       "parâmetros"),     ("Par?metros",       "Parâmetros"),
    ("par?metro",        "parâmetro"),      ("Par?metro",        "Parâmetro"),
    ("diagn?stico",      "diagnóstico"),    ("Diagn?stico",      "Diagnóstico"),
    ("diagn?sticos",     "diagnósticos"),   ("Diagn?sticos",     "Diagnósticos"),
    ("portf?lio",        "portfólio"),      ("Portf?lio",        "Portfólio"),
    ("portf?lios",       "portfólios"),
    ("n?meros",          "números"),        ("N?meros",          "Números"),
    ("n?mero",           "número"),         ("N?mero",           "Número"),
    ("N?cleo",           "Núcleo"),         ("n?cleo",           "núcleo"),
    ("m?todos",          "métodos"),        ("M?todos",          "Métodos"),
    ("m?todo",           "método"),         ("M?todo",           "Método"),
    ("m?dias",           "médias"),         ("M?dias",           "Médias"),
    ("m?dia",            "média"),          ("M?dia",            "Média"),
    ("m?dio",            "médio"),          ("M?dio",            "Médio"),
    ("m?s",              "mês"),            ("M?s",              "Mês"),
    ("padr?es",          "padrões"),        ("Padr?es",          "Padrões"),
    ("padr?o",           "padrão"),         ("Padr?o",           "Padrão"),
    ("per?odos",         "períodos"),       ("Per?odos",         "Períodos"),
    ("per?odo",          "período"),        ("Per?odo",          "Período"),
    ("in?cio",           "início"),         ("In?cio",           "Início"),
    ("poss?vel",         "possível"),       ("Poss?vel",         "Possível"),
    ("poss?veis",        "possíveis"),      ("Poss?veis",        "Possíveis"),
    ("vis?vel",          "visível"),        ("Vis?vel",          "Visível"),
    ("vis?veis",         "visíveis"),
    ("avan?ado",         "avançado"),       ("Avan?ado",         "Avançado"),
    ("avan?ados",        "avançados"),      ("Avan?ados",        "Avançados"),
    ("diferen?as",       "diferenças"),     ("Diferen?as",       "Diferenças"),
    ("diferen?a",        "diferença"),      ("Diferen?a",        "Diferença"),
    ("amea?as",          "ameaças"),        ("Amea?as",          "Ameaças"),
    ("amea?a",           "ameaça"),         ("Amea?a",           "Ameaça"),
    ("an?lises",         "análises"),       ("An?lises",         "Análises"),
    ("an?lise",          "análise"),        ("An?lise",          "Análise"),
    ("distribu?dos",     "distribuídos"),   ("Distribu?dos",     "Distribuídos"),
    ("distribu?do",      "distribuído"),    ("Distribu?do",      "Distribuído"),
    ("distribu?das",     "distribuídas"),
    ("conclu?dos",       "concluídos"),     ("Conclu?dos",       "Concluídos"),
    ("conclu?do",        "concluído"),      ("Conclu?do",        "Concluído"),
    ("unit?rios",        "unitários"),      ("Unit?rios",        "Unitários"),
    ("unit?rio",         "unitário"),       ("Unit?rio",         "Unitário"),
    ("unit?rias",        "unitárias"),
    ("pr?ximos",         "próximos"),       ("Pr?ximos",         "Próximos"),
    ("pr?ximo",          "próximo"),        ("Pr?ximo",          "Próximo"),
    ("pr?xima",          "próxima"),        ("Pr?xima",          "Próxima"),
    ("crit?rios",        "critérios"),      ("Crit?rios",        "Critérios"),
    ("crit?rio",         "critério"),       ("Crit?rio",         "Critério"),
    ("espec?ficos",      "específicos"),    ("Espec?ficos",      "Específicos"),
    ("espec?fico",       "específico"),     ("Espec?fico",       "Específico"),
    ("espec?ficas",      "específicas"),
    ("cr?ticos",         "críticos"),       ("Cr?ticos",         "Críticos"),
    ("cr?tico",          "crítico"),        ("Cr?tico",          "Crítico"),
    ("responsaveis",     "responsáveis"),   ("Responsaveis",     "Responsáveis"),
    ("pre?os",           "preços"),         ("Pre?os",           "Preços"),
    ("pre?o",            "preço"),          ("Pre?o",            "Preço"),
    ("s?o",              "são"),            ("S?o",              "São"),
    ("n?o",              "não"),            ("N?o",              "Não"),
    ("h?",               "há"),             ("H?",               "Há"),
    ("tamb?m",           "também"),         ("Tamb?m",           "Também"),
    ("ap?s",             "após"),           ("Ap?s",             "Após"),
    ("at?",              "até"),            ("At?",              "Até"),
    ("j?",               "já"),             ("J?",               "Já"),
    ("Gr?ficos",         "Gráficos"),       ("gr?ficos",         "gráficos"),
    ("Gr?fico",          "Gráfico"),        ("gr?fico",          "gráfico"),
    ("Saida",            "Saída"),          ("saida",            "saída"),
    # ── additional patterns found after first pass ────────────────────────────
    ("Voc?s",            "Vocês"),          ("voc?s",            "vocês"),
    ("Voc?",             "Você"),           ("voc?",             "você"),
    ("Qu?o",             "Quão"),           ("qu?o",             "quão"),
    ("an?nimos",         "anônimos"),       ("An?nimos",         "Anônimos"),
    ("an?nimo",          "anônimo"),        ("An?nimo",          "Anônimo"),
    ("avan?ar",          "avançar"),        ("Avan?ar",          "Avançar"),
    ("emerg?ncia",       "emergência"),     ("Emerg?ncia",       "Emergência"),
    ("espec?fica",       "específica"),     ("Espec?fica",       "Específica"),
    ("espec?ficas",      "específicas"),
    ("est?o",            "estão"),          ("Est?o",            "Estão"),
    ("expl?cito",        "explícito"),      ("Expl?cito",        "Explícito"),
    ("expl?cita",        "explícita"),
    ("gen?rica",         "genérica"),       ("Gen?rica",         "Genérica"),
    ("gen?ricas",        "genéricas"),
    ("incid?ncia",       "incidência"),     ("Incid?ncia",       "Incidência"),
    ("incid?ncias",      "incidências"),
    ("priorit?ria",      "prioritária"),    ("Priorit?ria",      "Prioritária"),
    ("priorit?rio",      "prioritário"),    ("Priorit?rio",      "Prioritário"),
    ("dispon?veis",      "disponíveis"),    ("Dispon?veis",      "Disponíveis"),
    ("dispon?vel",       "disponível"),     ("Dispon?vel",       "Disponível"),
    ("diverg?ncia",      "divergência"),    ("Diverg?ncia",      "Divergência"),
    ("diverg?ncias",     "divergências"),
    ("entreg?vel",       "entregável"),     ("Entreg?vel",       "Entregável"),
    ("num?ricas",        "numéricas"),      ("Num?ricas",        "Numéricas"),
    ("num?rica",         "numérica"),       ("Num?rica",         "Numérica"),
    ("num?rico",         "numérico"),       ("Num?rico",         "Numérico"),
    ("pa?s",             "país"),           ("Pa?s",             "País"),
    ("prim?ria",         "primária"),       ("Prim?ria",         "Primária"),
    ("prim?rio",         "primário"),       ("Prim?rio",         "Primário"),
    ("prim?rias",        "primárias"),
    ("presen?a",         "presença"),       ("Presen?a",         "Presença"),
    ("presen?as",        "presenças"),
    ("ret?m",            "retém"),          ("Ret?m",            "Retém"),
    ("reuni?o",          "reunião"),        ("Reuni?o",          "Reunião"),
    ("ru?do",            "ruído"),          ("Ru?do",            "Ruído"),
    ("respons?vel",      "responsável"),    ("Respons?vel",      "Responsável"),
    ("respons?veis",     "responsáveis"),   ("Respons?veis",     "Responsáveis"),
    ("execut?rias",      "executárias"),
    ("execut?ria",       "executária"),
    ("bin?rio",          "binário"),        ("Bin?rio",          "Binário"),
    ("compat?vel",       "compatível"),     ("Compat?vel",       "Compatível"),
    ("compat?veis",      "compatíveis"),
    ("atrav?s",          "através"),        ("Atrav?s",          "Através"),
    ("tradu??o",         "tradução"),       ("Tradu??o",         "Tradução"),
]

# ─── Main ─────────────────────────────────────────────────────────────────────

def run():
    changed = []

    # Pass 1: Ã-mojibake on seed.sql + all JSON lesson files
    targets = [ROOT / "seed.sql"] + list(ROOT.rglob("*.json"))
    for path in targets:
        try:
            txt = path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"  [skip] {path.name}: {e}")
            continue
        fixed = fix_moji(txt)
        if fixed != txt:
            path.write_text(fixed, encoding="utf-8")
            changed.append(f"[moji] {path.relative_to(ROOT)}")

    # Pass 2: ?-replacement on master challenge only
    if MASTER.exists():
        txt = MASTER.read_text(encoding="utf-8")
        original = txt
        for bad, good in WORD_FIXES:
            txt = txt.replace(bad, good)
        if txt != original:
            MASTER.write_text(txt, encoding="utf-8")
            changed.append(f"[word] {MASTER.relative_to(ROOT)}")
    else:
        print(f"  [warn] master challenge JSON not found at {MASTER}")

    if changed:
        print("\nFiles modified:")
        for c in changed:
            print(f"  {c}")
    else:
        print("\nNo files needed changes.")

    # Validate master challenge JSON is still valid
    import json
    try:
        with open(MASTER, encoding="utf-8") as f:
            json.load(f)
        print(f"\n[ok] {MASTER.name} is valid JSON after fixes.")
    except Exception as e:
        print(f"\n[ERROR] JSON parse failed: {e}")
        raise


if __name__ == "__main__":
    run()
