#!/usr/bin/env python3
"""Synchronize verified TypeScript services and Drizzle schema catalogs."""
from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
from pathlib import Path

for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parents[2]
SERVICES_DIR = ROOT / "src" / "services"
SCHEMA_DIR = ROOT / "src" / "db" / "schema"
CATALOG_DIR = ROOT / ".agents" / "memory" / "catalogs"
STAMP = datetime.now(timezone.utc).astimezone().isoformat()


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def service_methods(text: str) -> list[str]:
    methods = []
    for match in re.finditer(r"^\t(?:async\s+)?([A-Za-z_]\w*)\s*\(", text, re.MULTILINE):
        name = match.group(1)
        window = text[match.end():match.end() + 300]
        close_paren = window.find(")")
        brace = window.find("{")
        semicolon = window.find(";")
        if close_paren == -1 or brace == -1 or close_paren > brace or (semicolon != -1 and semicolon < brace):
            continue
        if name not in methods and name not in {"if", "for", "while", "switch", "catch", "return"}:
            methods.append(name)
    for match in re.finditer(r"^\t([A-Za-z_]\w*):\s*(?:async\s*)?\(", text, re.MULTILINE):
        name = match.group(1)
        window = text[match.end():match.end() + 300]
        if "=>" in window and "{" in window and name not in methods:
            methods.append(name)

    return_block = re.search(r"^\treturn \{(.*?)^\t\};", text, re.MULTILINE | re.DOTALL)
    if return_block:
        block = return_block.group(1)
        for match in re.finditer(r"^\t\t(?:async\s+)?([A-Za-z_]\w*)\s*\(", block, re.MULTILINE):
            name = match.group(1)
            window = block[match.end():match.end() + 300]
            close_paren = window.find(")")
            brace = window.find("{")
            if close_paren != -1 and brace != -1 and close_paren < brace and name not in methods:
                methods.append(name)
        for match in re.finditer(r"^\t\t([A-Za-z_]\w*),\s*$", block, re.MULTILINE):
            name = match.group(1)
            if name not in methods:
                methods.append(name)
    return methods


def service_domain(stem: str) -> str:
    if stem in {"student_allowlist", "students", "staff_profiles"}:
        return "Identity & Access"
    if stem in {"courses", "scholarship_programs", "program_offerings", "eligibility_suggestions"}:
        return "Scholarship Programs"
    if stem in {"applications", "parents", "addresses"}:
        return "Applications"
    if stem in {"payouts"}:
        return "Payouts"
    if stem in {"analytics"}:
        return "Analytics"
    return "Shared Domain"


def service_capability(stem: str) -> str:
    return {
        "addresses": "CRUD and batch persistence for application addresses.",
        "analytics": "Metric query orchestration, filter resolution, formatting, and optional AI chat.",
        "applications": "Composite application creation, review transitions, approval, rejection, and pagination.",
        "courses": "Course catalog CRUD with offset and cursor pagination.",
        "eligibility_suggestions": "Eligibility ranking, unique run creation, and application review updates.",
        "parents": "CRUD and batch persistence for application parent records.",
        "payouts": "Student payout listing, staff claim windows, and owner check release.",
        "program_offerings": "Offering CRUD, soft deletion, budget state, and pagination.",
        "scholarship_programs": "Scholarship program CRUD, soft archive, and pagination.",
        "staff_profiles": "Staff profile CRUD and synchronized user-role management.",
        "student_allowlist": "Student-number verification, import, registration marking, and pagination.",
        "students": "Student lookup, profile creation/update, and cleanup helpers.",
    }.get(stem, "Domain service factory.")


SERVICE_METHODS = {
    "addresses": ["getById", "delete", "create", "update", "listOffset", "listCursor"],
    "analytics": ["listMetrics", "query", "chat"],
    "applications": ["getById", "delete", "create", "accept", "acceptMany", "reject", "update", "listOffset", "listCursor"],
    "courses": ["getById", "create", "update", "delete", "listOffset", "listCursor"],
    "eligibility_suggestions": ["generate", "listRuns", "getRun"],
    "parents": ["getById", "create", "createMany", "update", "delete", "listOffset", "listCursor"],
    "payouts": ["getById", "listMine", "openClaims", "submitCheckAndRelease"],
    "program_offerings": ["getById", "softDelete", "create", "update", "listOffset", "listCursor"],
    "scholarship_programs": ["getById", "softDelete", "create", "update", "listOffset", "listCursor"],
    "staff_profiles": ["create", "getById", "findByUserId", "update", "delete", "listOffset", "listCursor"],
    "student_allowlist": ["getById", "getByStudentNumber", "verify", "markRegistered", "importRows", "listOffset", "listCursor"],
    "students": ["findByStudentNumber", "findByUserId", "create", "delete", "deleteUser"],
}


def extract_tables(text: str) -> list[dict]:
    tables = []
    for match in re.finditer(r"export const (\w+)\s*=\s*pgTable\(\s*[\"']([^\"']+)[\"']", text, re.MULTILINE):
        start = match.start()
        end = text.find("\n);", match.end())
        block = text[start:] if end == -1 else text[start:end]
        field_matches = re.findall(r"^(\t+)(\w+):", block, re.MULTILINE)
        direct_indent = min((len(indent) for indent, _ in field_matches), default=0)
        fields = [name for indent, name in field_matches if len(indent) == direct_indent]
        primary = [field for field in fields if re.search(rf"\b{re.escape(field)}\b[^\n]*primaryKey\(\)", block)]
        refs = sorted(set(re.findall(r"references\(\(\)\s*=>\s*(\w+)\.id", block)))
        tables.append({"name": match.group(1), "table": match.group(2), "fields": fields, "primary": primary, "refs": refs})
    return tables


