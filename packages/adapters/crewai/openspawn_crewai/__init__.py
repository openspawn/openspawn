"""OpenSpawn adapter for CrewAI — report crew activity to OpenSpawn infrastructure."""

from openspawn_crewai.adapter import OpenSpawnCrew
from openspawn_crewai.hooks import OpenSpawnTaskCallback

__all__ = ["OpenSpawnCrew", "OpenSpawnTaskCallback"]
