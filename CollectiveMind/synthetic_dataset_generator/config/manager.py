"""Configuration manager for loading and validating settings."""

import yaml
import os
from typing import Dict, Any, Optional
from .settings import GenerationConfig


class ConfigurationManager:
    """Manages configuration loading, validation, and environment overrides."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize configuration manager.
        
        Args:
            config_path: Path to YAML configuration file. If None, uses default config.
        """
        self.config_path = config_path
        self._config: Optional[GenerationConfig] = None
    
    def load_config(self) -> GenerationConfig:
        """Load configuration from file or create default."""
        if self.config_path and os.path.exists(self.config_path):
            return self._load_from_file()
        else:
            return self._create_default_config()
    
    def _load_from_file(self) -> GenerationConfig:
        """Load configuration from YAML file."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config_data = yaml.safe_load(f)
            
            # Apply environment overrides
            config_data = self._apply_environment_overrides(config_data)
            
            # Validate configuration
            self._validate_config(config_data)
            
            # Convert to GenerationConfig object
            return self._dict_to_config(config_data)
            
        except Exception as e:
            raise ValueError(f"Failed to load configuration from {self.config_path}: {e}")
    
    def _create_default_config(self) -> GenerationConfig:
        """Create default configuration."""
        config = GenerationConfig()
        
        # Apply environment overrides to default config
        config_dict = config.to_dict()
        config_dict = self._apply_environment_overrides(config_dict)
        
        return self._dict_to_config(config_dict)
    
    def _apply_environment_overrides(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply environment variable overrides to configuration."""
        # Check for common environment overrides
        env_overrides = {
            'DATASET_OUTPUT_DIR': ('output', 'output_dir'),
            'DATASET_EMPLOYEE_COUNT': ('organization', 'employee_count'),
            'DATASET_DOCUMENT_COUNT': ('content_volumes', 'documents'),
            'DATASET_VALIDATION': ('output', 'validation'),
        }
        
        for env_var, (section, key) in env_overrides.items():
            if env_var in os.environ:
                value = os.environ[env_var]
                
                # Convert to appropriate type
                if key in ['employee_count', 'documents']:
                    value = int(value)
                elif key == 'validation':
                    value = value.lower() in ('true', '1', 'yes')
                
                # Apply override
                if section not in config_data:
                    config_data[section] = {}
                config_data[section][key] = value
        
        return config_data
    
    def _validate_config(self, config_data: Dict[str, Any]) -> None:
        """Validate configuration values and constraints."""
        # Validate organization settings
        org = config_data.get('organization', {})
        if org.get('employee_count', 0) < 1:
            raise ValueError("Employee count must be at least 1")
        
        if not org.get('teams'):
            raise ValueError("At least one team must be specified")
        
        # Validate content volumes
        volumes = config_data.get('content_volumes', {})
        if volumes.get('documents', 0) < 1:
            raise ValueError("Document count must be at least 1")
        
        # Validate temporal settings
        temporal = config_data.get('temporal', {})
        try:
            from datetime import datetime
            start_date = datetime.fromisoformat(temporal.get('start_date', '2024-01-01'))
            end_date = datetime.fromisoformat(temporal.get('end_date', '2025-10-24'))
            if start_date >= end_date:
                raise ValueError("Start date must be before end date")
        except ValueError as e:
            raise ValueError(f"Invalid date format: {e}")
    
    def _dict_to_config(self, config_data: Dict[str, Any]) -> GenerationConfig:
        """Convert dictionary to GenerationConfig object."""
        # This is a simplified conversion - in a full implementation,
        # you'd want more robust mapping from dict to dataclass
        config = GenerationConfig()
        
        # Update organization settings
        if 'organization' in config_data:
            org_data = config_data['organization']
            if 'company_name' in org_data:
                config.organization.company_name = org_data['company_name']
            if 'employee_count' in org_data:
                config.organization.employee_count = org_data['employee_count']
            if 'teams' in org_data:
                config.organization.teams = org_data['teams']
            if 'manager_count' in org_data:
                config.organization.manager_count = org_data['manager_count']
        
        # Update content volumes
        if 'content_volumes' in config_data:
            vol_data = config_data['content_volumes']
            if 'documents' in vol_data:
                config.content_volumes.documents = vol_data['documents']
            if 'chat_threads' in vol_data:
                config.content_volumes.chat_threads = vol_data['chat_threads']
        
        # Update output settings
        if 'output' in config_data:
            out_data = config_data['output']
            if 'output_dir' in out_data:
                config.output.output_dir = out_data['output_dir']
            if 'validation' in out_data:
                config.output.validation = out_data['validation']
        
        return config
    
    def save_config(self, config: GenerationConfig, output_path: str) -> None:
        """Save configuration to YAML file."""
        config_dict = config.to_dict()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(config_dict, f, default_flow_style=False, indent=2)
    
    @property
    def config(self) -> GenerationConfig:
        """Get current configuration, loading if necessary."""
        if self._config is None:
            self._config = self.load_config()
        return self._config