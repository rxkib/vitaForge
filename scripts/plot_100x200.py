import json
import pandas as pd
import matplotlib.pyplot as plt
import os

# 1) Point this at your JSON results file
RESULTS_PATH = r"E:\vitaForge\scripts\results_pop100_gen200.json"

if not os.path.isfile(RESULTS_PATH):
    raise FileNotFoundError(f"Cannot find {RESULTS_PATH}")

# 2) Load the data
with open(RESULTS_PATH, "r") as f:
    payload = json.load(f)
# The JSON should have a "results" array of objects { gen_time_s, score, ... }
runs = payload.get("results", [])
if not runs:
    raise ValueError("No 'results' key found or it's empty.")

# 3) Build a DataFrame
df = pd.DataFrame(runs)

# 4) Make the scatterplot
plt.figure(figsize=(8,6))
plt.scatter(df["gen_time_s"], df["score"],
            alpha=0.6, s=25, edgecolors="k", linewidth=0.5)
plt.xlabel("Generation time (s)", fontsize=12)
plt.ylabel("Plan score",        fontsize=12)
plt.title("Pop=100, Gen=200 – time vs. score (100 runs)", fontsize=14)
plt.grid(True, linestyle="--", alpha=0.5)
plt.tight_layout()

# 5) Save to PNG
out_png = os.path.join(os.path.dirname(RESULTS_PATH), "scatter_100x200.png")
plt.savefig(out_png, dpi=150)
print(f"✅ Scatterplot saved to {out_png}")
