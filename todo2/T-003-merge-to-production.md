# T-003: Promover branch import/arcanum-initial para produção (merge em `main`)

🎯 Objective: Mover o estado atual do projeto (branch `import/arcanum-initial`, commit 6c79d54) para produção no GitHub, fazendo merge para o branch `main` de forma segura e auditável.

📋 Acceptance Criteria:
- Existe um Pull Request aberto de `import/arcanum-initial` → `main` contendo descrição e checklist.
- O merge é realizado (fast-forward ou merge commit) sem incluir arquivos sensíveis (.env).
- O estado `main` no remoto contém os arquivos essenciais (migrations em `supabase/migrations/`, `@fazendo/db_schema_design.md`, etc.).
- Registro da operação (commit hashes antes/depois) salvo neste todo como evidência.

🚫 Scope Boundaries:
- Included: criar PR e fazer merge para `main` (ou instruir o usuário a fazê-lo). Atualizar remoto `main`.
- Excluded: deployment em servidores/infra; ajustes de CI/CD pós-merge (só farei se solicitado explicitamente).

🔧 Technical Requirements / Options (choose one):
- Option A (Automático - Requer token): eu crio o PR e realizo o merge automaticamente usando GitHub API / `gh` com token com escopo `repo`.
- Option B (Manual assistido): eu gero o PR title/body e retorno o link pronto para você abrir/revisar no browser e clicar "Create pull request" + "Merge".
- Option C (Comandos para você): eu gero os comandos git/gh exatos para você executar localmente para criar e mesclar o PR.

📁 Files/Components a verificar:
- `supabase/migrations/*.sql`
- `@fazendo/db_schema_design.md`
- `package.json` / `husky` (pre-commit hooks)

🧪 Testing Requirements:
- Verificar `git log -3 --oneline` antes e depois do merge.
- Verificar que `.env` não está no repositório (`git ls-files | grep .env` deve retornar vazio).

⚠️ Risks & Mitigations:
- Divergência entre `main` remoto e branch local: mitigação -> criar PR, revisar e resolver conflitos manualmente.
- CI/pre-commit hooks: use PR e deixe CI rodar; evite `--no-verify` para commits que alteram código crítico.

---

Planned Steps (after you choose Option A/B/C):
1. Prepare PR body + checklist.
2A. (A) Use token to call GitHub API / gh to create PR and merge.
2B. (B) Output PR link: https://github.com/Pguillen87/arcanum-ai/compare/main...import/arcanum-initial?expand=1 (you open and click Create pull request)
2C. (C) Provide `git`/`gh` commands for you to run locally.
3. Record commit hashes before/after and close this todo.

---

Result notes: aguardo sua escolha entre A, B ou C. Se A, forneça token (ou autorize `gh`); se B ou C, eu procedo imediatamente a gerar o conteúdo correspondente.
