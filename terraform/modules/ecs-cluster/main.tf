variable "name" { type = string }

resource "aws_ecs_cluster" "this" {
  name = var.name
}

output "id"   { value = aws_ecs_cluster.this.id }
output "name" { value = aws_ecs_cluster.this.name }
