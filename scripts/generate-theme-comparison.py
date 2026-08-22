from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from matplotlib.colors import LinearSegmentedColormap

OUTPUT = Path("/home/ubuntu/alexos-source/docs/alexos-theme-token-comparison.png")

THEMES = [
    {
        "name": "OpsMind Command",
        "id": "opsmind",
        "start": "#07070b",
        "end": "#22113e",
        "accent": "#c855ff",
        "series": ["purple", "blue", "green", "amber", "coral"],
    },
    {
        "name": "DroneView Ember",
        "id": "droneview",
        "start": "#171312",
        "end": "#5b2b1b",
        "accent": "#ff8a4c",
        "series": ["amber", "coral", "blue", "green", "purple"],
    },
    {
        "name": "PulseAI Warm Light",
        "id": "pulseai",
        "start": "#fffaf2",
        "end": "#f8ded1",
        "accent": "#e9792c",
        "series": ["amber", "coral", "blue", "green", "purple"],
    },
    {
        "name": "PricePilot Lavender",
        "id": "pricepilot",
        "start": "#f4f2f8",
        "end": "#ffffff",
        "accent": "#8b5cf6",
        "series": ["purple", "blue", "green", "amber", "coral"],
    },
    {
        "name": "FinAI Neon Ledger",
        "id": "finai",
        "start": "#071126",
        "end": "#142461",
        "accent": "#44d9ff",
        "series": ["blue", "purple", "coral", "green", "amber"],
    },
]

ROLE_LABELS = ["primary", "secondary", "context", "warning", "alert"]
ROLE_TOKEN = {
    "purple": "--alexos-purple",
    "blue": "--alexos-blue",
    "green": "--alexos-green",
    "amber": "--alexos-amber",
    "coral": "--alexos-coral",
}
ROLE_COLOR = {
    "purple": "#a855f7",
    "blue": "#38bdf8",
    "green": "#34d399",
    "amber": "#f59e0b",
    "coral": "#fb7185",
}

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "axes.titleweight": "bold",
        "figure.facecolor": "#0b1020",
        "text.color": "#eef2ff",
        "axes.labelcolor": "#cbd5e1",
        "xtick.color": "#cbd5e1",
        "ytick.color": "#cbd5e1",
    }
)

fig = plt.figure(figsize=(16, 10), dpi=180, facecolor="#0b1020")
grid = fig.add_gridspec(
    nrows=3,
    ncols=1,
    height_ratios=[0.18, 0.58, 0.24],
    left=0.05,
    right=0.98,
    top=0.94,
    bottom=0.07,
    hspace=0.36,
)

header = fig.add_subplot(grid[0])
header.axis("off")
header.text(0, 0.85, "AlexOS theme response matrix", fontsize=24, weight="bold", color="#f8fafc")
header.text(
    0,
    0.42,
    "Declared chart-token roles and responsive implementation contract — not runtime performance scores",
    fontsize=11,
    color="#94a3b8",
)
header.text(
    0,
    0.08,
    "Source: src/components/theme/visual-themes.ts, src/styles.css, and the MoneyFlowChart responsive classes",
    fontsize=9,
    color="#64748b",
)

ax = fig.add_subplot(grid[1])
ax.set_facecolor("#111827")
ax.set_xlim(0, 8.85)
ax.set_ylim(-0.8, len(THEMES) - 0.25)
ax.set_xticks([])
ax.set_yticks(range(len(THEMES)))
ax.set_yticklabels([theme["name"] for theme in THEMES], fontsize=11, color="#e2e8f0")
ax.invert_yaxis()
for spine in ax.spines.values():
    spine.set_visible(False)

ax.text(0.0, -0.62, "Theme canvas", fontsize=10, weight="bold", color="#94a3b8")
for col, label in enumerate(ROLE_LABELS):
    ax.text(3.1 + col * 0.98, -0.62, f"Series {col + 1}\n{label}", ha="center", va="bottom", fontsize=9, color="#94a3b8")

for row, theme in enumerate(THEMES):
    gradient = LinearSegmentedColormap.from_list(f"{theme['id']}-gradient", [theme["start"], theme["end"]])
    for step in range(40):
        ax.add_patch(
            Rectangle(
                (0.0 + step * 0.06, row - 0.24),
                0.061,
                0.48,
                facecolor=gradient(step / 39),
                edgecolor="none",
                clip_on=False,
            )
        )
    ax.add_patch(Rectangle((2.43, row - 0.24), 0.09, 0.48, facecolor=theme["accent"], edgecolor="#f8fafc", linewidth=0.7))
    ax.text(2.58, row, theme["accent"], va="center", fontsize=8.2, color="#cbd5e1")
    for col, role in enumerate(theme["series"]):
        x = 3.1 + col * 0.98
        ax.add_patch(Rectangle((x - 0.43, row - 0.22), 0.86, 0.44, facecolor=ROLE_COLOR[role], alpha=0.92, edgecolor="#e2e8f0", linewidth=0.35))
        ax.text(x, row + 0.035, role, ha="center", va="center", fontsize=8.6, color="#07111f" if role in {"green", "amber"} else "#f8fafc", weight="bold")
        ax.text(x, row - 0.13, ROLE_TOKEN[role], ha="center", va="center", fontsize=5.3, color="#07111f" if role in {"green", "amber"} else "#f8fafc")

legend_x = 8.14
ax.text(legend_x, -0.62, "Role swatches", fontsize=10, weight="bold", color="#94a3b8")
for index, role in enumerate(["purple", "blue", "green", "amber", "coral"]):
    y = index * 0.83 + 0.05
    ax.add_patch(Rectangle((legend_x, y - 0.17), 0.22, 0.34, facecolor=ROLE_COLOR[role], edgecolor="none"))
    ax.text(legend_x + 0.31, y, f"{role} · {ROLE_TOKEN[role]}", va="center", fontsize=8.1, color="#cbd5e1")

ax2 = fig.add_subplot(grid[2])
ax2.set_facecolor("#111827")
viewports = ["Mobile", "Tablet", "Desktop", "Ultrawide"]
heights = [208, 240, 256, 256]
bar_colors = ["#44d9ff", "#a855f7", "#34d399", "#f59e0b"]
ax2.bar(viewports, heights, color=bar_colors, width=0.58, alpha=0.9)
ax2.set_ylim(0, 300)
ax2.set_ylabel("chart height (px)", fontsize=9, color="#94a3b8")
ax2.set_title("Responsive Money Flow implementation contract", loc="left", fontsize=12, color="#f8fafc", pad=12)
ax2.grid(axis="y", color="#334155", linewidth=0.7, alpha=0.55)
ax2.set_axisbelow(True)
for spine in ax2.spines.values():
    spine.set_visible(False)
for index, height in enumerate(heights):
    ax2.text(index, height + 8, f"{height}px", ha="center", fontsize=9, color="#e2e8f0", weight="bold")
ax2.tick_params(axis="x", labelsize=9)
ax2.tick_params(axis="y", labelsize=8)

fig.savefig(OUTPUT, bbox_inches="tight", facecolor=fig.get_facecolor())
print(OUTPUT)
