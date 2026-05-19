$ErrorActionPreference = "Stop"

$themes = @(
  "midnight",
  "midnight-light",
  "lakeshore",
  "lakeshore-light",
  "signal",
  "signal-light",
  "ember",
  "ember-light",
  "daylight",
  "daylight-light",
  "rose",
  "rose-light"
)

$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$scriptable = Join-Path $root "scriptable"
$source = Join-Path $scriptable "metra-small-otc-outbound-widget.js"
$template = Get-Content -LiteralPath $source -Raw

foreach ($theme in $themes) {
  $target = Join-Path $scriptable "metra-small-otc-outbound-$theme.js"
  $content = $template `
    -replace "metra-small-otc-outbound-widget\.js - paste into Scriptable and add as a small widget\.", "metra-small-otc-outbound-$theme.js - paste into Scriptable and add as a small widget." `
    -replace "const FIXED_THEME = null;", "const FIXED_THEME = `"$theme`";"

  Set-Content -LiteralPath $target -Value $content -NoNewline
}

Write-Host "Generated OTC outbound small widget scripts."
