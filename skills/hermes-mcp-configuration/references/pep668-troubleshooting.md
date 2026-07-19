# PEP 668 Troubleshooting

## Error: `externally-managed-environment`
**Cause**: PEP 668 blocks `pip install` (even `--user`) on Debian/Ubuntu/Linux Mint.

**Example Error**:
```
error: externally-managed-environment
× This environment is externally managed
╰─> To install Python packages system-wide, try apt install python3-xyz...
```

**Solutions**:
1. **Use `pipx`** (recommended):
   ```bash
   pipx install <package>
   ```
   - Creates an isolated venv and symlinks the binary to `~/.local/bin/`.
   - Hermes includes `~/.local/bin` in PATH by default.

2. **Use `uv venv`** (alternative):
   ```bash
   uv venv --python 3.12
   source .venv/bin/activate
   uv pip install -r requirements.txt
   ```

**Do NOT use**:
- `pip install --user` (blocked).
- `uv pip install --system` (blocked).
- `--break-system-packages` (risks breaking system Python).

---

## Error: Timeout During Large Downloads (e.g., `torch`)
**Cause**: Large packages (e.g., `torch` >500MB) may timeout during download.

**Example Error**:
```
[Command timed out after 180s]
```

**Solutions**:
1. **Install CPU-only versions** (smaller):
   ```bash
   uv pip install torch --index-url https://download.pytorch.org/whl/cpu
   ```
   - Size: ~180MB (vs 500+MB for CUDA).

2. **Install dependencies one by one**:
   ```bash
   uv pip install numpy && uv pip install transformers
   ```

3. **Use a mirror or local cache**:
   ```bash
   uv pip install --index-url https://mirror.example.com/simple torch
   ```

---

## Error: `ModuleNotFoundError` After Installation
**Cause**: The package was installed but the Python environment is not activated.

**Example Error**:
```
ModuleNotFoundError: No module named 'transformers'
```

**Solutions**:
1. **Activate the virtual environment**:
   ```bash
   source .venv/bin/activate  # For uv venv
   ```

2. **Use the full path to the Python binary**:
   ```bash
   ~/.hermes/orchestration/trinity/.venv/bin/python -c "import transformers"
   ```

---

## Error: Private/Hugging Face Models (401/404)
**Cause**: Models like `qwen2.5-0.5b-instruct` may be private or gated.

**Example Error**:
```
Repository Not Found for url: https://huggingface.co/qwen2.5-0.5b-instruct/resolve/main/config.json.
```

**Solutions**:
1. **Use a public alternative** (e.g., `distilbert-base-uncased`):
   ```python
   from transformers import AutoModel
   model = AutoModel.from_pretrained('distilbert-base-uncased')
   ```

2. **Authenticate with Hugging Face**:
   ```bash
   hf auth login
   ```

3. **Use a local model** (if available):
   ```python
   model = AutoModel.from_pretrained('/path/to/local/model')
   ```

---

## Error: `torch` Not Found for Transformers
**Cause**: `transformers` requires `torch`, but it may not be installed.

**Example Error**:
```
ImportError: AutoModel requires the PyTorch library but it was not found in your environment.
```

**Solutions**:
1. **Install `torch` first**:
   ```bash
   uv pip install torch --index-url https://download.pytorch.org/whl/cpu
   ```

2. **Use `transformers` without `torch`** (tokenizer-only mode):
   ```python
   from transformers import AutoTokenizer
   tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')
   ```