variable "name" { type = string }

resource "aws_ecr_repository" "this" {
  name = var.name
  image_scanning_configuration { scan_on_push = true }
  lifecycle_policy {
    policy = jsonencode({
      rules = [{
        rulePriority = 1, description = "expire untagged after 30d",
        selection = { tagStatus = "untagged", countType = "sinceImagePushed", countUnit = "days", countNumber = 30 },
        action     = { type = "expire" }
      }]
    })
  }
}

output "repository_url" { value = aws_ecr_repository.this.repository_url }
output "name"          { value = aws_ecr_repository.this.name }
