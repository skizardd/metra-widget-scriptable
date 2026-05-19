$ErrorActionPreference = "Stop"

$themePalettes = [ordered]@{
  "midnight" = [ordered]@{
    background = "#111318"
    primary = "#F4F7FB"
    secondary = "#9AA4B2"
    accent = "#5EC2FF"
  }
  "midnight-light" = [ordered]@{
    background = "#F3F6FA"
    primary = "#18212C"
    secondary = "#687789"
    accent = "#2878C8"
  }
  "lakeshore" = [ordered]@{
    background = "#081B22"
    primary = "#EAF8FA"
    secondary = "#8FB7C0"
    accent = "#42D6CA"
  }
  "lakeshore-light" = [ordered]@{
    background = "#EAF8F8"
    primary = "#12343A"
    secondary = "#5E858B"
    accent = "#008C96"
  }
  "signal" = [ordered]@{
    background = "#10170F"
    primary = "#F1F8EA"
    secondary = "#A3B99A"
    accent = "#8FD14F"
  }
  "signal-light" = [ordered]@{
    background = "#F1F8E8"
    primary = "#1F321C"
    secondary = "#6F8767"
    accent = "#4F9D2F"
  }
  "ember" = [ordered]@{
    background = "#1A1214"
    primary = "#FFF3F0"
    secondary = "#C7A3A8"
    accent = "#FF7A59"
  }
  "ember-light" = [ordered]@{
    background = "#FFF0EB"
    primary = "#3A1D1A"
    secondary = "#946B63"
    accent = "#D94E2B"
  }
  "daylight" = [ordered]@{
    background = "#F7FAFC"
    primary = "#17212B"
    secondary = "#667581"
    accent = "#0B75D1"
  }
  "daylight-light" = [ordered]@{
    background = "#FFFFFF"
    primary = "#102033"
    secondary = "#637184"
    accent = "#006BD6"
  }
  "rose" = [ordered]@{
    background = "#2A111F"
    primary = "#FFF1F7"
    secondary = "#D8A8BE"
    accent = "#FF8CC6"
  }
  "rose-light" = [ordered]@{
    background = "#FFF0F8"
    primary = "#3B1830"
    secondary = "#9A6482"
    accent = "#D9368B"
  }
}
$themes = @($themePalettes.Keys)

$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$scriptable = Join-Path $root "scriptable"
$themeDocs = Join-Path (Join-Path $root "docs") "themes"
$smallSource = Join-Path $scriptable "metra-widget.js"
$largeSource = Join-Path $scriptable "metra-large-widget.js"

$smallTemplate = Get-Content -LiteralPath $smallSource -Raw
$largeTemplate = Get-Content -LiteralPath $largeSource -Raw
New-Item -ItemType Directory -Force -Path $themeDocs | Out-Null

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

  if ($theme.EndsWith("-light")) {
    foreach ($size in @("small", "large")) {
      $themeJsonTarget = Join-Path $themeDocs "metra-$size-$theme.json"
      $themeJson = [ordered]@{
        widget_size = $size
        theme = $theme
        script = "metra-$size-$theme.js"
        colors = $themePalettes[$theme]
        roles = [ordered]@{
          background = "Widget background fill"
          primary = "Standard departure and arrival times"
          secondary = "Headers, service pattern, train numbers, relative times, footer, and muted connector text"
          accent = "Next train in each schedule and error title text"
        }
      }
      $themeJson | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $themeJsonTarget -NoNewline
    }
  }
}

Write-Host "Generated themed Scriptable widget scripts."
