$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")).Path "public"

function New-Color {
  param(
    [string]$Hex,
    [int]$Alpha = 255
  )

  $normalized = $Hex.TrimStart("#")
  $r = [Convert]::ToInt32($normalized.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($normalized.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($normalized.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = [Math]::Max(1, $Radius * 2)

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Use-Graphics {
  param(
    [System.Drawing.Bitmap]$Bitmap
  )

  $graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return $graphics
}

function Draw-GradientBackground {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Width,
    [int]$Height
  )

  $backgroundRect = [System.Drawing.RectangleF]::new(0, 0, $Width, $Height)
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundRect,
    (New-Color "#1d120c"),
    (New-Color "#d88b5e"),
    40
  )

  $blend = New-Object System.Drawing.Drawing2D.ColorBlend
  $blend.Colors = @(
    (New-Color "#1d120c"),
    (New-Color "#7c3a22"),
    (New-Color "#b85c38"),
    (New-Color "#f4d3b4")
  )
  $blend.Positions = @(0.0, 0.35, 0.72, 1.0)
  $backgroundBrush.InterpolationColors = $blend
  $Graphics.FillRectangle($backgroundBrush, $backgroundRect)
  $backgroundBrush.Dispose()

  $overlayBrush = New-Object System.Drawing.SolidBrush((New-Color "#ffffff" 18))
  $Graphics.FillEllipse($overlayBrush, $Width * 0.04, $Height * 0.04, $Width * 0.35, $Width * 0.35)
  $Graphics.FillEllipse($overlayBrush, $Width * 0.62, $Height * 0.12, $Width * 0.28, $Width * 0.28)
  $Graphics.FillEllipse($overlayBrush, $Width * 0.44, $Height * 0.62, $Width * 0.42, $Width * 0.42)
  $overlayBrush.Dispose()
}

function Draw-BrandEmblem {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$CanvasSize,
    [bool]$Maskable
  )

  $outerMargin = if ($Maskable) { $CanvasSize * 0.16 } else { $CanvasSize * 0.21 }
  $panelSize = $CanvasSize - ($outerMargin * 2)
  $panelX = ($CanvasSize - $panelSize) / 2
  $panelY = ($CanvasSize - $panelSize) / 2

  $panelPath = New-RoundedRectanglePath -X $panelX -Y $panelY -Width $panelSize -Height $panelSize -Radius ($panelSize * 0.24)
  $panelBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.RectangleF]::new($panelX, $panelY, $panelSize, $panelSize),
    (New-Color "#fffaf5" 242),
    (New-Color "#f6d7bf" 220),
    125
  )
  $Graphics.FillPath($panelBrush, $panelPath)
  $panelBrush.Dispose()

  $panelPen = New-Object System.Drawing.Pen((New-Color "#ffffff" 105), [Math]::Max(3, $CanvasSize * 0.016))
  $Graphics.DrawPath($panelPen, $panelPath)
  $panelPen.Dispose()

  $highlightBrush = New-Object System.Drawing.SolidBrush((New-Color "#ffffff" 34))
  $Graphics.FillEllipse(
    $highlightBrush,
    $panelX + ($panelSize * 0.11),
    $panelY + ($panelSize * 0.09),
    $panelSize * 0.36,
    $panelSize * 0.2
  )
  $highlightBrush.Dispose()

  $housePen = New-Object System.Drawing.Pen((New-Color "#7a351f"), [Math]::Max(4, $CanvasSize * 0.024))
  $housePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $roofPoints = @(
    [System.Drawing.PointF]::new($panelX + ($panelSize * 0.29), $panelY + ($panelSize * 0.47)),
    [System.Drawing.PointF]::new($panelX + ($panelSize * 0.5), $panelY + ($panelSize * 0.27)),
    [System.Drawing.PointF]::new($panelX + ($panelSize * 0.71), $panelY + ($panelSize * 0.47))
  )
  $Graphics.DrawLines($housePen, $roofPoints)
  $Graphics.DrawLine(
    $housePen,
    $panelX + ($panelSize * 0.34),
    $panelY + ($panelSize * 0.47),
    $panelX + ($panelSize * 0.34),
    $panelY + ($panelSize * 0.72)
  )
  $Graphics.DrawLine(
    $housePen,
    $panelX + ($panelSize * 0.66),
    $panelY + ($panelSize * 0.47),
    $panelX + ($panelSize * 0.66),
    $panelY + ($panelSize * 0.72)
  )
  $Graphics.DrawLine(
    $housePen,
    $panelX + ($panelSize * 0.34),
    $panelY + ($panelSize * 0.72),
    $panelX + ($panelSize * 0.66),
    $panelY + ($panelSize * 0.72)
  )

  $doorPath = New-RoundedRectanglePath -X ($panelX + ($panelSize * 0.445)) -Y ($panelY + ($panelSize * 0.52)) -Width ($panelSize * 0.11) -Height ($panelSize * 0.2) -Radius ($panelSize * 0.05)
  $doorBrush = New-Object System.Drawing.SolidBrush((New-Color "#d07b4c"))
  $Graphics.FillPath($doorBrush, $doorPath)
  $doorBrush.Dispose()

  $monogramFont = New-Object System.Drawing.Font("Segoe UI Semibold", [Math]::Max(12, $CanvasSize * 0.15), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $monogramBrush = New-Object System.Drawing.SolidBrush((New-Color "#6b2e1a"))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $Graphics.DrawString(
    "N",
    $monogramFont,
    $monogramBrush,
    [System.Drawing.RectangleF]::new($panelX, $panelY + ($panelSize * 0.06), $panelSize, $panelSize * 0.22),
    $format
  )

  $monogramBrush.Dispose()
  $monogramFont.Dispose()
  $format.Dispose()
  $doorPath.Dispose()
  $housePen.Dispose()
  $panelPath.Dispose()
}

