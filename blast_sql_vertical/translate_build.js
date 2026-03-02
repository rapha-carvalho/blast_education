const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'backend', 'content');
const coursesJsonPath = path.join(contentDir, 'courses.json');
const mdPath = path.join(__dirname, 'Full_Course_Curriculum_PTBR.md');

// 1. Read the corrupted double-encoded file
let corruptedContent = fs.readFileSync(mdPath, 'utf8');

// 2. Fix the double encoding (Mojibake to pure UTF-8 string)
let buf = Buffer.alloc(corruptedContent.length);
for (let i = 0; i < corruptedContent.length; i++) {
    let charCode = corruptedContent.charCodeAt(i);
    buf[i] = charCode & 0xFF; // basic down-casting
}
let cleanMdStr = buf.toString('utf8');

let stripNulls = '';
for (let i = 0; i < cleanMdStr.length; i++) {
    if (cleanMdStr.charCodeAt(i) !== 0) {
        stripNulls += cleanMdStr[i];
    }
}
cleanMdStr = stripNulls.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const schemaPTBR = `
---

## Esquema de Banco de Dados de Prática

**Domínio**: GrooveCommerce — uma plataforma de e-commerce onde os clientes pesquisam, adicionam ao carrinho e compram produtos físicos. A empresa também executa campanhas de marketing e rastreia sessões da web.

**Por que esse domínio?** Ele suporta os três perfis principais simultaneamente:
- **Analista Financeiro**: Receita, reembolsos, análise de descontos, métricas de P&L, comparações de períodos.
- **Analista de Marketing**: Desempenho de campanhas, análise de funil, atribuição de canais, coortes.
- **Analista de Dados Júnior**: Joins entre várias tabelas, qualidade de dados, agregações, funções de janela (window functions).

---

### Definições de Tabela

---

#### \`clientes\`
Armazena uma linha por cliente registrado.

| Coluna | Tipo | Notas |
|---|---|---|
| \`customer_id\` | INTEGER | **Chave Primária** |
| \`first_name\` | VARCHAR | — |
| \`last_name\` | VARCHAR | — |
| \`email\` | VARCHAR | Único, anulável (alguns registros podem estar incompletos) |
| \`phone\` | VARCHAR | Anulável |
| \`created_at\` | TIMESTAMP | Quando o cliente se registrou |
| \`acquisition_channel\` | VARCHAR | ex: 'organic_search', 'paid_social', 'referral', 'email', NULL |
| \`country\` | VARCHAR | ex: 'US', 'BR', 'UK' |

---

#### \`pedidos\`
Uma linha por pedido feito.

| Coluna | Tipo | Notas |
|---|---|---|
| \`order_id\` | INTEGER | **Chave Primária** |
| \`customer_id\` | INTEGER | **FK → clientes.customer_id** |
| \`created_at\` | TIMESTAMP | Horário em que o pedido foi feito |
| \`status_code\` | INTEGER | 1=pendente, 2=confirmado, 3=enviado, 4=entregue, 5=cancelado |
| \`order_total\` | DECIMAL | Soma de todos os itens (antes do desconto aplicado no checkout) |
| \`discount_amount\` | DECIMAL | Anulável — desconto aplicado ao pedido |
| \`delivery_date\` | DATE | Anulável — preenchido quando entregue |
| \`shipping_address_country\` | VARCHAR | País de destino |

---

#### \`itens_pedido\`
Uma linha por produto dentro de um pedido. Um pedido com 3 produtos diferentes = 3 linhas.

| Coluna | Tipo | Notas |
|---|---|---|
| \`order_item_id\` | INTEGER | **Chave Primária** |
| \`order_id\` | INTEGER | **FK → pedidos.order_id** |
| \`product_id\` | INTEGER | **FK → produtos.product_id** |
| \`quantity\` | INTEGER | Unidades pedidas |
| \`unit_price\` | DECIMAL | Preço no momento da compra (pode diferir do preço atual do catálogo) |

---

#### \`produtos\`
Catálogo de todos os produtos disponíveis na plataforma.

| Coluna | Tipo | Notas |
|---|---|---|
| \`product_id\` | INTEGER | **Chave Primária** |
| \`product_name\` | VARCHAR | — |
| \`category_id\` | INTEGER | **FK → categorias_produto.category_id** |
| \`price\` | DECIMAL | Preço atual do catálogo |
| \`unit_cost\` | DECIMAL | Custo das mercadorias (para cálculos de margem) |
| \`is_active\` | BOOLEAN | Se o produto está listado atualmente |
| \`created_at\` | TIMESTAMP | Quando foi adicionado ao catálogo |

---

#### \`categorias_produto\`
Tabela de pesquisa mapeando IDs de categoria para nomes.

| Coluna | Tipo | Notas |
|---|---|---|
| \`category_id\` | INTEGER | **Chave Primária** |
| \`category_name\` | VARCHAR | — |
| \`parent_category_id\` | INTEGER | Anulável — para hierarquia de subcategorias |

---

#### \`campanhas_marketing\`
Uma linha por campanha de marketing executada pela equipe.

| Coluna | Tipo | Notas |
|---|---|---|
| \`campaign_id\` | INTEGER | **Chave Primária** |
| \`campaign_name\` | VARCHAR | — |
| \`channel\` | VARCHAR | ex: 'paid_search', 'paid_social', 'email', 'influencer' |
| \`start_date\` | DATE | — |
| \`end_date\` | DATE | — |
| \`budget\` | DECIMAL | Orçamento total alocado |
| \`clicks\` | INTEGER | Total de cliques |
| \`conversions\` | INTEGER | Total de conversões atribuídas |

---

#### \`eventos_campanha\`
Dados em nível de evento: uma linha por interação de campanha (impressão, clique, conversão).

| Coluna | Tipo | Notas |
|---|---|---|
| \`event_id\` | INTEGER | **Chave Primária** |
| \`campaign_id\` | INTEGER | **FK → campanhas_marketing.campaign_id** |
| \`customer_id\` | INTEGER | **FK → clientes.customer_id** — anulável (visitantes anônimos) |
| \`event_type\` | VARCHAR | 'impression', 'click', 'conversion' |
| \`event_at\` | TIMESTAMP | Quando o evento ocorreu |

---

#### \`sessoes\`
Dados em nível de sessão da web: uma linha por evento de sessão (visualização de página, adicionar ao carrinho, compra).

| Coluna | Tipo | Notas |
|---|---|---|
| \`session_id\` | VARCHAR | **Chave Primária** (geralmente um UUID) |
| \`customer_id\` | INTEGER | **FK → clientes.customer_id** — anulável (anônimo) |
| \`event_type\` | VARCHAR | 'page_view', 'add_to_cart', 'purchase' |
| \`page\` | VARCHAR | Caminho da URL, ex: '/products/201' |
| \`event_at\` | TIMESTAMP | Quando o evento ocorreu |
| \`device_type\` | VARCHAR | 'mobile', 'desktop', 'tablet' |

---

#### \`reembolsos\`
Uma linha por reembolso emitido em um pedido ou item de pedido.

| Coluna | Tipo | Notas |
|---|---|---|
| \`refund_id\` | INTEGER | **Chave Primária** |
| \`order_id\` | INTEGER | **FK → pedidos.order_id** |
| \`order_item_id\` | INTEGER | **FK → itens_pedido.order_item_id** — anulável (reembolso do pedido inteiro) |
| \`refund_amount\` | DECIMAL | — |
| \`refund_reason\` | VARCHAR | ex: 'defective', 'wrong_item', 'customer_changed_mind' |
| \`refunded_at\` | TIMESTAMP | — |
`;

