#!/usr/bin/env python
# scripts/full_evaluation.py

import os
import sys
import time
import random
import json
import logging
import statistics
import argparse

# ─── Django bootstrap ─────────────────────────────────────────────────────────
HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

from api.ml.meal_plan_optimizer import generate_meal_plan, compute_daily_macro_targets
from api.models import FoodItem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mealplan_evaluator")


def timed(name, fn, *args, **kwargs):
    start = time.time()
    result = fn(*args, **kwargs)
    elapsed = time.time() - start
    logger.info(f"{name}: {elapsed:.3f}s")
    return result, elapsed


def compute_totals(plan_by_id):
    """
    plan_by_id: dict { food_id: portion_in_grams }
    Returns actual totals for calories, protein, fat, carbs, fiber.
    """
    totals = {
        "calories": 0.0,
        "protein":  0.0,
        "fat":      0.0,
        "carbs":    0.0,
        "fiber":    0.0,
    }

    for food_id, portion in plan_by_id.items():
        try:
            food = FoodItem.objects.get(pk=food_id)
        except FoodItem.DoesNotExist:
            logger.warning(f"FoodItem id={food_id} not found; skipping")
            continue

        factor = portion / 100.0

        totals["protein"]  += (food.protein_g or 0.0) * factor
        totals["fat"]      += (food.total_fat_g or 0.0) * factor

        carbs = (
            food.carbs_g
            if food.carbs_g is not None
            else (food.total_available_cho_g or 0.0)
        )
        totals["carbs"]    += carbs * factor
        totals["fiber"]    += (food.dietary_fibre_g or 0.0) * factor

        # Convert kJ to kcal: 1 kJ ≈ 0.239006 kcal
        totals["calories"] += (food.energy_kj or 0.0) * factor * 0.239006

    return totals


def score_plan(plan_by_id, targets):
    """
    plan_by_id: dict { food_id: portion_in_grams }
    targets: dict of desired macros, e.g. {'calories':2000, 'protein':150, ...}
    Returns a 0–1 score (1 = perfect match).
    """
    totals = compute_totals(plan_by_id)

    def deviation(actual, expected):
        return abs(actual - expected) / expected if expected else 0.0

    devs = [
        deviation(totals.get(macro, 0.0), target)
        for macro, target in targets.items()
    ]
    avg_dev = sum(devs) / len(devs) if devs else 0.0
    return max(0.0, 1.0 - avg_dev)


def run_evaluation(population, generations, runs=100):
    # 1) compute daily targets
    targets, _ = timed(
        "compute_daily_macro_targets",
        compute_daily_macro_targets,
        25, 175, 70, "maintain"
    )

    # 2) fetch all IDs
    all_ids = list(FoodItem.objects.values_list("id", flat=True))
    if len(all_ids) < 7:
        raise RuntimeError("Need at least 7 FoodItem records to sample from")

    results = []
    for i in range(runs):
        # 3) sample until we have at least one protein/fiber AND one fat
        while True:
            seed_ids = random.sample(all_ids, k=7)
            qs = FoodItem.objects.filter(id__in=seed_ids)
            has_protein_or_fiber = (
                qs.filter(protein_g__gt=0).exists()
                or qs.filter(dietary_fibre_g__gt=0).exists()
            )
            has_fat = qs.filter(total_fat_g__gt=0).exists()
            if has_protein_or_fiber and has_fat:
                break

        # 4) generate raw plan (name→portion)
        (raw_plan, _), gen_time = timed(
            "generate_meal_plan",
            generate_meal_plan,
            seed_ids,
            targets,
            population_size=population,
            generations=generations,
            min_portion=20,
            max_portion=500,
            min_foods=7,
        )

        # 5) map back to id→portion
        #    build a lookup: normalized_name → id
        foods = FoodItem.objects.filter(id__in=seed_ids)
        name_to_id = {
            f.name.strip().lower(): f.id
            for f in foods
        }

        plan_by_id = {}
        for raw_name, portion in raw_plan.items():
            key = raw_name.strip().lower()
            fid = name_to_id.get(key)
            if fid:
                plan_by_id[fid] = portion
            else:
                logger.warning(f"Could not map '{raw_name}' back to an ID")

        # 6) score using real totals
        score = score_plan(plan_by_id, targets)

        results.append({
            "iteration":   i,
            "population":  population,
            "generations": generations,
            "gen_time_s":  round(gen_time, 3),
            "score":       round(score, 3),
            "plan":        plan_by_id,
        })

    # 7) summarize stats
    times  = [r["gen_time_s"] for r in results]
    scores = [r["score"]      for r in results]
    summary = {
        "population":    population,
        "generations":   generations,
        "runs":          len(results),
        "avg_time":      round(statistics.mean(times), 3),
        "min_time":      round(min(times), 3),
        "max_time":      round(max(times), 3),
        "std_time":      round(statistics.pstdev(times), 3) if len(times)>1 else 0.0,
        "avg_score":     round(statistics.mean(scores), 3),
        "min_score":     round(min(scores), 3),
        "max_score":     round(max(scores), 3),
        "std_score":     round(statistics.pstdev(scores), 3) if len(scores)>1 else 0.0,
        "target_macros": targets,
    }

    return summary, results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--population",  type=int, required=True)
    parser.add_argument("--generations", type=int, required=True)
    parser.add_argument("--runs",        type=int, default=100)
    parser.add_argument("--output",      required=True,
                        help="Path to JSON output file")
    args = parser.parse_args()

    summary, results = run_evaluation(
        args.population,
        args.generations,
        runs=args.runs
    )
    with open(args.output, "w") as f:
        json.dump({"summary": summary, "results": results}, f, indent=2)

    logger.info(f"Wrote results to {args.output}")


if __name__ == "__main__":
    main()
