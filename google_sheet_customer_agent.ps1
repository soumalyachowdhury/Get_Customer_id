$PhoneNumber = Read-Host "Phone number"
$SpreadsheetId = "1NDTklJxtW9jLJYtqh9v-lXN1O_-6lEXi0MalVzL_QeQ"
$Gid = "1037034171"
$CsvUrl = "https://docs.google.com/spreadsheets/d/$SpreadsheetId/export?format=csv&gid=$Gid"

$ErrorActionPreference = "Stop"

$CsvText = Invoke-WebRequest -Uri $CsvUrl -UseBasicParsing | Select-Object -ExpandProperty Content
$Rows = $CsvText | ConvertFrom-Csv
$RequestedPhoneNumber = $PhoneNumber -replace "\D", ""
$Match = $Rows | Where-Object { ($_."Phone Number" -replace "\D", "") -eq $RequestedPhoneNumber } | Select-Object -First 1
$CustomerId = if ($Match) { $Match."Customer ID" } else { $null }

[PSCustomObject]@{
    message = if ($CustomerId) { "Customer ID found." } else { "No customer found for that phone number." }
    phone_number = $PhoneNumber
    customer_id = $CustomerId
} | ConvertTo-Json
