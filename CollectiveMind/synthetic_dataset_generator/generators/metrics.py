"""Metrics generator for creating realistic business analytics CSV data."""

import random
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import calendar

from .base import BaseGenerator
from .context import ContextManager
from ..config.settings import GenerationConfig
from ..output.writers import CSVWriter


class MetricsGenerator(BaseGenerator):
    """Generates realistic business metrics CSV data for all teams."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize metrics generator."""
        super().__init__(config, context)
        
        # Date range for metrics
        self.start_date = datetime.fromisoformat(config.temporal.start_date)
        self.end_date = datetime.fromisoformat(config.temporal.end_date)
        
        # Generate 18 months of data plus recent weekly slice
        self.monthly_months = 18
        self.weekly_weeks = 8  # Recent 8 weeks
        
        # Metric definitions by team
        self.metric_definitions = {
            "marketing": {
                "filename": "marketing_metrics.csv",
                "fields": [
                    "date", "campaign_name", "channel", "impressions", "clicks", 
                    "ctr", "cost", "conversions", "conversion_rate", "cpa", "roas", "region"
                ],
                "campaigns": [
                    "Q1 Brand Awareness", "Product Launch", "Holiday Campaign", 
                    "Retargeting Campaign", "Lead Generation", "Customer Acquisition",
                    "Social Media Push", "Email Campaign", "Content Marketing", "SEO Campaign"
                ],
                "channels": ["Google Ads", "Facebook", "LinkedIn", "Email", "Organic", "Display"],
                "regions": ["North America", "Europe", "Asia Pacific", "Latin America"]
            },
            "product": {
                "filename": "product_adoption.csv", 
                "fields": [
                    "date", "feature_id", "feature_name", "active_users", "new_users",
                    "retention_rate", "engagement_score", "completion_rate", "user_segment"
                ],
                "features": [
                    "Dashboard", "Analytics", "Reporting", "API Access", "Mobile App",
                    "Notifications", "Collaboration", "Export", "Integration", "Search"
                ],
                "segments": ["Free", "Pro", "Enterprise", "Trial"]
            },
            "customer": {
                "filename": "customer_churn.csv",
                "fields": [
                    "date", "region", "customer_segment", "churn_rate", "retention_rate",
                    "satisfaction_score", "support_tickets", "avg_resolution_time", "nps_score"
                ],
                "segments": ["SMB", "Mid-Market", "Enterprise", "Startup"],
                "regions": ["North America", "Europe", "Asia Pacific", "Latin America"]
            },
            "finance": {
                "filename": "finance_kpis.csv",
                "fields": [
                    "date", "quarter", "revenue", "expenses", "profit_margin", "cash_flow",
                    "arr", "mrr", "ltv", "cac", "department"
                ],
                "departments": ["Marketing", "Product", "Engineering", "Finance", "HR", "Sales"]
            },
            "hr": {
                "filename": "hr_analytics.csv",
                "fields": [
                    "date", "department", "headcount", "new_hires", "departures", 
                    "attrition_rate", "engagement_score", "satisfaction_score", "training_hours"
                ],
                "departments": ["Marketing", "Product", "Engineering", "Finance", "HR"]
            }
        }
        
        self.generated_files = []
    
    def generate(self) -> List[str]:
        """Generate all CSV metric files."""
        generated_files = []
        
        for metric_type, config in self.metric_definitions.items():
            print(f"   Generating {config['filename']}...")
            
            # Generate monthly data
            monthly_data = self._generate_monthly_data(metric_type, config)
            
            # Generate weekly data
            weekly_data = self._generate_weekly_data(metric_type, config)
            
            # Combine data
            all_data = monthly_data + weekly_data
            
            # Write to CSV
            file_path = f"technova_dataset/{config['filename']}"
            writer = CSVWriter(file_path, config["fields"])
            writer.write_items(all_data)
            
            generated_files.append(config["filename"])
            print(f"     Saved {len(all_data)} records to {file_path}")
        
        self.generated_files = generated_files
        return generated_files
    
    def _generate_monthly_data(self, metric_type: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate 18 months of monthly data."""
        data = []
        
        # Start from 18 months ago
        current_date = self.end_date - timedelta(days=30 * self.monthly_months)
        
        for month in range(self.monthly_months):
            month_data = self._generate_month_data(metric_type, config, current_date, "monthly")
            data.extend(month_data)
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return data
    
    def _generate_weekly_data(self, metric_type: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate recent 8 weeks of weekly data."""
        data = []
        
        # Start from 8 weeks ago
        current_date = self.end_date - timedelta(weeks=self.weekly_weeks)
        
        for week in range(self.weekly_weeks):
            week_data = self._generate_week_data(metric_type, config, current_date)
            data.extend(week_data)
            
            # Move to next week
            current_date += timedelta(weeks=1)
        
        return data
    
    def _generate_month_data(self, metric_type: str, config: Dict[str, Any], 
                           date: datetime, frequency: str) -> List[Dict[str, Any]]:
        """Generate data for a specific month."""
        if metric_type == "marketing":
            return self._generate_marketing_data(config, date, frequency)
        elif metric_type == "product":
            return self._generate_product_data(config, date, frequency)
        elif metric_type == "customer":
            return self._generate_customer_data(config, date, frequency)
        elif metric_type == "finance":
            return self._generate_finance_data(config, date, frequency)
        elif metric_type == "hr":
            return self._generate_hr_data(config, date, frequency)
        
        return []
    
    def _generate_week_data(self, metric_type: str, config: Dict[str, Any], 
                          date: datetime) -> List[Dict[str, Any]]:
        """Generate data for a specific week."""
        return self._generate_month_data(metric_type, config, date, "weekly")
    
    def _generate_marketing_data(self, config: Dict[str, Any], date: datetime, 
                               frequency: str) -> List[Dict[str, Any]]:
        """Generate marketing metrics data."""
        data = []
        
        campaigns = config["campaigns"]
        channels = config["channels"]
        regions = config["regions"]
        
        # Generate 2-4 campaign records per period
        num_records = self.random.randint(2, 4)
        
        for _ in range(num_records):
            campaign = self.random_choice(campaigns)
            channel = self.random_choice(channels)
            region = self.random_choice(regions)
            
            # Generate realistic metrics with seasonal variations
            base_impressions = self.random.randint(10000, 100000)
            if date.month in [11, 12]:  # Holiday season boost
                base_impressions = int(base_impressions * 1.3)
            
            impressions = base_impressions
            ctr = self.random.uniform(0.5, 5.0)  # 0.5% to 5% CTR
            clicks = int(impressions * (ctr / 100))
            
            cost = self.random.uniform(1000, 10000)
            conversion_rate = self.random.uniform(1.0, 8.0)  # 1% to 8%
            conversions = int(clicks * (conversion_rate / 100))
            
            cpa = cost / max(conversions, 1)  # Cost per acquisition
            roas = (conversions * self.random.uniform(50, 200)) / cost  # Return on ad spend
            
            record = {
                "date": date.strftime("%Y-%m-%d"),
                "campaign_name": campaign,
                "channel": channel,
                "impressions": impressions,
                "clicks": clicks,
                "ctr": round(ctr, 2),
                "cost": round(cost, 2),
                "conversions": conversions,
                "conversion_rate": round(conversion_rate, 2),
                "cpa": round(cpa, 2),
                "roas": round(roas, 2),
                "region": region
            }
            
            data.append(record)
        
        return data
    
    def _generate_product_data(self, config: Dict[str, Any], date: datetime, 
                             frequency: str) -> List[Dict[str, Any]]:
        """Generate product adoption metrics data."""
        data = []
        
        features = config["features"]
        segments = config["segments"]
        
        # Generate data for each feature
        for feature in features:
            for segment in segments:
                # Base users with growth trend
                months_since_start = (date.year - self.start_date.year) * 12 + (date.month - self.start_date.month)
                growth_factor = 1 + (months_since_start * 0.05)  # 5% monthly growth
                
                base_users = self.random.randint(100, 2000) * growth_factor
                
                # Segment multipliers
                segment_multipliers = {"Free": 1.0, "Pro": 0.6, "Enterprise": 0.3, "Trial": 0.2}
                active_users = int(base_users * segment_multipliers.get(segment, 1.0))
                
                new_users = int(active_users * self.random.uniform(0.05, 0.15))  # 5-15% new users
                retention_rate = self.random.uniform(70, 95)  # 70-95% retention
                engagement_score = self.random.uniform(3.0, 5.0)  # 1-5 scale
                completion_rate = self.random.uniform(60, 90)  # 60-90% completion
                
                record = {
                    "date": date.strftime("%Y-%m-%d"),
                    "feature_id": f"FEAT_{features.index(feature) + 1:03d}",
                    "feature_name": feature,
                    "active_users": active_users,
                    "new_users": new_users,
                    "retention_rate": round(retention_rate, 1),
                    "engagement_score": round(engagement_score, 1),
                    "completion_rate": round(completion_rate, 1),
                    "user_segment": segment
                }
                
                data.append(record)
        
        return data
    
    def _generate_customer_data(self, config: Dict[str, Any], date: datetime, 
                              frequency: str) -> List[Dict[str, Any]]:
        """Generate customer churn and satisfaction data."""
        data = []
        
        segments = config["segments"]
        regions = config["regions"]
        
        for region in regions:
            for segment in segments:
                # Churn rates vary by segment
                segment_churn_rates = {
                    "SMB": (8, 15),      # 8-15% churn
                    "Mid-Market": (5, 10), # 5-10% churn  
                    "Enterprise": (2, 6),  # 2-6% churn
                    "Startup": (12, 20)    # 12-20% churn
                }
                
                churn_min, churn_max = segment_churn_rates.get(segment, (5, 15))
                churn_rate = self.random.uniform(churn_min, churn_max)
                retention_rate = 100 - churn_rate
                
                # Satisfaction correlates with churn (inverse relationship)
                satisfaction_score = self.random.uniform(3.5, 5.0) if churn_rate < 10 else self.random.uniform(2.5, 4.0)
                
                support_tickets = self.random.randint(50, 500)
                avg_resolution_time = self.random.uniform(2, 48)  # Hours
                
                # NPS score correlates with satisfaction
                nps_base = (satisfaction_score - 3) * 20  # Scale to -40 to +40
                nps_score = max(-100, min(100, nps_base + self.random.uniform(-10, 10)))
                
                record = {
                    "date": date.strftime("%Y-%m-%d"),
                    "region": region,
                    "customer_segment": segment,
                    "churn_rate": round(churn_rate, 2),
                    "retention_rate": round(retention_rate, 2),
                    "satisfaction_score": round(satisfaction_score, 1),
                    "support_tickets": support_tickets,
                    "avg_resolution_time": round(avg_resolution_time, 1),
                    "nps_score": round(nps_score, 1)
                }
                
                data.append(record)
        
        return data
    
    def _generate_finance_data(self, config: Dict[str, Any], date: datetime, 
                             frequency: str) -> List[Dict[str, Any]]:
        """Generate finance KPI data."""
        data = []
        
        departments = config["departments"]
        quarter = f"Q{((date.month - 1) // 3) + 1}"
        
        # Generate overall company metrics
        base_revenue = 1000000  # $1M base
        months_since_start = (date.year - self.start_date.year) * 12 + (date.month - self.start_date.month)
        growth_factor = 1 + (months_since_start * 0.08)  # 8% monthly growth
        
        revenue = base_revenue * growth_factor * self.random.uniform(0.9, 1.1)
        expenses = revenue * self.random.uniform(0.6, 0.8)  # 60-80% of revenue
        profit_margin = ((revenue - expenses) / revenue) * 100
        
        cash_flow = revenue - expenses + self.random.uniform(-50000, 100000)
        arr = revenue * 12  # Annual Recurring Revenue
        mrr = revenue  # Monthly Recurring Revenue
        
        # LTV and CAC metrics
        ltv = self.random.uniform(5000, 15000)
        cac = self.random.uniform(500, 2000)
        
        # Company-level record
        company_record = {
            "date": date.strftime("%Y-%m-%d"),
            "quarter": quarter,
            "revenue": round(revenue, 2),
            "expenses": round(expenses, 2),
            "profit_margin": round(profit_margin, 2),
            "cash_flow": round(cash_flow, 2),
            "arr": round(arr, 2),
            "mrr": round(mrr, 2),
            "ltv": round(ltv, 2),
            "cac": round(cac, 2),
            "department": "Company"
        }
        
        data.append(company_record)
        
        # Department-level records
        for department in departments:
            dept_revenue = revenue * self.random.uniform(0.1, 0.3)  # Department contribution
            dept_expenses = dept_revenue * self.random.uniform(0.5, 0.9)
            dept_profit_margin = ((dept_revenue - dept_expenses) / dept_revenue) * 100
            
            dept_record = {
                "date": date.strftime("%Y-%m-%d"),
                "quarter": quarter,
                "revenue": round(dept_revenue, 2),
                "expenses": round(dept_expenses, 2),
                "profit_margin": round(dept_profit_margin, 2),
                "cash_flow": round(dept_revenue - dept_expenses, 2),
                "arr": round(dept_revenue * 12, 2),
                "mrr": round(dept_revenue, 2),
                "ltv": round(ltv * self.random.uniform(0.8, 1.2), 2),
                "cac": round(cac * self.random.uniform(0.8, 1.2), 2),
                "department": department
            }
            
            data.append(dept_record)
        
        return data
    
    def _generate_hr_data(self, config: Dict[str, Any], date: datetime, 
                        frequency: str) -> List[Dict[str, Any]]:
        """Generate HR analytics data."""
        data = []
        
        departments = config["departments"]
        
        for department in departments:
            # Base headcount with growth
            base_headcount = {"Marketing": 8, "Product": 6, "Engineering": 12, "Finance": 4, "HR": 3}
            months_since_start = (date.year - self.start_date.year) * 12 + (date.month - self.start_date.month)
            growth_factor = 1 + (months_since_start * 0.02)  # 2% monthly growth
            
            headcount = int(base_headcount.get(department, 5) * growth_factor)
            
            # Hiring and departures
            new_hires = self.random.randint(0, max(2, headcount // 10))  # 0-10% new hires
            departures = self.random.randint(0, max(1, headcount // 15))  # 0-7% departures
            
            # Attrition rate (annual)
            monthly_attrition = (departures / max(headcount, 1)) * 100
            attrition_rate = monthly_attrition * 12  # Annualized
            
            # Engagement and satisfaction scores
            engagement_score = self.random.uniform(3.2, 4.8)  # 1-5 scale
            satisfaction_score = self.random.uniform(3.0, 4.5)  # 1-5 scale
            
            # Training hours
            training_hours = self.random.randint(2, 20) * headcount
            
            record = {
                "date": date.strftime("%Y-%m-%d"),
                "department": department,
                "headcount": headcount,
                "new_hires": new_hires,
                "departures": departures,
                "attrition_rate": round(attrition_rate, 2),
                "engagement_score": round(engagement_score, 1),
                "satisfaction_score": round(satisfaction_score, 1),
                "training_hours": training_hours
            }
            
            data.append(record)
        
        return data
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for metrics generation."""
        return {
            "generator_type": "MetricsGenerator",
            "files_generated": len(self.generated_files),
            "target_files": len(self.metric_definitions),
            "generated_files": self.generated_files,
            "status": "completed" if self.generated_files else "ready"
        }