variable "region" { type = string }
variable "account_id" { type = string }
variable "vpc_id" { type = string }
variable "public_subnets" { type = list(string) }
variable "private_subnets" { type = list(string) }

# Secrets Manager JSON secret arn, e.g. arn:aws:secretsmanager:...:secret:eldercare/prod-XXXXX
variable "secret_arn" { type = string }

# Image tag to deploy (e.g., set from CI)
variable "image_tag" {
  type    = string
  default = "latest"
}
