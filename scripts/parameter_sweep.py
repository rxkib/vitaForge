# scripts/parameter_sweep_grid.py

import sys, subprocess

populations = [50, 70, 100]
generations = [200, 300, 500]

for pop in populations:
    for gen in generations:
        out = f"scripts/results_pop{pop}_gen{gen}.json"
        subprocess.check_call([
            sys.executable, "scripts/full_evaluation.py",
            "--population",  str(pop),
            "--generations", str(gen),
            "--output",      out
        ])
print("Grid sweep complete.")
