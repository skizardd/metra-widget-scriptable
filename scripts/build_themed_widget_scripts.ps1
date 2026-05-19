$ErrorActionPreference = "Stop"

$themes = @(
  "midnight",
  "lakeshore",
  "signal",
  "ember",
  "daylight",
  "rose"
)

$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$scriptable = Join-Path $root "scriptable"
$smallSource = Join-Path $scriptable "metra-widget.js"
$largeSource = Join-Path $scriptable "metra-large-widget.js"

$smallTemplate = Get-Content -LiteralPath $smallSource -Raw
$largeTemplate = Get-Content -LiteralPath $largeSource -Raw

foreach ($theme in $themes) {
  $smallTarget = Join-Path $scriptable "metra-small-$theme.js"
  $largeTarget = Join-Path $scriptable "metra-large-$theme.js"

  $smallContent = $smallTemplate `
    -replace "metra-widget\.js - paste into Scriptable and add as a widget\.", "metra-small-$theme.js - paste into Scriptable and add as a small widget." `
    -replace "const FIXED_THEME = null;", "const FIXED_THEME = `"$theme`";"

  $largeContent = $largeTemplate `
    -replace "metra-large-widget\.js - paste into Scriptable and use with a large widget\.", "metra-large-$theme.js - paste into Scriptable and use with a large widget." `
    -replace "const FIXED_THEME = null;", "const FIXED_THEME = `"$theme`";"

  Set-Content -LiteralPath $smallTarget -Value $smallContent -NoNewline
  Set-Content -LiteralPath $largeTarget -Value $largeContent -NoNewline
}

Write-Host "Generated themed Scriptable widget scripts."
