region          = "eu-west-1"
account_id      = "123456789012"
vpc_id          = "vpc-xxxxxxxx"
public_subnets  = ["subnet-aaaa", "subnet-bbbb"]
private_subnets = ["subnet-cccc", "subnet-dddd"]

# ARN of Secrets Manager JSON secret "eldercare/prod"
secret_arn = "arn:aws:secretsmanager:eu-west-1:123456789012:secret:eldercare/prod-xxxxxx"

# Set by CI to your git sha or "latest"
image_tag = "latest"
