"""Configuration management for the synthetic dataset generator."""

from .manager import ConfigurationManager
from .settings import GenerationConfig

__all__ = ["ConfigurationManager", "GenerationConfig"]