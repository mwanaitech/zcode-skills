# TRINITY Training Errors

## Error: `TypeError: CMAEvolutionStrategy.__init__() got an unexpected keyword argument 'popsize'`

### Context
- **Script**: `~/.hermes/orchestration/trinity/train.py`
- **Library**: `cma` (Covariance Matrix Adaptation Evolution Strategy)
- **Trigger**: Training phase initialization (`trainer.train()`)

### Error Transcript
```python
Traceback (most recent call last):
  File "/home/gibson/.hermes/orchestration/trinity/train.py", line 81, in <module>
    trainer.train()
  File "/home/gibson/.hermes/orchestration/trinity/train.py", line 41, in train
    es = CMA(
        self.head.weight.data.numpy().flatten(),
        sigma0=0.5,
        popsize=self.config["training"]["population_size"]  # Incorrect argument name
    )
TypeError: CMAEvolutionStrategy.__init__() got an unexpected keyword argument 'popsize'
```

### Root Cause
The `cma` library (v3.3.0+) expects `population_size`, not `popsize`. This is a breaking change from older versions or tutorials.

### Reproduction Steps
1. Install `cma` in a virtual environment:
   ```bash
   source .venv/bin/activate
   pip install cma
   ```
2. Run the training script:
   ```bash
   python train.py
   ```
3. Observe the `TypeError`.

### Solution
Patch the script to use `population_size`:

**Before**:
```python
es = CMA(
    self.head.weight.data.numpy().flatten(),
    sigma0=0.5,
    popsize=self.config["training"]["population_size"]
)
```

**After**:
```python
es = CMA(
    self.head.weight.data.numpy().flatten(),
    sigma0=0.5,
    population_size=self.config["training"]["population_size"]
)
```

### Verification
1. Apply the patch:
   ```bash
   patch -p1 < fix_cma.patch
   ```
2. Rerun the training script:
   ```bash
   python train.py
   ```
3. Confirm no `TypeError` and training proceeds.

### Additional Checks
- Ensure `config.yaml` contains:
  ```yaml
  training:
    population_size: 20  # Example value
  ```
- If the error persists, check the `cma` version:
  ```bash
  pip show cma
  ```
  - For versions **< 3.0.0**, `popsize` is valid.
  - For versions **≥ 3.0.0**, use `population_size`.

### Related Pitfalls
- **Accented Characters**: If the script contains French text (e.g., comments), use `read_file` to verify exact byte content before patching.
- **Background Process Errors**: If running in background, check logs with:
  ```bash
  hermes process log <session_id>
  ```