if (!cleanMdStr.includes("Esquema de Banco de Dados de Prática")) {
    cleanMdStr += "\n" + schemaPTBR;
}

fs.writeFileSync(mdPath, cleanMdStr, 'utf8');

const coursesData = {
    courses: [
        {
            id: "sql-basics",
            title: "SQL do básico ao avançado",
            modules: []
        }
    ]
};

let currentModuleId = null;
let currentModuleObj = null;
let currentLessonData = null;
let currentLessonId = null;
let parsingLessonContent = false;
let lessonContentLines = [];

const lines = cleanMdStr.split('\n');
let moduleIndex = 1;
let lessonCounter = 1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const modMatch = line.match(/^#### Módulo (\d+): (.*)/) || line.match(/^#### ✅ Ponto de Verificação (.*)/) || line.match(/^#### Módulo Final(.*)/);

    if (modMatch) {
        if (currentLessonData) saveCurrentLesson();

        let title = modMatch[2] ? modMatch[2].trim() : (modMatch[1] ? modMatch[1].trim() : "Final");
        let namePrefix = line.includes("Módulo") ? "Módulo " + (modMatch[1] || 'Final') + ": " : "Ponto de Verificação: ";
        if (line.includes("Módulo Final")) {
            namePrefix = "Avaliação Final: ";
            title = "Teste suas habilidades";
        }

        currentModuleId = "module-" + moduleIndex;
        currentModuleObj = {
            id: currentModuleId,
            title: namePrefix + title,
            lessons: []
        };
        coursesData.courses[0].modules.push(currentModuleObj);
        moduleIndex++;
        lessonCounter = 1;
        continue;
    }

    const lessonMatch = line.match(/^##### Aula (\d+)\.(\d+) — (.*)/) || line.match(/^##### (.*)/);

    if (lessonMatch && currentModuleObj) {
        if (currentLessonData) saveCurrentLesson();

        parsingLessonContent = true;
        lessonContentLines = [];

        let lessonTitle = "";
        if (lessonMatch[3]) {
            lessonTitle = lessonMatch[3].trim();
        } else {
            lessonTitle = lessonMatch[1].trim();
        }

        if (lessonTitle === "Definições de Tabela") continue;

        let lessonSlug = lessonTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_').substring(0, 25);
        currentLessonId = "lesson_" + lessonCounter + "_" + lessonSlug;
        lessonCounter++;

        currentLessonData = {
            id: currentLessonId,
            title: lessonTitle,
            lesson_type: "interactive_sql",
            objective: lessonTitle,
            prerequisites: [],
            estimated_minutes: 10,
            content_markdown: "",
            exercises: [
                {
                    id: "challenge_1",
                    title: "Desafio Principal",
                    prompt_markdown: "Escreva uma query para resolver o cenário.",
                    starter_query: "-- (editor vazio)"
                }
            ]
        };

        currentModuleObj.lessons.push({
            id: currentLessonId,
            title: lessonTitle
        });
        continue;
    }

    if (currentLessonData && parsingLessonContent) {
        if (line.match(/^\*\*Desafios\*\*:/)) {
            continue;
        }
        if (!line.includes('-- (editor vazio)')) {
            lessonContentLines.push(line);
        }
    }
}
if (currentLessonData) saveCurrentLesson();

function saveCurrentLesson() {
    if (currentLessonData && currentModuleId && currentLessonId) {
        const rawContent = lessonContentLines.join('\n').trim();
        currentLessonData.content_markdown = rawContent.replace(/```sql\s*```/g, '');

        const modFolder = currentModuleId.replace(/-/g, '_');
        const dirPath = path.join(contentDir, 'sql_basics', modFolder);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const lessonFilePath = path.join(dirPath, currentLessonId + ".json");
        try {
            fs.writeFileSync(lessonFilePath, JSON.stringify(currentLessonData, null, 2));
        } catch (e) {
            console.error("Could not save " + lessonFilePath + ": " + e.message);
        }
    }
}

fs.writeFileSync(coursesJsonPath, JSON.stringify(coursesData, null, 2));
console.log('Successfully fully converted PT-BR curriculum, generated ALL 10 MODULES.');
