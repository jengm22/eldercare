locals {
  app_name      = "eldercare-backend"
  container_port= 3001
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"
  
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = data.aws_availability_zones.available.names
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# ECR repo
module "ecr" {
  source = "../../modules/ecr"
  name   = local.app_name
}

# IAM roles
module "iam" {
  source       = "../../modules/iam"
  secrets_arns = [var.secret_arn]
}

# ECS cluster
module "cluster" {
  source = "../../modules/ecs-cluster"
  name   = "eldercare"
}

# ALB (HTTP; swap to HTTPS in prod with ACM)
module "alb" {
  source         = "../../modules/alb"
  name           = local.app_name
  vpc_id         = var.vpc_id
  public_subnets = var.public_subnets
  health_path    = "/readyz"
  port           = local.container_port
}

# ECS Service + Task
module "svc" {
  source               = "../../modules/ecs-service"
  name                 = local.app_name
  cluster_id           = module.cluster.id
  task_exec_role_arn   = module.iam.execution_role_arn
  task_role_arn        = module.iam.task_role_arn
  image                = "${var.account_id}.dkr.ecr.${var.region}.amazonaws.com/${module.ecr.name}:${var.image_tag}"
  container_port       = local.container_port
  desired_count        = 2
  cpu                  = 512
  memory               = 1024
  vpc_id               = var.vpc_id
  private_subnets      = var.private_subnets
  target_group_arn     = module.alb.target_group_arn
  region               = var.region

  env_map = {
    NODE_ENV = "production"
    PORT     = tostring(local.container_port)
  }

  secrets_map = {
    JWT_SECRET     = "${var.secret_arn}:JWT_SECRET::"
    MONGODB_URI    = "${var.secret_arn}:MONGODB_URI::"
    MONGODB_DB     = "${var.secret_arn}:MONGODB_DB::"
    FRONTEND_URL   = "${var.secret_arn}:FRONTEND_URL::"
    MONGO_MAX_POOL = "${var.secret_arn}:MONGO_MAX_POOL::"
  }
}

output "alb_dns_name" { value = module.alb.alb_dns_name }
output "ecr_repo_url" { value = module.ecr.repository_url }
