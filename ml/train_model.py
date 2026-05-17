"""
Train attendance shortage model from live MongoDB data.

Usage:
    python train_model.py              # force train
    python train_model.py --auto       # train only if enough new records
"""

from __future__ import annotations

import argparse
import logging
import sys

from train_core import run_training

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> int:
    parser = argparse.ArgumentParser(description="Train ML model from MongoDB attendance")
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Train only when enough new attendance records exist since last run",
    )
    args = parser.parse_args()

    logger.info("Starting training (source: MongoDB Atlas)")
    result = run_training(force=not args.auto, auto=args.auto)

    if result.get("trained"):
        logger.info("Training complete: %s", result.get("message"))
        logger.info("Meta: %s", result.get("meta"))
        return 0

    if result.get("skipped"):
        logger.info("Training skipped: %s", result.get("reason"))
        return 0

    logger.error("Training failed: %s", result.get("error"))
    if result.get("fallback"):
        logger.info("Fallback: %s", result["fallback"])
    return 1


if __name__ == "__main__":
    sys.exit(main())
