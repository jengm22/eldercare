# terraform/main.tf
# Main Terraform Configuration for Elderly Care Application

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "eldercare-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "eldercare-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "ElderCare"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = data.aws_availability_zones.available.names
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# Security Module
module "security" {
  source = "./modules/security"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  environment             = var.environment
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password
  db_instance_class       = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  private_subnet_ids      = module.vpc.private_subnet_ids
  rds_security_group_id   = module.security.rds_security_group_id
}

# S3 Module
module "s3" {
  source = "./modules/s3"
  
  environment = var.environment
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"
  
  environment = var.environment
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"
  
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  public_subnet_ids        = module.vpc.public_subnet_ids
  private_subnet_ids       = module.vpc.private_subnet_ids
  ecs_security_group_id    = module.security.ecs_security_group_id
  alb_security_group_id    = module.security.alb_security_group_id
  ecr_repository_url       = module.ecr.repository_url
  db_host                  = module.rds.db_endpoint
  db_name                  = var.db_name
  db_username              = var.db_username
  db_password              = var.db_password
  jwt_secret               = var.jwt_secret
  stripe_secret_key        = var.stripe_secret_key
  s3_documents_bucket      = module.s3.documents_bucket_name
  aws_region               = var.aws_region
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"
  
  environment         = var.environment
  frontend_bucket_id  = module.s3.frontend_bucket_id
  frontend_bucket_arn = module.s3.frontend_bucket_arn
  frontend_bucket_domain = module.s3.frontend_bucket_domain
  alb_dns_name        = module.ecs.alb_dns_name
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  environment         = var.environment
  ecs_cluster_name    = module.ecs.cluster_name
  ecs_service_name    = module.ecs.service_name
  alb_arn_suffix      = module.ecs.alb_arn_suffix
  target_group_arn_suffix = module.ecs.target_group_arn_suffix
  db_instance_id      = module.rds.db_instance_id
  alarm_email         = var.alarm_email
}