variable "name"               { type = string }
variable "cluster_id"         { type = string }
variable "task_exec_role_arn" { type = string }
variable "task_role_arn"      { type = string }
variable "image"              { type = string }
variable "container_port"     { type = number }
variable "desired_count"      { type = number, default = 2 }
variable "cpu"                { type = number, default = 512 }
variable "memory"             { type = number, default = 1024 }
variable "vpc_id"             { type = string }
variable "private_subnets"    { type = list(string) }
variable "target_group_arn"   { type = string }
variable "region"             { type = string }
variable "secrets_map"        { # map of { NAME = "<secret-arn>:KEY::" }
  type = map(string)
}
variable "env_map" {
  type    = map(string)
  default = {}
}

resource "aws_cloudwatch_log_group" "lg" {
  name              = "/ecs/${var.name}"
  retention_in_days = 14
}

resource "aws_security_group" "svc" {
  name        = "${var.name}-svc-sg"
  description = "Service ingress from ALB"
  vpc_id      = var.vpc_id
  # Ingress added dynamically by ALB SG at runtime via TG; keep service open only to ALB SG if desired.
  egress { from_port = 0, to_port = 0, protocol = "-1", cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_ecs_task_definition" "td" {
  family                   = var.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.cpu)
  memory                   = tostring(var.memory)
  execution_role_arn       = var.task_exec_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "app",
      image     = var.image,
      essential = true,
      portMappings = [{ containerPort = var.container_port, protocol = "tcp" }],
      environment = [for k, v in var.env_map : { name = k, value = v }],
      secrets     = [for k, v in var.secrets_map : { name = k, valueFrom = v }],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = aws_cloudwatch_log_group.lg.name,
          awslogs-region        = var.region,
          awslogs-stream-prefix = "app"
        }
      },
      healthCheck = {
        command     = ["CMD-SHELL", "curl -fsS http://localhost:${var.container_port}/healthz || exit 1"],
        interval    = 30,
        timeout     = 5,
        retries     = 3,
        startPeriod = 10
      }
    }
  ])
}

resource "aws_ecs_service" "svc" {
  name            = "${var.name}-svc"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.td.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [aws_security_group.svc.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "app"
    container_port   = var.container_port
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
}

output "service_name"        { value = aws_ecs_service.svc.name }
output "task_definition_arn" { value = aws_ecs_task_definition.td.arn }
output "log_group_name"      { value = aws_cloudwatch_log_group.lg.name }
output "service_sg_id"       { value = aws_security_group.svc.id }