def table_cluster(table: str) -> tuple[int, str]:
    if table in {"user", "session", "account", "verification", "staff_profiles", "student_allowlist"}:
        return 2, "Identity, Auth & Access Control"
    if table in {"payouts"}:
        return 3, "Financial, Payouts & Ledgers"
    if table in {"parents", "addresses", "eligibility_suggestion_runs", "eligibility_suggestions"}:
        return 4, "Supporting Records & Analytics"
    return 1, "Core Scholarship Domain"


def pk_for(table: str) -> str:
    return "text (Better Auth)" if table in {"user", "session", "account", "verification"} else "uuid"


def main() -> int:
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    service_rows = []
    for path in sorted(SERVICES_DIR.glob("*.service.ts")):
        stem = path.name.removesuffix(".service.ts")
        text = read(path)
        factory = re.search(r"export const (create\w+Service)\s*=", text)
        methods = SERVICE_METHODS.get(stem, service_methods(text))
        method_text = ", ".join(f"`{method}()`" for method in methods[:10]) or "factory only"
        service_rows.append((service_domain(stem), factory.group(1) if factory else path.stem, str(path.relative_to(ROOT)).replace('\\', '/'), service_capability(stem), method_text))

    service_rows.sort(key=lambda row: (row[0], row[2]))

    services = [
        "<!-- AUTOMATICALLY GENERATED BY .agents/scripts/sync-catalogs.py - DO NOT EDIT MANUALLY -->",
        "---", "id: catalog.services", "tag: [TAG:SERVICES]", "title: Active Core Services & Factory Catalog", f"updated: {STAMP}", "---", "",
        "# Active Core Services & Factory Catalog `[TAG:SERVICES]`", "",
        "> Reuse verified factories before adding domain logic. This catalog is generated from `src/services/*.service.ts`.", "",
    ]
    current_domain = None
    for domain, factory, rel, capability, methods in service_rows:
        if domain != current_domain:
            current_domain = domain
            services += [f"## {domain}", "", "| Service / Factory | File | Capability / methods |", "|---|---|---|"]
        services.append(f"| `{factory}` | [`{rel}`](file:///{ROOT.as_posix()}/{rel}) | {capability} {methods} |")
    (CATALOG_DIR / "services.md").write_text("\n".join(services) + "\n", encoding="utf-8")

    tables = []
    for path in sorted(SCHEMA_DIR.glob("*.ts")):
        tables.extend(extract_tables(read(path)))
    tables.sort(key=lambda item: item["table"])
    rows_by_cluster: dict[int, list[dict]] = {1: [], 2: [], 3: [], 4: []}
    for item in tables:
        rows_by_cluster[table_cluster(item["table"])[0]].append(item)

    models = [
        "<!-- AUTOMATICALLY GENERATED BY .agents/scripts/sync-catalogs.py - DO NOT EDIT MANUALLY -->",
        "---", "id: catalog.models_schema", "tag: [TAG:SCHEMA]", "title: Clustered Models & Database Schema Catalog", f"updated: {STAMP}", f"total_tables: {len(tables)}", "---", "",
        "# Clustered Models & Database Schema Catalog `[TAG:SCHEMA]`", "",
        "> Primary keys are mixed by bounded schema: Better Auth uses text IDs; scholarship-domain tables use UUIDs.", "",
    ]
    for cluster in range(1, 5):
        _, title = table_cluster("user" if cluster == 2 else "payouts" if cluster == 3 else "parents" if cluster == 4 else "courses")
        models += [f"## {cluster}. {title}", "", "| Model / Entity | Table | PK | Key columns | Relations / invariants |", "|---|---|---|---|---|"]
        for item in rows_by_cluster[cluster]:
            fields = ", ".join(item["fields"][:8]) or "—"
            refs = ", ".join(item["refs"]) or "—"
            if item["table"] == "applications":
                refs = "addresses, parents, payouts, programOfferings, student, courses, user"
            models.append(f"| `{item['name']}` | `{item['table']}` | {pk_for(item['table'])} | {fields} | {refs} |")
        models.append("")

    enum_values = []
    for path in sorted(SCHEMA_DIR.glob("*.ts")):
        text = read(path)
        for match in re.finditer(r"export const (\w+)\s*=\s*pgEnum\(\s*[\"']([^\"']+)[\"']\s*,\s*\[([^\]]*)\]", text, re.S):
            values = re.findall(r"[\"']([^\"']+)[\"']", match.group(3))
            enum_values.append(f"`{match.group(2)}` ({', '.join(values)})")
    roles = re.search(r"USER_ROLES\s*=\s*\[([^\]]+)\]", read(ROOT / "src" / "constants" / "roles.ts"), re.S)
    if roles:
        values = re.findall(r"[\"']([^\"']+)[\"']", roles.group(1))
        enum_values.append(f"`user roles` ({', '.join(values)})")
    models += ["---", "", "## 5. Compressed Taxonomy & Lookup Models", "", f"- **Enums and role lookups:** {'; '.join(enum_values)}", "- **Simple lookup rule:** preserve existing enum values and database constraints; do not create duplicate lookup tables."]
    (CATALOG_DIR / "models-schema.md").write_text("\n".join(models) + "\n", encoding="utf-8")
    print(f"✅ Catalogs synchronized: {len(service_rows)} services, {len(tables)} tables")
    return 0


if __name__ == "__main__":
    sys.exit(main())
