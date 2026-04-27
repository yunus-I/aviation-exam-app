param(
  [Parameter(Mandatory = $true)]
  [string]$BotToken,

  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$SecretToken
)

$webhookUrl = "$BaseUrl/api/telegram/webhook"
$uri = "https://api.telegram.org/bot$BotToken/setWebhook"

$body = @{
  url = $webhookUrl
  secret_token = $SecretToken
  allowed_updates = @("message", "callback_query")
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $body
