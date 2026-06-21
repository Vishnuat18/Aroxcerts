$lines = Get-Content d:\Certificate\index.html -Encoding UTF8
$newLines = $lines[0..156] + $lines[357..($lines.Length-1)]
Set-Content d:\Certificate\index.html $newLines -Encoding UTF8
