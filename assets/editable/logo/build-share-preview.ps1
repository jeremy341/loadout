param([string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$logoRoot = Join-Path $RepositoryRoot 'assets/editable/logo'
$appRoot = Join-Path $RepositoryRoot 'apps/landing/app'

function Export-WordmarkHalf {
  param([System.Drawing.Bitmap]$Source, [int]$StartY, [int]$EndY, [string]$OutputPath)
  $minX = $Source.Width; $minY = $Source.Height; $maxX = -1; $maxY = -1
  for ($y = $StartY; $y -lt $EndY; $y++) {
    for ($x = 0; $x -lt $Source.Width; $x++) {
      if ($Source.GetPixel($x, $y).A -eq 0) { continue }
      $minX = [math]::Min($minX, $x); $maxX = [math]::Max($maxX, $x)
      $minY = [math]::Min($minY, $y); $maxY = [math]::Max($maxY, $y)
    }
  }
  if ($maxX -lt 0) { throw 'The wordmark half contains no visible pixels.' }
  $width = $maxX - $minX + 1; $height = $maxY - $minY + 1
  $crop = [System.Drawing.Bitmap]::new($width + 2, $height + 2, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
      $crop.SetPixel($x + 1, $y + 1, $Source.GetPixel($minX + $x, $minY + $y))
    }
  }
  $crop.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
}

$source = [System.Drawing.Bitmap]::FromFile((Join-Path $logoRoot 'wordmark-flat-source.png'))
$splitY = [int][math]::Floor($source.Height / 2)
Export-WordmarkHalf $source 0 $splitY (Join-Path $logoRoot 'wordmark-flat-top.png')
Export-WordmarkHalf $source $splitY $source.Height (Join-Path $logoRoot 'wordmark-flat-bottom.png')
$source.Dispose()

# Retain the original composition from main; repair only the old text region.
if (-not ('LoadoutSharePatch' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
public static class LoadoutSharePatch {
  public static void Restore(byte[] data, int stride, int left, int top, int width, int height) {
    var random = new Random(20261019);
    for (int y = top; y < top + height; y++) for (int x = left; x < left + width; x++) {
      int edge = Math.Min(Math.Min(x-left, left+width-1-x), Math.Min(y-top, top+height-1-y));
      double t = Math.Min(1.0, Math.Max(0.0, edge/12.0));
      double alpha = t*t*(3-2*t), sum = 0;
      for (int i=0; i<12; i++) sum += random.NextDouble();
      int noise = (int)Math.Round((sum-6)*12.5);
      int grid = (x%32 == 0 || y%32 == 0) ? 10 : 0;
      int at = y*stride+x*4;
      data[at] = Blend(data[at], 53+noise+grid, alpha);
      data[at+1] = Blend(data[at+1], 52+noise+grid, alpha);
      data[at+2] = Blend(data[at+2], 48+noise+grid, alpha);
      data[at+3] = 255;
    }
  }
  public static void QuietDepthStrip(byte[] data, int stride, int width) {
    for (int y = 501; y < 594; y++) for (int x = 0; x < width; x++) {
      int at = y*stride+x*4;
      data[at] = (byte)Math.Round(data[at]*0.68 + 39*0.32);
      data[at+1] = (byte)Math.Round(data[at+1]*0.68 + 38*0.32);
      data[at+2] = (byte)Math.Round(data[at+2]*0.68 + 34*0.32);
    }
  }
  static byte Blend(byte previous, int next, double alpha) {
    next = Math.Max(0, Math.Min(255, next));
    return (byte)Math.Round(previous*(1-alpha)+next*alpha);
  }
}
'@
}

$base = [System.Drawing.Bitmap]::FromFile((Join-Path $logoRoot 'share-preview-main-base.jpg'))
if ($base.Width -ne 1200 -or $base.Height -ne 630) { throw 'Expected the original 1200x630 main image.' }
$labelRect = [System.Drawing.Rectangle]::new(440, 121, 444, 49)
$builderLabel = $base.Clone($labelRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$canvas = [System.Drawing.Bitmap]::new(1200, 630, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.DrawImageUnscaled($base, 0, 0)
$graphics.Dispose(); $base.Dispose()
$bits = $canvas.LockBits([System.Drawing.Rectangle]::new(0, 0, 1200, 630), [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$pixels = [byte[]]::new($bits.Stride * $bits.Height)
[System.Runtime.InteropServices.Marshal]::Copy($bits.Scan0, $pixels, 0, $pixels.Length)
[LoadoutSharePatch]::Restore($pixels, $bits.Stride, 24, 120, 372, 328)
[LoadoutSharePatch]::Restore($pixels, $bits.Stride, 416, 110, 480, 72)
[LoadoutSharePatch]::Restore($pixels, $bits.Stride, 416, 186, 700, 280)
[LoadoutSharePatch]::QuietDepthStrip($pixels, $bits.Stride, $canvas.Width)
[System.Runtime.InteropServices.Marshal]::Copy($pixels, 0, $bits.Scan0, $pixels.Length)
$canvas.UnlockBits($bits)

$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
# Reuse main's label artwork intact, centered over the larger wordmark.
$graphics.DrawImage($builderLabel, [System.Drawing.Rectangle]::new(378, 121, 444, 49), [System.Drawing.Rectangle]::new(0, 0, 444, 49), [System.Drawing.GraphicsUnit]::Pixel)
$builderLabel.Dispose()
$graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
$cornerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(210, 233, 235, 231), 2)
$graphics.DrawLine($cornerPen, 48, 100, 78, 100)
$graphics.DrawLine($cornerPen, 48, 100, 48, 130)
$cornerPen.Dispose()
$wordmark = [System.Drawing.Bitmap]::FromFile((Join-Path $logoRoot 'wordmark-flat-bottom.png'))
$wordmarkScale = 6
$wordmarkWidth = $wordmark.Width * $wordmarkScale; $wordmarkHeight = $wordmark.Height * $wordmarkScale
$wordmarkLeft = [int]((1200 - $wordmarkWidth) / 2)
$wordmarkTop = 185
$graphics.DrawImage($wordmark, [System.Drawing.Rectangle]::new($wordmarkLeft, $wordmarkTop, $wordmarkWidth, $wordmarkHeight), [System.Drawing.Rectangle]::new(0, 0, $wordmark.Width, $wordmark.Height), [System.Drawing.GraphicsUnit]::Pixel)
$wordmark.Dispose()

$fonts = [System.Drawing.Text.PrivateFontCollection]::new()
$fonts.AddFontFile((Join-Path $RepositoryRoot 'apps/landing/public/fonts/Jersey10-Regular.ttf'))
$family = $fonts.Families | Where-Object Name -eq 'Jersey 10' | Select-Object -First 1
$taglineFont = [System.Drawing.Font]::new($family, 54, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$tracksFont = [System.Drawing.Font]::new($family, 36, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$foreground = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#E9EBE7'))
$muted = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#A7AEAB'))
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::SingleBitPerPixelGridFit
$format = [System.Drawing.StringFormat]::GenericTypographic.Clone()
$format.Alignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString('Build your own technical stack.', $taglineFont, $foreground, [System.Drawing.RectangleF]::new(64, 350, 1072, 58), $format)
$graphics.DrawString('Tools, systems, compute and hardware.', $tracksFont, $muted, [System.Drawing.RectangleF]::new(64, 410, 1072, 42), $format)
$format.Dispose()
$foreground.Dispose(); $muted.Dispose(); $taglineFont.Dispose(); $tracksFont.Dispose(); $fonts.Dispose(); $graphics.Dispose()

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg' | Select-Object -First 1
$encoding = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoding.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]91)
foreach ($filename in 'opengraph-image.jpg', 'twitter-image.jpg') { $canvas.Save((Join-Path $appRoot $filename), $codec, $encoding) }
$encoding.Dispose(); $canvas.Dispose()
