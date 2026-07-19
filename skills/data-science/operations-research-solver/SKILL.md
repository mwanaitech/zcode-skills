---
name: operations-research-solver
description: "Solve operations research / linear programming problems (transportation, assignment, product mix, etc.) using PuLP/CBC in Python and produce professional reports. Covers model formulation, PuLP solver setup on PEP 668 systems, result interpretation, and scenario analysis."
category: data-science
---
# Operations Research Solver

Solve linear programming and transportation problems using Python (PuLP + CBC solver) and generate professional reports.

## Trigger

Use when the user asks to:
- Solve a transportation / distribution / logistics problem
- Formulate and solve a linear program
- Optimize a supply chain or allocation problem
- Model constraints and an objective function
- "TP Programmation Linéaire" / OR assignment

## Workflow

### 1. Problem Analysis — Extract Data

Read the problem statement carefully and extract these data structures:

**Transportation problems:**
- **Sources (offre/supply):** list of origins with capacities
- **Destinations (demande/demand):** list of destinations with quantities required
- **Cost matrix:** unit transport costs from each source to each destination
- **Special constraints:** route limits, budget caps, exclusivity rules
- **Scenarios:** parameter variations to test

### ⚠️ DATA INTEGRITY PITFALL — Context Compaction

When picking up from a context compaction or session summary, **always re-read the source document** (original problem statement). Context summaries frequently contain wrong numbers — costs, capacities, or demands can differ from the original. Verify every data point against the original source before solving.

### 2. Model Formulation

Define the mathematical model:

- **Indices:** i = sources, j = destinations
- **Decision variables:** X_ij = quantity from source i to destination j
- **Objective:** Minimize Σ c_ij · X_ij (total transport cost)
- **Constraints:**
  - Supply: Σ_j X_ij ≤ capacity_i (row sums bounded)
  - Demand: Σ_i X_ij = demand_j (column sums fixed)
  - Integer: X_ij ∈ ℤ⁺ (if units are indivisible)
  - Special: X_pq ≤ limit (route/budget constraints)

### 3. Python Implementation with PuLP

```python
import pulp

prob = pulp.LpProblem("Transport", pulp.LpMinimize)

# Variables: indexed by (source, dest), integer, non-negative
x = {(i, j): pulp.LpVariable(f"x_{i}_{j}", lowBound=0, cat=pulp.LpInteger)
     for i in sources for j in destinations}

# Objective
prob += pulp.lpSum(cost[i][j] * x[i, j] for i in sources for j in destinations)

# Supply constraints
for i in sources:
    prob += pulp.lpSum(x[i, j] for j in destinations) <= supply[i]

# Demand constraints
for j in destinations:
    prob += pulp.lpSum(x[i, j] for i in sources) == demand[j]

# Special constraints (example: route limit)
prob += x["Lam", "Oyem"] <= 150

# Solve
prob.solve(pulp.PULP_CBC_CMD(msg=True))
print(f"Status: {pulp.LpStatus[prob.status]}")
print(f"Z* = {pulp.value(prob.objective)} FCFA")
```

### 4. Package Installation (PEP 668 Systems)

On systems where pip refuses `--system` install:
```bash
# Create virtual environment and install
uv venv
uv pip install pulp

# Or use pipx for execution
pipx run --spec pulp python3 solve.py

# Check available solvers
pipx run --spec pulp python3 -c "import pulp; print(pulp.listSolvers(onlyAvailable=True))"
```

### 5. Scenario Analysis

After solving the base scenario, test variations:
- **Relax special constraints** — quantify the cost of each constraint (shadow price)
- **Change capacities** — simulate maintenance, expansion, or disruptions
- **Change demand** — simulate market growth or decline
- **Change costs** — simulate fuel price hikes, new routes
- **Combined scenarios** — test multiple changes simultaneously

For each scenario, compare:
- Feasibility (is the problem solvable?)
- Cost change (Δ Z)
- Structural shift (which arcs changed?)

### 6. Report Generation

Generate a professional Word document with:

1. **Cover page** — institution, course, title, date
2. **Data extraction** — supply/demand tables, cost matrix, constraint list
3. **Mathematical model** — variables, objective, constraints with clear notation
4. **Base solution** — flow table, cost verification, constraint satisfaction
5. **Scenario analysis** — per-scenario tables, comparison table
6. **Recommendations** — decision support based on results

Use `python-docx` for DOCX generation (see `document-generator` skill for formatting patterns).

## Pitfalls

- **Wrong source data:** Always verify numbers against the original problem document, even after context compaction. Session summaries routinely contain transcription errors.
- **Integer vs continuous:** Transportation problems with whole units (caisses, pallets) need `cat=pulp.LpInteger`; without it, fractional solutions may be invalid.
- **Infeasibility:** When a scenario is infeasible, first test without constraints (budget, special routes) to identify which constraint binds. The difference reveals the constraint's implicit cost.
- **PDF generation on the fly:** Use python-docx directly (not MCP office-word) for large documents — it's faster and supports fine-grained table control. Save the .docx, then optionally convert to PDF.
- **PEP 668:** Never `pip install --break-system-packages`; always use `uv venv && uv pip install` or `pipx run`.