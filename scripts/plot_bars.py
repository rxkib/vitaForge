#!/usr/bin/env python
import glob, json
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.ticker import LogLocator, NullFormatter

# 1) Gather data
records = []
for path in glob.glob("scripts/results_pop*_gen*.json"):
    with open(path) as f:
        s = json.load(f)["summary"]
    label = f"{s['population']}×{s['generations']}"
    records.append({
        "config":    label,
        "min_score": s["min_score"],
        "avg_score": s["avg_score"],
        "max_score": s["max_score"],
        "min_time":  s["min_time"],
        "avg_time":  s["avg_time"],
        "max_time":  s["max_time"],
        "std_time":  s["std_time"],
        "std_score": s["std_score"],
    })

df = pd.DataFrame(records).set_index("config")

# Styling
def style_axes(ax, title, xlabel, ylabel):
    ax.set_title(title, fontsize=14)
    ax.set_xlabel(xlabel, fontsize=10, labelpad=15)
    ax.set_ylabel(ylabel, fontsize=12)
    ax.tick_params(axis='x', rotation=45, labelsize=10)
    ax.tick_params(axis='y', labelsize=10)
    plt.tight_layout()

BOTTOM = 0.25  # lots of room for the x‑label

# 2) Score Summary (0–1)
fig, ax = plt.subplots(figsize=(8,5))
df[["min_score","avg_score","max_score"]].plot(kind="bar", ax=ax)
ax.set_ylim(0,1)
style_axes(
    ax,
    "Score Summary by Configuration",
    "Configuration (Population × Generations)",
    "Score (0–1)"
)
fig.subplots_adjust(bottom=BOTTOM)
fig.savefig("scripts/score_summary.png")
plt.clf()

# 3) Time Summary (log scale)
fig, ax = plt.subplots(figsize=(8,5))
df[["min_time","avg_time","max_time"]].plot(kind="bar", ax=ax, log=True)
style_axes(
    ax,
    "Time Summary by Configuration (log scale)",
    "Configuration (Population × Generations)",
    "Time (s, log scale)"
)
fig.subplots_adjust(bottom=BOTTOM)
fig.savefig("scripts/time_summary_log.png")
plt.clf()

# 4) Std Dev of Score (linear)
fig, ax = plt.subplots(figsize=(8,5))
df[["std_score"]].plot(kind="bar", ax=ax)
style_axes(
    ax,
    "Standard Deviation of Score",
    "Configuration (Population × Generations)",
    "Std Dev (score)"
)
fig.subplots_adjust(bottom=BOTTOM)
fig.savefig("scripts/std_score.png")
plt.clf()

# 5) Std Dev of Time (log scale) — show all levels
fig, ax = plt.subplots(figsize=(8,5))
df[["std_time"]].plot(kind="bar", ax=ax, log=True)
style_axes(
    ax,
    "Standard Deviation of Generation Time (log scale)",
    "Configuration (Population × Generations)",
    "Std Dev (s, log scale)"
)
# Show decades (10^0,10^1,...) and intermediate ticks (2×10^n...9×10^n)
ax.yaxis.set_major_locator(LogLocator(base=10, numticks=10))
ax.yaxis.set_minor_locator(LogLocator(base=10, subs=range(1,10), numticks=10))
ax.yaxis.set_minor_formatter(NullFormatter())
ax.grid(which='major', linestyle='-', alpha=0.8)
ax.grid(which='minor', linestyle=':', alpha=0.5)

fig.subplots_adjust(bottom=BOTTOM)
fig.savefig("scripts/std_time.png")
plt.clf()

print("Saved charts.")