function Draw-AppHeaderCopy {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Width,
    [int]$Height,
    [string]$Title,
    [string]$Subtitle
  )

  $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", [Math]::Max(26, $Width * 0.048), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = New-Object System.Drawing.Font("Segoe UI", [Math]::Max(14, $Width * 0.018), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $titleBrush = New-Object System.Drawing.SolidBrush((New-Color "#fff9f3"))
  $subtitleBrush = New-Object System.Drawing.SolidBrush((New-Color "#ffe4d1" 230))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center

  $Graphics.DrawString($Title, $titleFont, $titleBrush, [System.Drawing.RectangleF]::new(0, $Height * 0.65, $Width, $Height * 0.12), $format)
  $Graphics.DrawString($Subtitle, $subtitleFont, $subtitleBrush, [System.Drawing.RectangleF]::new($Width * 0.12, $Height * 0.76, $Width * 0.76, $Height * 0.1), $format)

  $format.Dispose()
  $titleBrush.Dispose()
  $subtitleBrush.Dispose()
  $titleFont.Dispose()
  $subtitleFont.Dispose()
}

function Draw-Icon {
  param(
    [int]$Size,
    [string]$OutputName,
    [bool]$Maskable = $false
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = Use-Graphics -Bitmap $bitmap

  Draw-GradientBackground -Graphics $graphics -Width $Size -Height $Size
  Draw-BrandEmblem -Graphics $graphics -CanvasSize $Size -Maskable $Maskable

  $outputPath = Join-Path $publicDir $OutputName
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-WideTile {
  param(
    [int]$Width,
    [int]$Height,
    [string]$OutputName
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = Use-Graphics -Bitmap $bitmap

  Draw-GradientBackground -Graphics $graphics -Width $Width -Height $Height
  Draw-BrandEmblem -Graphics $graphics -CanvasSize ([Math]::Min($Height * 0.82, $Width * 0.34)) -Maskable $true
  Draw-AppHeaderCopy -Graphics $graphics -Width $Width -Height $Height -Title "NoAgentNaija" -Subtitle "Rent direct. Manage smarter. Work faster."

  $outputPath = Join-Path $publicDir $OutputName
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-Splash {
  param(
    [int]$Width,
    [int]$Height,
    [string]$OutputName
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = Use-Graphics -Bitmap $bitmap

  Draw-GradientBackground -Graphics $graphics -Width $Width -Height $Height

  $accentBrush = New-Object System.Drawing.SolidBrush((New-Color "#ffffff" 22))
  $graphics.FillEllipse($accentBrush, $Width * 0.06, $Height * 0.08, $Width * 0.3, $Width * 0.3)
  $graphics.FillEllipse($accentBrush, $Width * 0.62, $Height * 0.68, $Width * 0.24, $Width * 0.24)
  $accentBrush.Dispose()

  $canvasSize = [Math]::Min($Width, $Height) * 0.42
  $graphics.TranslateTransform(($Width - $canvasSize) / 2, $Height * 0.14)
  Draw-BrandEmblem -Graphics $graphics -CanvasSize $canvasSize -Maskable $true
  $graphics.ResetTransform()

  Draw-AppHeaderCopy -Graphics $graphics -Width $Width -Height $Height -Title "NoAgentNaija" -Subtitle "Direct landlord access, technician discovery, and premium dashboards."

  $chipPath = New-RoundedRectanglePath -X ($Width * 0.26) -Y ($Height * 0.88) -Width ($Width * 0.48) -Height ($Height * 0.05) -Radius ($Height * 0.025)
  $chipBrush = New-Object System.Drawing.SolidBrush((New-Color "#ffffff" 18))
  $graphics.FillPath($chipBrush, $chipPath)
  $chipBrush.Dispose()
  $chipPath.Dispose()

  $outputPath = Join-Path $publicDir $OutputName
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-Screenshot {
  param(
    [int]$Width,
    [int]$Height,
    [string]$OutputName,
    [string]$Mode
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = Use-Graphics -Bitmap $bitmap

  Draw-GradientBackground -Graphics $graphics -Width $Width -Height $Height

  $cardPath = New-RoundedRectanglePath -X ($Width * 0.08) -Y ($Height * 0.12) -Width ($Width * 0.84) -Height ($Height * 0.76) -Radius ($Width * 0.04)
  $cardBrush = New-Object System.Drawing.SolidBrush((New-Color "#fffaf5" 236))
  $graphics.FillPath($cardBrush, $cardPath)
  $cardBrush.Dispose()

  $shadowPen = New-Object System.Drawing.Pen((New-Color "#ffffff" 68), [Math]::Max(2, $Width * 0.004))
  $graphics.DrawPath($shadowPen, $cardPath)
  $shadowPen.Dispose()

  $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", [Math]::Max(18, $Width * 0.03), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $bodyFont = New-Object System.Drawing.Font("Segoe UI", [Math]::Max(10, $Width * 0.013), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $darkBrush = New-Object System.Drawing.SolidBrush((New-Color "#3c2316"))
  $mutedBrush = New-Object System.Drawing.SolidBrush((New-Color "#7f5d47"))

  $graphics.DrawString("NoAgentNaija", $titleFont, $darkBrush, $Width * 0.15, $Height * 0.17)
  $graphics.DrawString(
    $(if ($Mode -eq "dashboard") { "Role-based dashboards with installable mobile UX" } else { "Browse listings, technicians, and direct actions without agent fees" }),
    $bodyFont,
    $mutedBrush,
    [System.Drawing.RectangleF]::new($Width * 0.15, $Height * 0.25, $Width * 0.7, $Height * 0.08)
  )

  for ($row = 0; $row -lt 2; $row++) {
    for ($column = 0; $column -lt 2; $column++) {
      $cardWidth = $Width * 0.31
      $cardHeight = $Height * 0.18
      $cardX = $Width * 0.15 + ($column * $Width * 0.35)
      $cardY = $Height * 0.38 + ($row * $Height * 0.22)
      $innerPath = New-RoundedRectanglePath -X $cardX -Y $cardY -Width $cardWidth -Height $cardHeight -Radius ($Width * 0.022)
      $innerBrush = New-Object System.Drawing.SolidBrush((New-Color "#ffffff" 214))
      $graphics.FillPath($innerBrush, $innerPath)
      $innerBrush.Dispose()

      $labelBrush = New-Object System.Drawing.SolidBrush((New-Color "#b85c38"))
      $graphics.FillEllipse($labelBrush, $cardX + ($cardWidth * 0.08), $cardY + ($cardHeight * 0.12), $cardWidth * 0.14, $cardWidth * 0.14)
      $labelBrush.Dispose()

      $graphics.DrawString(
        $(if ($Mode -eq "dashboard") { "Dashboard Module" } else { "Property Card" }),
        $bodyFont,
        $darkBrush,
        $cardX + ($cardWidth * 0.28),
        $cardY + ($cardHeight * 0.12)
      )
      $graphics.DrawString(
        "Premium glass, quick actions, and mobile-safe layouts",
        $bodyFont,
        $mutedBrush,
        [System.Drawing.RectangleF]::new($cardX + ($cardWidth * 0.08), $cardY + ($cardHeight * 0.42), $cardWidth * 0.8, $cardHeight * 0.32)
      )

      $innerPath.Dispose()
    }
  }

  $darkBrush.Dispose()
  $mutedBrush.Dispose()
  $titleFont.Dispose()
  $bodyFont.Dispose()
  $cardPath.Dispose()

  $outputPath = Join-Path $publicDir $OutputName
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$iconSpecs = @(
  @{ Size = 16; Name = "favicon-16.png" },
  @{ Size = 32; Name = "favicon-32.png" },
  @{ Size = 48; Name = "favicon-48.png" },
  @{ Size = 64; Name = "icon-64.png" },
  @{ Size = 70; Name = "icon-70.png" },
  @{ Size = 72; Name = "icon-72.png" },
  @{ Size = 96; Name = "icon-96.png" },
  @{ Size = 128; Name = "icon-128.png" },
  @{ Size = 144; Name = "icon-144.png" },
  @{ Size = 150; Name = "icon-150.png" },
  @{ Size = 152; Name = "apple-touch-icon-152.png" },
  @{ Size = 167; Name = "apple-touch-icon-167.png" },
  @{ Size = 180; Name = "apple-touch-icon.png" },
  @{ Size = 180; Name = "apple-touch-icon-180.png" },
  @{ Size = 192; Name = "icon-192.png" },
  @{ Size = 192; Name = "icon-any-192.png" },
  @{ Size = 192; Name = "icon-192-maskable.png"; Maskable = $true },
  @{ Size = 256; Name = "icon-256.png" },
  @{ Size = 310; Name = "icon-310.png" },
  @{ Size = 384; Name = "icon-384.png" },
  @{ Size = 512; Name = "icon-512.png" },
  @{ Size = 512; Name = "icon-any-512.png" },
  @{ Size = 512; Name = "icon-512-maskable.png"; Maskable = $true },
  @{ Size = 150; Name = "mstile-150.png"; Maskable = $true }
)

foreach ($spec in $iconSpecs) {
  Draw-Icon -Size $spec.Size -OutputName $spec.Name -Maskable ([bool]$spec.Maskable)
}

Draw-WideTile -Width 310 -Height 150 -OutputName "icon-310-wide.png"

$splashSpecs = @(
  @{ Width = 1179; Height = 2556; Name = "apple-splash-1179x2556.png" },
  @{ Width = 1290; Height = 2796; Name = "apple-splash-1290x2796.png" },
  @{ Width = 1206; Height = 2622; Name = "apple-splash-1206x2622.png" },
  @{ Width = 1125; Height = 2436; Name = "apple-splash-1125x2436.png" },
  @{ Width = 1536; Height = 2048; Name = "apple-splash-1536x2048.png" },
  @{ Width = 1668; Height = 2224; Name = "apple-splash-1668x2224.png" },
  @{ Width = 1640; Height = 2360; Name = "apple-splash-1640x2360.png" }
)

foreach ($spec in $splashSpecs) {
  Draw-Splash -Width $spec.Width -Height $spec.Height -OutputName $spec.Name
}

Draw-Screenshot -Width 540 -Height 720 -OutputName "screenshot-narrow-home.png" -Mode "home"
Draw-Screenshot -Width 540 -Height 720 -OutputName "screenshot-narrow-dashboard.png" -Mode "dashboard"
Draw-Screenshot -Width 1280 -Height 720 -OutputName "screenshot-wide-home.png" -Mode "home"
Draw-Screenshot -Width 1280 -Height 720 -OutputName "screenshot-wide-dashboard.png" -Mode "dashboard"

Write-Host "PWA assets generated in $publicDir"
