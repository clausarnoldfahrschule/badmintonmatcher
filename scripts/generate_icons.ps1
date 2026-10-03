Add-Type -AssemblyName System.Drawing

function Generate-Icon {
    param(
        [int]$size,
        [string]$outputPath
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $c1 = [System.Drawing.Color]::FromArgb(5, 150, 105)
    $c2 = [System.Drawing.Color]::FromArgb(13, 148, 136)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
    $g.FillRectangle($brush, $rect)

    # Scale factor
    $s = $size / 512.0

    # Subtle court line
    $penLine = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 255, 255, 255), [Math]::Max(1.0, 3.0 * $s))
    $g.DrawLine($penLine, (64 * $s), (256 * $s), (448 * $s), (256 * $s))
    $g.DrawRectangle($penLine, (96 * $s), (96 * $s), (320 * $s), (320 * $s))

    # Draw Shuttlecock rotated
    $state = $g.Save()
    $g.TranslateTransform(($size / 2.0), ($size / 2.0))
    $g.RotateTransform(-35.0)
    $g.TranslateTransform(-($size / 2.0), -($size / 2.0))

    # Feathers polygon
    $featherBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
    $pts = @(
        (New-Object System.Drawing.PointF((180 * $s), (140 * $s))),
        (New-Object System.Drawing.PointF((332 * $s), (140 * $s))),
        (New-Object System.Drawing.PointF((290 * $s), (310 * $s))),
        (New-Object System.Drawing.PointF((222 * $s), (310 * $s)))
    )
    $g.FillPolygon($featherBrush, $pts)

    # Ribs
    $ribPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(203, 213, 225), [Math]::Max(1.0, 4.0 * $s))
    $g.DrawLine($ribPen, (196 * $s), (140 * $s), (230 * $s), (305 * $s))
    $g.DrawLine($ribPen, (226 * $s), (140 * $s), (244 * $s), (308 * $s))
    $g.DrawLine($ribPen, (256 * $s), (140 * $s), (256 * $s), (310 * $s))
    $g.DrawLine($ribPen, (286 * $s), (140 * $s), (268 * $s), (308 * $s))
    $g.DrawLine($ribPen, (316 * $s), (140 * $s), (282 * $s), (305 * $s))

    # Bands
    $bandPen1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 185, 129), [Math]::Max(1.0, 5.0 * $s))
    $g.DrawArc($bandPen1, (194 * $s), (195 * $s), (124 * $s), (25 * $s), 0, 180)

    $bandPen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(5, 150, 105), [Math]::Max(1.0, 5.0 * $s))
    $g.DrawArc($bandPen2, (208 * $s), (255 * $s), (96 * $s), (22 * $s), 0, 180)

    # Cork base
    $corkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(234, 179, 8))
    $g.FillPie($corkBrush, (218 * $s), (270 * $s), (76 * $s), (80 * $s), 0, 180)

    $corkRingPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 83, 9), [Math]::Max(1.0, 3.0 * $s))
    $g.DrawLine($corkRingPen, (220 * $s), (310 * $s), (292 * $s), (310 * $s))

    $g.Restore($state)
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath"
}

Generate-Icon -size 180 -outputPath "c:\Users\claus\Documents\Badminton\public\apple-touch-icon.png"
Generate-Icon -size 192 -outputPath "c:\Users\claus\Documents\Badminton\public\icon-192.png"
Generate-Icon -size 512 -outputPath "c:\Users\claus\Documents\Badminton\public\icon-512.png"
