$SpreadsheetId = "1NDTklJxtW9jLJYtqh9v-lXN1O_-6lEXi0MalVzL_QeQ"
$Gid = "1037034171"
$CsvUrl = "https://docs.google.com/spreadsheets/d/$SpreadsheetId/export?format=csv&gid=$Gid"

$ErrorActionPreference = "Stop"

$CsvText = Invoke-WebRequest -Uri $CsvUrl -UseBasicParsing | Select-Object -ExpandProperty Content
$Rows = $CsvText | ConvertFrom-Csv
$CustomerIds = $Rows | Where-Object { $_."Customer ID" } | Select-Object -ExpandProperty "Customer ID"

[PSCustomObject]@{
    customer_ids = @($CustomerIds)
} | ConvertTo-Json
